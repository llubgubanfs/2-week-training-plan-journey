import { Registry, collectDefaultMetrics } from 'prom-client';

/** DI token for the one Registry the app exposes on /metrics. */
export const METRICS_REGISTRY = Symbol('METRICS_REGISTRY');

/**
 * A dedicated Registry rather than prom-client's global `register`.
 *
 * The global is process-wide singleton state: registering the same metric name
 * twice throws, which turns every test that rebuilds the module into a failure.
 * An instance per module keeps that contained.
 *
 * `collectDefaultMetrics` adds process CPU/memory, GC, handle counts and — the
 * useful one for Node — `nodejs_eventloop_lag_seconds`. Roughly 40 series, free,
 * and event loop lag is the metric that explains a latency spike no amount of
 * request instrumentation will.
 */
export const createMetricsRegistry = (service: string): Registry => {
  const registry = new Registry();

  // Stamped on every series, so two services scraped into one Prometheus stay
  // distinguishable without relying on the scrape config to label them.
  registry.setDefaultLabels({ service });
  collectDefaultMetrics({ register: registry });

  return registry;
};
