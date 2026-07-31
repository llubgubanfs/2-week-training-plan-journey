import { Inject, Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import { METRICS_REGISTRY } from './metrics.registry';

/** The label set. Bounded on every axis — see request-labels.ts for why. */
export type HttpLabels = 'method' | 'route' | 'status_code';

/**
 * Dense from 10ms to 250ms, where a healthy API for this domain actually lives,
 * because histogram quantiles are only as precise as the bucket they land in —
 * histogram_quantile interpolates linearly *inside* a bucket, so a wide bucket
 * around p95 gives a confidently wrong number. Sparse above that: no precision
 * is needed to conclude 2.5s is bad.
 *
 * The top bucket matters more than it looks. Anything slower than 5s lands in
 * `+Inf`, which has no upper bound to interpolate toward, so Prometheus returns
 * the highest finite boundary. A service degrading to 30s would report a p99 of
 * 5s — a flat ceiling on the graph rather than an outage.
 */
export const LATENCY_BUCKETS = [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];

@Injectable()
export class HttpMetrics {
  /**
   * One counter labelled by status_code, not a separate error counter. The error
   * ratio is then a query, not a second write path that can drift out of sync
   * with the first:
   *   sum(rate(http_requests_total{status_code=~"5.."}[5m]))
   *     / sum(rate(http_requests_total[5m]))
   */
  readonly requestsTotal: Counter<HttpLabels>;

  readonly requestDuration: Histogram<HttpLabels>;

  /**
   * Unlabelled by route, deliberately: this moves on *arrival*, and Express has
   * not matched a route yet at that point — there is no template to label with.
   *
   * This is the only one of the three that stays meaningful during a hang. The
   * counter and histogram are driven by request *completion*; if the database
   * seizes and every caller gives up, nothing completes, both read ~0, and
   * errors/total evaluates to 0/0 → NaN, which never crosses a threshold. The
   * gauge is driven by arrival — the half that always happens — so it climbs and
   * stays there. It is literally received-minus-completed.
   */
  readonly inFlight: Gauge<string>;

  constructor(@Inject(METRICS_REGISTRY) registry: Registry) {
    this.requestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests, by route template and response status.',
      labelNames: ['method', 'route', 'status_code'],
      registers: [registry],
    });

    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request latency in seconds.',
      labelNames: ['method', 'route', 'status_code'],
      buckets: LATENCY_BUCKETS,
      registers: [registry],
    });

    this.inFlight = new Gauge({
      name: 'http_requests_in_flight',
      help: 'Requests received but not yet completed.',
      registers: [registry],
    });
  }
}
