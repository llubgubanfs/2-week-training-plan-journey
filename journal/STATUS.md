# STATUS — single source of truth

> Claude: read this before responding to anything. Update it via `/day-end`.
> Humans: this is "where am I right now."

**Currently:** Day 4 of 10 · next working day Mon 2026-08-03 · Week 2 begins
**Last updated:** 2026-07-31 (Day 3 closed out)

---

## Scores

| Track | Baseline (Day 1) | Target | Retest |
|---|---|---|---|
| Observability & Structured Logging | not yet scored by EM | **7 / 10** | Day 10 |
| System Design | not yet scored by EM | **8 / 12** | Day 9 |

Baseline answers: `1-baseline/observability-structured-logging-answers.md`. Neither track's baseline number has come back from Harvey yet. Chasing them is **parked** (Leander's call, Day 2) — revisit before Day 9 only if a measured delta is wanted.

---

## Real calendar

**Rule:** Day N advances one weekday at a time, anchored to **Day 2 = Thu Jul 30**. The plan's
own Mon–Fri labels are ignored — Leander's call, confirmed Day 2. This table is the answer; no
session should re-derive it.

| Day | Date | Topic | Status |
|---|---|---|---|
| 1 | Wed Jul 29 | Baseline assessments | ✅ done |
| 2 | Thu Jul 30 | Structured logging | ✅ done |
| 3 | Fri Jul 31 | Metrics & alertable signals | ✅ done |
| 4 | **Mon Aug 3** | Infra: Prometheus + Grafana + Jaeger | 🔵 next |
| 5 | Tue Aug 4 | Integration + EM demo (live or recorded) | ⬜ |
| 6 | Wed Aug 5 | Distributed tracing | ⬜ |
| 7 | Thu Aug 6 | Waitlist design extension | ⬜ |
| 8 | Fri Aug 7 | Silent failure detection | ⬜ |
| 9 | Mon Aug 10 | **System Design defense — GRADED** | ⬜ |
| 10 | Tue Aug 11 | Walkthrough + **Observability retest — GRADED** | ⬜ |

---

## Open questions for Harvey (raise at EOD)

1. Is a PR per day into my own repo the delivery format you want, or do you prefer something else? *(asked Day 2 EOD)*
2. Does the Day 10 "recorded walkthrough" need to be a specific length or format?
3. Should `correlation_id` be renamed to the plan's literal `request_id`? *(raised Day 2 EOD — free to change until Day 4, when Grafana dashboards start querying the field by name)*

**Deprioritised by Leander on Day 2 — do not re-raise unprompted:**

- ~~Booking Days 5, 9, 10~~ — not treated as a blocker. Harvey may accept a recorded submission instead of a live session, so chasing calendar slots is premature.
- ~~Day 1 baseline scores~~ — parked. Worth revisiting before Day 9 if a measured delta is wanted, but not a blocker now.

## Decisions made

| Decision | Rationale |
|---|---|
| One continuous project, not per-day copies | Day 2's service *is* Day 6's and Day 8's; Day 4's stack is explicitly reused all of Week 2 |
| NestJS built-in monorepo mode | Shared `libs/observability` via tsconfig alias, no workspace tooling tax |
| Booking-domain slice + hard scope fence | Ties the two tracks together for Day 9; fence stops it eating Week 2 |
| `AsyncLocalStorage` for correlation | Day 8's cron has no request to scope to; ALS covers HTTP *and* jobs |
| Deploy-ready, deploy decision deferred to Day 8 | 12-factor costs ~nothing now; hosting hours aren't in the plan |
| Winston over pino | Plan names Winston. Know the tradeoff for Day 10 follow-ups. |
| **TypeORM** over Prisma | Leander's call, Day 2. Not assessed — chosen for speed. Lands with the domain work, not before. |
| **`llubgubanfs/…` is the canonical repo** | Leander's call, Day 3. Two same-named repos existed with identical `master`; Days 1–2 happened in `y4nder/…`, Day 3 onward is `llubgubanfs/…`. |
| Route **template** as the metric label, never `req.originalUrl` | Day 3. Bounds cardinality at ~135 series instead of ~131,500 and growing. Full arithmetic in `journal/day-03-metrics.md`. |
| Error ratio **derived in PromQL**, not a second counter | Day 3. One labelled counter cannot drift out of sync with itself. |

### ⚠️ Known workflow friction — PRs must be opened in the browser

`gh` is authenticated as **`y4nder`**, which has no write access to `llubgubanfs/…`, so
`gh pr create` fails with *"must be a collaborator"*. `git push` is unaffected (SSH, as
`llubgubanfs`). **Every day from here: push the branch, then open the PR via**
`https://github.com/llubgubanfs/2-week-training-plan-journey/compare/master...<branch>?expand=1`.
Fixable with `gh auth login` as `llubgubanfs`, but that switches the active account globally
and would affect Leander's other projects — deliberately not done.

Also: **Day 2's PR link is orphaned.** It lives at `y4nder/…/pull/1` and that repo has no Day 3+
work. If Harvey was given that link, he needs the new one.

## Carry-over into Day 4

- [ ] Booking domain endpoints (only scaffolding exists — no domain code yet). Slipped from Day 2, then from Day 3. **Day 4 is the natural home** — the entities, TypeORM and Postgres all land together, and the scope fence keeps it thin (3 endpoints, ~300 lines).
- [x] ORM chosen: **TypeORM**. Not installed yet — it ships in the same PR as the entities so that diff is coherent.
- [ ] Postgres not yet in the stack (lands Day 4)
- [x] **Pluralsight** — Prometheus/Grafana sections watched Day 3. Deck saved at `plural-sight-resources/` (gitignored: licensed content, 11 MB). Its alert example is *wrong* in a useful way — see the Day 3 journal.
- [ ] **The `499` branch is written but never fired.** Every test request completed, so `res.writableFinished` was always true. Needs a slow endpoint to abandon — verify on Day 4 once there is a real DB call.
- [ ] **PII / secret redaction and log-level discipline** — still not in the logger. Plausible Day 10 question ("what must never go in a log line?"). Known hole.
- [ ] **Graceful shutdown at app level** — `tini` fixed signal delivery at the container level on Day 2, but `app.enableShutdownHooks()` and draining in-flight work are still unwired. Day 8 concern.
- [ ] **No dashboard yet.** The metrics exist and nothing renders them. That is Day 4's job, and the alert rules in the Day 3 note are written but not wired into a running Prometheus.

---

## Weak-spot list

Concepts fumbled in quizzes or review. **This drives Day 10 retest prep** — don't re-read everything, drill this.

Seeded from the Day 1 baseline answers:

| # | Gap | Day 1 answer | Reality | Addressed |
|---|---|---|---|---|
| 1 | **What a trace is** | "information that tells where the log originated or has come about to" | That describes a log's source. A trace is the causal chain of **spans** across services for **one request**, tied by a shared trace id. | Day 6 |
| 2 | **Prometheus scrape model** | "I do not have knowledge nor experience with Prometheus" | Pull model: Prometheus periodically GETs `/metrics`; the app just exposes current values, it does not push. | Days 3–4 |
| 3 | **Knowing you're down before users report** | health endpoint + notify | Incomplete. A health check can't catch a job that fails *silently* — that needs alerting on **absence of success**, not on errors. This is his own interview scenario. | Day 8 |
| 4 | **Metric vs log boundary** | called a metric "how long a process took... useful for benchmarks and analytics" | Directionally right but framed as analytics. Metrics are for **alerting on aggregate behavior**; framing them as analytics understates the point. | ✅ **closed Day 3** (3rd pass) — see below |

Added Day 2 (ALS vs nestjs-cls review):

| # | Gap | Answer given | Reality | Addressed |
|---|---|---|---|---|
| 5 | **Why context survives an `await`** | "it has its own managed storage during request time" | Restates the API, not the mechanism. The store attaches to the **async resource** created at the await point, via `async_hooks`' `init` hook — each in-flight request holds its own reference, so there is no shared slot to overwrite. He can explain why a module-level `let` *fails*, not why ALS *works*. Also said Node is "single-threaded by default" — there is no non-default; `worker_threads` are separate isolates. | ⚠️ re-missed Day 3 (2nd) — `/explain-back` required |
| 6 | **"Where is the correlation id created?"** | "at module level" (`ClsModule.forRoot`) | That is where it is **configured**. It is **created** per-request by the `idGenerator` inside the mount middleware. Config site ≠ creation site — a one-question-deep answer, and Day 10 is a follow-up format. | ✅ **closed Day 3** — answered "in the middleware" unprompted |
| 7 | **Background work needs its own identity** | inheriting the originating `request_id` is enough | Necessary but not sufficient. A fire-and-forget that fails at t+30s logs the id of a request that returned 201 at t+0 — the correlation is intact and the alert is still useless. Needs a countable signal you can alert on the **absence** of. Same shape as gap #3 and as the Day 8 cron. | Day 8 |
| 8 | **`res.on('finish')` semantics** | assumed the completion line always fires, so a client abort still yields 3 log lines | `'finish'` fires only when `end()` has been called *and* all data is flushed. A client that disconnects mid-response never satisfies it — Node emits `'close'` instead, which nothing listens for. So an aborted request logs **2** lines, not 3, and the completion line silently vanishes. Got there after being pointed at the event name, not unaided. | ✅ **closed Day 3** — produced the 2-lines answer unaided, then fixed the code |

**Day 3 warm-up quiz (3 questions, ~1.5/3).**

- **#6 CLOSED.** Asked where the correlation id is created, he answered "in the middleware,"
  unprompted. Config site vs creation site has stuck. No further drilling needed.
- **#5 RE-MISSED (2nd time).** Same shape of answer as Day 2 — "both get their own context,
  the store holds the reference." Restates isolation, does not explain it. Mechanism was
  handed to him on Day 3 (`async_hooks` `init` copies the store pointer onto each new async
  resource; `before` restores it when the callback runs — the store rides the resource, not a
  variable). **Not creditable until he produces it unprompted.** → `/explain-back` before Day 10.
- **#4 RE-MISSED**, plus a new misconception. Asked why `/metrics` is needed when the
  completion log already carries `status_code` and `duration_ms`, he called the metrics
  endpoint "an aggregator for those lines" — it reads nothing from the log stream; it is a
  separate in-process counter path. His justification (received-with-no-completed) is also a
  pure log-aggregator query, so it doesn't distinguish the two signals. Missing concept:
  **query-time vs write-time aggregation** — histograms pre-aggregate into fixed buckets, so
  cost is flat in RPS, retention is cheap, and rules can evaluate every 15s; log-derived
  percentiles scale with traffic and are computed from *sampled* data at volume. Corrected
  Day 3; verify it holds when he writes the alerting note.

Added Day 3 (metrics build session):

| # | Gap | Answer given | Reality | Addressed |
|---|---|---|---|---|
| 13 | **Knows a gauge, doesn't reach for one** | asked which metric would survive an outage where nothing completes, answered "the count, derived to rate" | He had already rejected gauges correctly for error rate an hour earlier, so the *definition* is solid — but when a problem called for "state right now" rather than "events completed," he reached for a counter again. Counters are driven by completion; during a hang nothing completes, both numerator and denominator read ~0, and `errors/total` is `NaN`, which crosses no threshold. The gauge is driven by **arrival** — the half that always happens. Definition owned, tool not owned. | drill before Day 10 |

**Day 3 build session — gaps #4 and #8 both closed.**

- **#8 CLOSED.** Asked what an abandoned request logs under the Day 2 code, he answered
  "two lines — request received, and the service log" unaided, and correctly said the
  counter would never increment. Day 2's nudge has stuck. Code now hooks `'close'` and
  branches on `res.writableFinished`.
- **#4 CLOSED on the third pass.** After the schools/tally-sheet analogy and a walk through
  the log-vs-metric pair in the middleware, his first restatement was a pure vocabulary swap
  ("identify an event" / "classify it") with no mechanism — *not* credited, and called out as
  the same failure shape as #5. Re-asked with those two words **banned**, he produced it
  cleanly and unprompted: a log stores one record per request so `originalUrl` is just a field,
  whereas every distinct label value creates a separate time series Prometheus must store,
  index and update — so dynamic paths generate unbounded cardinality, memory growth and
  slower queries. That version survives a follow-up. Closed.
- **Technique note that worked:** banning the borrowed vocabulary is what separated recall
  from understanding. Reuse this on #5 — make him explain ALS without the words "context",
  "store", or "isolated".

**Day 2 quiz (5 questions, 4/5 with one nudge).** Gap #3 has partially closed: on Day 1 the
answer was "health endpoint + notify"; today he independently produced two further
instances of the same failure class (a cron that finishes without notifying, a welcome
email that never sends) and named it as silent failure unprompted.

Residual on #3 — he framed the fix as "we should see an error log entry for those." That
inverts it: if an error existed to log, it would not be a silent failure. The detection
has to key on the **absence of an expected success**, not on the presence of an error.
Drill this exact sentence before Day 8 and again before the Day 10 retest.

### Live-skill gaps (self-identified, Day 1 system design session)

| Gap | Plan |
|---|---|
| Thinking on his feet under live follow-up | Rehearsals Days 5 and 9; `/design-drill` × 4 |
| Drawing diagrams under time pressure | Fixed 90-second skeleton in `design/skeleton.md`, drilled to muscle memory |
| Structuring a design walkthrough out loud | 9-section script in `design/talk-track.md` |

**Revised Day 2 after transcribing the session** (`design/01-baseline-session-transcript.md`).
Diagramming is *not* the real gap — the canvas was recalled accurately two days later. Three
sharper gaps replace it:

| # | Gap | Evidence | Plan |
|---|---|---|---|
| 9 | **Loses track of the prompt under load** | Background jobs — a quarter of the question — went untouched for 17 minutes until Harvey re-prompted at [17:04]. Remembered afterwards as a strength rather than a rescue. | Read the prompt back and keep it visible as a checklist; tick items off aloud. Drill in `/design-drill`. |
| 10 | **Doesn't register being corrected** | At [04:26] Harvey corrected the room/desk model via the internet-cafe analogy. Recorded afterwards as Leander clarifying, not being corrected. | Say corrections back out loud ("so a desk is independent of a room — noted"). Makes it stick and shows the interviewer it landed. |
| 11 | **Answers "how does this scale?" with a data model** | [09:07] acknowledged 200 locations and moved on; [15:01] returned with entity relationships. No scaling mechanism named anywhere in 22 min, no arithmetic. | Days 7 + 9. **Do not hand him the answer** — this is graded on independent reasoning. |
| 12 | **Reconstructs answers he never gave** | Multi-tenancy: "tenant" occurs twice, both in the prompt. Section 8 of the baseline doc describes a strategy never spoken in the session. | The habit, not the topic, is the risk: believing a topic was covered when it wasn't. Verify against notes before claiming coverage on Day 9. |

Strength confirmed on tape: double-booking [13:52–15:01] — app-level validation, composite
unique constraint, and explicit reasoning about two concurrent requests racing. The **Strong**
relational rating is real. Note the vocabulary gap though — the right answer was reached
without the words *transaction*, *lock*, or *isolation* appearing anywhere in the session.

---

## Day log

### Day 1 — Wed Jul 29 ✅
- Observability: 5-question written check-in → `1-baseline/observability-structured-logging-answers.md`
- System Design: live 15-min session with Harvey. Prompt: multi-tenant co-working platform, members reserve desks and meeting rooms across many locations, a desk can never be double-booked, must scale to 200 locations. Walk components, data flow, caching, background jobs.
- Self-assessment: constraints and flows went adequately; diagramming and thinking on his feet were weak.
- ⚠️ Baseline scores not yet received.
- ✅ **Correction (Day 2):** the design diagram *was* saved — `design/preassessment diagram.excalidraw`. An earlier note here said it was lost, which drove an unnecessary reconstruction push. A **22-min screen recording** of the session also exists at `~/Videos/2_week_training_plan_videos/recording_system_design_baseline.mp4`.
- The from-memory reconstruction was still done first, deliberately, to measure retention before the artifacts overwrote it. Result: recall matched the canvas on every component; he *under*-reported his own structure (a numbered flow and a schema-relationships block he didn't credit himself for). Self-assessment is harsher than the evidence supports — relevant to the live-confidence gap below.

### Day 2 — Thu Jul 30 ✅
**Objective:** structured JSON logging with an id correlated across one request.

**Deliverable — verified on disk and committed:**

| Evidence | Path |
|---|---|
| PR (merged) | [#1](https://github.com/y4nder/2-week-training-plan-journey/pull/1) → merge commit `7a9e09c` |
| Screenshot of JSON log output | `deliverables/day-02/correlated-logs.png` |
| Raw unfiltered log capture | `deliverables/day-02/booking-api-stdout.jsonl` |
| What each line proves + repro steps | `deliverables/day-02/README.md` |

Re-verified at day-end from a fresh build of `master`: two requests, six lines, one id per
request, inbound `x-correlation-id` honoured. Not inferred from a passing test — the service
was run and the output read.

Done:
- [x] Workspace structure, `CLAUDE.md`, this file, slash commands, design-track scaffolding
- [x] NestJS monorepo scaffolded: `apps/booking-api` (:3000), `apps/notifier` (:3001), `libs/observability` (`@app/observability`)
- [x] Deploy-ready boilerplate: parameterized `Dockerfile`, `.dockerignore`, `.env.example`, root `.gitignore`, pinned pnpm
- [x] Verified: both apps build, lint clean, both return 200 on their own ports
- [x] Verified: both Docker images build, run as non-root `node`, serve 200, and stop in ~150ms
- [x] Pluralsight structured-logging sections
- [x] Winston JSON logger + correlation middleware — approach stated before any code was written
- [x] `design/00-baseline-design.md` reconstructed from memory, *then* diffed against the recovered diagram and a 22-min recording
- [x] Deliverable: PR merged + screenshot
- [x] EOD to Harvey

**Checks at close:** `typecheck` clean (5 tsconfigs) · `lint` 0 errors 0 warnings · unit 5/5 ·
e2e 5+1 both apps · `build` passes.

**Design decisions made today** (all defensible on Day 10):
- `correlation_id` over `request_id` — Day 8's cron has no request; `context_type` (`http` · `job` · `system`) distinguishes the source
- Field **omitted**, not sentinelled, when no context is active — matches OTel's handling of `trace_id`
- `nestjs-cls` over hand-rolled ALS — Leander's call, taken after the tradeoffs were laid out
- Mounted as middleware, not interceptor or guard — the only mount point with no gap in front of it
- Logger injected rather than imported, so it mocks through DI

**Three bugs, all invisible to `pnpm build`:**
1. **Middleware ordering.** `mount: true` gave no ordering guarantee; the logging middleware ran first and read an empty store. Every request threw. Both now mounted explicitly in one `apply()`.
2. **Nothing was typechecking.** `nest-cli.json` sets `"webpack": true` → ts-loader transpile-only. ESLint is type-aware but never reports compiler diagnostics. Added `pnpm typecheck`, which found an unsound callback signature and a non-portable inferred type immediately. Enabled `strictFunctionTypes`.
3. **e2e suites broken.** No `moduleNameMapper` for `@app/observability`; both failed to resolve the module once the apps imported it. `test:e2e` also only ran one of the two apps.

Notes — scaffold bugs found and fixed (worth being able to explain on Day 5):
- Both apps defaulted to **port 3000**, and the notifier read a lowercase `process.env.port`. Would have collided the moment Compose brought both up.
- Both apps now bind **`0.0.0.0`** — bound to localhost inside a container, a published port is unreachable from outside.
- Notifier's generated e2e spec used `import * as request from 'supertest'` (not callable under `nodenext`) and never called `app.close()`. The `nest g app` template is older than the `nest new` one.
- **Container signal handling** — took three attempts, and the lesson is worth keeping for Day 8:
  1. Shell-form `CMD` forks node under `/bin/sh`, which never forwards signals.
  2. Switching to exec form still failed — **as PID 1 the kernel skips default signal dispositions**, and node installs no SIGTERM handler of its own, so the signal is silently ignored.
  3. Fixed with `tini` as PID 1. Measured: `docker stop` went from **10165ms** (full grace period, then SIGKILL) to **148ms**.

  Relevant on Day 8: a container that ignores SIGTERM gives an in-flight cron run no chance to finish or record its outcome — which is exactly the silent-failure class being studied.
  Still open at app level: `app.enableShutdownHooks()` + closing the server for *graceful* drain. Not wired yet — that's a Day 8 concern, not just an infra one.

### Day 3 — Fri Jul 31 ✅
**Objective:** expose `/metrics` carrying request count, error rate and latency, and write the one alert worth wiring off it.

**Deliverable — verified on disk and committed:**

| Evidence | Path |
|---|---|
| PR (open) | [#1](https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1) → branch `day-03-metrics`, commit `114e76a` |
| `curl /metrics` capture | `deliverables/day-03/metrics-scrape.txt` |
| Alerting note (one paragraph + 2 rules) | `deliverables/day-03/alerting-note.md` |
| Reasoning behind all of it | `journal/day-03-metrics.md` |

Re-verified at day-end from the committed build, not inferred from a green test: `GET /metrics`
returns **200** with `Content-Type: text/plain; version=0.0.4`, all three metrics present, plus
77 `process_`/`nodejs_` default series.

**Screenshot deliberately skipped.** The plan listed a `metrics-endpoint.png`; the committed
scrape text is strictly better evidence (greppable, diffable, shows every series). Leander's call.

Done:
- [x] Pluralsight Prometheus/Grafana sections
- [x] `prom-client` + dedicated `Registry` + `collectDefaultMetrics` in `@app/observability`
- [x] `http_requests_total` (counter), `http_request_duration_seconds` (histogram),
      `http_requests_in_flight` (gauge) — **approach stated and defended before any code**
- [x] `GET /metrics` via `MetricsController`; excluded from its own middleware
- [x] Alerting note, PR, EOD

**Bug found and fixed — carried over from Day 2's logger.** `HttpLoggingMiddleware` hooked
`res.on('finish')`, which fires only on a flushed response. A client who gave up mid-request
produced `request received` with no completion line, and would never have incremented the
counter either. Both middlewares now hook `'close'` and read `res.writableFinished`; abandoned
requests record **499**. `res.statusCode` cannot be used for this — Node initialises it to `200`,
so an abandoned request would have been counted as a **success**, which is worse than not
counting it at all.

**The day's real content was the cardinality decision.** Correctly labelled this service is
~135 time series; labelled with `req.originalUrl` it is ~131,500 and grows every day forever.
Full arithmetic in the journal. The scrape proves the guard: three different probe URLs
(`/wp-admin`, `/.env`, `/nope?id=…`) collapse to one `route="unmatched"` series.

**Quiz/drill result: gaps #4 and #8 closed, #13 opened.** See the weak-spot list. The technique
that worked — **banning the borrowed vocabulary** — is recorded there and should be reused on #5.

**Checks at close:** `typecheck` clean · `lint` 0 errors 0 warnings · `build` passes both apps ·
working tree clean · branch in sync with origin.

**Time:** ran long. The drill on histogram-vs-summary, cardinality and the alert threshold ate
most of the budget, and the booking domain slipped again. Judged worth it — those are Day 10
retest content, the domain is not assessed at all.
