import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ClsService } from 'nestjs-cls';
import { Logger } from 'winston';

/**
 * The outbound half of the Day 6 hop — the first code in this repo that leaves
 * the process.
 *
 * Note what is *absent* here: there is no OpenTelemetry import, no tracer, no
 * startSpan, no end(). The client span for each call below is created and ended
 * by @opentelemetry/instrumentation-undici, which patches fetch underneath this
 * file. Ending it on the error path is the instrumentation's job, done inside
 * listeners that fire on every outcome — which is why a hand-rolled span is the
 * only way to produce a span that never ends.
 *
 * `traceparent` is injected on these requests by that same instrumentation. It is
 * a W3C standard header, so the notifier joins the trace without either side
 * agreeing on anything locally.
 *
 * x-correlation-id IS forwarded, decided Day 6 after seeing the two ids diverge in
 * a real trace. The receiving half has existed since Day 2 — CORRELATION_ID_HEADERS
 * already honours an inbound id "so an id assigned upstream survives the hop" — so
 * only the sending half was ever missing.
 *
 * Kept alongside trace_id rather than replaced by it, and the reason is sampling.
 * Under head sampling every log line still carries a trace_id, but the trace it
 * names was never exported: pasting it into Jaeger returns nothing. Logs are not
 * sampled, so correlation_id has no such failure mode. They also cover different
 * ground — Day 8's cron has a correlation id and, unless it is instrumented, no
 * span at all.
 */
@Injectable()
export class DownstreamService {
  /** Long enough to be a real hop, short enough that the drill stays interactive. */
  private static readonly TIMEOUT_MS = 3_000;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly config: ConfigService,
    private readonly cls: ClsService,
  ) {}

  /**
   * Outbound headers.
   *
   * `traceparent` is absent here on purpose — the instrumentation injects it, and
   * writing it by hand would fight the SDK for ownership of the span context.
   * This method exists only for the header OTel does not know about.
   *
   * Read at call time, not captured in the constructor: ClsService is a singleton
   * that reads AsyncLocalStorage on each get(), so this returns the id of the
   * request in flight right now. The fire-and-forget path depends on that — it
   * builds these headers while the request context is still open, even though the
   * fetch resolves long after the response has gone out.
   */
  private headers(): Record<string, string> {
    const correlationId = this.cls.get('correlationId');
    return correlationId ? { 'x-correlation-id': correlationId } : {};
  }

  /**
   * Awaited. The child span opens and closes strictly inside the parent's window,
   * and the parent's duration accounts for the downstream call.
   *
   * A rejection here surfaces inside the Nest request pipeline, where the
   * exception filter turns it into a response. There is no unhandled rejection to
   * have — awaiting *is* the error handling.
   */
  async callImmediate(): Promise<unknown> {
    const url = this.url('/downstream-immediate');
    this.logger.info('calling notifier', { downstream: url, mode: 'await' });

    try {
      const res = await fetch(url, {
        headers: this.headers(),
        signal: AbortSignal.timeout(DownstreamService.TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new Error(`notifier responded ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      // Rethrown, not swallowed: the caller is still waiting, so the failure
      // belongs in their response. Contrast with fireAndForget below, where
      // there is nobody left to tell.
      this.logger.error('notifier call failed', {
        downstream: url,
        mode: 'await',
        error: err instanceof Error ? err.message : String(err),
      });
      throw new ServiceUnavailableException('notifier unavailable');
    }
  }

  /**
   * Not awaited. The handler returns 202 while this is still in flight, so the
   * child span outlives its parent — which looks like a rendering fault in the
   * Jaeger waterfall the first time you see it, and is simply what
   * fire-and-forget means drawn accurately.
   *
   * The .catch() is load-bearing and its contribution is entirely negative. It
   * records nothing that the instrumentation has not already recorded — the
   * client span was ended before this callback runs. What it prevents is an
   * unhandled rejection, which since Node 15 terminates the process. A dead
   * process has no event loop, so BatchSpanProcessor's flush timer never fires
   * and the whole buffer is lost — including the parent span of the request that
   * just returned a perfectly healthy 202.
   *
   * An empty .catch(() => {}) would protect the trace just as well. It would also
   * leave a failure that nobody ever learns about, which is why this one logs.
   */
  fireAndForget(): void {
    const url = this.url('/fire-and-forget');
    this.logger.info('calling notifier', {
      downstream: url,
      mode: 'fire-and-forget',
    });

    void fetch(url, {
      headers: this.headers(),
      signal: AbortSignal.timeout(DownstreamService.TIMEOUT_MS),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`notifier responded ${res.status}`);
        this.logger.info('notifier accepted fire-and-forget', {
          downstream: url,
        });
      })
      .catch((err: unknown) => {
        this.logger.error('fire-and-forget to notifier failed', {
          downstream: url,
          mode: 'fire-and-forget',
          error: err instanceof Error ? err.message : String(err),
        });
      });
  }

  /**
   * NOTIFIER_URL has been in the environment since Day 2 and read by nothing
   * until now. Compose sets it to the service name; the fallback is for running
   * the app outside a container.
   */
  private url(path: string): string {
    const base =
      this.config.get<string>('NOTIFIER_URL') ?? 'http://localhost:3001';
    return `${base.replace(/\/+$/, '')}${path}`;
  }
}
