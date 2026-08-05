import { Controller, Get } from '@nestjs/common';
import { NotifierService } from './notifier.service';

/**
 * Day 6. Two endpoints named for the *caller's* calling convention rather than
 * for anything they do, matching the DebugController precedent in
 * @app/observability: these exist to make a signal move, not to model a domain.
 *
 * The names are mirrored on both sides on purpose. Jaeger disambiguates by
 * service, so a trace reads:
 *
 *   booking-api  GET /fire-and-forget
 *     notifier   GET /fire-and-forget
 *
 * which shows the hop being crossed rather than two unrelated-looking operations.
 */
@Controller()
export class NotifierController {
  constructor(private readonly notifierService: NotifierService) {}

  @Get()
  getHello(): string {
    return this.notifierService.getHello();
  }

  @Get('downstream-immediate')
  downstreamImmediate(): Promise<{ notified: true; tookMs: number }> {
    return this.notifierService.handleImmediate();
  }

  @Get('fire-and-forget')
  fireAndForget(): Promise<{ accepted: true; tookMs: number }> {
    return this.notifierService.handleFireAndForget();
  }
}
