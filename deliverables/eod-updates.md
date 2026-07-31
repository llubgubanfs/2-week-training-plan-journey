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
