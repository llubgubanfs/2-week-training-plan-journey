// Deliberately NOT exported here: ./tracing/otel.
//
// This barrel pulls in the Nest decorators, and with them express and node:http.
// Reaching the tracing bootstrap through it would load the very modules the
// bootstrap exists to patch first, which is the one ordering mistake that
// produces an empty Jaeger with no error. Import it by its own path:
//
//   import { startTracing } from '@app/observability/tracing/otel';
//
export * from './observability.module';
export * from './cls/app-cls-store';
export * from './debug/debug.controller';
export * from './logging/correlation.format';
export * from './logging/http-logging.middleware';
export * from './logging/winston-options.factory';
export * from './metrics/http.metrics';
export * from './metrics/http-metrics.middleware';
export * from './metrics/metrics.controller';
export * from './metrics/metrics.registry';
export * from './metrics/request-labels';
