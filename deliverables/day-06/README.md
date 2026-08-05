# Day 6 — Distributed Tracing

**Objective:** instrument the sample service plus one downstream call with OpenTelemetry and
export the trace to the Jaeger running since Day 4.

**Deliverable the plan asks for:** a screenshot of a trace in the Jaeger UI spanning both the
sample service and the downstream call.

---

## Evidence

| File | What it shows |
|---|---|
| `jaeger-trace-immediate.png` | The asked-for artifact — `GET /downstream-immediate`, 2 services, 10 spans |
| `jaeger-trace-fire-and-forget.png` | The same hop not awaited, and the child span outliving its parent |
| `trace-immediate.json` | Trace `d505e96a…` as data — greppable and diffable, following Day 3's precedent of committing the scrape text rather than only a picture |
| `trace-fire-and-forget.json` | Trace `fce6c47e…` as data |
| `correlated-log-with-trace.jsonl` | Log lines from **both** services carrying one shared `trace_id` and one shared `correlation_id` |

The two JSON exports are the same traces as the two screenshots. The log capture is a third,
later request — the log buffer had already rotated past the screenshot traces, and reusing a
different trace's ids would have been a nicer-looking file that did not correspond to anything.

## 1 — Awaited: `GET /downstream-immediate`

Trace `d505e96ac94d472965c016f32dd9a702` · **49.93 ms** · 2 services · depth 9 · 10 spans

```
booking-api  GET /downstream-immediate                       49.93ms
  booking-api  request handler - /downstream-immediate
    booking-api  DownstreamController.callImmediate
      booking-api  callImmediate
        booking-api  GET                                     45.55ms   ← the hop
          notifier  GET /downstream-immediate                42.99ms   ← other process
            notifier  request handler - /downstream-immediate  42.42ms
              notifier  NotifierController.downstreamImmediate 41.74ms
                notifier  downstreamImmediate                 40.83ms
  booking-api  tcp.connect                                     1.02ms
```

The textbook shape: every child opens and closes strictly inside its parent's window.

The interesting number is the gap. The client span runs 45.55 ms, the server span it caused
runs 42.99 ms — so **~2.5 ms is neither service's own work.** It is DNS, connect and transit,
and it appears in no single service's logs. Recovering time that belongs to the *space between*
services is the thing a trace does that a shared id cannot.

## 2 — Not awaited: `GET /fire-and-forget`

Trace `fce6c47e8e2e88f265b7e22e35d9e1bc` · **50.12 ms** · 2 services · depth 9 · 9 spans

```
booking-api  GET /fire-and-forget                             4.14ms   ← what the client saw
  booking-api  request handler - /fire-and-forget             3.67ms
    booking-api  DownstreamController.fireAndForget           2.66ms
      booking-api  fireAndForget                              1.59ms
        booking-api  GET                                     47.96ms   ← runs on past all of it
          notifier  GET /fire-and-forget                     43.79ms
            notifier  request handler - /fire-and-forget     42.94ms
              notifier  NotifierController.fireAndForget     42.12ms
                notifier  fireAndForget                      41.09ms
```

**The client's request took 4.14 ms. The trace is 50.12 ms.**

Twelve times longer than anything the caller could observe, and in the UI the root span is a
stub at the far left while its own child runs the full width of the timeline. A child bar
extending past the right edge of its parent looks like a rendering fault the first time you
see it. It is not — it is what fire-and-forget means, drawn accurately.

### Why both endpoints exist

They differ in exactly one variable, so the failure behaviour can be compared:

| | awaited | fire-and-forget |
|---|---|---|
| Status, healthy | 200 | **202** |
| Notifier stopped | **503** after 3 s | **202** in 2.6 ms |
| Who learns about a failure | the caller | nobody |

With the notifier stopped, the failure logged **729 ms after the client had already been told
202**. The correlation is perfectly intact and the alerting value is still zero: a log line is
a record, not a signal — nothing counts, so nothing can threshold, and finding it requires
already suspecting it. Detection has to key on the **absence of an expected success**. That is
Day 8's subject, and it now has a working example on this stack.

## 3 — `trace_id` in every log line

The highest-signal item here. One request, six lines, two processes:

```
booking-api  trace_id 0c05f9cf9c…  correlation_id 81d9c1f9…  request received
booking-api  trace_id 0c05f9cf9c…  correlation_id 81d9c1f9…  calling notifier
booking-api  trace_id 0c05f9cf9c…  correlation_id 81d9c1f9…  request completed
notifier     trace_id 0c05f9cf9c…  correlation_id 81d9c1f9…  request received
notifier     trace_id 0c05f9cf9c…  correlation_id 81d9c1f9…  notifier: handling immediate call
notifier     trace_id 0c05f9cf9c…  correlation_id 81d9c1f9…  request completed
```

Find a slow trace in Jaeger, copy its id, and every log line from every service that took part
is one query away.

**Both ids are shared, and they get there by different routes.** `traceparent` is a W3C
standard header injected by the instrumentation — the notifier joined the trace without either
service agreeing on anything locally. `x-correlation-id` is ours and nothing propagates it for
free, so booking-api forwards it explicitly.

Before that forwarding existed, the same request produced one `trace_id` and **two different**
`correlation_id`s. Seeing that divergence in a real trace is what prompted the decision.

### Why keep both, now that `trace_id` crosses for free

- **Sampling.** Under head sampling a log line still carries a `trace_id`, but the trace it
  names was never exported — paste it into Jaeger and get nothing. Logs are not sampled, so
  `correlation_id` has no equivalent failure mode.
- **They cover different ground.** Day 8's cron has a correlation id and `context_type: job`;
  unless it is instrumented it has no span, and therefore no trace id at all.

Only the *sending* half was ever missing. `CORRELATION_ID_HEADERS` has honoured an inbound id
since Day 2, with a comment reading "so an id assigned upstream survives the hop" — the
notifier had been ready for four days.

## Notes on what was tuned, and why

- **38 spans → 9.** One request initially produced 38 spans, 26 of them Express middleware.
  Turning off the express middleware layers removed only half; the survivors carried
  `otel.scope.name: @opentelemetry/instrumentation-router`. Express 5 moved its router into a
  standalone package with its own instrumentation, so every middleware and route handler was
  being recorded **twice** by two instrumentations unaware of each other. Diagnosed by reading
  span tags, not by guessing a second time.
- **`/metrics` excluded from tracing.** Prometheus scrapes every 15 s and the healthcheck hits
  it every 10 s — ~14,000 traces a day against zero users, burying the real ones. Same
  exclusion as Day 3 made for metrics and Day 5 for logs, in a third currency.
- **SDK started from a side-effecting first import.** Instrumentation patches modules as they
  load and imports are hoisted, so `startTracing()` as the first *statement* is already too
  late — it produces an empty Jaeger with no error at all.

## Reproducing

```bash
cd coworking-obs/infra
docker compose up -d --build
curl localhost:3000/downstream-immediate
curl localhost:3000/fire-and-forget
open http://localhost:16686          # service: booking-api

# the failure path both endpoints exist for
docker stop coworking-notifier
curl -i localhost:3000/downstream-immediate   # 503 — the client is told
curl -i localhost:3000/fire-and-forget        # 202 — the client is not
```

## Reasoning

`journal/day-06-distributed-tracing.md`.
