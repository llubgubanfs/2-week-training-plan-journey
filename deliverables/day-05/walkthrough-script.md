# Day 5 — recorded walkthrough script

**Target: 12–14 minutes.** Companion to `demo-run-sheet.md`, which has the reasoning behind
each beat. This file is the running order and the words.

## How to read this file

| Mark | Meaning |
|---|---|
| ✅ | You produced this unaided in a quiz or review. These are **your** answers written down. Read them, paraphrase them, reorder them — they are yours. |
| ⚠️ | **You have never answered this cleanly.** No sentence is supplied on purpose. Facts are given; the phrasing has to be yours or it will not survive a Day 10 follow-up. |
| ▶ | Command to run on camera. |
| 👁 | What to have on screen. |

---

## Pre-flight — before recording starts

```bash
cd ~/Projects/2-week-training-plan-journey/coworking-obs/infra
./scripts/verify.sh                 # must end "all checks passed"
./scripts/traffic.sh status         # expect: wave running
```

If `wave` is not running: `./scripts/traffic.sh wave 7200 &` then **wait 2 minutes** before
opening Grafana. `rate()` needs several scrapes before the lines have shape.

👁 Windows, in this order — nothing else open:

1. Terminal A — `docker compose logs -f booking-api`
2. Terminal B — empty, for commands
3. Grafana — http://localhost:3030
4. Prometheus — http://localhost:9090/targets
5. Jaeger — http://localhost:16686
6. Editor — `infra/` tree open

**Mic check.** Record 10 seconds, play it back, confirm levels move. Do not discover a dead mic
after take 1.

---

## 1 · Open — 45s

👁 Grafana, dashboard already rendering, traffic already moving.

> Hi Harvey — this is the Day 5 integration walkthrough. What you are looking at is the sample
> NestJS service I have been instrumenting through Week 1.
>
> The service itself is deliberately minimal — it is a stand-in. Week 1 was about the
> instrumentation, so that is what this covers. Everything interesting here is wrapped *around*
> the application rather than inside it.
>
> Three things: structured logs with correlation, a live metrics endpoint, and a Grafana
> dashboard rendering it. Then I want to show four failure signals actually firing, and finish
> with what I know is still missing.

**If he asks what the service does, or notices the repo name on screen:** answer plainly — the
directory is named after the Day 1 system design prompt, because the original intent was to
share one project across both tracks. No domain logic was ever built, deliberately: the plan
asks for a sample service to instrument, and application code would have competed with the
observability work rather than supported it. Do not claim a domain that does not exist in the
repository.

Do **not** open on architecture. Open on the moving dashboard.

---

## 2 · The dashboard — 2.5 min

👁 Grafana, `now-30m`, refreshing every 10s.

> This is live. Traffic behind it is a generator producing a wave between roughly 2 and 26
> requests a second, so the shape you see is real load, not a screenshot.

Point at each panel as you name it.

> The signals are the three from Day 3 — request rate, error ratio, latency percentiles — plus
> an in-flight gauge I will come back to, because it behaves differently to how you would
> expect.

👁 The **"Request rate by route"** panel. Its query is
`sum by (route) (rate(http_requests_total[$__rate_interval]))` with legend `{{route}}`, so it
draws **one line per route — four of them**: `/`, `unmatched`, `/debug/fail`, `/debug/slow`.
The two debug lines sit flat at zero until §5 touches them.

**✅ Cardinality — your strongest 30 seconds. You produced this unaided on Day 3.**

> This panel breaks the rate down by route, one line each. Three of these are routes I actually
> wrote — the main endpoint, and two debug endpoints I will use in a minute, which is why those
> two are sitting flat at zero right now.
>
> The fourth is called `unmatched`, and that one is the decision I want to show.
>
> Every distinct label value creates a separate time series that Prometheus has to store, index
> and update. If I labelled these with the raw request URL, then every bot probe, every unique
> query string, every scan for `/wp-admin` would mint a brand-new series that lives forever. The
> cardinality becomes a function of how much traffic the internet sends me — a number I do not
> control.
>
> Instead, anything that does not match a route I registered collapses into that single
> `unmatched` line. There is probe traffic running right now inventing a brand-new URL on every
> request, and all of it lands in that one line.

▶ Terminal B — show it rather than assert it:

```bash
curl -sG localhost:9090/api/v1/query \
  --data-urlencode 'query=count(http_requests_total)' | python3 -m json.tool | grep -A2 value
```

⚠️ **The panel shows 4 lines; this query returns 5.** They are counting different things, and
that *is* the answer — do not treat it as a discrepancy to explain away:

| | |
|---|---|
| `count(http_requests_total)` → **5** | raw series, `status_code` intact |
| `sum by (route) (...)` → **4 lines** | summing *by route* discards `status_code` |

`/debug/fail` is stored as two series (200 and 500) and drawn as one line. Verified live:

```
/              200          →  /
unmatched      404          →  unmatched
/debug/fail    200 and 500  →  /debug/fail   (one line)
/debug/slow    499          →  /debug/slow
```

Say it in the same breath:

> Five series stored. The panel draws four lines because it sums by route, which folds the status
> codes together — one of those routes emits both a 200 and a 500. Either way, that number is
> bounded by the routes I wrote, not by the URLs anyone sends me.

**Know the five, because "why five?" is the obvious follow-up:**

| route | status | what it is |
|---|---|---|
| `/` | 200 | the real endpoint |
| `unmatched` | 404 | every probe, collapsed to one |
| `/debug/fail` | 200 | failure endpoint succeeding |
| `/debug/fail` | 500 | failure endpoint failing |
| `/debug/slow` | 499 | abandoned mid-request |

> It is bounded by routes times the status codes I can actually emit — a number I can work out
> by reading my own code. Not by URLs, which is a number the internet picks for me.

---

## 3 · The logs — 2 min

👁 Terminal A, `docker compose logs -f booking-api`.

> Every line is a single JSON object. Structured, not formatted strings.

Point at the fields as you say them: `correlation_id`, `service`, `context_type`, `duration_ms`,
`status_code`.

> Each request produces a pair — received and completed — sharing one `correlation_id`, so you
> can pull a single request out of interleaved output.

**✅ The plan deviation. Say it as a decision, not an oversight — it is one.**

> The plan said `request_id`. I used `correlation_id` on purpose. Day 8 adds a cron job, which
> has no HTTP request behind it but still needs correlating through the same logger — a
> `request_id` field on a job would be a lie. `context_type` distinguishes the source: http, job,
> or system. That is also why correlation runs through `AsyncLocalStorage` rather than a
> request-scoped provider — ALS covers both uniformly.

**✅ Now volunteer the bug. Highest-credibility move in the recording.**

> The dashboard found a bug in my own logging within an hour of existing.
>
> Prometheus scrapes every 15 seconds and the container healthcheck hits the same endpoint every
> 10. The metrics middleware already excluded `/metrics` — but the logging middleware did not. So
> every scrape and every healthcheck wrote two log lines. With zero users, this service was
> producing about 28,800 log lines a day, all of it noise about being watched.
>
> I fixed it today. Both middlewares now share the exclusion.

Then the part that shows judgment:

> The thing I had to think about was *where* to exclude it. The obvious move was to put the
> exclusion on the middleware chain that also mounts the context — but that would have stripped
> the correlation context from `/metrics` too, so if the metrics controller ever logged an error
> it would come out with no id, and from Day 6 no trace id either. So the context still runs on
> every route; only the request-pair logging is silenced.
>
> Nothing is lost by going quiet there. If scrapes start failing, Prometheus already knows — it
> has `up` and `scrape_duration_seconds` on its own side, which is where I would look anyway.

---

## 4 · Where the numbers come from — 2 min

👁 Prometheus http://localhost:9090/targets — two targets, both UP.

**✅ Weak-spot #2 from your Day 1 baseline. Closed. Say it plainly.**

> Prometheus pulls. The application exposes current values at `/metrics` and never pushes
> anything anywhere — it does not know Prometheus exists. Prometheus does the scraping on its own
> schedule, every 15 seconds.

**✅ The addressing question — you answered this today.**

> One detail worth pointing at: the app target is `booking-api:3000`, a service name resolved by
> Docker's internal DNS on the shared network. The self-scrape is `localhost:9090`, because
> Prometheus is already inside its own container.
>
> Those are not interchangeable, and it is asymmetric. If I pointed the app job at
> `localhost:3000`, that is Prometheus's own loopback — nothing is listening there and the target
> goes down. It does *not* fall through to the published port on the host; publishing is a rule
> in the host's network namespace, and the container has its own. The other direction is fine —
> `prometheus:9090` resolves and works — so only one of the two swaps actually breaks.

👁 Switch to http://localhost:9090/rules — three rules, loaded, healthy.

> Three rules, evaluating. The error rule alerts on a **ratio**, not an absolute count, because
> an absolute threshold means something different at 10 requests a second than at 1,000 — you end
> up retuning it every time traffic changes.
>
> The second rule exists because the ratio has a blind spot, and I will show that in a moment.

If you want to give the detection window: **6–10 minutes depending on severity.** Do not say
"instantly."

---

## 5 · The failure demo — 4 min ⭐

The strongest section. Everything here was measured, none of it is theoretical.

### a · Move the in-flight gauge

▶ Terminal B:

```bash
./scripts/traffic.sh slow 120 &
```

👁 Watch the gauge go 0 → ~25 and the latency percentiles jump to the top bucket.

**✅ Day 4's investigation. Two unprompted passes — this is fully yours.**

> This gauge counts requests held *inside* the handler. It is not a load gauge, and I learned
> that the hard way — I spent an afternoon convinced it was broken because ordinary traffic never
> moved it. I measured 401 established connections and it still read zero.
>
> It was correct the whole time. The handler returns in about a fifth of a millisecond, so by
> Little's Law the occupancy of that span is under one even at several thousand requests a
> second. The requests were queued in the kernel and in libuv — upstream of the part I
> instrumented.
>
> It moves when something inside the handler stops coming back. Which is exactly why it is the
> signal that survives a hang: it is driven by **arrival**, and during a hang arrival is the half
> that still happens. Counters are driven by completion, and during a hang nothing completes — so
> the error ratio has zero over zero and crosses no threshold at all.

### b · Fire the 499 path

▶ Terminal B:

```bash
curl --max-time 1 'localhost:3000/debug/slow?ms=8000'
```

👁 Terminal A — find the line with `status_code: 499`.

**✅ You produced the two-lines answer unaided on Day 3.**

> A client that gives up mid-request. This branch was written on Day 3 and had never once
> executed, because every real request finished in about two milliseconds and there was nothing
> slow enough to abandon.
>
> It matters more than it looks. Node initialises `res.statusCode` to 200, so if I just read that
> field, an abandoned request would be counted as a **success** — which is worse than not counting
> it at all. And the original code listened for `finish`, which only fires on a response that
> actually flushed. A client that disconnects never satisfies it, so the completion line silently
> vanished on exactly the requests worth investigating. It listens for `close` now and reads
> `writableFinished` to tell a real status from an abandoned one.

### c · Drive the error ratio into an alert

▶ Terminal B:

```bash
./scripts/traffic.sh errors 0.6 120 &
```

👁 Error ratio panel climbs to ~36%. Then Prometheus `/rules` — `HighErrorRatio` → **pending**.

> Pending, not firing — because the rule has a `for: 5m` clause. The condition has to hold for
> five minutes before it becomes a real alert.
>
> That clause buys me not being paged for a thirty-second blip. It costs me five minutes of
> detection time. That is a deliberate trade and the right one for this service; for something
> user-facing and critical you would tighten it and accept the noise.

▶ **Stop everything before moving on:**

```bash
./scripts/traffic.sh stop && ./scripts/traffic.sh wave 3600 &
```

> Worth saying: `stop` there kills every generator. It did not this morning — it only killed the
> most recently started one and orphaned the rest, which would have left this dashboard pinned
> red while I told you I had stopped it. I found it and fixed it today.

Let the dashboard recover for ~30s before section 6 so you do not narrate over a red screen.

---

## 6 · How it's built — 2 min

👁 Editor: `docker-compose.yml`, then `grafana/provisioning/`.

**✅ You closed this one today, unprompted.**

> Four services: the app, Prometheus, Grafana, Jaeger. Every port is environment-overridable —
> nothing hardcoded, so this is deploy-ready even though I have not deployed it.
>
> The dashboard is a JSON file in git, provisioned at boot. I never built it by clicking. That
> distinction matters more than it sounds: a dashboard built in the UI lives in Grafana's sqlite
> and dies with that volume. A provisioned one is a file, so it is reviewable in a pull request
> and it rebuilds on every boot.
>
> There are two volumes and they behave differently. Prometheus's holds the TSDB — that is where
> the metric history physically lives. Grafana stores no time series at all; it queries Prometheus
> at render time. So if I destroyed both volumes right now and brought the stack back up, the
> dashboard would return exactly as you see it, with empty charts. Layout survives, data does not.

**✅ The SELinux finding — today's, and the best answer you have to a Day 8 question.**

> That property got tested for real this morning, because Day 5 is on a new machine. Fedora runs
> SELinux enforcing, and every bind-mounted config file was labelled wrong for a container to
> read. Both Prometheus and Grafana failed — but they failed completely differently.
>
> Prometheus failed loudly: it could not read its config, exited, and crash-looped with an error
> every 400 milliseconds. Impossible to miss.
>
> Grafana started, reported healthy, and provisioned **nothing**. No datasource, no dashboard, no
> error line anywhere in its logs. `docker compose ps` showed it up and healthy. It was up and
> useless.
>
> The only thing that caught it was my verification script — because it does not ask "is the
> container running", it asks "does Grafana have one provisioned datasource and one dashboard".
> It asserts on the expected success rather than on the absence of an error. Which is the whole
> lesson of Day 8, and I got to learn it a week early on my own stack.

---

## 7 · Jaeger and what's next — 1 min

👁 http://localhost:16686

> Jaeger is running and reachable. It is empty apart from its own self-instrumentation, and that
> is the expected state, not a fault — it is running a day early on purpose so Day 6 has an export
> target ready.
>
> Day 6 instruments the service and a downstream call, and puts `trace_id` and `span_id` into
> every log line — so a log line and a trace point at each other. Day 8 is the cron job that fails
> silently.

---

## 8 · Close — name your own gaps — 1 min

**Do not skip this. In a recording it is the only way these get framed by you.**

> Before I finish, what is deliberately not there yet.
>
> No Alertmanager. The rules evaluate and reach firing, but they notify nobody — right now
> "alerting" means a state in a web UI. Day 8 decides whether that is worth wiring.
>
> Related, and it is the sharper version: this stack cannot detect its own failure. If the
> Prometheus container died overnight, `up` would not go to zero — the series would just stop
> existing, nothing would evaluate the rules, and the dashboard would flatline in a way that looks
> identical to a quiet night. The fix is a deadman's switch: an alert that fires permanently and
> routes to something outside the stack, where the *silence* is the signal. That has to terminate
> somewhere I do not run, because Alertmanager would die with everything else.
>
> No graceful shutdown at the app level yet. No `/health` endpoint — the container healthcheck
> currently hits `/metrics`, which renders the whole registry every ten seconds. There is an
> event-loop lag metric being collected that is not on the dashboard, and it is the signal that
> registered load when the in-flight gauge could not.
>
> And no PII or secret redaction in the logger. Structured logging makes it easy to log an entire
> request object, and that is exactly how credentials end up in log storage. It is a known hole.
>
> No database and no application logic behind it — deliberate, not slippage. The plan asks for a
> sample service to instrument; building a domain on top would have competed with the
> observability work for the same hours without adding anything the assessment measures.
>
> That's the walkthrough. Happy to go deeper on any of it.

---

## ⚠️ If Harvey asks — the two you must answer in your own words

No sentences supplied. If you read mine you will not survive the follow-up.

### ⚠️ "Why Winston over pino?"

*"The plan said so"* is the weak answer, and it is the one you would give today. Facts:

- pino is faster — it does less work per line and serialises JSON more efficiently.
- `nestjs-pino` has tighter request-context integration out of the box.
- Winston has a broader transport ecosystem and more flexible formatters.
- The formatter is where `trace_id` lands on Day 6 — about ten lines.
- Your log volume, post-fix, is low enough that the throughput difference is not the deciding
  factor for *this* service. It would be at high volume.

Build a sentence that says what you chose, what it cost, and when you would pick differently.

### ⚠️ "Why does a metric exist when the log already has status and duration?"

**Missed twice — Day 3 and again in review.** You called `/metrics` "an aggregator for those
log lines." It is not. It reads nothing from the log stream; it is a completely separate
in-process counter path. Facts:

- **Write-time vs query-time aggregation.** A histogram pre-aggregates into fixed buckets as
  requests happen. A log-derived percentile is computed at query time by reading every line.
- Histogram cost is **flat in requests per second** — same handful of numbers at 10 req/s or
  10,000. Log-derived cost scales with traffic.
- At volume, log percentiles are computed from **sampled** data, so they are estimates from a
  subset. The histogram saw every request.
- A rule can evaluate a metric every 15 seconds. Nobody runs a log aggregation query every 15
  seconds across all traffic.
- Retention: metrics are cheap to keep for months; equivalent log retention is not.

Say it in one sentence with the words **write-time** and **query-time** in it.
