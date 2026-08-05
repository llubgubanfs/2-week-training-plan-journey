import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * The downstream half of the Day 6 hop.
 *
 * Both handlers below do the same trivial thing and differ only in what the
 * *caller* does with them. That is deliberate: the interesting variable on Day 6
 * is the shape of the call, not the shape of the work.
 */
@Injectable()
export class NotifierService {
  /**
   * Enough work to be visible as a bar in a Jaeger waterfall. A handler that
   * returns synchronously produces a span of ~0.2ms, which renders as a hairline
   * and makes the parent/child relationship impossible to read — the same
   * Little's Law problem that made http_requests_in_flight look broken on Day 4.
   */
  private static readonly WORK_MS = 40;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async handleImmediate(): Promise<{ notified: true; tookMs: number }> {
    this.logger.info('notifier: handling immediate call');
    await NotifierService.work();
    return { notified: true, tookMs: NotifierService.WORK_MS };
  }

  async handleFireAndForget(): Promise<{ accepted: true; tookMs: number }> {
    // The caller is not waiting for this. It still logs and still emits a span —
    // the work being unobserved by the client is exactly why it has to be
    // observable to us.
    this.logger.info('notifier: handling fire-and-forget call');
    await NotifierService.work();
    return { accepted: true, tookMs: NotifierService.WORK_MS };
  }

  private static work(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, NotifierService.WORK_MS),
    );
  }
}
