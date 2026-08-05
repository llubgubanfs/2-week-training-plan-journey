import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressLayerType } from '@opentelemetry/instrumentation-express';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { IncomingMessage } from 'node:http';

/**
 * OpenTelemetry bootstrap. Day 6.
 *
 * ⚠️ THIS MUST RUN BEFORE ANY INSTRUMENTED MODULE IS LOADED, AND "BEFORE" IS
 * STRICTER THAN IT LOOKS.
 *
 * Instrumentation works by intercepting module loading: it hooks require/import,
 * and when `node:http` (or express, or undici) is asked for, it hands back a
 * patched copy. Anything that captured a reference *before* the hook was
 * installed keeps the unpatched original forever, and produces no spans.
 *
 * Which is why this is imported, not called:
 *
 *     import './tracing';                        // ✅ evaluated first
 *     import { NestFactory } from '@nestjs/core';
 *
 *     import { NestFactory } from '@nestjs/core'; // ❌ http already loaded here
 *     startTracing('booking-api');                //    looks first, is not
 *
 * Imports are hoisted and evaluated before any statement in the module body, so
 * `startTracing()` as the first *line of code* is already too late. It has to be
 * an import, and it has to be the first one.
 *
 * This file therefore imports nothing from @app/observability's barrel — that
 * would pull in the Nest decorators, and with them express and http, before the
 * hooks exist. Everything here is @opentelemetry/* only. Keep it that way.
 *
 * (Checked before relying on it: `nest build --webpack` marks node_modules as
 * externals, so `dist/main.js` still emits real `require("@nestjs/core")` calls
 * at runtime. Bundled dependencies would be invisible to the hooks; these are not.)
 */
export function startTracing(serviceName: string): NodeSDK {
  // Compose sets this to http://jaeger:4318. The exporter wants the full signal
  // path, and appending it here rather than baking it into the env var keeps the
  // variable meaning what OTel says it means: the collector root, shared by
  // traces, metrics and logs.
  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

  const sdk = new NodeSDK({
    // What splits the trace into two coloured halves in the Jaeger UI. Without
    // it every span is attributed to "unknown_service:node" and the whole point
    // of a distributed trace — seeing the boundary — is lost.
    resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: serviceName }),

    traceExporter: new OTLPTraceExporter({
      url: `${endpoint.replace(/\/+$/, '')}/v1/traces`,
    }),

    instrumentations: [
      getNodeAutoInstrumentations({
        // Every fs call becomes a span. On a Nest boot that is thousands of
        // them, and they bury the two spans anyone actually wants to look at.
        '@opentelemetry/instrumentation-fs': { enabled: false },

        // Measured before tuning: one request produced 38 spans, 26 of them
        // named "middleware - patched" or "middleware - <anonymous>". Express
        // instrumentation emits a span per middleware layer, and Nest mounts a
        // dozen — body parsers, the CLS middleware, both of ours.
        //
        // This is Day 3's cardinality decision in a third currency. There it was
        // time series, here it is spans: the cost is storage, and the cost that
        // bites sooner is that the two spans worth looking at are buried under
        // two dozen sub-millisecond bars in the waterfall. A trace nobody can
        // read is not evidence.
        //
        // MIDDLEWARE only. ROUTER and REQUEST_HANDLER stay — they carry the
        // matched route, which is what makes the span name a bounded label
        // rather than a raw URL. Same reasoning as route templates on Day 3.
        '@opentelemetry/instrumentation-express': {
          ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
        },

        // Turning off the express layers above only removed half of them, which
        // was worth measuring rather than assuming: the survivors carried
        // `otel.scope.name: @opentelemetry/instrumentation-router`, a different
        // package entirely.
        //
        // Express 5 moved its router into a standalone `router` module, and that
        // module has its own instrumentation. It re-reports the same layers
        // express already reports, so every middleware and every route handler
        // was being recorded twice by two instrumentations that do not know about
        // each other. Off: express is the one that also knows the matched route.
        '@opentelemetry/instrumentation-router': { enabled: false },

        '@opentelemetry/instrumentation-http': {
          // Same decision as Day 5's, in a third currency.
          //
          // Prometheus scrapes /metrics every 15s and the container healthcheck
          // hits it every 10s. Left alone that is ~14,000 traces a day against
          // zero users, and the Jaeger UI's "find traces" list becomes unusable
          // — the one real trace is on page 40.
          //
          // Day 3 excluded /metrics from the metrics middleware, Day 5 excluded
          // it from the logging middleware, and this is the same exclusion for
          // spans. Scrape health is observable from Prometheus's own `up` series,
          // which is where you would look for it anyway.
          ignoreIncomingRequestHook: (req: IncomingMessage) =>
            (req.url ?? '').startsWith('/metrics'),
        },
      }),
    ],
  });

  sdk.start();

  // The other half of the lesson from the fire-and-forget drill: BatchSpanProcessor
  // holds ended spans in memory and ships them on a timer. A process that exits
  // between flushes takes the buffer with it.
  //
  // shutdown() force-flushes, so a deliberate `docker stop` loses nothing. It
  // cannot help with an abrupt death — an unhandled rejection gives no chance to
  // run this, which is exactly why the fire-and-forget path carries a .catch().
  //
  // This only works because of Day 2's tini fix: as PID 1 node never received
  // SIGTERM at all, so this handler would have been installed and never called.
  const flushAndExit = (signal: NodeJS.Signals) => {
    void sdk
      .shutdown()
      .catch(() => undefined)
      .finally(() => process.kill(process.pid, signal));
  };

  process.once('SIGTERM', () => {
    process.removeAllListeners('SIGTERM');
    flushAndExit('SIGTERM');
  });
  process.once('SIGINT', () => {
    process.removeAllListeners('SIGINT');
    flushAndExit('SIGINT');
  });

  return sdk;
}
