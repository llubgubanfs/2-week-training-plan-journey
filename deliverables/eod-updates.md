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

**Blocked:**
- Nothing blocking.
- **Repo link changed.** Day 2's PR was opened on a duplicate repo (`y4nder/…`). Everything from
  Day 3 onward is on `llubgubanfs/…`. If the Day 2 link was saved, it needs replacing.
- **Decision needed today, locks tomorrow:** `correlation_id` vs the plan's literal `request_id`
  (raised Day 2). Day 4 wires Grafana dashboards that query the field by name, so renaming after
  tomorrow means touching dashboards too.

**Tomorrow — Day 4: Infrastructure Day (Metrics & Tracing Stack):**
- Docker Compose stack: Prometheus + Grafana + Jaeger + the service
- Grafana panel screenshot + confirmation Jaeger's UI is reachable
- This stack gets reused for the rest of Week 2

<details>
<summary>Message as sent</summary>

```
Hi Sir Harvey,

DONE — Day 3: Metrics & Alertable Signals
PR: https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1

The booking-api now exposes GET /metrics with request count, latency and
requests-in-flight, plus the Node process defaults. A real scrape and the
alerting note are committed under deliverables/day-03/.

The alert I'd wire is on the *ratio* of 5xx to total requests, not an
absolute error count. An absolute threshold is inverted in practice — at
2 req/min it stays silent through a total outage, and at 50 rps it fires
on a healthy 1% error rate. The note has the rule and the numbers.

I also added an in-flight gauge, which isn't in the plan's list. If the
database hangs and callers give up, nothing completes, so both sides of
the error ratio go to zero and the alert never fires. The gauge is driven
by requests arriving rather than finishing, so it still climbs.

While doing this I found a bug in Day 2's logger: it listened for 'finish',
which never fires if the client disconnects mid-request. Those requests
were logging a "received" line with no completion, and would have been
missing from the metrics as well. Both now use 'close' and record 499.

BLOCKED — nothing.

Two flags:
1. Day 2's PR was on a duplicate repo. Everything from Day 3 is on
   llubgubanfs/2-week-training-plan-journey — worth replacing the old link
   if you saved it.
2. Still open from Day 2: correlation_id vs the plan's request_id. Day 4
   wires Grafana dashboards that query the field by name, so this is the
   last day it's a cheap rename. Happy either way — just need the call.

TOMORROW — Day 4: Infrastructure Day
Docker Compose stack with Prometheus, Grafana and Jaeger so /metrics has
somewhere to be scraped and visualized, with Jaeger ready ahead of Day 6.

Thanks!
```

</details>
