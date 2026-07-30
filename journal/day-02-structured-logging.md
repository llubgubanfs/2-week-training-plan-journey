# Day 2 — Structured Logging

**Date:** Thu 2026-07-30 · Track: Observability · Branch: `day-02-structured-logging`

**Objective:** replace `console.log` with structured JSON logging, with a request-id correlated across a single request.

**Deliverable:** PR/diff with the structured logger wired in + a screenshot of sample JSON log output.

**Course:** Pluralsight — *Node.js Microservices: Monitoring and Logging*, structured-logging section.

---

## Time budget (~4 hrs, today is partly gone)

| | Task | Est |
|---|---|---|
| ✅ | Workspace + monorepo scaffold *(Claude)* | 30m |
| ✅ | Pluralsight structured-logging module | 45m |
| ✅ | Winston JSON logger + ALS request-id — **explain-first** | 90m |
| ✅ | Reconstruct Day 1 design from memory | 30m |
| ✅ | Journal + EOD | 15m |
| ⏭ | Booking domain endpoints — *slipped to Day 3, as planned* | 45m |

---

## Before building — answer these

`/quiz structured logging` covers these. Commit to an answer before any code gets written.

1. Why is a JSON log line more useful than `console.log('user ' + id + ' booked desk ' + deskId)`? Give the concrete operational reason, not "it's structured."
2. What is a correlation id *for*? What question does it let you answer that you couldn't before?
3. Where should the request-id be generated — client, load balancer, or app? What breaks with each choice?
4. Which fields belong on **every** log line, regardless of what's being logged?
5. What must never go into a log line?

## My approach — stated before any code was written

**My proposal:** mount the context in middleware, since that is where universal metadata gets
initialised. Store the correlation id and, on a second pass, a `startedAt` timestamp so a
duration can be diffed at response time. Use `nestjs-cls` rather than hand-rolling
`AsyncLocalStorage`.

**Failure cases Claude raised:**
1. A store timestamp meant as "the time of this log line" would be frozen at request start and
   stamp every line of the request with an identical, stale time — silently overriding
   Winston's correct one. *(Resolved: the field means `started_at`, and exists only to compute
   `duration_ms`.)*
2. The Winston format function is a plain callback outside DI, while `ClsService` lives inside
   it. Reaching it via the static `ClsServiceManager` would bypass the exact DI ergonomics that
   `nestjs-cls` was chosen for. *(Resolved: `WinstonModule.forRootAsync` with
   `inject: [ClsService]`.)*
3. Every log line with no request behind it — bootstrap, shutdown, Day 8's cron — also runs
   through that format function. *(Resolved: the field is omitted, and `context_type` falls
   back to `system`.)*

**Where I landed, and why:** `nestjs-cls`, chosen against the recommendation to hand-roll ALS.
The tradeoff was understood — the library is a wrapper over the same primitive, so the choice
buys ergonomics and maintenance at the cost of one layer between me and the mechanism. The
consequence I accepted: `async_hooks` now has to be learned deliberately before Day 10 rather
than absorbed by writing it.

Field named `correlation_id`, not the plan's `request_id`, because Day 8's cron has no request
behind it and a name mentioning one would lie. That call was mine, reached by reasoning about
Day 8 rather than by being told.

---

## What I built

- Winston JSON logger in `libs/observability`, exposed to both apps through `@app/observability`
- Correlation via `AsyncLocalStorage` (through `nestjs-cls`), carried across every line of one
  request without appearing in a single function signature
- `HttpLoggingMiddleware` emitting an open/close pair with method, path, `status_code` and
  `duration_ms`
- Inbound `x-correlation-id` and `x-request-id` both honoured, former winning
- Tests: concurrent contexts staying separate across an `await`; header precedence asserted
  against real stdout rather than a mocked logger

## What I learned

- **Why `AsyncLocalStorage` works, not just that it does.** The store attaches to the *async
  resource* created at the await point, via `async_hooks`' `init` hook. Each in-flight request
  holds its own reference, so there is no shared slot for a second request to overwrite. A
  module-level `let` has exactly one slot, which is why it corrupts under concurrency — and why
  it still looks correct under sequential traffic on a laptop.
- **`res.on('finish')` is not "the handler returned."** It fires only when `end()` has been
  called *and* the data is flushed. A client that disconnects mid-response never satisfies it;
  Node emits `'close'` instead. An aborted request therefore logs two lines, not three, and the
  completion line vanishes silently.
- **A green build proved almost nothing.** `nest build` transpiles without typechecking, ESLint
  never reports compiler diagnostics, and `pnpm test` does not run the e2e suites. Three of the
  four defects found today were invisible to it.
- **Absence beats a sentinel.** Omitting `correlation_id` on a system line is directly
  queryable, keeps cardinality clean, and matches what OTel does with `trace_id` — so a single
  line never carries two conventions.

## What I got stuck on

*The highest-value section for Day 9/10 prep.*

1. **I could explain why the naive approach fails, but not why the correct one works.** Asked
   why context survives an `await`, my answer was "it has its own managed storage during request
   time" — a restatement of the API, not a mechanism. I could describe the module-level
   variable being overwritten, but not what ALS does instead. That is a one-question-deep
   answer, and Day 10 is a follow-up format. **→ weak-spot #5.**

2. **I confused where something is configured with where it is created.** Asked where the
   correlation id is created, I said "at module level." That is `ClsModule.forRoot` — the
   configuration site. The id is created per request, inside the mount middleware. **→ #6.**

3. **I assumed the completion log always fires.** On the client-abort scenario I said three
   lines would still be emitted. I only got to the right answer after being pointed at the
   event name. **→ #8.**

4. **I framed silent failure as something that produces an error to log.** I said those cases
   "should be able to see an error log entry." If an error existed to log, it would not be a
   silent failure — detection has to key on the *absence of an expected success*. This is the
   Day 8 topic and it is my own interview scenario, so the framing needs to be automatic.
   **→ residual on #3.**

5. **I flagged a red line that turned out to be a real type error I had accepted.** Worth
   recording as a *positive*: `pnpm build` and `pnpm lint` were both green, and the editor was
   right. Trusting the tool over the passing build was the correct instinct.

## Evidence

- [x] PR opened against `master`, English title and body — [#1](https://github.com/y4nder/2-week-training-plan-journey/pull/1), merged as `7a9e09c`
- [x] Screenshot: `deliverables/day-02/correlated-logs.png` — two requests, six lines, **two distinct ids**, one shared per request
- [x] Path recorded in `journal/STATUS.md`
- [x] Raw log capture and reproduction steps: `deliverables/day-02/README.md`

---

## Notes from scaffolding

Already done, and worth knowing since you'll be asked to explain the repo on Day 5:

- **NestJS monorepo mode**, not a pnpm workspace — `apps/booking-api`, `apps/notifier`, `libs/observability` aliased `@app/observability`. One dependency tree, shared lib via tsconfig path, no workspace tooling.
- **Two generator bugs fixed:** both apps defaulted to port 3000, and the notifier read a lowercase `process.env.port`. Both would have collided the moment Compose brought them up together.
- **Both apps bind `0.0.0.0`**, not Nest's default localhost. Bound to localhost inside a container, a published port is unreachable from outside — a classic first-Docker-deploy failure.
- **`@nestjs/config` is global** in both apps; every value comes from env. Nothing hardcoded, so the same image runs locally, in Compose, and on a host if we deploy on Day 8.
- **`tini` is PID 1 in the images.** Without it `docker stop` took the full 10s grace period and then SIGKILLed — because as PID 1 the kernel skips default signal dispositions and node installs no SIGTERM handler. With tini: 148ms. Worth understanding before Day 8, since a container that ignores SIGTERM kills a cron run mid-flight with no chance to record the outcome.
- Winston and `nest-winston` are installed but **not wired** — that's yours.
- ~~**No `nestjs-cls` dependency.**~~ *Superseded on Day 2:* `nestjs-cls` was added after the tradeoff was laid out and Leander chose the library over hand-rolling. It wraps the same `AsyncLocalStorage` primitive, so nothing about propagation changes — what changes is that the mechanism now has to be learned deliberately before Day 10 instead of being absorbed by writing it.
