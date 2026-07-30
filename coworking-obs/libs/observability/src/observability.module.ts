import { randomUUID } from 'node:crypto';
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { ClsMiddleware, ClsModule, ClsService } from 'nestjs-cls';
import type { Request } from 'express';
import { CORRELATION_ID_HEADERS } from './cls/app-cls-store';
import { HttpLoggingMiddleware } from './logging/http-logging.middleware';
import { buildWinstonOptions } from './logging/winston-options.factory';

export interface ObservabilityModuleOptions {
  /** Stamped on every line as `service` — what tells the two apps apart in one stream. */
  service: string;
}

/**
 * First non-empty value among the given headers. A repeated header arrives as an array;
 * the first occurrence wins, matching how proxies append rather than replace.
 */
const inboundId = (
  req: Request,
  names: readonly string[],
): string | undefined => {
  for (const name of names) {
    const raw = req.headers[name];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) return value;
  }
  return undefined;
};

/** Populates the store the moment the context opens, before any handler runs. */
const openHttpContext = (cls: ClsService, req: Request): void => {
  cls.set(
    'correlationId',
    inboundId(req, CORRELATION_ID_HEADERS) ?? randomUUID(),
  );
  cls.set('contextType', 'http');
  cls.set('startedAt', Date.now());
};

@Module({})
export class ObservabilityModule implements NestModule {
  static forRoot(options: ObservabilityModuleOptions): DynamicModule {
    return {
      module: ObservabilityModule,
      global: true,
      imports: [
        // Note the absence of `middleware: { mount: true }`. Auto-mounting gives no
        // ordering guarantee against middleware registered in configure() below,
        // and HttpLoggingMiddleware ran first — reading an empty store. Mounting
        // both explicitly, in one apply() call, makes the order part of the code.
        ClsModule.forRoot({ global: true }),
        WinstonModule.forRootAsync({
          imports: [ClsModule],
          inject: [ConfigService, ClsService],
          useFactory: (config: ConfigService, cls: ClsService) =>
            buildWinstonOptions(config, cls, options.service),
        }),
      ],
      providers: [HttpLoggingMiddleware],
      exports: [ClsModule, WinstonModule],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(
        // `.use` rather than the class: ClsMiddleware binds `use` as an arrow
        // function in its constructor precisely so it can be mounted this way with
        // options. It reaches ClsService through ClsServiceManager, which is a
        // `useValue` of the same singleton the Winston factory injects — one
        // AsyncLocalStorage, one context.
        new ClsMiddleware({ setup: openHttpContext }).use,
        HttpLoggingMiddleware,
      )
      // '{*splat}' rather than '*': Express 5 routes through path-to-regexp v8,
      // where a bare '*' is a syntax error. The braces make the segment optional,
      // so this matches '/' as well as '/anything/nested'.
      .forRoutes('{*splat}');
  }
}
