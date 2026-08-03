# STATUS — single source of truth

> Claude: read this before responding to anything. Update it via `/day-end`.
> Humans: this is "where am I right now."

**Currently:** Day 5 of 10 · next working day Tue 2026-08-04 · **live EM demo**
**Last updated:** 2026-08-03 (Day 4 closed out)

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
| 4 | Mon Aug 3 | Infra: Prometheus + Grafana + Jaeger | ✅ done |
| 5 | **Tue Aug 4** | Integration + EM demo (live or recorded) | 🔵 next |
| 6 | Wed Aug 5 | Distributed tracing | ⬜ |
| 7 | Thu Aug 6 | Waitlist design extension | ⬜ |
| 8 | Fri Aug 7 | Silent failure detection | ⬜ |
| 9 | Mon Aug 10 | **System Design defense — GRADED** | ⬜ |
| 10 | Tue Aug 11 | Walkthrough + **Observability retest — GRADED** | ⬜ |

---

## Open questions for Harvey

1. **Day 5 demo — live session or recorded submission?** ⚠️ **Tomorrow, Tue Aug 4, no slot booked.** Asked in the Day 4 chat message.
2. Does the Day 10 "recorded walkthrough" need to be a specific length or format? Folded into the same message.

**Answered Day 3 — do not re-raise:**

- ~~"Is a PR per day the delivery format you want?"~~ and ~~"is chat the right channel for daily progress?"~~ — both settled by Harvey's reply: *"For now, the daily progress should be in Daily Status Report in Rocks. PR Links, docs, video, stays here in the chat for now."* Two channels, recorded in `CLAUDE.md` and in `/day-end`.

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
| **`correlation_id` kept — `request_id` not adopted** | Day 3, by decision rather than by answer. Raised at Day 2 EOD and Day 3 EOD; Leander removed it from the Day 3 message before sending, so it was never asked. **Closed deliberately, not left pending.** Rationale is sound and defensible on Day 10: Day 8's cron has no HTTP request behind it but still needs correlating through the same logger, and `context_type` (`http` · `job` · `system`) distinguishes the source. From Day 4 the Grafana dashboards query the field by name, so a rename now costs dashboards too. **If Harvey asks on Day 10 why it differs from the plan, that is the answer — do not present it as an oversight.** |

### 💻 Machine change — Day 5 (Tue Aug 4) onward

**Days 1–4 happened on one machine; Day 5 onward is on a different one.** If a session finds
missing files or a stack that will not start, this is the first thing to check.

**Comes with the clone — nothing to do:** `CLAUDE.md`, this file, all journals and
deliverables, the whole `coworking-obs/` tree including `infra/`, and **the slash commands**
(`.claude/commands/` is tracked, so `/day-start`, `/day-end`, `/quiz`, `/design-drill` and
`/explain-back` all come across). `coworking-obs/.env` was byte-identical to `.env.example`,
so there was no local config to carry.

**Prerequisites on the new machine:** Docker Engine 24+ with the Compose v2 plugin, and git.
Nothing else — the app compiles inside the image. See `coworking-obs/infra/README.md`.

**Does not transfer, and each was a deliberate call:**

| Item | Status |
|---|---|
| Docker volumes (`prometheus-data`, `grafana-data`) | **Accepted loss.** The dashboard and datasource rebuild from the provisioning files; only metric *history* is gone. This is exactly the property provisioning-as-code was chosen for on Day 4. |
| `plural-sight-resources/` (11 MB, gitignored licensed content) | copy manually if needed |
| Day 1 baseline recording, `~/Videos/2_week_training_plan_videos/` (155 MB) | outside the repo; referenced in the Day 1 log |
| Agent memory files | outside the repo. **Deliberately not committed — this repo is public and they hold internal context.** |

**Opportunity, not friction:** `gh` on the new machine has no account attached yet. Authenticating
as `llubgubanfs` from the start removes the browser-only PR workaround below entirely. The warning
in `CLAUDE.md` about not switching accounts applies to the *old* machine, where it would disturb
other projects.

**Before the Day 5 demo:** do the setup early, not at T-30. A first `docker compose up -d --build`
takes 2–4 minutes on a cold machine and can fail in new ways. `infra/scripts/verify.sh` exiting 0
is the signal that the environment is genuinely ready.

### ⚠️ Known workflow friction — PRs must be opened in the browser

`gh` is authenticated as **`y4nder`**, which has no write access to `llubgubanfs/…`, so
`gh pr create` fails with *"must be a collaborator"*. `git push` is unaffected (SSH, as
`llubgubanfs`). **Every day from here: push the branch, then open the PR via**
`https://github.com/llubgubanfs/2-week-training-plan-journey/compare/master...<branch>?expand=1`.
Fixable with `gh auth login` as `llubgubanfs`, but that switches the active account globally
and would affect Leander's other projects — deliberately not done.

Also: **Day 2's PR link is orphaned.** It lives at `y4nder/…/pull/1` and that repo has no Day 3+
work. If Harvey was given that link, he needs the new one.

## Carry-over into Day 5

**Decide tonight, it has a deadline you don't control:**

- [ ] ⚠️ **No slot booked with Harvey for the Day 5 demo, which is tomorrow.** Live or recorded is still undecided. Deprioritised on Day 2 on the reasoning that a recording might be acceptable — that reasoning is intact, but "tomorrow" changes the calculus. Goes in the chat message tonight, folded in with the open Day 10 format question.
- [ ] **Should `/metrics` be excluded from the logging middleware?** Open decision, raised by today's finding. Three options: exclude it; drop it to `debug` level; leave it and rely on Prometheus's own `up` series for scrape visibility.

**Open from before:**

- [ ] Booking domain endpoints + Postgres + TypeORM. Slipped from Day 2, Day 3, and now **Day 4 — third time, deliberately.** Zero assessment points and it competes directly with the Growth Area. Realistic homes now: a Day 7 side-slot, or accept it does not land at all.
- [x] ORM chosen: **TypeORM**. Not installed.
- [x] **Pluralsight** — Prometheus/Grafana sections watched Day 3.
- [x] ✅ **The `499` branch has now fired.** Closed Day 4 as a side effect of the in-flight investigation: `--max-time 1` against `/debug/slow?ms=8000` produced `status_code=499`, `duration_ms: 1005`. Written Day 3, first executed Day 4.
- [ ] **PII / secret redaction and log-level discipline** — still not in the logger. Plausible Day 10 question. Known hole, untouched for three days.
- [ ] **Graceful shutdown at app level** — `app.enableShutdownHooks()` and draining in-flight work still unwired. Day 8.
- [ ] **No Alertmanager.** Rules evaluate and reach `firing` but notify nobody. Day 8 decides whether it is worth adding.
- [ ] **~28,800 log lines/day with zero users** — `/metrics` is excluded from the metrics middleware but not the logging middleware, so every scrape and healthcheck writes two lines. See the open decision above.
- [ ] **No `/health` endpoint.** The container healthcheck hits `/metrics`, which renders the entire registry every 10s. Day 8, alongside graceful shutdown.
- [ ] **`nodejs_eventloop_lag_p99_seconds` is exposed and unused.** It is the signal that registered today's saturation when the in-flight gauge could not (sub-ms idle → 10.5 ms under load). Not on the dashboard. Cheap ninth panel.
- [ ] **Nothing demonstrates a partial outage below 1 req/s** — the `HighErrorRatio` denominator guard gives that up by design. Day 8's absence-of-success work.

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

Added Day 4 (warm-up quiz, 1.5/3):

| # | Gap | Answer given | Reality | Addressed |
|---|---|---|---|---|
| 14 | **Thinks the app's counters persist on a volume** | asked what `http_requests_total` looks like after the container restarts: "the same thing happens… there will be volumes being set up for the container so it is persistent" | `http_requests_total` is a **number in the Node process's heap**, held by prom-client's `Registry`. No volume touches it. On restart it resets to 0, so Prometheus sees the series fall 40,000 → 12: a **counter reset**. Volumes persist *Prometheus's* TSDB, not the app's counters. The payoff: `rate()` treats any decrease as a reset and compensates — which is the actual reason you always `rate()` a counter instead of subtracting raw values. Sibling of #2. | drill before Day 10 |
| 15 | **Thinks Grafana stores the time-series data** | "data is physically stored inside the configured volumes when the container of grafana was created" | Grafana stores **no** time series. It is a query front-end: the panel issues a PromQL query at render time and Prometheus's TSDB answers. Grafana's own volume holds sqlite — users, orgs, and dashboards *created through the UI*. Missing the second half too: a click-configured dashboard dies with that volume, a **provisioned** one is a JSON file bind-mounted from the repo and is rebuilt on every boot regardless of volumes. That distinction is the entire reason for the provisioned-as-code decision, and he argued for the side that loses the dashboard. | Day 4 build — verify it holds |

**Day 4 warm-up quiz (3 questions, ~1.5/3).**

- **#13 — first clean pass.** Given a fresh symptom (Postgres pool saturation) with no mention
  of metric types, he reached for a **gauge** unprompted and framed it as *state right now*
  — the exact framing he failed to reach for on Day 3. Definition and tool selection now
  agree. **One more unprompted pass and this closes.** He did not answer the second half —
  why a counter of `connections_acquired` can't substitute: acquire and release are both
  events, so a counter gives throughput, never occupancy; recovering occupancy needs two
  counters that can drift and still goes negative across a restart.
- **Transfer miss worth noting.** He framed the pool alert as an absolute threshold. Day 3's
  own alerting note argues absolutes over ratios are the wrong shape — the useful signal is
  saturation (`in_use / pool_size`). He got this right yesterday for error rate and did not
  carry it one scenario sideways. Same class as #11 (reasoning doesn't transfer under a new
  frame).
- **#14 and #15 opened.** Both are "where does the state actually live" — the same underlying
  hole from two directions. Both land in today's build, so they get corrected against a
  running stack rather than on paper.

**Day 4 build session.**

- **#14 and #15 both closed in practice, not just corrected.** #15 got settled by editing the
  dashboard JSON on disk mid-session and watching Grafana's provider rescan pick it up with no
  restart — the file *is* the dashboard. #14 got settled by the in-flight investigation, which
  ended in exactly the right place: metric values live in the process heap, and the only
  durable copy is Prometheus's TSDB. **Verify both hold unprompted before Day 10** — they were
  learned by doing rather than produced on demand.
- **#13 CLOSED (2nd clean pass).** Asked which signal survives a hang, he had the gauge answer
  and the reason: driven by arrival, not completion. Two unprompted passes. Closed.

| # | Gap | What happened | Reality | Addressed |
|---|---|---|---|---|
| 16 | **Declares something broken before measuring it** | `http_requests_in_flight` would not move, and the working assumption was that the metric was faulty | It was correct the whole time. Three explanations were found convincing and all three were wrong — Prometheus's sampling interval, curl spawn cost, undici connection pooling — each killed by a measurement that took under two minutes. The real answer came from a number already being collected: the histogram spans the same region as the gauge and read 0.19 ms, so by Little's Law the gauge could not exceed 1. **The habit is the risk, not the topic** — same shape as #12 (reconstructing answers never given). Day 9 is live, and a confident wrong explanation costs more there than "let me check". | drill: on Days 7 and 9, say *"that's a guess — here's how I'd check it"* out loud before committing to a cause |

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

### Day 4 — Mon Aug 3 ✅
**Objective:** stand up Prometheus + Grafana + Jaeger + the service so `/metrics` has somewhere
to be scraped and rendered, and Jaeger is running ahead of Day 6.

**Deliverable — verified on disk and committed:**

| Evidence | Path |
|---|---|
| PR (open) | [#2](https://github.com/llubgubanfs/2-week-training-plan-journey/pull/2) → branch `day-04-infra-stack`, 4 commits, 19 files |
| Compose stack | `coworking-obs/infra/docker-compose.yml` |
| Grafana panel screenshot | `deliverables/day-04/grafana-dashboard.jpg` |
| Jaeger UI reachable | `deliverables/day-04/jaeger-ui.jpg` |
| Both targets UP | `deliverables/day-04/prometheus-targets.jpg` |
| Targets + rules + cardinality as text | `deliverables/day-04/stack-verification.txt` |
| Reasoning | `journal/day-04-infra-stack.md` |

Re-verified at day-end by running `infra/scripts/verify.sh` against the live stack: **18/18
checks pass** — both targets UP, three rules loaded healthy, and a live PromQL query travelling
Grafana → Prometheus → TSDB and back.

Done:
- [x] Compose stack, all four services, every port env-overridable
- [x] Prometheus scraping booking-api + itself at 15s; notifier deliberately excluded
- [x] The two Day 3 alert rules **loaded into a running Prometheus**, plus `TargetDown`
- [x] Grafana **provisioned as code** — datasource + 8-panel dashboard, `allowUiUpdates: false`
- [x] `infra/README.md`, `verify.sh` (18 checks), `traffic.sh` (8 modes)
- [x] `/debug/slow` + `/debug/fail` so the failure signals can be driven
- [x] PR description rewritten with the three screenshots embedded, pinned to a commit SHA so
      the links survive branch deletion

**The day's real content was the in-flight investigation.** `http_requests_in_flight` would not
move under any load, and it was assumed broken. It is not. Four hypotheses died to measurement:
Prometheus sampling, curl spawn cost, undici pooling (killed by 401 established TCP
connections), and finally a decisive in-container run — 14,624 requests served, 96 gauge
samples, max 0. **Root cause:** the gauge spans middleware entry to `res` `'close'`, which is
0.19 ms for a handler returning a static string, so by Little's Law its occupancy is under 1
even at 4,900 req/s. Requests queue in the kernel and libuv, upstream of the instrumented span.
It is not a load gauge — it counts requests held *inside* the handler, which is exactly the
Day 8 failure mode. Confirmed once `/debug/slow` existed: 0 → 30 → 0.

**Two Day 3 items closed as side effects.** The `499` branch fired for the first time
(`duration_ms: 1005`), and `HighErrorRatio` reached `pending` off a real 36% error ratio.

**A bug found in his own earlier work:** `/metrics` is excluded from the metrics middleware but
not the logging middleware, so every scrape and healthcheck writes two log lines — ~28,800/day
with no users. Found by the dashboard within an hour of it existing. Decision on the fix is
still open and is carry-over.

**Checks at close:** `typecheck` clean · `lint` 0/0 · unit 5/5 · `verify.sh` 18/18 · branch in
sync with origin · working tree clean apart from journal files, which go to `master` after merge.

**Time:** ran long and lopsided — infra was ~2h, the rest went on warm-up material and the
in-flight investigation.
