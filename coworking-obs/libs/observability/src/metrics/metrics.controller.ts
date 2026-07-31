import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Registry } from 'prom-client';
import { METRICS_REGISTRY } from './metrics.registry';

/**
 * The scrape target. Prometheus GETs this on an interval; the app never pushes.
 *
 * Note what this does *not* do: it reads nothing from the log stream. The values
 * here come from in-process counters incremented by HttpMetricsMiddleware. Logs
 * and metrics are two independent write paths off the same events, which is why
 * the metric survives log sampling and costs the same at 10 rps or 10,000.
 */
@Controller('metrics')
export class MetricsController {
  constructor(@Inject(METRICS_REGISTRY) private readonly registry: Registry) {}

  @Get()
  async scrape(
    // passthrough so Nest still sends the returned body; we only need the raw
    // response to set the exposition-format content type off the registry.
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.setHeader('Content-Type', this.registry.contentType);
    return this.registry.metrics();
  }
}
