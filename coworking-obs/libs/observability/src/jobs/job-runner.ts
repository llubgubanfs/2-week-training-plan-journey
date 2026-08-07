import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ClsService } from 'nestjs-cls';
import { Logger } from 'winston';
import { JobMetrics } from './job.metrics';

const tracer = trace.getTracer('@app/observability/jobs');

/**
 * Wraps one run of a scheduled job so that a job gets the same three signals a
 * request already gets: a correlated log pair, a metric, and a span.
 *
 * ── Why this exists as a wrapper rather than as decoration on each job ──
 *
 * The three call sites below are the whole point, and they are the thing that was
 * got wrong first: the success signal goes in `try`, *after* the await; the failure
 * signal goes in `catch`; and only span.end() goes in `finally`. A success counter
 * in `finally` increments on the throwing path too — which reproduces exactly the
 * silent failure the job is supposed to make visible, with more syntax. A span in
 * `catch` is the mirror-image mistake: it loses every successful run.
 *
 * Spans and success counters look like the same kind of cleanup and have opposite
 * requirements. A span must be closed on *every* path or the trace is lost; a
 * success counter must be reachable on *exactly one* path or it stops meaning
 * anything. Putting the rule in one place is how it stays right in every job.
 */
@Injectable()
export class JobRunner {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly cls: ClsService,
    private readonly metrics: JobMetrics,
  ) {}

  /**
   * `work` returns whatever it likes; the value is logged as `result` on the
   * completion line. It must *throw* to be counted as a failure — a run that
   * returns normally is a success by definition here, and that definition is
   * precisely the blind spot the state gauge next door exists to cover.
   */
  async run<T>(job: string, work: () => Promise<T>): Promise<T | undefined> {
    // The Day 2 decision paying for itself. There is no request to scope to, so a
    // request-scoped provider would have had nothing to attach to and this job
    // would have needed a second, parallel correlation mechanism. AsyncLocalStorage
    // does not care what opened the context — cls.run() opens one here exactly as
    // ClsMiddleware opens one per request, and every logger, formatter and deep
    // callee downstream is unchanged.
    //
    // `contextType: 'job'` is the field that lets one query separate cron noise
    // from user-facing traffic in a single log stream. It was declared on Day 2 for
    // this day.
    return this.cls.run(async () => {
      this.cls.set('correlationId', randomUUID());
      this.cls.set('contextType', 'job');
      this.cls.set('startedAt', Date.now());

      return tracer.startActiveSpan(`job ${job}`, async (span) => {
        const startedAt = process.hrtime.bigint();
        this.logger.info('job started', { job });

        try {
          const result = await work();

          // ── success path, inside try, after the await ──
          // Reachable only if `work` resolved. If it rejects, control has already
          // left for `catch` and none of these four lines run.
          const seconds = elapsedSeconds(startedAt);
          this.metrics.runsTotal.inc({ job_name: job, outcome: 'success' });
          this.metrics.duration.observe({ job_name: job }, seconds);
          this.metrics.lastSuccessTimestamp.set(
            { job_name: job },
            Date.now() / 1000,
          );
          this.logger.info('job completed', {
            job,
            outcome: 'success',
            duration_ms: Math.round(seconds * 1000),
            result,
          });

          return result;
        } catch (error) {
          // ── failure path ──
          // The duration is still observed: a job that fails after 30s and one that
          // fails in 2ms are different incidents, and dropping the slow one from the
          // histogram would bias every latency question toward the healthy runs.
          const seconds = elapsedSeconds(startedAt);
          this.metrics.runsTotal.inc({ job_name: job, outcome: 'failure' });
          this.metrics.duration.observe({ job_name: job }, seconds);

          // Deliberately NOT rethrown. This is called from a scheduler callback,
          // and an unhandled rejection there takes the process down under Node's
          // default policy — turning a 1-in-5 job failure into a full outage. The
          // signals above are the report; the exception has nowhere useful to go.
          const message =
            error instanceof Error ? error.message : String(error);
          span.recordException(
            error instanceof Error ? error : new Error(message),
          );
          span.setStatus({ code: SpanStatusCode.ERROR, message });
          this.logger.error('job failed', {
            job,
            outcome: 'failure',
            duration_ms: Math.round(seconds * 1000),
            error: message,
            stack: error instanceof Error ? error.stack : undefined,
          });

          return undefined;
        } finally {
          // ── and only this in finally ──
          // Day 6's rule: whoever calls startSpan calls end(), and for a hand-rolled
          // span it goes in `finally`, never `catch`. An unended span is never
          // exported, so the successful runs would vanish from Jaeger entirely.
          span.end();
        }
      });
    });
  }
}

const elapsedSeconds = (startedAt: bigint): number =>
  Number(process.hrtime.bigint() - startedAt) / 1e9;
