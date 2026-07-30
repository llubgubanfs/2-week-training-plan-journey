# STATUS — single source of truth

> Claude: read this before responding to anything. Update it via `/day-end`.
> Humans: this is "where am I right now."

**Currently:** Day 2 of 10 · Thu 2026-07-30 · Week 1
**Last updated:** 2026-07-30 (workspace + scaffold session)

---

## Scores

| Track | Baseline (Day 1) | Target | Retest |
|---|---|---|---|
| Observability & Structured Logging | not yet scored by EM | **7 / 10** | Day 10 |
| System Design | not yet scored by EM | **8 / 12** | Day 9 |

Baseline answers: `1-baseline/observability-structured-logging-answers.md`. Neither track's baseline number has come back from Harvey yet — **ask for both**, since without them there's no measured delta to show on Days 9/10.

---

## Real calendar

The plan's Mon–Fri labels don't match the actual dates. Plan issued Tue 2026-07-28; Day 1 live session ran Wed 2026-07-29.

| Day | Date | Topic | Status |
|---|---|---|---|
| 1 | Wed Jul 30 — *ran Jul 29* | Baseline assessments | ✅ done |
| 2 | **Thu Jul 30** | Structured logging | 🔵 in progress |
| 3 | Fri Jul 31 | Metrics & alertable signals | ⬜ |
| 4 | Mon Aug 3 | Infra: Prometheus + Grafana + Jaeger | ⬜ |
| 5 | Tue Aug 4 | Integration + **live EM demo** | ⬜ needs booking |
| 6 | Wed Aug 5 | Distributed tracing | ⬜ |
| 7 | Thu Aug 6 | Waitlist design extension | ⬜ |
| 8 | Fri Aug 7 | Silent failure detection | ⬜ |
| 9 | Mon Aug 10 | **System Design defense — GRADED** | ⬜ needs booking |
| 10 | Tue Aug 11 | Walkthrough + **Observability retest — GRADED** | ⬜ needs booking |

---

## Open questions for Harvey (raise at EOD)

1. **Book Days 5, 9, 10.** Day 9 and Day 10 are the two graded sessions. The plan says Thu/Fri; real dates are Mon Aug 10 and Tue Aug 11. ← highest priority
2. **What were my Day 1 baseline scores** for both tracks?
3. Is a PR per day into my own repo the delivery format you want, or do you prefer something else?
4. Does the Day 10 "recorded walkthrough" need to be a specific length or format?

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

## Carry-over into Day 3

- [ ] Booking domain endpoints (only scaffolding exists — no domain code yet)
- [x] ORM chosen: **TypeORM**. Not installed yet — it ships in the same PR as the entities so that diff is coherent.
- [ ] Postgres not yet in the stack (lands Day 4)

---

## Weak-spot list

Concepts fumbled in quizzes or review. **This drives Day 10 retest prep** — don't re-read everything, drill this.

Seeded from the Day 1 baseline answers:

| # | Gap | Day 1 answer | Reality | Addressed |
|---|---|---|---|---|
| 1 | **What a trace is** | "information that tells where the log originated or has come about to" | That describes a log's source. A trace is the causal chain of **spans** across services for **one request**, tied by a shared trace id. | Day 6 |
| 2 | **Prometheus scrape model** | "I do not have knowledge nor experience with Prometheus" | Pull model: Prometheus periodically GETs `/metrics`; the app just exposes current values, it does not push. | Days 3–4 |
| 3 | **Knowing you're down before users report** | health endpoint + notify | Incomplete. A health check can't catch a job that fails *silently* — that needs alerting on **absence of success**, not on errors. This is his own interview scenario. | Day 8 |
| 4 | **Metric vs log boundary** | called a metric "how long a process took... useful for benchmarks and analytics" | Directionally right but framed as analytics. Metrics are for **alerting on aggregate behavior**; framing them as analytics understates the point. | Day 3 |

Added Day 2 (ALS vs nestjs-cls review):

| # | Gap | Answer given | Reality | Addressed |
|---|---|---|---|---|
| 5 | **Why context survives an `await`** | "it has its own managed storage during request time" | Restates the API, not the mechanism. The store attaches to the **async resource** created at the await point, via `async_hooks`' `init` hook — each in-flight request holds its own reference, so there is no shared slot to overwrite. He can explain why a module-level `let` *fails*, not why ALS *works*. Also said Node is "single-threaded by default" — there is no non-default; `worker_threads` are separate isolates. | Day 2 build, re-drill Day 10 |
| 6 | **"Where is the correlation id created?"** | "at module level" (`ClsModule.forRoot`) | That is where it is **configured**. It is **created** per-request by the `idGenerator` inside the mount middleware. Config site ≠ creation site — a one-question-deep answer, and Day 10 is a follow-up format. | Day 10 walkthrough rehearsal |
| 7 | **Background work needs its own identity** | inheriting the originating `request_id` is enough | Necessary but not sufficient. A fire-and-forget that fails at t+30s logs the id of a request that returned 201 at t+0 — the correlation is intact and the alert is still useless. Needs a countable signal you can alert on the **absence** of. Same shape as gap #3 and as the Day 8 cron. | Day 8 |
| 8 | **`res.on('finish')` semantics** | assumed the completion line always fires, so a client abort still yields 3 log lines | `'finish'` fires only when `end()` has been called *and* all data is flushed. A client that disconnects mid-response never satisfies it — Node emits `'close'` instead, which nothing listens for. So an aborted request logs **2** lines, not 3, and the completion line silently vanishes. Got there after being pointed at the event name, not unaided. | Day 3 (metrics), Day 8 |

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

### Day 2 — Thu Jul 30 🔵
**Objective:** structured JSON logging with a request-id correlated across one request.

Done:
- [x] Workspace structure, `CLAUDE.md`, this file, slash commands, design-track scaffolding
- [x] NestJS monorepo scaffolded: `apps/booking-api` (:3000), `apps/notifier` (:3001), `libs/observability` (`@app/observability`)
- [x] Deploy-ready boilerplate: parameterized `Dockerfile`, `.dockerignore`, `.env.example`, root `.gitignore`, pinned pnpm
- [x] Verified: both apps build, lint clean, 3/3 tests pass, both return 200 on their own ports
- [x] Verified: both Docker images build, run as non-root `node`, serve 200, and stop in ~150ms

Pending (Leander):
- [ ] Pluralsight structured-logging module (~45m)
- [ ] Winston JSON logger in `libs/observability` + ALS request-id middleware — **explain-first**
- [ ] `design/00-baseline-design.md` — reconstruct the Day 1 design **from memory, alone** (urgent: Day 7 + Day 9 prereq, memory decaying)
- [ ] Deliverable: PR + screenshot of JSON logs, same `request_id` across multiple lines of one request
- [ ] EOD to Harvey, **including the Days 5/9/10 booking ask**

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
