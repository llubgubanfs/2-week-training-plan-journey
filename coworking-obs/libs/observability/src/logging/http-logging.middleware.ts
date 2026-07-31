import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ClsService } from 'nestjs-cls';
import { Logger } from 'winston';
import type { NextFunction, Request, Response } from 'express';
import { statusLabel } from '../metrics/request-labels';

/**
 * Emits the open/close pair for every request. Runs after ClsMiddleware, so a
 * context is always active by the time it executes.
 */
@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly cls: ClsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const method = req.method;
    // The full URL, query string and all — and that is correct *here*. A log
    // line is a one-off record; the specific ?locationId=7&date=2026-08-14 is
    // the whole reason you opened it. The metric next door must use the route
    // template instead, because there every distinct value becomes a permanent
    // time series. Same source, opposite requirement.
    const path = req.originalUrl;

    this.logger.info('request received', { method, path });

    // Snapshot the store synchronously, here, while the context is definitely
    // active — then re-enter it inside the listener.
    //
    // The listener is *registered* inside the context, but that is not what decides
    // which context it runs in. EventEmitter.emit() is synchronous, so a listener
    // executes in whatever context is active when the event fires. 'finish' is
    // emitted once the response is flushed to the socket, which under backpressure
    // is a libuv callback outside this request's chain. Re-reading CLS in there is
    // the classic way to log the wrong id — or none at all.
    const store = this.cls.get();
    const startedAt = store.startedAt;

    // 'close' rather than 'finish'. 'finish' fires only on a response that was
    // actually flushed, so a caller who gave up and closed the tab produced a
    // 'request received' line with no matching completion — the pair silently
    // broke on exactly the requests worth investigating. 'close' fires either
    // way; statusLabel() reads writableFinished to tell a real status from an
    // abandoned connection (499).
    res.on('close', () => {
      this.cls.runWith(store, () => {
        this.logger.info('request completed', {
          method,
          path,
          status_code: statusLabel(res),
          duration_ms: Date.now() - startedAt,
        });
      });
    });

    next();
  }
}
