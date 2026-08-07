import { Inject, Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import { METRICS_REGISTRY } from '../metrics/metrics.registry';

/**
 * Bounded on both axes. `job_name` is a fixed set of names declared in code — there
 * is no user input anywhere near it — and `outcome` has exactly two values. Compare
 * `route` on the HTTP side, where the whole Day 3 argument was about keeping a
 * user-supplied path out of the label.
 *
 * ⚠️ `job_name`, and NOT `job`, and this is not a style preference — it was a live
 * bug, found on Day 8 by an alert firing that should not have been.
 *
 * `job` is Prometheus's own label: the server attaches `job="<job_name from
 * scrape_configs>"` to every series it scrapes. When a target exposes a label the
 * server already owns, the collision is resolved by `honor_labels`, which defaults
 * to false — meaning the *exposed* label loses and is silently renamed to
 * `exported_job`. Nothing errors, nothing warns, /metrics looks exactly right.
 *
 * The result was that `job_last_success_timestamp_seconds{job="expiry-sweep"}`
 * matched nothing in the TSDB, so the `absent()` arm of ExpirySweepNotRunning
 * evaluated to 1 and the rule fired permanently — while the sweep ran perfectly.
 * A false positive that was indistinguishable from the demo working.
 *
 * The same collision applies to `instance`. Note it does NOT apply to the log
 * lines: `job` is still the field name there, because a log stream has no server
 * writing labels underneath it. Same word, two systems, one of which has reserved
 * it.
 */
export type JobLabels = 'job_name' | 'outcome';

/** Two values, deliberately. `partial` was considered and rejected — see JobRunner. */
export type JobOutcome = 'success' | 'failure';

/**
 * Wider than LATENCY_BUCKETS and for the opposite reason. An HTTP handler that takes
 * 5s is already an outage; a sweep that takes 5s is ordinary. The interesting
 * question for a job is not "is it fast" but "did it change shape" — a sweep that
 * usually finishes in 40ms and now takes 30s is doing something different, and the
 * top bucket has to be high enough to show that rather than flattening it into +Inf.
 */
export const JOB_DURATION_BUCKETS = [0.01, 0.05, 0.25, 1, 5, 15, 60];

@Injectable()
export class JobMetrics {
  /**
   * The step signal. Counts runs that reached the end of their work function
   * without throwing.
   *
   * Note what this can and cannot tell you, because Day 10 is a follow-up format:
   * it is driven by the job *reporting on itself*, so it is only as honest as the
   * job's own idea of success. A run that swallows its exception, or one whose
   * query silently matches nothing, increments `success` here and is invisible.
   * That is not a flaw to fix in this counter — it is the reason a state signal
   * has to exist alongside it.
   */
  readonly runsTotal: Counter<JobLabels>;

  readonly duration: Histogram<'job_name'>;

  /**
   * Unix seconds of the last successful run. The absence-of-success signal.
   *
   * A gauge holding a *timestamp*, not a counter of successes, and the difference
   * is what makes it alertable. `rate(job_runs_total{outcome="success"}[10m]) == 0`
   * looks equivalent and is worse: rate() over a window needs at least two samples
   * inside that window to produce anything, so a job that stops immediately after a
   * deploy yields no series rather than a zero, and `== 0` never matches. Comparing
   * `time() - <this>` needs one sample and keeps working forever after it.
   *
   * The failure mode that remains: after a restart this gauge does not exist at all
   * until the first successful run, and a rule that references a non-existent series
   * evaluates to nothing — silence, at exactly the moment a crash-looping container
   * most needs to be loud. That is what the `absent()` arm of the alert rule is for.
   */
  readonly lastSuccessTimestamp: Gauge<'job_name'>;

  constructor(@Inject(METRICS_REGISTRY) registry: Registry) {
    this.runsTotal = new Counter({
      name: 'job_runs_total',
      help: 'Scheduled job runs, by job name and self-reported outcome.',
      labelNames: ['job_name', 'outcome'],
      registers: [registry],
    });

    this.duration = new Histogram({
      name: 'job_duration_seconds',
      help: 'Wall-clock duration of a scheduled job run.',
      labelNames: ['job_name'],
      buckets: JOB_DURATION_BUCKETS,
      registers: [registry],
    });

    this.lastSuccessTimestamp = new Gauge({
      name: 'job_last_success_timestamp_seconds',
      help: 'Unix timestamp of the last run that completed without throwing.',
      labelNames: ['job_name'],
      registers: [registry],
    });
  }
}
