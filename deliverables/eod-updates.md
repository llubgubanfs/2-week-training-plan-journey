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
