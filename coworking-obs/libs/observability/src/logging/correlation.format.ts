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

    return info;
  })();
