/**
 * What kind of work a log line belongs to.
 *
 * `http`   — an inbound request.
 * `job`    — a scheduled or queued run. Day 8's cron opens its own context with this
 *            type and its own generated id, so it correlates exactly like a request.
 * `system` — no unit of work behind the line at all: bootstrap, shutdown, a stray
 *            unhandled rejection. Never stored — it is what the formatter falls back
 *            to when no context is active.
 *
 * Three values, so this stays low-cardinality and is safe to use as a label. The
 * correlation id itself is not: it belongs inside the log line, never as a Loki label.
 */
export type ContextType = 'http' | 'job' | 'system';

/**
 * Declaration-merged into nestjs-cls's own `ClsStore` rather than passed around as
 * `ClsService<AppClsStore>`.
 *
 * The generic form looked tidier but was unsound: `ClsMiddleware` invokes `setup`
 * with a plain `ClsService<ClsStore>`, so a callback declaring it needs
 * `ClsService<AppClsStore>` claims fields the caller never promised. Under
 * `strictFunctionTypes` that is exactly the error it should be. Augmenting the
 * interface makes `ClsService` mean *this* store everywhere, with no generic and no
 * cast.
 */
declare module 'nestjs-cls' {
  interface ClsStore {
    /**
     * `correlation_id`, not `request_id`: Day 8's cron has no request, so a name
     * mentioning one would lie. `contextType` says which kind of work it identifies.
     */
    correlationId: string;
    contextType: Exclude<ContextType, 'system'>;
    /** Captured at context open; diffed at response time to produce `duration_ms`. */
    startedAt: number;
  }
}

/**
 * Honoured on the way in, in this order, so an id assigned upstream survives the hop.
 *
 * `x-correlation-id` wins when both are present: it is the deliberate choice of a caller
 * that knows this contract, whereas `x-request-id` is typically stamped automatically by a
 * proxy or load balancer. Accepting the second means the service behaves correctly behind
 * infrastructure it does not control.
 *
 * Node lowercases inbound header names, so these must stay lowercase to match.
 */
export const CORRELATION_ID_HEADERS = [
  'x-correlation-id',
  'x-request-id',
] as const;
