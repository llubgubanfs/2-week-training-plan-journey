# Day 4 — Infrastructure: Prometheus + Grafana + Jaeger

The Day 3 `/metrics` endpoint now has something scraping it and something rendering it.
This stack is not a throwaway: Day 6 exports traces into this Jaeger, Day 8 alerts off this
Prometheus, and the Day 10 walkthrough is recorded against this Grafana.

## Run it

```bash
cd coworking-obs/infra
docker compose up -d --build
```

| Service | URL | What to look for |
|---|---|---|
| booking-api | http://localhost:3000 | `/metrics` is the scrape target |
| Prometheus | http://localhost:9090/targets | 2 targets, both **UP** |
| Grafana | http://localhost:3030 | dashboard loads with no login |
| Jaeger | http://localhost:16686 | UI reachable, **zero traces — expected until Day 6** |

Grafana publishes on **3030**, not 3000. Its container listens on 3000 internally, which
booking-api already publishes on the host.

## Evidence

| File | Shows |
|---|---|
| `grafana-dashboard.jpg` | All 8 panels rendering live data |
| `prometheus-targets.jpg` | Both scrape targets UP |
| `jaeger-ui.jpg` | Jaeger UI reachable ahead of Day 6 |
| `stack-verification.txt` | Targets, loaded alert rules, and the cardinality check as text — greppable, unlike a screenshot |
| `grafana-datasource.json` | The datasource Grafana built from the provisioning file |
| `jaeger-services.json` | `{"data":null,...}` — proof the API answers and that nothing has reported spans yet |

## Decisions worth defending

**Grafana is provisioned as code, never click-configured.** The datasource lives in
`infra/grafana/provisioning/datasources/`, the dashboard in `infra/grafana/dashboards/`.
Both are read at boot, so they survive `docker compose down -v` and exist on a fresh clone.
A dashboard built by clicking lives in Grafana's sqlite and dies with that volume — it can't
be diffed and it can't be reviewed. `allowUiUpdates: false` makes the file the source of
truth; Save is disabled in the UI on purpose.

This was verified rather than assumed: the dashboard JSON was edited on disk mid-session and
Grafana picked the change up within the provider's 15s rescan, with no container restart.

**Two volumes, two different failure modes.** `prometheus-data` holds the TSDB — the actual
metric history. `grafana-data` holds Grafana's sqlite. Delete the first and the dashboard
renders empty; delete the second and a provisioned dashboard simply rebuilds. Grafana stores
no time-series data at all; it issues a PromQL query at render time and forgets the answer.

**The notifier is deliberately not a scrape target.** It runs no metrics middleware yet, so a
target for it would sit permanently DOWN and train us to ignore a red row on `/targets`. It
gets added on Day 6 when it has something to expose.

**Postgres is not in this stack.** No domain code exists to use it yet, and host port 5432 is
already occupied by an unrelated container. It lands with the entities, in the PR that needs it.

**Jaeger's all-in-one image stores spans in memory.** Restart it and every trace is gone. Fine
for a demo, and worth knowing on Day 6 before losing a trace to a container restart.

## The cardinality guard, proven against live traffic

Traffic was generated including three probe paths — `/wp-admin`, `/.env`, and
`/nope?id=<changing unix timestamp>`, that last one minting a brand-new URL every second.

```
route="/"           status=200   3177
route="unmatched"   status=404   1191
distinct http_requests_total series: 2
```

**Two series.** Labelled with `req.originalUrl` instead of the route template, the `/nope?id=…`
probe alone would have created one new time series per second, forever. This is the Day 3
decision working in a running system rather than in a paragraph.

## Alert rules are loaded, not just written

The two rules from the Day 3 note are now evaluated every 15s by a running Prometheus —
see `/rules`. A third was added: `TargetDown`. Without it, a scrape target disappearing makes
every other rule go quiet for the best possible reason and the worst possible cause.

All three read `state=inactive`, which is correct: the service is healthy.

## Known gaps

- **No Alertmanager.** Rules evaluate and would move to `firing`, but nothing routes a
  notification anywhere. Day 8 decides whether that's worth adding.
- **Nothing produces 5xx**, so the error-ratio panel is exercised only at 0%. The `or vector(0)`
  in the expression distinguishes "traffic, no errors" (0.00%) from "no traffic at all"
  (No data — 0/0 is NaN). The threshold path is unverified against real errors.
- **The `499` branch is still never fired.** Every request completes in ~10ms, so
  `res.writableFinished` has always been true. Still needs a slow endpoint to abandon.
- **Detection latency is unmeasured.** The rules carry `for: 5m` against a `[5m]` window,
  which leaves roughly a 30-second transient budget — see `journal/study-aids.md`.
