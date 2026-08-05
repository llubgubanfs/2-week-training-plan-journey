# Day 6 — Distributed Tracing

**Objective:** instrument the sample service plus one downstream call with OpenTelemetry and
export the trace to the Jaeger running since Day 4.

**Deliverable the plan asks for:** a screenshot of a trace in the Jaeger UI spanning both the
sample service and the downstream call.

---

## Evidence

| File | What it proves |
|---|---|
| `jaeger-trace.png` | The asked-for artifact: one trace, two services, in the UI |
| `trace-export.json` | The same trace as data — greppable and diffable, following the Day 3 precedent of committing the scrape text rather than only a picture |
| `correlated-log-with-trace.jsonl` | Log lines from **both** services carrying the same `trace_id` as that trace |

## The trace

`c6532bb5d91b2029270932705e10a940` — `GET /downstream-immediate`, 10 spans across two services:

```
+  0.0ms  booking-api  GET /downstream-immediate                 74.9ms
+  3.0ms  booking-api  request handler - /downstream-immediate   73.5ms
+  3.0ms  booking-api  DownstreamController.callImmediate        71.6ms
+  3.0ms  booking-api  callImmediate                             70.6ms
+ 13.0ms  booking-api  GET                                       57.3ms   ← the hop
+ 14.0ms  booking-api  tcp.connect                                1.2ms
+ 22.0ms  notifier     GET /downstream-immediate                 45.2ms   ← other process
+ 24.0ms  notifier     request handler - /downstream-immediate   43.7ms
+ 25.0ms  notifier     NotifierController.downstreamImmediate    42.3ms
+ 25.0ms  notifier     downstreamImmediate                       41.1ms
```

The 12 ms between the client span opening (`+13`) and the server span opening (`+22`) is DNS,
connect and transit — time that exists in no single service's own logs. Recovering it is
the thing a trace does that a correlation id cannot.

## Two calling conventions, deliberately

`booking-api` calls the notifier two ways, differing in exactly one variable — whether the
outbound call is awaited.

| | awaited | fire-and-forget |
|---|---|---|
| Endpoint | `GET /downstream-immediate` | `GET /fire-and-forget` |
| Status | 200 | **202** |
| Notifier stopped | **503** after 3 s | **202** in 2.6 ms |
| Waterfall | child nested inside parent | **child outlives parent** |

The fire-and-forget trace, measured:

```
booking-api  GET /fire-and-forget     4.1ms      ← parent ends here
booking-api  GET  (outbound)         48.0ms      ← child runs on to +50ms
```

A child span extending past the right edge of its parent looks like a rendering fault the
first time you see it. It is not — it is what fire-and-forget means, drawn accurately.

With the notifier stopped, the failure logged **729 ms after the client had already been told
202**. The correlation is perfectly intact and the alert value is still zero: nothing counts,
so nothing can be alerted on. That is Day 8's subject, arriving with a working example.

## `trace_id` in every log line

The highest-signal item here. Six lines for the trace above, across two processes:

```
booking-api  trace_id c6532bb5d91b2029…  correlation_id 90e8f9de…  request received
booking-api  trace_id c6532bb5d91b2029…  correlation_id 90e8f9de…  calling notifier
booking-api  trace_id c6532bb5d91b2029…  correlation_id 90e8f9de…  request completed
notifier     trace_id c6532bb5d91b2029…  correlation_id 37d11fa0…  request received
notifier     trace_id c6532bb5d91b2029…  correlation_id 37d11fa0…  notifier: handling…
notifier     trace_id c6532bb5d91b2029…  correlation_id 37d11fa0…  request completed
```

**Same `trace_id` on both sides. Two different `correlation_id`s.**

That difference is what `traceparent` buys. It is a W3C standard header, injected by the
instrumentation on every outbound request and read on every inbound one, so the notifier
joined the trace without either service agreeing on anything locally. `x-correlation-id` is
ours — nothing propagates it for free.

### The decision that came out of seeing that

**Forward `x-correlation-id`, and keep it alongside `trace_id`.** Measured after the change,
same request, both services:

```
booking-api  trace_id 9ece2d5f151525…  correlation_id 1d970d79…  request received
booking-api  trace_id 9ece2d5f151525…  correlation_id 1d970d79…  calling notifier
booking-api  trace_id 9ece2d5f151525…  correlation_id 1d970d79…  request completed
booking-api  trace_id 9ece2d5f151525…  correlation_id 1d970d79…  notifier accepted…
notifier     trace_id 9ece2d5f151525…  correlation_id 1d970d79…  request received
notifier     trace_id 9ece2d5f151525…  correlation_id 1d970d79…  notifier: handling…
notifier     trace_id 9ece2d5f151525…  correlation_id 1d970d79…  request completed
```

Only the *sending* half was ever missing. `CORRELATION_ID_HEADERS` has honoured an inbound
id since Day 2, with a comment saying "so an id assigned upstream survives the hop" — the
notifier had been ready for four days.

Why keep both rather than drop one now that `trace_id` crosses the boundary for free:

- **Sampling.** Under head sampling a log line still carries a `trace_id`, but the trace it
  names was never exported — paste it into Jaeger and get nothing. Logs are not sampled, so
  `correlation_id` has no equivalent failure mode.
- **They cover different ground.** Day 8's cron has a correlation id and a
  `context_type: job`; unless it is instrumented it has no span, and therefore no trace id.

Note the fourth line above: `notifier accepted fire-and-forget` is logged *after* the
response has gone out, and still carries the id. The headers are read at call time from
`ClsService`, which reads AsyncLocalStorage per call — the same mechanism, and the same Day 2
decision, still paying out.

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
