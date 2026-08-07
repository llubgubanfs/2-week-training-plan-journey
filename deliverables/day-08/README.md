# Day 8 — Silent Failure Detection

**Track:** Observability · **Date:** Fri 2026-08-07 · **Branch:** `day-08-silent-failure`

A scheduled job that releases expired bookings, deliberately flawed so that it fails ~1 in 5 runs,
instrumented so a failure is visible as a **log entry**, a **metric**, and an **alert rule**.

This is the scenario Leander raised in his interview — a cron that fails silently — and it is the
same shape as weak-spot gaps **#3**, **#7** and **#17**.

---

## Evidence

| What it shows | Path |
|---|---|
| Job log lines, mixed failure mode — success and failure runs, all correlated | `sweep-logs-mixed.jsonl` |
| `/metrics` in mixed mode | `metrics-mixed.txt` |
| Job log lines, silent-only mode — **every run reports success** | `sweep-logs-silent.jsonl` |
| `/metrics` in silent-only mode — success counter climbing while the gauge climbs too | `metrics-silent.txt` |
| Prometheus alert state during the silent failure | `alerts-firing.json` |
| The three rules as Prometheus loaded them | `prometheus-rules.json` |
| Grafana panel, sweep outcomes + pending gauge | `grafana-sweep.jpg` |

Measured during the silent-only run, all four at the same instant:

```
job_runs_total{outcome="success"}   12      every run reported success
error-level sweep log lines          0      nothing threw, so nothing logged
bookings_expired_pending            33      desks not returning to circulation

ExpirySweepNotRunning         silent        the step signal
ExpiredBookingsNotSwept       firing        the state signal
```

Reproduce:

```bash
cd coworking-obs
docker compose -f infra/docker-compose.yml up -d --build

# the silent failure, forced
SWEEP_FAILURE_MODE=silent SWEEP_FAILURE_RATE_PCT=100 \
  docker compose -f infra/docker-compose.yml up -d --force-recreate booking-api

curl -s localhost:3000/metrics | grep -E '^(job_|bookings_)'
open http://localhost:9090/alerts
```

---

## The two failure shapes

The job can fail in two ways, and the whole day is about the difference.

| | `throw` | `silent` |
|---|---|---|
| What happens | an exception escapes the work function | the sweep runs, its cutoff is wrong, it matches nothing and returns 0 |
| Error log | yes — `job failed` at `level: error` | **none** |
| `job_runs_total` | `outcome="failure"` | **`outcome="success"`** |
| `job_last_success_timestamp_seconds` | not advanced | **advanced** |
| `bookings_expired_pending` | climbs | climbs |
| Caught by | `ExpirySweepFailingOften`, `ExpirySweepNotRunning` | **`ExpiredBookingsNotSwept` only** |

The `silent` column is the one worth defending. Nothing went wrong — something merely never
happened. There is no exception for a `catch` to catch, no 5xx, no user request that failed. Desks
simply never return to circulation, and on the Day 7 waitlist design it is worse: no expiry means
no `desk.freed`, so no promotion fires and every queue behind those desks stalls too.

## The three signals

**Log** — `libs/observability/src/jobs/job-runner.ts`. Each run opens its own CLS context with a
generated `correlation_id` and `context_type: "job"`, so the two lines of a run correlate exactly
like a request pair, with no request anywhere. This is the Day 2 `AsyncLocalStorage` decision
paying off: a request-scoped provider would have had nothing to scope to here.

**Metric** — three series, and the split between them is the point:

| Metric | Kind | Question it answers |
|---|---|---|
| `job_runs_total{job,outcome}` | counter | did the job report success? |
| `job_last_success_timestamp_seconds{job}` | gauge | how long since it last did? |
| `bookings_expired_pending` | gauge | **is the invariant broken right now?** |

`bookings_expired_pending` is computed by a prom-client `collect()` callback at scrape time, **not
written by the sweep** — `apps/booking-api/src/bookings/bookings.metrics.ts`. If the job wrote it,
a dead job would freeze it at its last healthy value and Prometheus would scrape a flat, green
zero forever. A state signal must not be written by the component it watches, or it is a step
signal wearing a state signal's name.

**Alert** — `coworking-obs/infra/prometheus/rules/booking-api.yml`.

| Rule | Shape | Blind to |
|---|---|---|
| `ExpirySweepNotRunning` | step — `time() - last_success > 180` | a run that succeeds and does nothing |
| `ExpiredBookingsNotSwept` | state — `bookings_expired_pending > 5` | nothing structural; it is the page |
| `ExpirySweepFailingOften` | step — failure ratio | every silent failure |

Two details in the rules worth being able to explain:

- **`absent()` arm on `ExpirySweepNotRunning`.** After a restart the timestamp gauge does not exist
  until the first success, and a rule referencing a non-existent series evaluates to nothing — so a
  container crash-looping before its first sweep would be perfectly silent without it.
- **`time() - timestamp` rather than `rate(...{outcome="success"}[10m]) == 0`.** `rate()` needs two
  samples inside the window to return anything, so a job that stops right after a deploy produces
  an empty result, and `== 0` never matches an empty result.

---

## How would I know this failed before a user reported it?

I detect silent cron job failures by monitoring the invariant the job is responsible for
maintaining rather than trusting the job to report its own health. In my implementation, the
system recorded twelve consecutive successful sweep executions while an independently collected
state metric remained non-zero, causing the invariant alert to fire even though the heartbeat
alert stayed green, demonstrating that I page on the violated state and use the job's execution
metrics only for diagnosis.

---

## The bug found by the demo, in the demo

The first run of this looked like a success: two alerts firing, gauge climbing, story intact. One
of the two was a **false positive**, and it was in the instrumentation, not the job.

`job` is Prometheus's own label — the server stamps `job="<scrape config job_name>"` on every
series it scrapes. When a scraped target exposes a label the server already owns, `honor_labels`
decides who wins and it defaults to **false**, so the *exposed* label loses and is silently renamed
to `exported_job`. Nothing errors. `/metrics` looks exactly right.

```
exposed:  job_last_success_timestamp_seconds{job="expiry-sweep",  service="booking-api"}
stored:   job_last_success_timestamp_seconds{job="booking-api", exported_job="expiry-sweep",
                                             service="booking-api", exported_service="booking-api"}
rule:     job_last_success_timestamp_seconds{job="expiry-sweep"}   →  []
```

An empty selector makes `absent()` return 1, so `ExpirySweepNotRunning` fired permanently while
the sweep ran perfectly. Fixed by renaming the metric label to `job_name`; the same collision on
`service` was removed by dropping the redundant label from the scrape config.

Two things worth keeping from this:

- **The alert firing is not evidence the alert works.** It fired for a reason unrelated to the
  condition it describes, and the symptom was identical to the demo succeeding. The check that
  found it was querying the selector directly in Prometheus and getting `[]` back.
- **`job` in a log line is fine.** A log stream has no server writing labels underneath it. Same
  word, two systems, and only one of them has reserved it.

## Tests

`libs/observability/src/jobs/job-runner.spec.ts` — 6 tests. Suite went 11 → 17.

The load-bearing one is the negative assertion in *"does not count a throw as a success"*. The
first version of `JobRunner` was going to put the success counter in `finally`, which compiles,
passes a smoke test, and increments `success` on the failing runs — silently disabling the
absence-of-success alert this entire day exists to build. `tsc` cannot see that, and a running
stack only shows it statistically.

Also asserted deliberately: *"counts a run that silently did nothing as a success"*. That is not a
bug being locked in — it is the justification for the state gauge existing, and if someone later
"fixes" it by inferring failure from an empty result, the Day 10 argument changes.

## Carried, not done

- `/health` endpoint and `app.enableShutdownHooks()` — still open, still Day 8's list.
- No Alertmanager. These rules reach `firing` and notify nobody. Gap **#17**'s deadman's switch
  remains the strongest argument for adding it.
- The sweep runs against an in-memory `Map`, not Postgres — the booking domain was fenced off on
  Day 2 and never landed. The instrumentation is identical either way; what would change with a
  real table is that `countExpiredPending()` becomes an indexed `COUNT`, and `collect()` running
  inside the scrape then has a real latency cost worth watching in `scrape_duration_seconds`.
