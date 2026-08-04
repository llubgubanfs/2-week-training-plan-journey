import { randomUUID } from 'node:crypto';
import {
  DynamicModule,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { ClsMiddleware, ClsModule, ClsService } from 'nestjs-cls';
import type { Request } from 'express';
import { CORRELATION_ID_HEADERS } from './cls/app-cls-store';
import { DebugController } from './debug/debug.controller';
import { HttpLoggingMiddleware } from './logging/http-logging.middleware';
import { buildWinstonOptions } from './logging/winston-options.factory';
import { HttpMetrics } from './metrics/http.metrics';
import { HttpMetricsMiddleware } from './metrics/http-metrics.middleware';
import { MetricsController } from './metrics/metrics.controller';
import {
  METRICS_REGISTRY,
  createMetricsRegistry,
} from './metrics/metrics.registry';

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
        // it explicitly in configure() makes the order part of the code instead.
        ClsModule.forRoot({ global: true }),
        WinstonModule.forRootAsync({
          imports: [ClsModule],
          inject: [ConfigService, ClsService],
          useFactory: (config: ConfigService, cls: ClsService) =>
            buildWinstonOptions(config, cls, options.service),
        }),
      ],
      // DebugController rides alongside MetricsController because it is an
      // observability affordance, not domain surface: it exists to make the
      // signals in this library move. Registered unconditionally — Leander's
      // call, Day 4; the bounded delay is what keeps that safe.
      controllers: [MetricsController, DebugController],
      providers: [
        {
          provide: METRICS_REGISTRY,
          useFactory: () => createMetricsRegistry(options.service),
        },
        HttpMetrics,
        HttpLoggingMiddleware,
        HttpMetricsMiddleware,
      ],
      exports: [ClsModule, WinstonModule, HttpMetrics, METRICS_REGISTRY],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    // ⚠️ The order of these two apply() calls is load-bearing. Nest runs
    // module-bound middleware in registration order, and that registration order
    // is the *only* thing keeping ClsMiddleware ahead of HttpLoggingMiddleware
    // now that they no longer share a call. Running the logger first does not
    // degrade gracefully — its first act is cls.get() followed by a property read
    // on the result, so an absent store throws on every single request. That was
    // Day 2's bug #1, and it is invisible to the compiler. Do not swap these.
    consumer
      .apply(
        // `.use` rather than the class: ClsMiddleware binds `use` as an arrow
        // function in its constructor precisely so it can be mounted this way with
        // options. It reaches ClsService through ClsServiceManager, which is a
        // `useValue` of the same singleton the Winston factory injects — one
        // AsyncLocalStorage, one context.
        new ClsMiddleware({ setup: openHttpContext }).use,
      )
      // '{*splat}' rather than '*': Express 5 routes through path-to-regexp v8,
      // where a bare '*' is a syntax error. The braces make the segment optional,
      // so this matches '/' as well as '/anything/nested'.
      //
      // Deliberately *not* excluded below. /metrics keeps a context even though
      // nothing logs the request pair for it, so anything MetricsController does
      // log still carries a correlation_id — and, from Day 6, a trace_id.
      .forRoutes('{*splat}');

    // Grouped because they share one exclusion policy, not because they are
    // related otherwise. Prometheus scrapes /metrics every 15s and the container
    // healthcheck hits the same endpoint every 10s.
    //
    // For metrics, counting those would swamp the real traffic — at low volume the
    // scrape *is* the traffic — and inflate the denominator of the error ratio with
    // requests no user ever made. For logs it is the same problem in a different
    // currency: two lines per request, ~28,800 a day against zero users, found by
    // the Day 4 dashboard within an hour of it existing.
    //
    // Nothing is lost by going quiet here. Scrape health is already observable
    // from Prometheus's own side — `up` and `scrape_duration_seconds` — which is
    // where you would look for it anyway.
    consumer
      .apply(HttpLoggingMiddleware, HttpMetricsMiddleware)
      .exclude({ path: 'metrics', method: RequestMethod.ALL })
      .forRoutes('{*splat}');
  }
}
