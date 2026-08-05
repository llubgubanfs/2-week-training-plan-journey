# Day 6 — Wed Aug 5 · Distributed Tracing

**Track:** Observability
**Prereq per the plan:** Day 4 Prometheus/Grafana/Jaeger stack ✅
**Objective:** Instrument the sample service *plus one downstream call* with OpenTelemetry and
export the trace to the Jaeger already running from Day 4, so one request produces one trace
spanning both services.

**Deliverable Harvey will look at:** a screenshot of a trace in the Jaeger UI spanning both the
sample service and the downstream call.

---

## Orientation findings (checked on disk, not taken from STATUS.md)

- **The stack is up and has been for 22 hours.** All four containers running, `booking-api`
  healthy. No reboot gap today — the `unless-stopped` note in STATUS.md did not bite.
- **Jaeger is genuinely ready.** `jaegertracing/all-in-one:1.65.0`, `COLLECTOR_OTLP_ENABLED=true`,
  ports 16686 / 4317 / 4318 published, on the `obs` network.
- **`OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318` is already wired into `booking-api`'s
  environment** by the Day 4 compose file, alongside `OTEL_TRACES_SAMPLER`. Day 4 left the
  runway.
- **🔴 The downstream call does not exist — in either half.**
  - `NOTIFIER_URL` is set in `docker-compose.yml` (`http://notifier:3001`) and in `.env`, but
    **no code reads it**. `AppService.getHello()` returns a string; nothing makes an outbound
    HTTP request anywhere in the repo.
  - **There is no `notifier` service in `docker-compose.yml`.** The file defines exactly four:
    `booking-api`, `prometheus`, `grafana`, `jaeger`. The app exists in the monorepo and builds,
    but it has never been containerised or put on the `obs` network — so `http://notifier:3001`
    resolves to nothing today.
- **No OpenTelemetry packages installed.** `package.json` has no `@opentelemetry/*` dependency.
  Expected — Day 6 is where they land.

## Deliverable — evidence table

| Evidence | Path | Status |
|---|---|---|
| Jaeger trace, awaited hop | `deliverables/day-06/jaeger-trace-immediate.jpg` | ✅ |
| Jaeger trace, fire-and-forget | `deliverables/day-06/jaeger-trace-fire-and-forget.jpg` | ✅ |
| Both traces as data (Day 3's precedent) | `deliverables/day-06/trace-*.json` | ✅ |
| Log lines with `trace_id` across both services | `deliverables/day-06/correlated-log-with-trace.jsonl` | ✅ |
| What each proves | `deliverables/day-06/README.md` | ✅ |
| PR into `master` | [#3](https://github.com/llubgubanfs/2-week-training-plan-journey/pull/3) — 7 commits, 24 files | ✅ |
| Reasoning | this file | ✅ |

## Warm-up quiz — ~0.5 / 3

Weakest round so far on score, but two of the three misses are informative rather than just wrong.

1. **Why one root cause made Prometheus loud and Grafana silent — "I do not know."** The correct
   output when you don't, and the direct inverse of gap **#16**. Answer: a hard dependency of the
   process fails loudly (no config → no process → exit → restart policy amplifies it); an optional
   startup step fails silently when its *empty* result is indistinguishable from its *skipped*
   result. Grafana's provisioning scan cannot tell "unreadable" from "nothing to provision".
2. **Gap #5 (ALS) re-missed, third time — under a vocabulary ban.** Opened with the banned word.
   Invented a "global registry", which cannot exist: a lookup needs the caller to know the id, and
   the deep callee not knowing it is the whole problem. What was described was the event loop —
   the hazard, not the guard. Escalated from `/quiz` to `/explain-back`.
3. **Gap #1 (what a trace is) probed pre-build — half.** "Multiple services" doesn't discriminate
   (`correlation_id` already crosses services); "log order" doesn't either (timestamps give order).
   The distinction is **membership vs structure**: a flat id is a set, `span_id` +
   `parent_span_id` + duration is a tree, and parentage is not recoverable from timestamps.
   Re-ask at day-end.

**Drills now owed before Day 9/10:** `/explain-back` on ALS, `/explain-back` on cardinality
(gap #18), `/design-drill` for live pressure.

## What I did

- Containerised the notifier and put it on the `obs` network. `NOTIFIER_URL` had been in the
  environment since Day 2 pointing at a service with no container, read by no code — the plan's
  prereq list for today does not mention that the downstream call did not exist.
- Two endpoints per side, differing in exactly one variable: `GET /downstream-immediate` awaits,
  `GET /fire-and-forget` does not.
- OTel SDK bootstrap in `libs/observability/src/tracing/otel.ts`, started from a side-effecting
  `./tracing` module that is the first import in each `main.ts`.
- `trace_id` and `span_id` into the Winston formatter.
- Forwarded `x-correlation-id` to the notifier.
- Tuned span volume 38 → 9 per request.
- Repaired the notifier spec and added four `DownstreamService` tests. Suite 5 → 11.

## What I learned

**A span reaches Jaeger only if it is ended *and* its batch is flushed.** Two gates, failing
independently. The version I was first given — "exported when `end()` is called" — is the half
everyone knows, and my wrong answer followed correctly from it.

- **Gate 1** is the instrumentation's job. `@opentelemetry/instrumentation-http` ends the span
  inside an `'error'` listener, which is why a *failed* call still appears, in red. The only way
  to reopen this gate is to hand-roll a span and put `end()` on the happy path.
- **Gate 2** is mine. `BatchSpanProcessor` holds ended spans in memory and ships them on a timer.
  Since Node 15 an unhandled rejection terminates the process, and a dead process has no event
  loop — so the flush never runs and the **entire buffer** is lost, including the parent span of
  a request that returned a healthy 202.

The `.catch()` on a fire-and-forget call therefore **records nothing**. It runs three steps after
the span was already ended and buffered. Its contribution is purely negative: it keeps the
process alive long enough to flush. `.catch(() => {})` protects the trace exactly as well as one
that logs — and leaves a failure nobody ever learns about.

**Ordering: "first" is stricter than it looks.** Imports are hoisted and evaluated before any
statement in the module body, so `startTracing()` as the first *line of code* is already too
late — `@nestjs/core` above it has loaded `http` unpatched. It has to be an `import`, and it has
to be first. The failure mode is an empty Jaeger with no error, warning or log line.

**What a `trace_id` buys over a `correlation_id`.** Membership vs structure. A shared id gives a
*set* of lines; `span_id` + `parent_span_id` + duration gives a *tree*. Measured on the awaited
trace: the client span ran 45.55 ms and the server span it caused ran 42.99 ms, so ~2.5 ms was
DNS, connect and transit — time belonging to the space *between* services, which appears in
neither service's logs and cannot be recovered from timestamps.

## What I got stuck on

**Answering the question next to the one that was asked. Three times, on material I knew.**

| Asked | I answered |
|---|---|
| what physically holds a value across an `await` | how the event loop interleaves |
| what in the code decides an outcome | the absence-of-signal theme |
| what **decides** a full vs empty trace | how the instrumentation works — accurately |

The third one was correct material aimed at a different question. The diagnostic I was given and
should keep: **a constant cannot explain a variable.** If the question is "what decides", the
answer has to be something that *differs* between the cases — and the instrumentation is
byte-identical in all five scenarios. The thing that varied was one `.catch()`.

This is gap **#11** from the baseline session in new clothing ("how does this scale?" answered
with a data model), and #11 is graded on Day 9. The Day 1 instance looked like not knowing the
answer; three instances on topics I did know show it is question-tracking, not knowledge.
**Fix: read the question back aloud before answering.**

**Gap #5 (why ALS survives an `await`) missed a third time**, this one under a vocabulary ban,
and I used the banned word in the first six words. I invented a "global registry", which cannot
exist — a registry implies a lookup, and a lookup requires the caller to know the id, which is
precisely what a deep callee does not have. `/quiz` has stopped producing new information here;
this needs `/explain-back`.

**Q2 (what the 3am person cannot do with the late failure log) — missed.** I said they could not
tell whether it crashed; the line explicitly says it failed. The problem is not the line's
content, it is that **nothing will ever bring anyone to it**. A log line is a record, not a
signal: nothing counts, so nothing can threshold, and finding it requires already suspecting it.
Gap #7, and I wrote the residual myself on Day 2 — *"if an error existed to log, it would not be
a silent failure."*

**What went the other way, and is worth as much.** Asked why one root cause made Prometheus loud
and Grafana silent, I said **"I do not know"** rather than constructing a plausible story — the
direct inverse of gap #16. And I stopped the build to ask whether the artifact's "no handler"
control meant a hand-rolled span; the control's wording was genuinely ambiguous and the
inconsistency was real. Two instances in one day of checking rather than assuming.

## Decisions made

| Decision | Rationale |
|---|---|
| **Forward `x-correlation-id`, keep it alongside `trace_id`** | Taken after watching the two ids diverge in a real trace. **Sampling** is the argument to have ready: under head sampling a log line still carries a `trace_id` whose trace was never exported, so pasting it into Jaeger returns nothing. Logs are not sampled. Also, Day 8's cron has a correlation id and, uninstrumented, no span at all. |
| Two calling conventions rather than one | They differ in exactly one variable, so the failure behaviour is directly comparable — and fire-and-forget is Day 8's subject, so Day 8 inherits a working reproduction. |
| `/metrics` excluded from tracing | ~14,000 scrape traces a day against zero users would bury the real ones. Third currency for the same call: Day 3 for metrics, Day 5 for logs. |
| `instrumentation-router` disabled outright | Express 5 moved its router to a standalone package whose instrumentation re-reports the same layers. Express is the one that also knows the matched route. |
| Tracing bootstrap kept out of the `@app/observability` barrel | The barrel pulls in Nest decorators, and with them `http` — importing the bootstrap through it would load the modules the bootstrap exists to patch first. |

## Checks at close

`typecheck` clean · `lint` 0 errors 0 warnings · unit **11/11** across 4 suites · e2e 5+1 both
apps · `build` passes both apps · `verify.sh` fully green, including its Day 6 assertion
*"booking-api is exporting spans — Day 6 has landed"*, written on Day 4 and true for the first
time today · working tree clean apart from journal files, which go to `master` after merge.
