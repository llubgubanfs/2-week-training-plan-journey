# Day 3 — Alerting note

I would alert on the **ratio** of 5xx responses to total requests rather than an absolute count
of errors. An absolute threshold such as `rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1`
is inverted in practice: at 2 req/min it stays silent through a total outage (0.033 errors/sec),
while at 50 rps it fires on a perfectly healthy 1% error rate (0.5 errors/sec) — quiet when the
service is broken, red when it is fine, and muted by the team within a week. The ratio fixes that
but is not itself traffic-independent: with a tiny denominator, one 500 out of two requests reads
as 50%, so the rule also guards the denominator and is only evaluated above 1 req/sec. I would
fire at 5% sustained for 5m. What this still cannot catch is a hang in which nothing completes at
all — both numerator and denominator fall to zero, `errors / total` evaluates to `NaN`, and no
threshold is crossed — so I would pair it with `http_requests_in_flight > 50`, a gauge driven by
request *arrival* rather than completion, which keeps climbing when nothing finishes.

```yaml
- alert: HighErrorRatio
  expr: |
    sum(rate(http_requests_total{status_code=~"5.."}[5m]))
      / sum(rate(http_requests_total[5m]))
      > 0.05
    and
    sum(rate(http_requests_total[5m])) > 1
  for: 5m
  labels: { severity: critical }

- alert: RequestsStuckInFlight
  expr: http_requests_in_flight > 50
  for: 5m
  labels: { severity: critical }
```

Known trade-off: the denominator guard gives up outages below 1 req/sec. Closing that needs an
alert on the *absence of expected success* rather than on the presence of errors — Day 8's work.
