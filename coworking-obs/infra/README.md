# Running the observability stack

Prometheus + Grafana + Jaeger + booking-api, in four containers. Everything here is
reproducible from this repository — no click-configuration, no manual setup steps.

## On a machine that has never seen this repo

**Prerequisites:** Docker Engine 24+ with the Compose v2 plugin (`docker compose`, not
`docker-compose`), git, and about 2 GB of free disk. Nothing else — no Node, no pnpm. The
booking-api image is built inside Docker, so the host needs no toolchain.

```bash
git clone git@github.com:llubgubanfs/2-week-training-plan-journey.git
cd 2-week-training-plan-journey/coworking-obs/infra
docker compose up -d --build
```

First run takes 2–4 minutes: it installs dependencies and compiles the Nest app inside the
image. Later runs start in seconds.

Then prove it works, rather than assuming it:

```bash
./scripts/verify.sh
```

18 checks. It does not merely confirm four containers are running — it reads `/metrics`,
confirms both scrape targets are UP, confirms the three alert rules loaded healthy, and
sends a real PromQL query through Grafana's proxy to Prometheus and back. Exit code is the
number of failures, so it also works unattended.

## Where things are

| Service | URL | Notes |
|---|---|---|
| booking-api | http://localhost:3000 | `/metrics` is the scrape target |
| Prometheus | http://localhost:9090 | `/targets`, `/rules`, `/graph` |
| Grafana | http://localhost:3030 | no login needed — anonymous Viewer is enabled |
| Jaeger | http://localhost:16686 | empty until Day 6; that is correct, not broken |

**Grafana is on 3030, not 3000.** Its container listens on 3000 internally, which booking-api
already publishes on the host.

Grafana admin is `admin` / `admin` by default. Both are environment-overridable — see below.

## Making the dashboards move

A dashboard with no traffic is four flat lines. `scripts/traffic.sh` fixes that using nothing
but `curl`.

```bash
./scripts/traffic.sh                # mixed — wave-shaped load, probes, occasional spikes
./scripts/traffic.sh wave 600       # undulating 2–26 req/s for 10 minutes
./scripts/traffic.sh burst          # quiet → spike → quiet, repeating. Best for a live demo
./scripts/traffic.sh probe          # only bot-probe URLs — the cardinality demonstration
./scripts/traffic.sh concurrent     # max throughput; moves event-loop lag, NOT the in-flight gauge
./scripts/traffic.sh steady 300     # flat ~10 req/s baseline

./scripts/traffic.sh slow           # holds ~25 requests open — the ONLY mode that moves the in-flight gauge
./scripts/traffic.sh abandon        # clients that give up mid-request — produces status_code=499
./scripts/traffic.sh errors 0.6     # 5xx at the given rate — drives the error ratio and HighErrorRatio

./scripts/traffic.sh wave 900 &     # background it and keep working
./scripts/traffic.sh stop           # stop a backgrounded run
```

`probe` mode is worth understanding rather than just running. It sends `/wp-admin`, `/.env`,
and `/nope?id=<unique>` — that last one a brand-new URL on every request. Run it for a while,
then check:

```bash
curl -sG localhost:9090/api/v1/query --data-urlencode 'query=count(http_requests_total)'
```

The count barely moves. Labelled with `req.originalUrl` instead of the route template, that
one probe would mint a new time series every second, for as long as the service ran.

## Overriding anything

Every port and credential reads from the environment. Create `infra/.env` — Compose picks it
up automatically — or export the variables:

```bash
BOOKING_API_PORT=3100      # if 3000 is taken
PROMETHEUS_PORT=9091
GRAFANA_PORT=3031
JAEGER_UI_PORT=16687
GRAFANA_ADMIN_USER=leander
GRAFANA_ADMIN_PASSWORD=something-not-admin
LOG_LEVEL=debug
```

These change only the **host-side** ports. Container-to-container addresses
(`booking-api:3000`, `prometheus:9090`) are fixed and must not be touched — they are how the
services find each other on the compose network.

## Stopping it, and what each option destroys

```bash
docker compose stop        # pause. Nothing is lost.
docker compose down        # remove containers. Named volumes survive; all data intact.
docker compose down -v     # ALSO delete the volumes.
```

That last one is worth being deliberate about, because the two volumes fail differently:

- **`prometheus-data`** holds the TSDB — every sample ever scraped. Delete it and your
  dashboard renders correctly with an empty chart. The history is gone and nothing brings
  it back.
- **`grafana-data`** holds Grafana's sqlite. Delete it and **nothing of consequence is lost**:
  the datasource and dashboard are provisioned from files in this repo and are rebuilt on the
  next boot.

That asymmetry is the reason for provisioning-as-code. A dashboard built by clicking lives
only in that second volume.

## When something is wrong

**A port is already in use.** `docker compose up` fails with `address already in use`. Find
the offender and either stop it or override the port:
```bash
ss -ltnp | grep -E ':(3000|3030|9090|16686)\b'
```
Note 5432 is commonly occupied by an unrelated Postgres; this stack does not use it yet.

## Making the signals fail on demand

`/debug/slow` and `/debug/fail` exist so the three signals that only ever show a healthy
service can be exercised. They are **registered unconditionally** — Leander's call, Day 4,
taken after the trade-off was laid out. The blast radius is bounded instead of gated: the
delay is clamped to 10s and there is deliberately no endpoint that hangs forever.

```bash
curl 'localhost:3000/debug/slow?ms=5000'          # held open for 5s
curl 'localhost:3000/debug/slow?ms=99999'         # clamped → sleptMs 10000
curl --max-time 1 'localhost:3000/debug/slow?ms=8000'   # abandoned → status_code=499
curl 'localhost:3000/debug/fail'                  # 500
curl 'localhost:3000/debug/fail?rate=0.1'         # 500 one time in ten
```

Measured when these landed: 30 concurrent slow requests took `http_requests_in_flight` from
**0 → 30**, and `errors 0.6` produced a 36% error ratio that put `HighErrorRatio` into
`pending` within a minute.

**`http_requests_in_flight` stays at 0 under ordinary load.** Correct, and
measured: the gauge spans Express middleware entry to `res` `'close'`, which for a handler
that synchronously returns a string is about **0.19 ms**. Little's Law puts the occupancy of
that span at `throughput × duration` — under 1 even at ~4,900 req/s. Requests queue in the
kernel accept queue and libuv, *upstream* of the instrumented region, so socket concurrency
never becomes middleware concurrency; 401 established TCP connections still read 0.

The gauge climbs when requests are held **inside** the span — an awaited database call, a
hanging downstream service. That is the Day 8 failure mode and it works; it simply cannot be
demonstrated against a static string. For upstream saturation the right signal already exists
in the default metrics: `nodejs_eventloop_lag_p99_seconds`, sub-millisecond at idle and ~10 ms
under `traffic.sh concurrent`.

**Grafana panels say "No data".** Almost always means no traffic, not a broken stack. Run
`./scripts/traffic.sh` and wait ~30 seconds — `rate()` needs at least two scrapes inside its
window before it can return anything.

**The error-ratio panel says "No data" even with traffic.** Correct behaviour. With no 5xx
the numerator vector is empty; `or vector(0)` turns that into 0.00% only when there is a
denominator. With no traffic at all, 0/0 is NaN and Prometheus returns nothing. That is
exactly why the alert rule carries a denominator guard.

**A target is DOWN on `/targets`.** Check the app is actually up (`docker compose logs
booking-api`). Remember Prometheus reaches it at `booking-api:3000`, over the compose
network — not via the published host port.

**Jaeger's UI shows only `jaeger-all-in-one`.** That is Jaeger's own self-instrumentation.
Your app appears there on Day 6, once it exports spans.

**Changes to a dashboard won't save in the UI.** Deliberate — `allowUiUpdates: false`. Iterate
in the UI, then **Dashboard settings → JSON Model**, copy it into
`grafana/dashboards/booking-api.json`, and commit. The provider rescans every 15 seconds, so
the change appears without restarting anything.

**Reload Prometheus config or rules without a restart:**
```bash
curl -XPOST localhost:9090/-/reload
```

## What is deliberately not here

Postgres and the booking domain (they land with the entities) · Alertmanager, so rules
evaluate and reach `firing` but notify nobody · the notifier as a scrape target, because it
exposes no metrics yet and a permanently-DOWN target teaches you to ignore red · container
resource limits.
