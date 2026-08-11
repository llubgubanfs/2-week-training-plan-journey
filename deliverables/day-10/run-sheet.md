# Day 10 — Final walkthrough run sheet

**Tue 11 Aug · ~18 minutes · Harvey Martus · last day of the plan**

The plan's ask: *"Give a walkthrough of the observability work — structured logging, metrics,
tracing, and the silent-failure demo — then complete your Observability post-training assessment
using the same format as Day 1."*

> **This sheet is a sequence and a set of prompts, not a script.** Where it says **SAY**, that is
> the point to land, phrased however you phrase it. The explanations have to be yours — Day 5
> proved that reading someone else's sentences produces a section you cannot narrate when the
> material shifts underneath you.

---

## Two takes. The first one is still not for Harvey.

This was agreed on Day 5 and skipped, and it has been carried ever since. **Today is the last day
it can happen.**

**Take 1: one unbroken run, unrehearsed, never submitted.** If something breaks, debug it out loud.
Then watch it back. **Take 2 is the one you send.**

Harvey has already seen one polished, edited recording of Week 1. What he has never seen is you
explaining something you did not rehearse — and gap **#18** exists precisely because the one topic
you struggled with on camera was the one marked *closed* after you produced it perfectly in writing.

---

## T-20 — setup

Two findings from this morning, both of which would have cost you a take.

```bash
cd coworking-obs/infra
docker compose up -d
./scripts/verify.sh                      # must exit 0
./scripts/traffic.sh wave 3600 &         # leave running the whole session
```

**1 · Send traffic before you hit record.** `http_requests_total` and the latency histogram **do
not exist in `/metrics` until the first request is served** — prom-client creates the labelled
child series on first increment, not at registration. A cold stack shows a missing metric and an
empty dashboard, and on camera that reads as broken instrumentation rather than an idle system.
Give it 2 minutes of traffic before opening Grafana; `rate()` needs several scrapes to have shape.

**2 · Start silent mode early — the alert takes ~4.5 minutes to ripen.**

```bash
SWEEP_FAILURE_MODE=silent SWEEP_FAILURE_RATE_PCT=100 docker compose up -d booking-api
```

⚠️ **The rate is not optional.** At the default `20`, only one run in five fails silently and the
other four sweep the backlog clean — `bookings_expired_pending` oscillates around zero, never
crosses `> 5`, and **the alert never fires.** Verified this morning: at 20 the gauge sat at 0 for
five minutes; at 100 it climbed 0 → 42 monotonically and fired in 4.5 minutes.

`ExpiredBookingsNotSwept` is `bookings_expired_pending > 5` with `for: 3m`. Measured timeline from
the restart: gauge crosses 5 at ~1 min, rule goes `pending` at ~1.5 min, **`firing` at ~4.5 min.**
Run it **as your first command on camera** (§1), not when you reach §6 — otherwise you sit and wait.

⚠️ That command restarts `booking-api`, which **resets the in-heap counters**. Do it early and the
reset is invisible; do it at §7 and `job_runs_total` drops to zero mid-demo. If it happens anyway,
that is a genuinely good save — it is the counter-reset story you closed on Day 5.

Windows, in this order:

1. Terminal — the stepper: `./scripts/walkthrough.sh --list`
2. Terminal — logs: `docker compose logs -f booking-api`
3. Grafana http://localhost:3030 · 4. Prometheus http://localhost:9090 · 5. Jaeger http://localhost:16686

---

## The flow — ~18 min

Week 1 is **compressed**: Harvey has seen the Day 5 recording. Week 2 is the new material and
should get roughly two-thirds of the time.

### 1 · Frame it — 1 min

Start silent mode (above) as your first command, then talk over it.

**SAY:** what the two weeks were for, and the shape of the answer — logs to tell you *what
happened*, metrics to tell you *that something is wrong*, traces to tell you *where*. Name that
the last one is a job that fails without erroring, which is the scenario you raised in your own
interview.

Open on the dashboard already rendering. Payoff first.

### 2 · Logs — 2 min

Tailing terminal. One JSON object per line.

- Point at `correlation_id`, `context_type`, `service`, `duration_ms`, **`trace_id`, `span_id`**.
- **SAY:** why `correlation_id` and not `request_id` — the cron has no HTTP request behind it and
  still needs correlating through the same logger; `context_type` (`http` · `job` · `system`)
  names the source. **This is a deviation from the plan. Say it as a decision.**
- **SAY:** the field is *omitted*, not sentinelled, when there is no context — and the same rule
  applies to `trace_id`, because W3C defines an all-zeroes trace id as invalid.

### 3 · Metrics and the cardinality guard — 3 min

**Your strongest 30 seconds, and the one that collapsed on camera on Day 5. Do it slowly.**

Stepper beats 1–2.

⚠️ **Two different numbers — do not merge them on camera.**

| On screen | What it is |
|---|---|
| `count(http_requests_total)` → **2** (4–5 if the debug endpoints have been hit) | series for *that one metric*, right now |
| **~135** | the whole registry, projected for the finished service — Day 3's *"~15 counter + ~120 histogram"* |
| **~131,500** | the same service labelled by raw URL — 10 locations × 365 dates = 3,650 paths |

Saying "135" while a `2` is on screen is the Day 5 failure repeating: the script said two lines,
the panel had four. Show the **series**, not a bare count — the labels are the argument:

```bash
curl -s localhost:3000/metrics | grep '^http_requests_total{'
```

**SAY:** two series — and the second is `route="unmatched"` with over a thousand requests behind it,
every one of them a different URL. Every distinct label value is a separate time series Prometheus
stores, indexes and updates. Raw URLs make series count a function of *traffic*, which the internet
picks for you; route templates bound it by *routes × status codes you can actually emit*, which you
get by reading your own code. Then give the scaled arithmetic as a **separate** figure.

### 4 · Where the numbers come from — 2 min

Prometheus `/targets`, then `/rules`.

- **SAY:** Prometheus **pulls**. The app exposes current values and never pushes; it does not know
  Prometheus exists.
- **SAY:** the error rule is a **ratio**, not an absolute count — and why the absolute version is
  the one that trains people to ignore the page.
- **SAY:** why `RequestsStuckInFlight` is a separate rule — during a hang nothing completes, both
  halves of the ratio go to zero, `0/0` is `NaN`, and the ratio alert is blind. The gauge is driven
  by **arrival**, which is the half that always happens.

### 5 · Tracing — 3 min

Stepper beats 9–11.

⚠️ **Pause ~5 seconds between beat 9 and beat 10.** Measured this morning: 3 seconds is not enough,
5 is. That pause is `BatchSpanProcessor` batching, and it is worth narrating rather than hiding —
**a span reaches Jaeger when it is ended *and* its batch is flushed. Two gates that fail
independently.**

- **SAY:** what a trace gives you that `correlation_id` cannot — **structure**. A flat id gives a
  set; `span_id` + `parent_span_id` + duration give a **tree**, and parentage cannot be recovered
  from timestamps.
- **SAY:** why you kept **both** ids. The strongest version is sampling: under head sampling a log
  line still carries a `trace_id` whose trace was never exported, so pasting it into Jaeger returns
  nothing. Logs are not sampled.
- Beat 11 — the fire-and-forget endpoint returns **202 in ~2 ms** while the awaited one takes ~45 ms.
  **SAY:** what Jaeger shows if that background call fails after the 202, and why an unhandled
  rejection loses the *whole buffer* including the parent span of a request that succeeded.

### 6 · The silent failure — 4 min · **the centre of the day**

Stepper beats 13–16. The alert should already be firing.

Build it in this order, because the order is the argument:

1. Beat 13 — `job_runs_total{outcome="success"}` climbing. **The job says it is fine.**
2. Beat 14 — **zero error-level log lines.** Nothing to alert on. Nothing to grep for.
3. Beat 15 — `bookings_expired_pending` climbing anyway. **The world is wrong.**
4. Beat 16 — `ExpiredBookingsNotSwept` **firing**, `ExpirySweepNotRunning` **silent**.

- **SAY:** the rule — **key on the absence of an expected success, not the presence of an error.**
  If an error existed to log, it would not be a silent failure.
- **SAY:** the state/step split, and that they are **not competing**: page on the state signal,
  diagnose with the step signals.
- **SAY:** why the gauge is a `collect()` callback and not a `.set()` inside the job — a signal
  written by the component it watches **freezes at its last healthy value when that component
  dies**. `collect()` is evaluated by the scrape, so the reporter is alive by definition.
- **SAY:** why the success counter is in `try` and not `finally`. In `finally` it counts every
  failure as a success and silently disables the entire day's alerting. (A span goes in `finally`;
  a success counter must be reachable on exactly one path. Same-shaped rule, opposite requirement.)
- **SAY:** `time() - job_last_success_timestamp_seconds` rather than `rate(...) == 0`, because
  `rate()` needs two samples and a job that stops right after a deploy gives an empty result that
  `== 0` never matches. Then the **`absent()` arm**, and why it is load-bearing: a failed scrape
  appends a staleness marker, so the series returns *no data* rather than a frozen value.

### 7 · The bug the demo found in itself — 2 min

Stepper beats 17–18. **Volunteer this. Nobody would have known.**

**SAY:** `job` is Prometheus's own label — the server stamps it from the scrape config. When a
target exposes a label the server already owns, `honor_labels` decides, and it **defaults to
false**, so the exposed label loses and is silently renamed `exported_job`. Nothing errors.
`/metrics` looked right. So the selector matched nothing, `absent()` returned 1, and the alert
fired permanently **while the sweep ran perfectly**.

**The line to land:** *a firing alert is not evidence that the alert works.* What caught it was
running the selector directly and getting `[]` back.

### 8 · Close — 1 min

Name your own gaps before he finds them: no Alertmanager, so rules reach `firing` and notify
nobody — and the deadman's switch is the only thing that can report the stack's own death. No PII
or secret redaction in the logger. No sampling configured. No `/health` endpoint separate from
`/metrics`. In-memory store rather than Postgres, and why that was a deliberate scope call.

---

## Questions to expect

The two that went **uncovered** in the Day 5 recording are the near-certain follow-ups, and you
answered both this morning — use your own words from today, not new ones:

| Question | Where your answer is |
|---|---|
| **Why Winston and not pino?** | Serializer/transport mechanisms · what you'd give up · **name the volume at which you'd switch** · and that sonic-boom's async buffer **dies on a hard exit**, which argues *for* Winston in exactly the failure class this plan is about |
| **Why a metric when the log already has `status_code` and `duration_ms`?** | ~2 GB/yr vs ~1.9 TB/yr, flat-in-traffic vs linear · a dropped log line is indistinguishable from a request that never happened, and drops correlate with the load the alert exists to catch · **and the honest other half: write-time aggregation forecloses the questions you didn't predict** |

Also plausible, all Day 8 material: why `collect()` and not `.set()` · why not `finally` ·
`time() - timestamp` vs `rate() == 0` · the `absent()` arm · the `job`/`exported_job` collision.

⚠️ **Two habits, both graded live:** read the question back before answering — *"you're asking what
**decides** X, so I need to name something that **varies**"* — and when you do not know, say
*"that's a guess, here's how I'd check it."* On Day 6 *"I don't know"* scored better than a
plausible story.

---

## Evidence to capture

| What | Where it goes |
|---|---|
| The recording | `~/Videos/2_week_training_plan_videos/` + Drive link in STATUS.md |
| Post-training answers, 5 questions, same format as Day 1 | `deliverables/day-10/observability-post-training-answers.md` |
| Reset the stack when done | `SWEEP_FAILURE_MODE=none docker compose up -d booking-api` (stepper beat 19) |

**The written assessment is not optional and it is not the recording.** The plan asks for both:
*"then complete your Observability post-training assessment using the same format as Day 1."*
Baseline for the delta: `1-baseline/observability-structured-logging-answers.md`.
