import { isSpanContextValid, trace } from '@opentelemetry/api';
import { ClsService } from 'nestjs-cls';
import { format, Logform } from 'winston';

/**
 * Stamps correlation fields onto every log line.
 *
 * `cls` is captured once, at bootstrap, and that is safe: ClsService is a singleton
 * whose methods read AsyncLocalStorage at call time. The freshness lives in `get()`,
 * not in the reference — which is exactly why a request-scoped provider was rejected
 * on Day 2. A `Scope.REQUEST` service could not be closed over like this at all.
 */
// The return type is annotated rather than inferred. Inferred, it resolves to a type
// from `logform` — a transitive dependency that pnpm does not hoist, so the emitted
// .d.ts would reference a path that only exists in this store (TS2742). `Logform` is
// re-exported by winston itself, which is a direct dependency and therefore nameable.
export const correlationFormat = (cls: ClsService): Logform.Format =>
  format((info) => {
    // Safe outside a context: nestjs-cls reads through optional chaining all the way
    // down, so this returns undefined rather than throwing. A logger that throws
    // while logging would fail hardest on the error paths that need it most.
    const correlationId = cls.get('correlationId');

    // Absent, not a sentinel. From Day 6 `trace_id` is omitted the same way when no
    // span is active — W3C treats an all-zeroes trace id as invalid — and one line
    // should not carry two conventions. Absence is also directly queryable in LogQL,
    // where a magic string like "system" would have to be remembered forever.
    if (correlationId) {
      info.correlation_id = correlationId;
    }
    info.context_type = cls.get('contextType') ?? 'system';

    // Day 6. The line that turns three separate tools into one investigation:
    // find a slow trace in Jaeger, copy its id, and every log line from every
    // service that took part is one query away.
    //
    // Read from the active span rather than from CLS. Both ride AsyncLocalStorage
    // — OTel keeps its own store — but the span context is the one that survives
    // the process boundary, because instrumentation injects W3C `traceparent` on
    // outbound calls and reads it on inbound ones. correlation_id does not travel
    // unless we forward it ourselves.
    //
    // Note what this does NOT need: no argument threading, no span passed down
    // the call stack. Deep inside AppService, getActiveSpan() finds the span the
    // instrumentation opened at the edge — the same async-resource mechanism that
    // carries correlation_id, which is why the Day 2 decision to use ALS paid for
    // itself twice.
    const spanContext = trace.getActiveSpan()?.spanContext();
    if (spanContext && isSpanContextValid(spanContext)) {
      // Omitted, not sentinelled, when there is no span — matching the
      // correlation_id handling above. W3C defines an all-zeroes trace id as
      // invalid, and isSpanContextValid() is what rejects it, so a log line never
      // carries an id that cannot be looked up.
      info.trace_id = spanContext.traceId;
      info.span_id = spanContext.spanId;
    }

    return info;
  })();
