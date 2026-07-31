# Day 3 — Metrics & Alertable Signals

**Date:** Fri 2026-07-31 · Week 1 · Track: **Observability**
**Prereq:** Day 2 structured logger — ✅ verified on disk (`libs/observability/src/logging/`, wired into `apps/booking-api/src/app.module.ts` via `ObservabilityModule.forRoot`)

---

## Objective

Expose a `/metrics` endpoint on `booking-api` carrying **request count, error rate, and latency**
in a format Prometheus can scrape — and write down the **one alert** worth wiring off it.

## Deliverable Harvey will look at

| Evidence | Path |
|---|---|
| PR into `master` from `day-03-metrics` | ✅ [#1](https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1) — commit `114e76a` |
| `curl /metrics` output capture | ✅ `deliverables/day-03/metrics-scrape.txt` |
| Screenshot of the endpoint | ⏭️ **skipped** — the scrape text is greppable, diffable and shows every series; a PNG adds nothing |
| One-paragraph alerting note | ✅ `deliverables/day-03/alerting-note.md` |

## Time budget (~4 hrs)

| Block | Budget | Can slip? |
|---|---|---|
| Warm-up quiz (Day 2 recall + metric/log boundary) | 15 min | no |
| Pluralsight — Prometheus/Grafana sections | 60 min | trim to the Prometheus half if tight |
| State the approach out loud, get pushed back on | 20 min | no — gates the build |
| `prom-client` + registry + `/metrics` in `@app/observability` | 60 min | no |
| Instrument count / errors / latency histogram | 45 min | no |
| Alerting note (the highest-signal artifact today) | 30 min | no |
| Deliverable capture + PR + EOD to Harvey | 30 min | no |
| Booking domain endpoints (carried from Day 2) | — | **yes — slip to Day 4** |

## Carried in from Day 2

- [ ] Booking domain endpoints — scaffolding only, no domain code. Fence: 3 endpoints, ~300 lines.
- [ ] TypeORM chosen but not installed — ships with the entities, not before.
- [ ] Pluralsight: note where the Prometheus/Grafana sections start.
- [ ] PII / secret redaction + log-level discipline — known hole, plausible Day 10 question.
- [ ] `app.enableShutdownHooks()` / graceful drain — Day 8.

---

## Warm-up quiz

*Answers withheld until he responds. Misses → weak-spot list in STATUS.md.*

**Score: ~1.5 / 3.**

| # | Question | Result |
|---|---|---|
| 1 | Concrete failure if `ClsMiddleware` auto-mounts instead of being ordered explicitly | ✅ **pass** — ordering + dependency correct. Understated the severity: `store.startedAt` on `undefined` is a TypeError, so it's a 500 on every request, not just a missing field. |
| 2 | Mechanism by which two interleaved requests keep separate correlation ids across an `await` | ❌ **miss (2nd time, gap #5)** — restated isolation rather than explaining it. Mechanism handed over: `async_hooks` `init` copies the store pointer onto each new async resource; `before` restores it at callback time. The store rides the resource, not a variable. Owed back unprompted. |
| 3 | Why add `/metrics` when the completion log already has `status_code` + `duration_ms` | ❌ **miss (gap #4 resurfacing)** — called `/metrics` "an aggregator for those lines"; it reads nothing from logs. Justification given (received-with-no-completed) is executable purely in a log aggregator, so it doesn't separate the signals. Missing: query-time vs write-time aggregation, flat cost in RPS, and log sampling making percentiles unreliable at volume. |

Gap **#6 closed** — creation site named correctly and unprompted.

---

## What I did

- Added `prom-client` and built `libs/observability/src/metrics/`: a dedicated `Registry`
  (+ `collectDefaultMetrics`), `HttpMetrics` (counter / histogram / gauge), `HttpMetricsMiddleware`,
  `MetricsController` at `GET /metrics`, and `request-labels.ts` for the two label decisions.
- Fixed a real Day 2 bug found while doing it: `HttpLoggingMiddleware` hooked `res.on('finish')`,
  so an abandoned request logged `request received` with no matching completion. Now hooks
  `'close'` and branches on `res.writableFinished`, recording `499` for client-abandoned requests.
- Wrote `deliverables/day-03/alerting-note.md`. Excluded `/metrics` itself from the middleware.

## What I learned

**Histogram vs summary — "a quantile is an answer, bucket counts are facts."**
Two instances reporting p95 = 100ms and p95 = 200ms cannot be combined: swap their request
volumes and the correct service-wide answer changes while both inputs stay identical, which
proves the inputs are insufficient. Bucket counts are additive, so `sum by (le)` just works.
`histogram_quantile` then interpolates *linearly inside* the bucket the target rank lands in —
so a quantile is only as precise as its bucket, and anything past the top bucket falls into
`+Inf`, which has no upper bound and reports the highest finite boundary instead. A service
degrading to 30s would show a flat 5s ceiling rather than an outage.

**Cardinality is a product, and one unbounded factor makes the product unbounded.**
Correctly labelled (`method`, route *template*, `status_code`), this service is ~15 counter
series and ~120 histogram series — about 135 total, which is nothing. Labelling with
`req.originalUrl` instead: 10 locations × 365 dates = 3,650 distinct paths → ~131,500 series,
roughly a thousandfold, growing every day and never shrinking, because Prometheus keeps a
series until retention expires. Unmatched routes must collapse to a single `unmatched` value —
falling back to the raw URL there lets a bot minting random URLs create series at will.

**The metric/log boundary (gap #4, finally closed).**
A log stores one record per request, so `originalUrl` is just another field on that event —
10 or 10,000 distinct URLs make no structural difference. A metric label is not per-event:
every distinct value creates a separate time series Prometheus must store, index and update.
Hence the same request is written down two different ways on purpose — full URL in the log
(`http-logging.middleware.ts:26`), route template in the metric (`http-metrics.middleware.ts:42`).
Also: at volume logs get sampled, so a p99 derived from them is an estimate; a counter is exact
by construction.

**Alerting — the reasoning behind the note.**

| Situation | Reality | `rate(5xx[5m]) > 0.1` does |
|---|---|---|
| 3am, 2 req/min, 100% failing | total outage | 0.033/sec → silent |
| Peak, 50 rps, 1% failing | healthy | 0.5/sec → fires |

Inverted in both directions, because the threshold is an absolute rate while the quantity that
matters (the *proportion* failing) never appears. Worse, the two compound: firing all day gets
the channel muted, so the 3am alert that wouldn't fire also has no audience left. The ratio form
fixes it but is not itself traffic-independent — one 500 out of two requests is 50% — so the rule
must also guard the denominator. Detection latency compounds too: `rate(...[5m])` plus `for: 5m`
means ~7–10 minutes. Little's Law (in-flight ≈ arrival rate × duration) puts normal in-flight
near 2.5 at 50 rps, so a ceiling of 50 is ~20× headroom. The gauge is the *fast* signal, the
ratio is the *accurate* one.

**Counters die during the outage they should catch.** Counter and histogram are driven by
request *completion*. If everything hangs, nothing completes, both numerator and denominator
go to ~0, `errors/total` is `NaN`, and `NaN > 0.05` is false. The dashboard reads "quiet night."
A gauge is driven by *arrival* — the half that always happens — so it climbs and stays.

## What I got stuck on

*The highest-value section for Day 9/10 prep.*

- **Answered with borrowed vocabulary instead of mechanism.** First attempt at the metric/log
  boundary was "we identify an event / we classify it" — the two words handed to me minutes
  earlier, mapped one per file, with no reasoning underneath. Same failure shape as gap #5 on
  Day 2. Re-asked with those two words *banned*, I produced the real answer. **Banning the
  borrowed term is the test for whether I actually own something** — apply it to ALS before Day 10.
- **Knew what a gauge is, didn't reach for one.** Asked which metric survives an outage where
  nothing completes, I answered "the count, derived to rate" — having correctly rejected gauges
  for error rate an hour earlier. Definition owned, tool not owned. Logged as gap #13.
- **Punted on the cardinality arithmetic** ("a lot, increases exponentially") when asked for a
  number. The magnitude *is* the lesson; the intuition isn't a substitute for multiplying it out.
- **Got the alert backwards on first read** — predicted the absolute-count rule would fire more
  at 3am. It is the exact opposite, and the arithmetic takes ten seconds.
- **Not verified:** the `499` path never fired in testing, because every request completed. Needs
  a slow endpoint to abandon — Day 4, once there is a real database call.

## Evidence

- [x] PR opened against `master`, English title and body — [#1](https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1)
- [x] `/metrics` output captured
- [x] Alerting note written
- [x] Paths recorded in `journal/STATUS.md`

**Re-verified at day-end from the committed build** (not inferred from a passing test):

```
$ curl -s -o /dev/null -D - http://localhost:3000/metrics | head -3
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/plain; charset=utf-8; version=0.0.4

$ curl -s http://localhost:3000/metrics | grep -E '^(http_requests_total|http_requests_in_flight)'
http_requests_total{method="GET",route="/",status_code="200",service="booking-api"} 2
http_requests_total{method="GET",route="unmatched",status_code="404",service="booking-api"} 1
http_requests_in_flight{service="booking-api"} 0
```

Plus 77 `process_`/`nodejs_` default series, including `nodejs_eventloop_lag_seconds`.
