import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { HttpMetrics } from './http.metrics';
import { routeLabel, statusLabel } from './request-labels';

/**
 * Records the three HTTP metrics. Deliberately separate from HttpLoggingMiddleware,
 * because the two have opposite context requirements:
 *
 *   - the logger reads the correlation id out of CLS, so its completion handler
 *     has to re-enter the store with runWith();
 *   - nothing here touches CLS. Counter.inc() takes its labels as arguments.
 *     Wrapping these calls in runWith() would restore a context that no line
 *     reads — cost, no benefit.
 *
 * Keeping them apart makes that asymmetry visible instead of burying it inside
 * one handler where the next person copies the ceremony without knowing why.
 */
@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: HttpMetrics) {}

  use(req: Request, res: Response, next: NextFunction): void {
    // Arrival side. Both of these run for every request that reaches us, whether
    // or not it ever produces a response.
    this.metrics.inFlight.inc();
    const stopTimer = this.metrics.requestDuration.startTimer();

    // 'close', not 'finish'. 'finish' fires only when the response was actually
    // flushed, so an abandoned request would never be counted at all — and the
    // requests that vanish are exactly the slow and failing ones, biasing the
    // error ratio to look healthiest during an incident. 'close' fires in both
    // cases; writableFinished (inside statusLabel) tells them apart.
    res.on('close', () => {
      this.metrics.inFlight.dec();

      // Read here, not at the top of use(): Express middleware runs before the
      // router has matched anything, so req.route is undefined on entry. By the
      // time the response closes, the handler has run and the template exists.
      const labels = {
        method: req.method,
        route: routeLabel(req),
        status_code: statusLabel(res),
      };

      this.metrics.requestsTotal.inc(labels);
      stopTimer(labels);
    });

    next();
  }
}
