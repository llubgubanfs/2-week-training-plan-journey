# Day 2 — Structured logging with a correlated request id

**Objective:** every log line emitted during one request carries the same id, without
that id being threaded through any function signature.

---

## ⚠️ Deviation from the plan — read this first

The plan specifies *"a **request-id** correlated across a single request."* This service emits
**`correlation_id`**, not `request_id`. The capability is exactly as specified — one id across
every line of one request — but the field is named differently, deliberately.

**Why.** Day 8 adds a cron in the notifier that runs with no HTTP request behind it, and it
needs the same correlation through the same logger. A field named `request_id` on a job-run
line would be false. `correlation_id` covers both, and a separate low-cardinality
`context_type` field (`http` · `job` · `system`) says which kind of work produced the line.

**Why not rename later.** From Day 4 the Grafana dashboards are provisioned as committed JSON
and query these fields by name. Renaming after that point means editing dashboard files and
re-verifying every panel. The cost of choosing now is zero; the cost of choosing on Day 8 is
not.

**If a literal `request_id` is required**, say so and it is a one-line change today — before
any dashboard depends on it. That window closes on Day 4.

Related: the service honours **both** `x-correlation-id` and `x-request-id` on the way in, so
an id assigned by an upstream proxy or load balancer survives the hop regardless of which
convention that infrastructure uses.

## Evidence

**`correlated-logs.png`** — the screenshot the plan asks for. Two requests, six lines, captured
live. It shows three things at once:

| Lines | Shows |
|---|---|
| 1–3 | `fdaab967-35a0-4f54-9bca-e99c00006e52` on all three — one id correlated across a single request, which is the literal requirement |
| 4–6 | a *different* id — ids are per-request, not a global that happens to look correct under sequential traffic |
| 4–6 | that id is `harvey-demo-42`, supplied via `x-correlation-id` — an inbound id is honoured, not overwritten |

The command is visible in the frame, so the capture is reproducible rather than asserted:

```bash
pnpm start:dev 2>&1 | jq -R 'fromjson? // empty | select(.correlation_id)' -c
```

`jq` is used to filter and colourise — the output is still genuine JSON, not a pretty-printer.
`select(.correlation_id)` drops bootstrap lines, which is why no `context_type: "system"` line
appears in the shot; those are evidenced separately below.

**`booking-api-stdout.jsonl`** — raw stdout from `node dist/apps/booking-api/main`, three
requests against a running instance, unfiltered. Reproduce with:

```bash
cd coworking-obs && pnpm build
BOOKING_API_PORT=3000 LOG_LEVEL=info node dist/apps/booking-api/main
curl localhost:3000/
curl -H 'x-correlation-id: upstream-supplied-id-42' localhost:3000/
curl localhost:3000/does-not-exist
```

### One id across three lines of one request

```json
{"context_type":"http","correlation_id":"238eaaee-…","level":"info","message":"request received","method":"GET","path":"/","service":"booking-api"}
{"context_type":"http","correlation_id":"238eaaee-…","level":"info","message":"handling hello","service":"booking-api"}
{"context_type":"http","correlation_id":"238eaaee-…","duration_ms":6,"level":"info","message":"request completed","status_code":200,"service":"booking-api"}
```

The middle line is emitted from `AppService`, which never receives an id as an
argument. It arrives through `AsyncLocalStorage`.

### An id supplied upstream is honoured, not replaced

Two headers are accepted, in priority order:

```
curl localhost:3000/                                    → 0b96adc8-9f2c-448d-…  (generated)
curl -H 'x-request-id: from-proxy-999' …                → from-proxy-999
curl -H 'x-request-id: …' -H 'x-correlation-id: …' …    → from-caller-111
```

`x-correlation-id` wins when both are present — it is the deliberate choice of a caller that
knows this contract, whereas `x-request-id` is typically stamped automatically by a proxy.
Accepting the second means the service behaves correctly behind infrastructure it does not
control. This is also what will make the id survive a service hop on Day 6.

Pinned by four e2e tests in `apps/booking-api/test/app.e2e-spec.ts`, which assert against the
JSON the service really writes to stdout rather than a mocked logger — a mock would bypass the
Winston format function, which is where correlation actually happens.

### Lines with no request behind them degrade cleanly

```json
{"context":"NestApplication","context_type":"system","level":"info","message":"Nest application successfully started","service":"booking-api"}
```

`correlation_id` is **absent** rather than `null` or a `"system"` sentinel — the same
convention OTel follows for `trace_id` when no span is active, so a line never carries
two conventions at once. `context_type` is always present and has three values
(`http` · `job` · `system`), which keeps it low-cardinality and safe to use as a label.

### The 404 is correlated too

Two lines, no handler line. The context is opened in Express middleware, which runs
outside Nest's pipeline entirely — so requests rejected before any handler still log
with an id. An interceptor mount would have left that gap.

## Decisions

| Decision | Why |
|---|---|
| `nestjs-cls` over hand-rolled ALS | Leander's call. It wraps the same `AsyncLocalStorage`; bought for DI ergonomics and maintenance. |
| `correlation_id`, not `request_id` | Day 8's cron has no request. A name mentioning one would lie; `context_type` says which kind of work it is. |
| Mounted as middleware | Only mount point with no gap in front of it — guards and interceptors both run later. |
| Both middlewares mounted explicitly in one `apply()` | `mount: true` gives no ordering guarantee. See the bug below. |
| Logger injected, not imported | Swaps for a mock in unit tests (`app.controller.spec.ts`). |

## Bug found and fixed during the build

With `ClsModule.forRoot({ middleware: { mount: true } })`, `HttpLoggingMiddleware` ran
**before** `ClsMiddleware` — the store was empty and every request threw
`Cannot read properties of undefined (reading 'startedAt')`. Auto-mounting carries no
ordering guarantee relative to middleware registered in `configure()`. Fixed by
mounting both explicitly, in order, in a single `consumer.apply(...)` call.

Verified `ClsServiceManager.getClsService()` (used internally by a manually-mounted
`ClsMiddleware`) returns the *same* instance the Winston factory injects — it is a
`useValue` of one module-global singleton, so there is exactly one
`AsyncLocalStorage`. Had they been separate instances, correlation would have failed
silently.

## Type safety: the build was not checking types

`nest-cli.json` sets `"webpack": true`, so `nest build` runs ts-loader in transpile-only
mode — it strips types and emits without checking them. ESLint is type-aware here, but
that only lets lint *rules* consult the checker; ESLint never reports compiler
diagnostics. So a green `build` + `lint` said nothing about type correctness.

Added `pnpm typecheck` (`tsc --noEmit`). It immediately found two errors:

1. **TS2322, `observability.module.ts`** — `setup` was typed
   `(cls: ClsService<AppClsStore>, …)`, but `ClsMiddleware` invokes it with a plain
   `ClsService<ClsStore>`. The callback demanded fields the caller never promised.
   It worked at runtime only because both resolve to one shared instance — correct
   behaviour resting on an incorrect type.

   Fixed by declaration-merging into nestjs-cls's own `ClsStore` interface instead of
   threading a generic parameter around. `ClsService` now *means* this store
   everywhere, so the unsound conversion has nowhere left to occur.

2. **TS2742, `correlation.format.ts`** — the inferred return type resolved into
   `.pnpm/logform@2.7.0/…`, a transitive dependency pnpm does not hoist, so the
   emitted `.d.ts` would have referenced a path that exists only in this store.
   Fixed by annotating `Logform.Format`, which winston re-exports directly.

Also enabled `strictFunctionTypes` in `tsconfig.json`. It is on by default under
`strict`, which the Nest generator leaves off — which is why the CLI accepted code
that editors flagged. The CLI and the editor now agree.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e && pnpm build
```

- `pnpm typecheck` — clean across all five tsconfigs
- `pnpm lint` — 0 errors, 0 warnings (`--max-warnings 0`, no autofix)
- `pnpm test` — 5/5, including a test proving two concurrent contexts stay separate
  across an `await` (`libs/observability/src/logging/correlation.format.spec.ts`)
- `pnpm test:e2e` — 2/2, both apps
- `pnpm build` — both apps compile

Three of the four defects found while building this were invisible to `pnpm build`:
the middleware ordering bug (runtime only), both type errors (transpile-only build),
and a broken e2e suite. The e2e configs had no `moduleNameMapper` for
`@app/observability`, so both suites failed to resolve the module the moment the apps
imported it — and `test:e2e` only ever ran one of the two apps. Both fixed.
