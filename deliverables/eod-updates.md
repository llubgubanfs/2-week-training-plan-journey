# EOD updates to Harvey

One entry per day, appended by `/day-end`. Format: `Done · Blocked · Tomorrow`, in English.

Keeping them all in one file means Day 10's walkthrough has a ready-made narrative of the two weeks.

---

## Day 2 — Structured Logging · Thu 2026-07-30

**Done:**
- Winston JSON logging wired into the NestJS service, with one correlation id carried across
  every log line of a single request via `AsyncLocalStorage`
- PR merged: https://github.com/y4nder/2-week-training-plan-journey/pull/1 (`7a9e09c`)
- Screenshot of the JSON output: `deliverables/day-02/correlated-logs.png` — two requests, six
  lines, two distinct ids
- Raw log capture and reproduction steps: `deliverables/day-02/README.md`
- Repo set up as a workspace for the full two weeks: daily journal, `STATUS.md`, and a
  `deliverables/` folder with a fixed home per day
- Day 1 system design baseline documented, with the session transcript, in `design/`

**Blocked:**
- Nothing blocking.
- Raised for a decision, not blocking: the plan specifies `request_id`; the field is named
  `correlation_id` because Day 8's cron has no HTTP request behind it and still needs
  correlation through the same logger. Free to rename until Day 4, when the Grafana dashboards
  begin querying the field by name.
- Asked whether chat is the right channel for daily progress, or a thread / doc / PR links.

**Tomorrow — Day 3: Metrics & Alertable Signals:**
- `/metrics` endpoint exposing request count, error rate, and latency
- A short note on the one alert to wire off that data
- Continue the same Pluralsight course, Prometheus/Grafana sections

<details>
<summary>Message as sent</summary>

```
Hi Sir Harvey,

DONE — Day 2: Structured Logging
PR: https://github.com/y4nder/2-week-training-plan-journey/pull/1

Winston JSON logging is wired into the NestJS service, with one correlation
id carried across every log line of a single request. The screenshot of the
JSON output and the raw log capture are in the repo under deliverables/day-02/.

I also set the repo up as a workspace for the full two weeks rather than just
a code drop — a daily journal, a STATUS file tracking where I am and what's
carried over, and a deliverables/ folder so each day's evidence has a fixed
place you can go straight to.

One flag: the plan specifies request_id, but I named the field correlation_id —
Day 8's cron has no HTTP request behind it and still needs correlation through
the same logger. Easy to rename if you'd prefer the literal field.

BLOCKED — nothing.

TOMORROW — Day 3: Metrics & Alertable Signals
A /metrics endpoint exposing request count, error rate and latency, plus a
short note on the one alert I'd wire off that data.

Quick question: is this the right channel for daily progress, or would you
prefer a thread, a doc, or just the PR links?

Thanks!
```

</details>

---

## Day 3 — Metrics & Alertable Signals · Fri 2026-07-31

**Done:**
- `GET /metrics` on `booking-api`, verified returning 200 with the Prometheus exposition
  content type — request count (counter), latency (histogram), and requests in flight (gauge),
  plus Node process/GC/event-loop-lag defaults
- Error rate derived in PromQL from the labelled counter rather than written by a second
  code path that could drift out of sync
- PR: https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1 (`114e76a`)
- Real scrape captured: `deliverables/day-03/metrics-scrape.txt`
- Alerting note: `deliverables/day-03/alerting-note.md`
- Fixed a bug in Day 2's logger found while doing this: it hooked `res.on('finish')`, which
  never fires on an abandoned request, so a client who gave up produced a "request received"
  log with no completion line — and would have gone uncounted in the metrics too

**Blocked:** Nothing blocking.

**Tomorrow — Day 4: Infrastructure Day (Metrics & Tracing Stack):**
- Docker Compose stack: Prometheus + Grafana + Jaeger + the service
- Grafana panel screenshot + confirmation Jaeger's UI is reachable
- This stack gets reused for the rest of Week 2

---

> **Format changed today.** Harvey: *"For now, the daily progress should be in Daily Status
> Report in Rocks. PR Links, docs, video, stays here in the chat for now."* From Day 3 there are
> two artifacts per day, not one. Both are recorded below as sent.

<details>
<summary>Rocks — Daily Status Report, as sent</summary>

```markdown
# What I did today

- Transferred origin of my 2 week training plan journey from my personal account to the company Github account.
- Day 3: Metrics & Alertable Signals.
- Added a `/metrics` endpoint to the booking API exposing request count, error rate and latency in a format Prometheus can scrape.
- Added a requests-in-flight gauge on top of the plan's list. If the database hangs and callers give up waiting, nothing ever completes, so both sides of an error-rate alert go to zero and it never fires. This gauge is driven by requests arriving rather than finishing, so it still climbs during that kind of outage.
- Wrote the alerting note: alert on the *ratio* of 5xx to total requests rather than an absolute error count, with a minimum-traffic guard so one error on a quiet night can't page anyone.
- Fixed a bug in Day 2's logger found while doing this. It listened for the `finish` event, which never fires if a client disconnects mid-request, so abandoned requests were logging a "received" line with no completion and would have been missing from the metrics too. Now listens for `close` and records them as 499.
- PR merged: https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1

---

# What I will be doing the next working day

- Day 4: Infrastructure Day — Metrics & Tracing Stack.
- Build a Docker Compose stack with Prometheus, Grafana and Jaeger alongside the service, so `/metrics` has somewhere to be scraped and visualised, and Jaeger is ready ahead of Day 6's distributed tracing. This stack gets reused for the rest of Week 2.
- Deliverable: `docker-compose.yml`, a screenshot of a working Grafana panel, and confirmation Jaeger's UI is reachable.
- Wire the two alert rules from today's note into the running Prometheus.
- Start the booking domain endpoints carried over from Day 2 — deliberately thin, three endpoints.
```

</details>

<details>
<summary>Chat with Harvey, as sent</summary>

```
Hi Sir Harvey,

Noted on Rocks — Day 3's status report is in there.

Day 3 PR (Metrics & Alertable Signals):
https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1

Note the repo moved from my personal account to the company account, so this
link is on a different org than the Day 2 one.

Docs in the repo, if useful:
- deliverables/day-03/alerting-note.md — the alert I'd wire off this data and
  why the obvious threshold is wrong in both directions
- deliverables/day-03/metrics-scrape.txt — actual scrape output

Thanks!
```

**Cut before sending:** a paragraph asking for a decision on `correlation_id` vs the plan's
`request_id`. It had been raised at Day 2 EOD and gone unanswered; removing it from the Day 3
message means it was never asked a second time. Treated from here as a **decision taken**, not a
pending question — see the Decisions table in `STATUS.md`. The rationale is defensible on its own
merits and should be presented that way on Day 10, not as an oversight.

</details>

---

## Day 4 — Mon 3 Aug 2026 · Infrastructure: Prometheus + Grafana + Jaeger

<details>
<summary>Rocks — Daily Status Report</summary>

```
# What I did today

- Built the Day 4 stack: Prometheus, Grafana, Jaeger and the booking service in Docker
  Compose. Prometheus scrapes the /metrics endpoint from Day 3, Grafana renders it, and
  Jaeger runs a day early so Day 6's tracing has an export target. Reused for the rest of
  Week 2.
- Grafana is provisioned as code, not click-configured. The datasource and dashboard are
  JSON files in the repo read at startup, so the dashboard survives the volumes being
  deleted and exists on a fresh clone. A click-built dashboard lives in Grafana's local
  database and cannot be reviewed or diffed.
- Wired Day 3's two alert rules into the running Prometheus and added a third of my own.
  Without a TargetDown rule, a scrape target disappearing silences every other rule for the
  best possible reason and the worst possible cause.
- Spent real time on why the in-flight gauge would not move under load. I assumed the
  metric was broken; it was not. It counts requests held inside the handler, and this
  service answers in 0.19 ms, so there was nothing to count — the queueing was in the
  operating system, upstream of where the metric can see it. Three explanations I found
  convincing were wrong before I measured properly. It is not a load gauge: it moves when
  something the handler is waiting on stops responding, which is the Day 8 failure mode.
- Added endpoints that stall and fail on demand so the signals can be exercised — three of
  the four had only ever shown a healthy service. This also fired the 499 branch for
  abandoned requests for the first time; it was written on Day 3 and had never executed,
  because nothing was slow enough to abandon.
- Found a bug in my own Day 2 logging. The metrics middleware excludes /metrics but the
  logging middleware does not, so every scrape and health check writes two log lines —
  about 28,800 a day with no users. The dashboard surfaced it within an hour of existing.
  Deciding on the fix rather than patching it quickly.

---

# What I will be doing the next working day

- Day 5: Integration Day — logs, metrics and dashboard demoed end to end. I will record it
  either way so there is an artifact rather than just a conversation.
- Fixing the logging noise above, and adding the event-loop lag metric to the dashboard.
  It is already collected, and it caught the saturation the in-flight gauge could not.
- The booking domain endpoints have slipped three days. They earn no assessment points and
  compete directly with the observability work, so I am not forcing them in.
```

</details>

<details>
<summary>Chat with Harvey</summary>

```
Hi Sir Harvey,

Day 4 status report is in Rocks.

Day 4 PR (Infrastructure — Prometheus, Grafana, Jaeger):
https://github.com/llubgubanfs/2-week-training-plan-journey/pull/2

Screenshots of the Grafana dashboard, the Prometheus targets and the Jaeger UI are
embedded at the top of the PR description.

Docs in the repo, if useful:
- coworking-obs/infra/README.md — how to bring the stack up from scratch, and
  what each volume does and does not persist
- deliverables/day-04/stack-verification.txt — targets, loaded alert rules and
  the cardinality check as text
- infra/scripts/verify.sh — 18 checks against a running stack, if you would like
  to confirm it yourself rather than take the screenshots on trust

One thing I need a decision on:

Day 5 is Integration Day and the plan says to present it live to you. Would you
prefer a live session tomorrow, or should I record a walkthrough and send it
over? I am happy either way — I just want to make sure I do not hold you to a
slot at short notice. If live, any time tomorrow works on my side.

While I have you: does the Day 10 walkthrough need to be a particular length or
format? Knowing that now would let me practise against the right target.

Thanks!
```

**Note on the chat message:** no progress prose — that is Rocks' job per your Day 3
instruction. The only ask is the Day 5 format decision, which is genuinely blocking because
the demo is tomorrow and no slot exists. The Day 10 format question has been open since Day 1
and is folded in rather than sent as a separate message.

</details>

---

## Day 5 — Tue 4 Aug · Integration Day (recorded walkthrough)

<details>
<summary>Rocks — Daily Status Report</summary>

```
# What I did today

- Delivered the Day 5 integration walkthrough as a recorded video: structured
  JSON logging with correlation ids, a live /metrics endpoint, a Grafana
  dashboard rendering it, and two failure signals driven live on camera.

- Moved the stack to a new machine. Grafana came up reporting healthy and had
  silently provisioned nothing -- no dashboard, no datasource, no error logged
  anywhere. Only my verification script caught it, because it checks that the
  datasource exists rather than that the container is running. That is the Day 8
  lesson arriving a week early on my own stack: alert on the absence of an
  expected success, not the presence of an error.

- Fixed a bug the Day 4 dashboard found in my own Day 2 logging: every
  Prometheus scrape and healthcheck was writing two log lines, roughly 28,800 a
  day with no users.

---

# What I will be doing the next working day

- Day 6: Distributed tracing. Instrument the service plus one downstream call
  and export spans to the Jaeger instance already in the stack.
- Deliverable: a screenshot of a trace in the Jaeger UI spanning both.
- Also adding trace_id and span_id to every log line.
```

</details>

<details>
<summary>Chat with Harvey</summary>

```
Hi Sir Harvey,

Day 5 status report is in Rocks.

Recorded walkthrough (18 min) — logs, metrics and the Grafana dashboard, plus
two failure signals driven live:
https://drive.google.com/file/d/1_79o8DYFxkwq6olAdUnD3p6J-1B_VZ6-/view?usp=drive_link

Still open from last week: does the Day 10 recorded walkthrough need a
particular length or format? Today's ran 18 minutes, so knowing whether that is
roughly the right target would help me plan for it.

Thanks!
```

</details>

**No PR link this time — Leander's call.** Day 5's deliverable in the plan is *"working sample
service demoed live"*, not a diff. The branch still exists and still merges, but sending a link
Harvey did not ask for adds noise to a message whose only real ask is the Day 10 format
question. Days 2–4 shipped a PR because the plan named one; Day 5 did not.

**Note on the split:** progress prose stayed in Rocks; the chat message carries only the video
link and the one open question. The Day 10 format question has now been open since Day 1 and is
re-raised with today's runtime as a concrete data point rather than as an abstract ask.

**Not said to Harvey, deliberately, but recorded in STATUS.md:** the walkthrough was several
takes and then edited, so the agreed single-take live-pressure rehearsal did not happen. That is
a training gap for Day 9, not a delivery caveat — the artefact he asked for is complete and
accurate.
