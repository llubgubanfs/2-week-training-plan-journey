# Day 8 — Silent Failure Detection

**Date:** Fri 2026-08-07 · **Track:** Observability · **Branch:** `day-08-silent-failure`

**Objective:** add a cron job to `booking-api` that fails silently ~1-in-5 runs, and instrument it
so the failure is visible as a **log entry**, a **metric**, and an **alert rule** — then write the
answer to *"how would you know this failed before a user reported it?"* backed by that
instrumentation rather than by assertion.

**Prereqs (verified on disk):** Day 2 logger · Day 3 `/metrics` · Day 4 stack. All present.

**Deliverable:** `deliverables/day-08/` + PR. **This is the exact scenario from the interview**,
and it is gaps **#3**, **#7** and **#17**, all the same shape.

---

## Warm-up quiz — 3 questions on Day 7 (~2.25 / 3, best round since Day 5)

**Q1 — waitlist signals, ~0.75.** Needed the third bug invented for him before (a) got traction,
but **"stalled queue looks at the state, lost promotion looks at the step"** was produced
unprompted, and (b) — that a state signal costs you specificity at 3am — was clean and unaided.

Better than the question asked: given a third bug (booking service crashes after marking the entry
`fulfilled` but before publishing `booking.created`), he worked out that **both** signals are
silent. The desk is `reserved` so stalled-queue doesn't fire; the entry is `fulfilled` so
lost-promotion doesn't. **The member holds a desk and is never told.** That is a real hole in the
Day 7 design, found by him, and it goes to Day 9.

**Q2 — job correlation, 0.5.** Id lifecycle correct (created per run, at the start of the run, by
the job; `context_type: 'job'`). **Mechanism not produced — gap #5, 4th miss.** Answer given was
"stored in its own isolated context", which is the same restatement as the previous three times and
uses two of the three words banned on Day 6. Drilling stopped there: `/quiz` has produced nothing
new on this in three sessions.

**Q3 — the expiry worker's silent death, 1.0.** Right on the member impact, and he added the
second-order consequence unprompted (no expiry → no `desk.freed` → the waitlist stalls too). On
(b) he claimed the design already detects it, **was challenged for evidence, and produced it** —
the observability strip on `waitlist-design.png`.

## What I did

- **`JobRunner`** (`libs/observability/src/jobs/`) — one wrapper giving a scheduled job the same
  three signals a request gets. Opens its own CLS context with a generated `correlation_id` and
  `context_type: "job"`. **The Day 2 ALS decision paying off exactly as predicted**: no request to
  scope to, and nothing downstream needed changing.
- **Three job metrics** — `job_runs_total{job_name,outcome}`, `job_duration_seconds`,
  `job_last_success_timestamp_seconds`.
- **`bookings_expired_pending`** — the state signal, as a prom-client `collect()` callback.
- **The expiry sweep** — deliberately flawed, two failure shapes (`throw` and `silent`), rate and
  mode driven by env.
- **Three alert rules** — one state, two step.
- **6 tests**, suite 11 → 17.
- **Fixed a label collision** the demo itself exposed (below).
- Wrote the "how would I know" answer — his, revised once.

## What I learned

**The call-site split, and why it is not stylistic.** Success in `try` after the await, failure in
`catch`, only `span.end()` in `finally`. First instinct was to put the success counter in `finally`
— transferring Day 6's span rule, which was a good rule *there*. But a span must close on **every**
path or the trace is lost, while a success counter must be reachable on **exactly one** path or it
stops meaning anything. Same-looking cleanup, opposite requirements. In `finally` it would have
counted every failure as a success and silently disabled the entire day's alerting.

**A state signal must not be written by the component it watches.** If the sweep called
`gauge.set(...)` at the end of each run, a dead sweep stops updating it and Prometheus scrapes the
last healthy value — 0 — forever. Flat, green, and wrong. A `collect()` callback inverts the
dependency: the value is computed by the *scrape*, so it stays honest while the job is dead,
wedged, or silently matching nothing. This is the load-bearing decision of the build.

**`time() - timestamp_gauge` beats `rate(successes[10m]) == 0`.** `rate()` needs two samples inside
its window, so a job that stops right after a deploy produces an *empty result*, and `== 0` never
matches an empty result. Hence also the `absent()` arm: a rule referencing a series that does not
exist evaluates to nothing, which is silence at exactly the moment a crash-looping container needs
to be loud.

**A firing alert is not evidence that the alert works.** See below.

## What I got stuck on

**Gap #5 for the fourth time.** Asked what has to be true about *where* the correlation id is held
so a deep callee three frames past an `await` can find it, the answer was "stored in its own
isolated context" — a property of the result, not a mechanism, and two of the three words banned on
Day 6. **`/explain-back` on ALS is now the only remaining tool.** The hint given, and the thing to
produce unprompted: if two concurrent runs each have their own id, something *physical* has to
differ between them at the moment the deep callee reads it. Name that thing.

**The bug the demo found in itself, and it looked like success.** The first silent-mode run showed
two alerts firing, the gauge climbing, story intact. One was a false positive.

`job` is Prometheus's own label — the server stamps `job="<scrape config job_name>"` on every
series. When a target exposes a label the server owns, `honor_labels` decides, and it defaults to
**false**, so the *exposed* label loses and is silently renamed `exported_job`. Nothing errors,
`/metrics` looks right. So `{job="expiry-sweep"}` matched nothing, `absent()` returned 1, and
`ExpirySweepNotRunning` fired permanently **while the sweep ran perfectly**.

Two things worth keeping. First: the symptom of the broken alert was indistinguishable from the
demo succeeding, and the only thing that caught it was running the selector directly in Prometheus
and getting `[]` back. Second: `job` as a *log field* is fine — a log stream has no server writing
labels underneath it. Same word, two systems, one of which reserved it.

The same collision had existed on `service` since Day 3 (`exported_service`), unnoticed, harmless
only because both values were identical.

## Carry-over out of today

- **`/explain-back` × 2, spoken — cardinality then ALS.** Deferred to the weekend, deliberately.
  Both are **Day 10** content, not Day 9, so the deferral is defensible. What is *not* Day 10 is
  the spoken rep itself (#18) — Monday is live, unscripted, single-take.
- **The crash-after-`fulfilled` hole** found in Q1 — uncovered by both Day 7 signals.
- **Multi-tenancy (#21)** still undecided. **Scale math (#11)** still has no stated conclusion.
- `/health`, `app.enableShutdownHooks()`, Alertmanager, notifier scrape — all still open.
