import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ClsService } from 'nestjs-cls';
import { Logger } from 'winston';
import type { NextFunction, Request, Response } from 'express';

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

    res.on('finish', () => {
      this.cls.runWith(store, () => {
        this.logger.info('request completed', {
          method,
          path,
          status_code: res.statusCode,
          duration_ms: Date.now() - startedAt,
        });
      });
    });

    next();
  }
}
