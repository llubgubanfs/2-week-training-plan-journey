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

That difference is not a bug and it is the clearest statement of what changed today.
`traceparent` is a W3C standard header injected by the instrumentation on every outbound
request and read on every inbound one, so the notifier joined the trace without either
service agreeing on anything locally. `x-correlation-id` is ours, nothing propagates it for
free, and it is deliberately not forwarded — so each service minted its own.

Which of those two is the right thing to propagate is recorded as a `TODO(day-06)` in
`downstream.service.ts` rather than silently decided.

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
