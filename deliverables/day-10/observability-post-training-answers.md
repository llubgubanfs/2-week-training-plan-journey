# Observability & Structured Logging — post-training assessment

**Day 10 · Tue 2026-08-11 · Leander Lorenz Lubguban**

Same five questions as the Day 1 baseline (`1-baseline/instructions.md`), answered again after the
two weeks. Baseline answers for comparison: `1-baseline/observability-structured-logging-answers.md`.

**Target: 7 / 10.** Scored by Harvey.

> Written unaided in one pass, without re-reading the baseline answers or any of the journals.

---

### 1. What's the difference between a log, a metric, and a trace?

Logs tell you what happened, metrics tell you something is wrong, traces tell you where — flat
events, aggregated numbers, and structure. The structural part is the trace's real value: a
`correlation_id` gives you a flat set of log lines, but `span_id` + `parent_span_id` + duration
builds a tree of what called what and how long each hop took relative to its parent — you can't
recover that from timestamps alone.

---

### 2. Your API's error rate just spiked — what's the first thing you look at?

Start with rate-by-route in the dashboard, not logs — it tells you if it's one route or everything,
one instance or all, and whether it lines up with a deploy. But watch the in-flight gauge alongside
the error ratio: the counter and histogram only update on completion, so if a downstream (DB, Redis)
seizes and nothing completes, both halves of the ratio go to zero and never cross a threshold — the
gauge, driven by arrival rather than completion, is the only one still moving during a hang.

---

### 3. What does a Prometheus scrape endpoint do?

It's a pull target — your app exposes an HTTP endpoint (usually `/metrics`) that serializes whatever
counters/gauges/histograms are sitting in the process heap, and Prometheus scrapes it on an interval;
the app never pushes and doesn't know Prometheus exists. Those values reset on restart, which is
exactly why you always query with `rate()` instead of diffing raw numbers — `rate()` treats a
decrease as a reset and compensates.

---

### 4. Why use structured (JSON) logs instead of plain text logs?

You get field-level queries — filter on `correlation_id`, `status_code`, `duration_ms`, `trace_id` —
instead of grepping text that drifts every time someone edits a log message. The real asymmetry is at
scale: a dropped log line is indistinguishable from a request that never happened, while a missed
metrics scrape just leaves a visible gap — one more reason logs and metrics are complementary, not
substitutes for each other.

---

### 5. How would you know your app is down before a user reports it?

Layer an error-rate alert that's a *ratio*, not an absolute count — an absolute threshold just
encodes whatever traffic you had when you wrote it — with a staleness/deadman check, since a dead
component doesn't make its metric drop to zero, it just stops existing, which looks identical to a
quiet night unless something's explicitly watching for that absence. Realistically that's six to ten
minutes depending on severity, bounded by the scrape interval and the alert's `for` window — not
instant, and deliberately so, to avoid paging on a blip.

---

## Delta against the Day 1 baseline

| # | Day 1 | Day 10 |
|---|---|---|
| 1 | *"A trace is the information that tells where the log originated"* — describes a log's source | membership vs **structure**: `span_id` + `parent_span_id` + duration give a tree; parentage is not recoverable from timestamps |
| 2 | *"investigate the api calls tagged as 'errors', then trace the failure point"* | rate-by-route first (one route or all, deploy correlation), **plus the hang case** — during a hang both halves of the ratio go to zero and only the arrival-driven gauge still moves |
| 3 | *"I do not have knowledge nor experience with Prometheus at the moment"* | pull model, values in the **process heap**, reset on restart, and why that mandates `rate()` over raw diffs |
| 4 | *"ideal for filtering when querying logs… easier to query"* | field-level queries vs message drift, plus the dropped-line/missed-scrape asymmetry |
| 5 | *"A health endpoint being called by a monitoring tool… then a mechanism to notify"* | ratio not absolute, **deadman/staleness on absence of expected success**, and an honest 6–10 min detection window |

## Score

<!-- filled when Harvey returns it -->
