# Day 4 — Mon Aug 3 · Infrastructure Day: Metrics & Tracing Stack

**Track:** Observability
**Prereq:** Day 3 `/metrics` endpoint ✅ verified
**Objective:** Stand up a Docker Compose stack — Prometheus + Grafana + Jaeger + booking-api —
so `/metrics` has somewhere to be scraped and rendered, and Jaeger is running ahead of Day 6.

**This stack is reused for the whole of Week 2.** Days 6, 8 and 10 all run on top of it.

---

## Orientation findings (checked on disk, not taken from STATUS.md)

- **Prereq ✅** — `/metrics` is real: `libs/observability/src/metrics/` has the registry,
  the counter/histogram/gauge, the middleware and `MetricsController`. Nothing to rebuild.
- **Port 5432 is already taken** by `lrnzo-postgres` (another project, up 26h). Moot in the
  end — Postgres did not join the stack today.
- **STATUS.md was stale on one line** — it recorded the Day 3 PR as *open*; `05badb2` is the
  merge commit.
- 3000 / 3001 / 9090 / 3030 / 16686 / 4317 / 4318 were all free.

## Deliverable Harvey will look at

| Evidence | Path | Status |
|---|---|---|
| `docker-compose.yml` (Prometheus + Grafana + Jaeger + service) | `coworking-obs/infra/` | ✅ |
| Screenshot of a working Grafana panel | `deliverables/day-04/grafana-dashboard.jpg` | ✅ |
| Confirmation Jaeger's UI is reachable | `deliverables/day-04/jaeger-ui.jpg` | ✅ |
| Both scrape targets UP | `deliverables/day-04/prometheus-targets.jpg` | ✅ |
| Targets, rules and cardinality as greppable text | `deliverables/day-04/stack-verification.txt` | ✅ |
| PR (open) | [#2](https://github.com/llubgubanfs/2-week-training-plan-journey/pull/2) — 4 commits, 19 files | ✅ |

## Warm-up quiz — 1.5 / 3

1. **Scrape resolution + counter reset — half.** Right that the 400 requests are invisible
   until the next scrape. Missed that Prometheus learns them as a *single jump* and cannot
   tell a smooth 400 from a burst of 400 one millisecond before the scrape. Then said the
   counter survives a restart "because volumes" — it does not; it is heap state in the Node
   process and resets to 0. → gap **#14**.
2. **Pool saturation — gauge, unprompted.** First clean pass on gap #13. Missed why a
   counter of acquisitions can't substitute, and reached for an absolute threshold where
   yesterday's own alerting note argues for a ratio.
3. **Where the p95 data lives — quarter.** Said Grafana's volume. It is Prometheus's TSDB;
   Grafana holds no time series. Didn't separate *panel data* from *the dashboard object*,
   which is the whole argument for provisioning as code. → gap **#15**.

Both new gaps were "where does state actually live", and both got settled against the
running stack rather than on paper.

---

## What I did

- Compose stack: booking-api, Prometheus, Grafana, Jaeger. Every port env-overridable, no
  hardcoded hosts. Grafana published on **3030** — its container port 3000 collides with
  booking-api on the host.
- `prometheus.yml` scraping booking-api and Prometheus itself at 15s. The **notifier is
  deliberately not a target**: it exposes no metrics, and a permanently-DOWN row on
  `/targets` teaches you to ignore red.
- The two Day 3 alert rules **loaded into a running Prometheus**, plus a third, `TargetDown`.
- Grafana **provisioned as code** — datasource + an 8-panel dashboard read from disk at boot.
- `infra/README.md`, `scripts/verify.sh` (18 checks), `scripts/traffic.sh` (8 modes).
- `/debug/slow` and `/debug/fail` so the failure signals can actually be driven.
- Two study artifacts on the warm-up material — see `journal/study-aids.md`.

## What I learned

**Grafana stores no time-series data at all.** It is a query front-end: the panel issues
PromQL at render time and Prometheus's TSDB answers. The two volumes therefore fail
differently — drop `prometheus-data` and the dashboard renders empty; drop `grafana-data` and
a *provisioned* dashboard simply rebuilds from the repo. That asymmetry is the entire argument
for provisioning as code, and I had it backwards this morning.

**`http_requests_total` is heap state.** No volume touches it. A restart resets it to 0, which
Prometheus sees as a counter reset — and `rate()` treats any decrease as a reset and
compensates. That is *why* you never subtract raw counter values, a rule I was already
following without the model underneath it.

**Detection latency is additive and severity-dependent.** `t_cross = (T/E) × W`. A total
outage crosses a 5% threshold in 15s; a 6% error rate takes 250s. End to end, roughly 6–10
minutes. "Instantly" is the wrong answer.

**`for:` only suppresses transients longer than the window.** Time above threshold is
`W + B − 2TW` — the window *plus* the burst, because the window keeps carrying the damage
after recovery. With `for: 5m` against a `[5m]` window the transient budget is ~30 seconds,
so a 45-second outage that heals itself still pages someone. A *wider* window makes this
worse, not better.

## What I got stuck on

**`http_requests_in_flight` would not move, and I assumed the metric was broken.** It was not.
Four hypotheses died in order, each killed by measurement rather than argument:

1. Prometheus's 15s sampling misses the spike → polled `/metrics` directly at 20ms. Still 0.
2. `curl` process-spawn is too slow to overlap → 300 async workers in one process. Still 0.
3. undici pools connections so the concurrency is fake → `/proc/net/tcp` showed **401
   established connections**. Real concurrency. Still 0.
4. Decisive run: load generator and sampler in one in-container process — 14,624 requests
   served, 96 gauge samples, **max 0**.

The answer was in the histogram, which spans the same region as the gauge: **mean server-side
duration 0.19 ms** against ~30 ms client-observed latency. The app is inside its own
instrumented span for **0.62%** of a request's life. By Little's Law the occupancy of that
span is `throughput × duration` = 0.93 even at 4,900 req/s — under one request. Everything
else is queued in the kernel accept queue and libuv, upstream of Express, where the gauge
cannot see it.

**So the gauge is not a load gauge.** It counts requests held *inside* the handler, which is
precisely the Day 8 failure mode — an awaited call that never returns. Confirmed once
`/debug/slow` existed: 30 concurrent requests took it **0 → 30 → 0**.

The lesson worth keeping is not about the gauge. It is that I called it broken before
measuring it, and the first three explanations I found convincing were all wrong.

## Carried over from today

- Booking domain + Postgres + TypeORM — slipped a **third** time, deliberately. Zero
  assessment points; the infra was the graded deliverable.
- No Alertmanager. Rules reach `firing` and notify nobody.
- `/metrics` is excluded from the metrics middleware but **not** the logging middleware, so
  every scrape and healthcheck writes two log lines — ~28,800/day with no users. Found by
  this stack within an hour of it existing. **Decision still open.**
- No `/health` endpoint; the container healthcheck hits `/metrics`, which renders the whole
  registry every 10s.
- `nodejs_eventloop_lag_p99_seconds` is exposed and unused — it is the signal that *did*
  register today's saturation (sub-ms idle → 10.5 ms under load). Not on the dashboard.

## Time

Ran long, and the split was lopsided: the infra itself was ~2 hours, and the rest went on the
warm-up material and the in-flight investigation. Judged worth it — both are Day 10 retest
content, and the investigation closed a Day 3 carry-over (the 499 branch) as a side effect.
