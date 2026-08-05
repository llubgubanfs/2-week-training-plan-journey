# STATUS — single source of truth

> Claude: read this before responding to anything. Update it via `/day-end`.
> Humans: this is "where am I right now."

**Currently:** Day 6 of 10 ✅ done · next working day Thu 2026-08-06 · **Day 7 waitlist design extension**
**Last updated:** 2026-08-05 (Day 6 closed out)

> ⚠️ **Day 7 is a System Design day and Day 9 is three working days away.** Three drills are
> owed and none has been scheduled: `/explain-back` on ALS (gap #5, missed three times),
> `/explain-back` on cardinality (gap #18), and `/design-drill`. Day 7 is the natural home for
> at least two of them.

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
| 5 | Tue Aug 4 | Integration + EM demo — **recorded** | ✅ done |
| 6 | Wed Aug 5 | Distributed tracing | ✅ done |
| 7 | **Thu Aug 6** | Waitlist design extension | 🔵 next |
| 8 | Fri Aug 7 | Silent failure detection | ⬜ |
| 9 | Mon Aug 10 | **System Design defense — GRADED** | ⬜ |
| 10 | Tue Aug 11 | Walkthrough + **Observability retest — GRADED** | ⬜ |

---

## Open questions for Harvey

1. Does the Day 10 "recorded walkthrough" need to be a specific length or format? Asked in the Day 4 chat message, still unanswered.

**Answered Day 5 — do not re-raise:**

- ~~"Day 5 demo — live session or recorded submission?"~~ — **Harvey's answer: a recorded
  walkthrough.** No live slot. This removes the calendar dependency and makes the recording
  itself the on-disk evidence, so the Day 5 deliverable satisfies the definition of done
  without a separate artifact. ⚠️ **It also removes the live pressure that Days 9 and 10 will
  apply** — retakes are possible on a recording and are not possible in a live defense. The
  live-skill gaps (**#9** losing the prompt under load, **#10** not registering corrections,
  **#16** committing to a confident wrong cause) get *no* rehearsal from a polished take.
  Mitigation adopted: do one unrehearsed single-take run first, treated as if live and never
  submitted, then record the real one.

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

**~~Opportunity, not friction: `gh` on the new machine has no account attached yet.~~ FALSE —
corrected Day 6.** Verified directly: `gh auth status` reports *"Logged in to github.com account
**y4nder** (keyring), Active account: true"*. The browser-only PR workaround below therefore still
applies on this machine, exactly as it did on the old one. Day 5's note was written from an
assumption and was never checked. Pushing is unaffected — the remote is SSH via the
`github-llubgubanfs` host alias, which is a separate identity from `gh`'s.

**Before the Day 5 demo:** do the setup early, not at T-30. A first `docker compose up -d --build`
takes 2–4 minutes on a cold machine and can fail in new ways. `infra/scripts/verify.sh` exiting 0
is the signal that the environment is genuinely ready.

**The stack does not come back after a reboot. This is correct, not broken — do not investigate
it again.** Checked on Day 5 after a reboot left all four containers down: `docker.service` is
`enabled` and starts ~20s into boot, so Docker is not the problem. The four services are
`restart: unless-stopped`, and Docker's definition of that policy is *"when the container is
stopped, **manually or otherwise**, it is not restarted even after the Docker daemon restarts."*
A clean host shutdown is "otherwise". `restart: always` is the policy that survives a reboot;
**`unless-stopped` was kept deliberately — Leander's call, Day 5** — because the pre-flight
already begins with `docker compose up -d` and `verify.sh`, and a deliberate stop staying stopped
is worth more than automatic resurrection. **Just run `docker compose up -d` first thing on Days
6, 8 and 10.**

### ⚠️ Known workflow friction — PRs must be opened in the browser

`gh` is authenticated as **`y4nder`**, which has no write access to `llubgubanfs/…`, so
`gh pr create` fails with *"must be a collaborator"*. `git push` is unaffected (SSH, as
`llubgubanfs`). **Every day from here: push the branch, then open the PR via**
`https://github.com/llubgubanfs/2-week-training-plan-journey/compare/master...<branch>?expand=1`.
Fixable with `gh auth login` as `llubgubanfs`, but that switches the active account globally
and would affect Leander's other projects — deliberately not done.

Also: **Day 2's PR link is orphaned.** It lives at `y4nder/…/pull/1` and that repo has no Day 3+
work. If Harvey was given that link, he needs the new one.

## Carry-over into Day 7

**Time-sensitive, and it has now slipped twice:**

- [ ] ⚠️ **Three drills owed, none scheduled. Day 9 is Mon Aug 10 — three working days.**
      `/explain-back` on **ALS** (gap #5, missed three times, `/quiz` has stopped producing new
      information), `/explain-back` on **cardinality** (gap #18 — held in writing, collapsed on
      camera), and `/design-drill` for live pressure. Day 7 is a System Design day and is the
      natural home for at least two. Day 8 alone cannot absorb all three.
- [ ] ⚠️ **The live-pressure rehearsal from Day 5 still has not happened.** Carried unchanged.
- [ ] ⚠️ **Winston vs pino** and **why a metric when the log has status and duration** — both
      uncovered in the recording Harvey watched, both still undrilled. Near-certain Day 10 content.

**New from Day 6:**

- [ ] **`x-correlation-id` is forwarded but nothing tests the receiving half.** The sending side
      now has four unit tests; that the notifier actually *honours* the inbound header is verified
      only by having read two log lines. Cheap e2e if Day 8 has room.
- [ ] **The notifier is still not scraped by Prometheus.** It now runs the metrics middleware and
      is a real container, so `prometheus.yml`'s comment ("deliberately NOT scraped: it runs no
      metrics middleware yet") is now false. Either scrape it or update the comment — a stale
      justification in a config file is worse than none.
- [ ] **Tracing has no sampling configured.** `parentbased_always_on` records 100% of requests,
      which is right at this volume and wrong at any real one. The README leans on head sampling
      to justify keeping `correlation_id`, so the argument is understood but unexercised.
- [ ] **No span is emitted for the fire-and-forget failure path in a way anything can alert on.**
      Confirmed today: the failure logs 729 ms after a 202 and nothing counts it. Day 8's subject,
      now with a working reproduction on this stack.

**Closed on Day 6:**

- [x] ✅ **The downstream call exists.** `NOTIFIER_URL` had pointed at a service with no container
      since Day 2, read by no code. Both halves now real.
- [x] ✅ **`trace_id` and `span_id` in every log line** — the item `CLAUDE.md` names as the
      highest-signal Day 10 content. Verified: the id in the log matches the Jaeger trace id.
- [x] ✅ **Gap #1 (what a trace is) addressed by building it.** Re-ask before Day 10; probed at
      the start of today and answered at half credit.

## Carry-over that was open into Day 6

**The one that is time-sensitive, and it is not technical:**

- [ ] ⚠️ **The live-pressure rehearsal never happened.** Day 5 was agreed as one unbroken
      unrehearsed take (never submitted) *then* a polished one. Only the polished path ran —
      several takes, then edited. **Day 9 is five days out, is live, single-take, and has no
      agent in the room.** Nothing in the plan so far has rehearsed speaking under pressure
      without a script. Schedule `/explain-back` and `/design-drill` deliberately; they are the
      only remaining opportunities. See gap **#18**.
- [ ] ⚠️ **Both unscripted topics went uncovered in the recording** — *Winston vs pino* and
      *why a metric when the log has status and duration*. Harvey has now watched a walkthrough
      where neither came up, which makes them the obvious Day 10 follow-ups. Drill both.

**Closed on Day 5:**

- [x] ✅ **`/metrics` excluded from the logging middleware.** Decision: exclude (not `debug`
      level, not leave). ~28,800 lines/day → **0**, measured. `ClsMiddleware` still runs on
      every route, so `/metrics` keeps a correlation context — only the request pair is
      silenced. Commit `1c5959b`.
- [x] ✅ **Machine migration complete.** Compose plugin installed, SELinux labelling fixed in
      `docker-compose.yml`, push identity for `llubgubanfs` wired via a dedicated SSH key and a
      `github-llubgubanfs` host alias. Global `gh`/git identity left as `y4nder`, untouched.
- [x] ✅ **Demo format resolved** — recorded, Harvey's call.

**Open from before:**

- [ ] Booking domain endpoints + Postgres + TypeORM. Slipped Days 2, 3, 4 and now **5 — fourth time, deliberately.** Zero assessment points, competes directly with the Growth Area. Realistic homes now: a Day 7 side-slot, or accept it does not land at all. Note the Day 5 recording described the service as "a sample NestJS service" precisely because no domain exists — that framing is now on tape and should stay consistent.
- [x] ORM chosen: **TypeORM**. Not installed.
- [x] **Pluralsight** — Prometheus/Grafana sections watched Day 3.
- [ ] **PII / secret redaction and log-level discipline** — still not in the logger. Named aloud as a known hole in the Day 5 recording, so Harvey has heard it. Plausible Day 10 question.
- [ ] **Graceful shutdown at app level** — `app.enableShutdownHooks()` and draining in-flight work still unwired. Day 8.
- [ ] **No Alertmanager.** Rules evaluate and reach `firing` but notify nobody. Day 8. Strongest argument for adding it is now gap **#17** — a deadman's switch is the only way this stack can report its own death.
- [ ] **No `/health` endpoint.** The container healthcheck hits `/metrics`, which renders the entire registry every 10s. Day 8, alongside graceful shutdown.
- [ ] **`nodejs_eventloop_lag_p99_seconds` is exposed and unused.** The signal that registered saturation when the in-flight gauge could not (sub-ms idle → 10.5 ms under load). Not on the dashboard. Cheap ninth panel.
- [ ] **Nothing demonstrates a partial outage below 1 req/s** — the `HighErrorRatio` denominator guard gives that up by design. Day 8's absence-of-success work.
- [ ] **No test covers the middleware ordering or the `/metrics` exclusion.** Both were verified by running the stack and reading output. Invisible to `tsc` *and* to the unit tests — the same shape as Day 2's bug #1. **Partially answered Day 6:** `DownstreamService` now has four tests covering correlation-id forwarding, the no-context case, and the fire-and-forget `.catch()`. Suite went 5 → 11. Middleware ordering and the `/metrics` exclusion are still uncovered, so the Day 10 answer is better than it was but not yet complete.

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
| 5 | **Why context survives an `await`** | "it has its own managed storage during request time" | Restates the API, not the mechanism. The store attaches to the **async resource** created at the await point, via `async_hooks`' `init` hook — each in-flight request holds its own reference, so there is no shared slot to overwrite. He can explain why a module-level `let` *fails*, not why ALS *works*. Also said Node is "single-threaded by default" — there is no non-default; `worker_threads` are separate isolates. | ⚠️ re-missed Day 3 (2nd) and **Day 6 (3rd, under a vocabulary ban)** — `/explain-back` now owed, `/quiz` has stopped producing new information on this one |
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

**Day 5 warm-up quiz (3 questions, 2.5 / 3 — best round so far).**

- **#15 CLOSED — unprompted.** Asked what survives `docker compose down -v`, he split the two
  volumes without being prompted to: Prometheus's TSDB is where the history physically lives;
  Grafana's sqlite holds only UI-created state; the dashboard rebuilds from the provisioned
  JSON either way — *"comes back, although empty."* On Day 4 he argued the losing side of
  exactly this. Produced on demand, not by doing. Closed.
- **#14 CLOSED — unprompted.** Asked what the request-rate panel does when `booking-api`
  restarts at ~40,000, he said the total **"in heap"** goes to zero and `rate()` treats the
  decrease as a reset, taking the new value as the delta. "In heap" is the precise word he got
  wrong on Day 4 ("volumes make it persistent"). Closed. **Open follow-up:** `rate()` prevents
  the *negative*, it does not *recover* the requests served between the last pre-restart scrape
  and the restart — that window is gone. **Follow-up answered correctly, same session:**
  *"it does not recover the requests lost across the restart, only hides the negative spike."*
- **Q1 half credit — the "why", not the "what breaks".** Correct that `booking-api:3000` uses
  Docker's embedded DNS on the shared network and `localhost:9090` is Prometheus already inside
  its own container. **Did not attempt the half that was explicitly asked — what breaks if you
  swap them** — which is the interesting half because it is asymmetric. Measured live this
  session: `localhost:3000` from inside the Prometheus container is *connection refused* (its
  own loopback, nothing listening, and it does **not** reach the host's published port), so
  that target goes DOWN; whereas `prometheus:9090` resolves fine (172.18.0.4) and would work
  unchanged. **Re-asked and answered:** got the loopback-namespace half unaided after the
  question was narrowed; needed the published-port NAT explanation and the whole asymmetry
  handed to him. Connected back to his own Day 2 fix (bind `0.0.0.0`, not localhost, or a
  published port is unreachable) — same mechanism seen from the other side.

| # | Gap | Answer given | Reality | Addressed |
|---|---|---|---|---|
| 17 | **Thinks the monitoring stack can detect its own failure** | volunteered that the self-scrape job "gives the signal that if the booking-api is DOWN and prometheus is UP then the app is down, not the stack" | `up{job="prometheus"}` is near-tautological — it is Prometheus reporting on Prometheus. If the Prometheus container dies, the series does not go to 0, it **stops existing**; nothing scrapes, nothing evaluates the three rules, and the dashboard flatlines in a way indistinguishable from a quiet night. The watcher cannot watch itself. Detecting it needs something *outside* the stack — a deadman's-switch alert that fires on the **absence** of a heartbeat (Alertmanager, or an external blackbox probe). Same shape as **#3** and **#7**: keying on absence of expected success, not presence of an error. Also the strongest argument yet for the "no Alertmanager" carry-over. | ⚠️ **corrected same session, unaided** — pointed at the *shape* only ("you've met this before"), no mechanism named, and he produced Alertmanager + deadman's switch + routed to an external receiver + *"triggers whenever the heartbeat stops"*. The inversion (a rule that fires **always**, where silence is the signal) was his. The misconception was still stated confidently first, so: **verify on Day 8, do not close yet.** Third instance of gap **#3**'s shape and the first he solved without being walked to it — #3 may be closing. |

**Day 5 recording — the most important finding of the day, and it is not a topic.**

| # | Gap | What happened | Reality | Addressed |
|---|---|---|---|---|
| 18 | **Explanations that hold in writing collapse when spoken** | The walkthrough was recorded across **several takes and then edited**. The section he struggled with was *request rate by route* — the cardinality argument. | That topic is **gap #4, marked closed on Day 3** after he produced it cleanly and unprompted in text. It did not survive being said out loud, on camera, once. Written recall and spoken explanation are different skills, and only the second one is graded: **Days 9 and 10 are live, single-take, with no edit pass and no agent present.** A polished edit is the one artefact that cannot tell you whether you could have done it live. Two contributing factors, neither of which changes the conclusion: that section was rewritten twice the same day (four lines vs two, 5 series vs 4), so he was narrating freshly-changed material; and the material was supplied as a script, which he read rather than reconstructed. | ⚠️ **`/explain-back` on cardinality, single take, before Day 9.** Also the standing drill for **#9**, **#10** and **#16**. |

**The mitigation that was agreed and then did not happen.** The plan was one unbroken unrehearsed
take, never submitted, purely as live-pressure rehearsal — then a second take for Harvey. Only
the polished path ran. **The live rehearsal is still owed and is now carry-over**, because Day 9
is five days out and nothing so far has rehearsed speaking under pressure without a script.

**Both ⚠️ items went uncovered in the recording — they are now near-certain Day 10 content.**
Neither *"why Winston over pino"* nor *"why a metric when the log already has status and
duration"* was mentioned. They were deliberately left unscripted precisely because he does not
own them, and the recording confirms he still does not. Harvey has now watched a walkthrough
where neither was addressed, which makes them the obvious follow-ups. See gaps **#4** (the
query-time vs write-time half, re-missed twice) and the Winston row below.

**Day 6 warm-up quiz (3 questions, ~0.5 / 3 — weakest round so far, and the reasons are useful).**

- **Q1 — "I do not know", and that is the correct output.** Asked why one root cause (SELinux
  labelling) made Prometheus crash-loop loudly and Grafana fail silently, he declined rather than
  constructing a plausible story. **This is the direct inverse of gap #16** and the second
  consecutive session showing that instinct (Day 5: catching three factual errors in his own
  script). Answer given: Prometheus's config is a *hard dependency* — no config, no process, so it
  exits and the restart policy makes it loud; Grafana's provisioning is a *startup scan of a
  directory allowed to be empty*, and to a scan that does not check permissions **unreadable is
  indistinguishable from empty**. Rule extracted: loud when the failed thing is a hard dependency,
  silent when it is an optional step whose empty result equals its skipped result. Same family as
  **#3**, **#7**, **#17** — reinforce on Day 8.
- **#5 RE-MISSED (3rd time). Escalating from `/quiz` to `/explain-back`.** Asked with "context",
  "store" and "isolated" banned, he opened with *"creates dedicated execution context"* — the
  banned word in the first six words. Two active errors: **"bounded by its request id"** (the id is
  a value *inside*, it keys nothing) and **"a global registry is being tracked"** (no registry can
  exist — a registry implies a lookup, and a lookup requires the caller to already know the id,
  which is precisely what a deep callee does not have). The rest described **the event loop** —
  i.e. the hazard, not the guard. He can now explain why a module-level `let` fails; he still
  cannot explain why ALS does not. One genuine gain: **"stored in the heap"** — the exact word he
  got wrong on Day 4 about metrics, now transferred. Mechanism handed over for the third time (the
  store reference is *copied onto the async resource at creation* and made active when its callback
  runs — the value rides the pending work, there is no shared slot). **Not creditable until
  produced unprompted. `/explain-back` on ALS is now owed alongside the one on cardinality.**
  Note the lever: the vocabulary ban is what broke #4 open, and it worked here too — it exposed
  the restatement in one sentence instead of three exchanges.
- **#1 probed before the build — half.** Asked what a `trace_id` answers that a `correlation_id`
  cannot, he offered log ordering and "processes across multiple services". Neither
  discriminates: `correlation_id` already crosses services via `x-correlation-id`, and timestamps
  already give order. Missing concept: **membership vs structure** — a flat id yields a *set*,
  while `span_id` + `parent_span_id` + duration yields a *tree*, and parentage cannot be inferred
  from timestamps (overlapping spans may be concurrent siblings; non-overlapping ones may be
  unrelated). Secondary: W3C `traceparent` is a *standard*, so uninstrumented libraries and
  third-party services join the trace without agreeing a header name. **This is today's build —
  re-ask at day-end and only credit if produced unprompted.**

| # | Gap | Evidence | Reality | Addressed |
|---|---|---|---|---|
| 19 | **Answers an adjacent question with correct content** | Three instances in one morning, Day 6. (1) Asked what physically holds a value across an `await` → described the event loop. (2) Asked what in the code decides an outcome → reached for the absence-of-signal theme. (3) Asked what **decides** a full vs empty trace → gave an accurate, unprompted account of how the HTTP instrumentation works. | **Not a knowledge gap — (3) was correct material.** The failure is upstream of the content: the answer is never checked against the question before he commits to it. The cheap diagnostic he was given: *a constant cannot explain a variable* — if the question is "what decides", the answer must be something that **differs** between the cases, and the instrumentation is byte-identical in all five scenarios. **This is gap #11 from the baseline session seen from a new angle** ("how does this scale?" answered with a data model) — and #11 is graded on Day 9. The Day 1 instance was read as not knowing the answer; three instances on topics he *did* know show the real mechanism is question-tracking, not knowledge. Closely related to **#9** (loses the prompt under load). | **drill: read the question back aloud before answering, on Days 7, 9 and 10.** "You're asking what *decides* — so I need to name something that varies." |

**Day 6 build session — Q1 drill on span export (interactive artifact).**

- **Instrumentation mechanism acquired, unprompted by the end.** Produced "the SDK patches
  `http.request`, creates the client span, then attaches listeners for error/close/response"
  without being led there. He did not have this at the start of the day.
- **The corrected rule he now owns:** a span reaches Jaeger when it is ended **and** its batch is
  flushed — two gates that fail independently. The rule first handed to him ("exported when
  `end()` is called") was incomplete, and his wrong answer to Q1(a) followed validly from it.
  Worth repeating as technique: **the miss was caused by a bad premise, and saying so mattered
  more than marking it wrong.**
- **Cut 1 vs cut 2 separated.** Never-ended (one span lost, only reachable by hand-rolling
  instrumentation with `end()` on the happy path) vs died-before-flush (the whole buffer lost,
  including healthy requests). He asked whether the artifact's "no handler" control meant a
  hand-rolled span — it did not, and **the control's copy was genuinely ambiguous**. He found a
  real inconsistency by reading carefully rather than assuming he had misunderstood. **Second
  instance today of the inverse of gap #16**, after the honest "I do not know" on Q1.
- **Ownership rule established:** whoever calls `startSpan()` calls `end()`, and for hand-rolled
  spans it goes in `finally`, never `catch` — `end()` in the catch loses the *success* path.
  Auto-instrumented spans need no code from him at all.
- **Day 8 connection made early:** an abrupt exit loses the batch buffer, so `sdk.shutdown()` /
  `app.enableShutdownHooks()` is now justified twice over — the same lesson as Day 2's `tini`
  fix seen from the exporter's side. Reinforces the existing graceful-shutdown carry-over.

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

### Day 5 — Tue Aug 4 ✅
**Objective:** bring Week 1 together — one service with structured logs, a live `/metrics`
endpoint and a Grafana dashboard rendering it — and present it to Harvey.

**Format: recorded walkthrough, Harvey's call.** No live session. Delivered as an 18:43 video.

**Deliverable — verified, committed, and shared:**

| Evidence | Path |
|---|---|
| Recording (18:43, narrated) | `~/Videos/2_week_training_plan_videos/raw-day-5.mp4` · [Drive](https://drive.google.com/file/d/1_79o8DYFxkwq6olAdUnD3p6J-1B_VZ6-/view?usp=drive_link) |
| PR | branch `day-05-integration-demo`, 4 commits |
| Walkthrough script (~9 min plan) | `deliverables/day-05/walkthrough-script.md` |
| Run sheet, reworked for recording | `deliverables/day-05/demo-run-sheet.md` |
| Command stepper | `coworking-obs/infra/scripts/walkthrough.sh` |
| Reasoning | `journal/day-05-integration-demo.md` |

Re-verified before recording by running `infra/scripts/verify.sh` against the live stack on the
new machine: **all checks pass**, both targets UP, datasource and dashboard provisioned, live
PromQL through Grafana's proxy.

Done:
- [x] Machine migration — Compose plugin, SELinux labelling, `llubgubanfs` push identity
- [x] Three fixes, two of which would have broken the demo (below)
- [x] Warm-up quiz **2.5/3** — best round so far; gaps **#14** and **#15** closed unprompted
- [x] Recorded, edited and delivered the walkthrough; Drive link sent

**The day's real content was two silent failures and one loud one.**

The stack would not start: SELinux on the new machine labels every bind-mounted config
`user_home_t`, which `container_t` cannot read. Prometheus crash-looped **loudly** — an error
every 400ms, impossible to miss. Grafana started, reported healthy, answered `/api/health` with
`database ok`, and **provisioned nothing** — `/api/datasources` and `/api/search` both returned
`[]`, with no error line anywhere. `docker compose ps` could not tell the two apart. `verify.sh`
caught it because it asserts *"one provisioned datasource exists"* rather than *"the container
is running"* — absence of expected success, which is Day 8's whole thesis, arriving a week early
on his own stack. Fixed with `:z` on the four bind mounts (`5160671`).

The third: `traffic.sh stop` only ever stopped the most recently started generator, because
every run overwrote one shared PID file. The run sheet layers three generators and then says
"stop both" — so the demo would have closed on a pinned red dashboard while he said he had
stopped the load. Reproduced, then fixed with per-run registration and a descendant-tree kill
(`71547f6`).

**Three factual errors in his own prep, all caught by him, all before recording.** The service
was described as a "coworking booking service" when the plan asks only for a sample service and
no domain code exists; the rate panel was described as having two lines when it has four; and
the panel's four lines were conflated with the five stored series. The third is the interesting
one — the panel sums by `route`, discarding `status_code`, so `/debug/fail` is two series drawn
as one line. **That instinct — checking the script against what is actually on screen — is the
exact inverse of gap #16 and the best signal of the day.**

**Checks at close:** `typecheck` clean · `lint` 0/0 · unit 5/5 · `verify.sh` fully green ·
branch pushed, 4 commits · working tree clean apart from journal files.

**⚠️ The cost of a recorded format, recorded honestly.** Several takes, then edited. The agreed
mitigation — one unbroken unrehearsed take first, never submitted — did not happen, so the only
live-pressure rehearsal available before Day 9 was skipped. He also struggled narrating the
*request rate by route* panel, which is the cardinality argument marked **closed** on Day 3. It
held in writing and did not hold aloud. That is gap **#18**, and it is the most important thing
learned today.

**Time:** most of the day went on the machine migration and the three fixes; the recording
itself was late afternoon.

### Day 6 — Wed Aug 5 ✅
**Objective:** instrument the sample service plus one downstream call with OpenTelemetry and
export the trace to the Jaeger running since Day 4.

**Deliverable — verified on disk and committed:**

| Evidence | Path |
|---|---|
| PR | [#3](https://github.com/llubgubanfs/2-week-training-plan-journey/pull/3) → branch `day-06-distributed-tracing`, 7 commits, 24 files |
| Jaeger trace, awaited hop | `deliverables/day-06/jaeger-trace-immediate.jpg` |
| Jaeger trace, fire-and-forget | `deliverables/day-06/jaeger-trace-fire-and-forget.jpg` |
| Both traces as data | `deliverables/day-06/trace-immediate.json`, `trace-fire-and-forget.json` |
| Log lines with `trace_id` across both services | `deliverables/day-06/correlated-log-with-trace.jsonl` |
| Reasoning | `deliverables/day-06/README.md`, `journal/day-06-distributed-tracing.md` |

Re-verified at day-end by running `infra/scripts/verify.sh` against the live stack: **all checks
pass**, including its own Day 6 assertion — *"booking-api is exporting spans — Day 6 has landed"*
— which was written on Day 4 and had never been true before today.

Done:
- [x] Notifier containerised and put on the `obs` network. **`NOTIFIER_URL` had pointed at a
      service with no container since Day 2, and no code read it** — both halves of the hop were
      missing, and the plan's prereq chip for Day 6 does not mention it.
- [x] Two endpoints on each side differing in exactly one variable — whether the call is awaited
- [x] OTel SDK, auto-instrumentation, OTLP/HTTP export to Jaeger
- [x] `trace_id` + `span_id` in the Winston formatter
- [x] `x-correlation-id` forwarded — Leander's call, taken from evidence
- [x] Span volume tuned 38 → 9 after root-causing
- [x] Unit suite repaired and extended, 5 → 11 tests

**The day's real content was the fire-and-forget drill, and it ran before any code was written.**
An interactive artifact modelling the span lifecycle — three switches, five outcomes — was used
to work out what Jaeger shows when a not-awaited call fails. The rule he was first given ("a span
is exported when `end()` is called") was **incomplete, and his wrong answer followed validly from
it**. The corrected rule: a span reaches Jaeger when it is ended **and** its batch is flushed —
two gates that fail independently. Auto-instrumentation closes the first; only catching the
rejection closes the second, because an unhandled rejection kills the process and
`BatchSpanProcessor` loses the whole buffer, including the parent span of a request that returned
a healthy 202. Saying "the premise was bad" mattered more than marking the answer wrong.

**Two findings that each could have cost the afternoon, both caught by checking rather than
assuming:**

1. **The build is webpack.** `"webpack": true` produces a single 35 KB `dist/main.js`, and
   bundled modules are invisible to OTel's require hooks. Read the emitted output first:
   `module.exports = require("@nestjs/core")` — Nest marks `node_modules` as externals, so every
   dependency is still a real runtime require. Fine, but only because it was checked.
2. **The span noise was not Express.** 26 of 38 spans were middleware; configuring
   `instrumentation-express` removed only half. The survivors carried
   `otel.scope.name: @opentelemetry/instrumentation-router`. **Express 5 moved its router into a
   standalone package with its own instrumentation**, so every middleware and route handler was
   being recorded twice by two instrumentations unaware of each other. Diagnosed from span tags,
   not from a second guess.

**A test broken by his own change, caught by the suite.** Adding a logger to `NotifierService`
made the winston token unresolvable in its spec; every test in that file failed at `compile()`.
Invisible to `tsc` and to eslint. This is the mirror image of the standing carry-over — the suite
caught a real DI regression that static analysis could not — and it prompted four new tests on
the part of the hop that *can* break silently.

**The decision of the day: forward `x-correlation-id`, keep it alongside `trace_id`.** Taken
after seeing the two ids diverge in a real trace rather than reasoning about it on paper. Only
the sending half was ever missing — `CORRELATION_ID_HEADERS` has honoured an inbound id since
Day 2, commented "so an id assigned upstream survives the hop". The strongest justification, and
the one to have ready for Day 10, is **sampling**: under head sampling a log line still carries a
`trace_id` whose trace was never exported, so pasting it into Jaeger returns nothing; logs are
not sampled.

**Checks at close:** `typecheck` clean · `lint` 0/0 · unit **11/11** (4 suites) · e2e 5+1 both
apps · `build` passes both apps · `verify.sh` fully green · working tree clean apart from journal
files.

**Time:** ran long on the warm-up drill — the Q1 artifact and the discussion around it took the
best part of the morning. Judged worth it: gap #1 is Day 10 retest content and the export
mechanism is now owned. The cost was that Q2 and Q3 had to be answered against a running stack in
the afternoon rather than in the quiz slot, which turned out better anyway.
