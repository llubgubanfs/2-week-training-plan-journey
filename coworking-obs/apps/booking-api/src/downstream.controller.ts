import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DownstreamService } from './downstream.service';

/**
 * Day 6. Two endpoints that differ in exactly one variable — whether the outbound
 * call is awaited — so the Jaeger waterfall for each can be compared directly.
 *
 *   curl localhost:3000/downstream-immediate
 *   curl localhost:3000/fire-and-forget
 *
 * The drill both were built for:
 *
 *   docker stop coworking-notifier
 *   curl -i localhost:3000/downstream-immediate   # 503, and the client is told
 *   curl -i localhost:3000/fire-and-forget        # 202, and the client is not
 *
 * The second one returning 202 while the work fails is the whole point. It is the
 * same failure class as the Day 8 cron: a caller that has already been told
 * everything went fine.
 */
@Controller()
export class DownstreamController {
  constructor(private readonly downstream: DownstreamService) {}

  @Get('downstream-immediate')
  callImmediate(): Promise<unknown> {
    return this.downstream.callImmediate();
  }

  /**
   * 202, not 200. The response is a claim that the request was *accepted*, not
   * that the work succeeded — which is the honest status code when nothing has
   * been waited for, and is the only part of this response the client can rely on.
   */
  @Get('fire-and-forget')
  @HttpCode(HttpStatus.ACCEPTED)
  fireAndForget(): { accepted: true } {
    this.downstream.fireAndForget();
    return { accepted: true };
  }
}
