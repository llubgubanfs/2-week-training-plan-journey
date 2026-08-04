# Day 5 — Integration demo run sheet

**Tue 4 Aug · ~15 minutes · Harvey Martus**

> ## 📹 Format: recorded walkthrough — Harvey's call, confirmed Day 5
>
> Not a live session. No length specified. Narrated with a mic. **Due today.**
>
> **What gets easier.** The recording *is* the deliverable, so the definition of done is
> satisfied by the file itself — no separate artifact needed. No calendar dependency. And a
> mistake costs a retake rather than the demo.
>
> **What gets harder, and it is not obvious.** Harvey cannot interrupt. Every question he would
> have asked mid-flow, he now answers privately, from whatever you did or did not say. So
> anything left implicit is decided without you in the room. Section 7 — naming your own gaps —
> stops being a nice touch and becomes the only way those gaps get framed by you rather than by
> him. The ⚠️ rows in *Questions to expect* are no longer questions to prepare for; they are
> **statements to make unprompted**.
>
> You also have to supply your own open and close. Nobody prompts you to start, and nothing
> tells you when you are done.
>
> ### Two takes. The first one is not for Harvey.
>
> A recording lets you retake until it is clean. **Days 9 and 10 do not.** Those are live, with
> no agent present, and your three live-skill gaps — losing the prompt under load (#9), not
> registering a correction (#10), committing to a confident wrong cause (#16) — only surface
> under pressure. A polished fourth take rehearses reading, not thinking.
>
> So: **take 1 is a single unbroken run, unrehearsed, never submitted.** If something breaks,
> debug it out loud on camera. Then watch it back — seeing yourself is better feedback than
> anyone's notes. **Take 2 is the one you send.**

The plan's ask: *"your sample service should have structured logs, a live `/metrics` endpoint,
and a Grafana dashboard rendering it. Present it live to your EM."*

This sheet is a **sequence and a set of prompts, not a script**. The explanations have to be
yours — Days 9 and 10 are graded with no agent in the room, and reading someone else's
sentences out loud builds nothing. Where it says **SAY**, that is the point to land, phrased
however you phrase it.

---

## T-30 minutes — set up

```bash
cd coworking-obs/infra
docker compose up -d
./scripts/verify.sh                 # must exit 0
./scripts/traffic.sh wave 3600 &    # leave running for the whole session
```

Wait **2 minutes** before opening Grafana. `rate()` over a window needs several scrapes
before the lines have shape; a dashboard opened 10 seconds after boot looks broken.

Windows to have open, in this order:

1. Terminal — logs: `docker compose logs -f booking-api`
2. Browser tab — Grafana http://localhost:3030
3. Browser tab — Prometheus http://localhost:9090/targets
4. Browser tab — Jaeger http://localhost:16686
5. Editor — `infra/` tree, `docker-compose.yml` open

Close everything else. Screen-record from the start — see *Evidence* at the bottom.

---

## The flow

### 1 · Frame it — 1 min

**SAY:** what the service is, and that this week was about the instrumentation wrapped around
it rather than the service itself. Name the three things you'll show: logs, metrics, dashboard.

Do **not** open with the architecture. Open with the dashboard already rendering — the payoff
first, the plumbing after.

### 2 · The dashboard — 3 min

Grafana, already loaded, traffic already flowing.

- Point at **Request rate by route** — it's moving because there's real traffic behind it.
- **SAY:** the three signals here are the three from Day 3 — count, error ratio, latency —
  plus the in-flight gauge.
- Point at the two series: `/` and `unmatched`.

**The strongest 30 seconds you have.** Explain why `unmatched` is one line and not thousands.
You've earned this one — you produced the answer unaided on Day 3.

> **SAY:** every distinct label value is a separate time series Prometheus stores, indexes and
> updates. Raw URLs make cardinality a function of traffic; route templates bound it by the
> number of routes you wrote.

Then show it rather than assert it:

```bash
curl -sG localhost:9090/api/v1/query --data-urlencode 'query=count(http_requests_total)'
```

**SAY:** the probe traffic includes a URL with a changing query string on every single
request. That count does not move.

⚠️ **The number is 5, not 3.** It was 3 when this sheet was written; Day 5's testing exercised
the debug endpoints and added two more. Know what the five are, because "why five?" is the
obvious follow-up:

| route | status | what it is |
|---|---|---|
| `/` | 200 | the real endpoint |
| `unmatched` | 404 | every bot probe, collapsed into one series |
| `/debug/fail` | 200 | the failure endpoint succeeding |
| `/debug/fail` | 500 | the failure endpoint failing |
| `/debug/slow` | 499 | abandoned mid-request — the Day 3 branch, now firing |

This is a **better** demo than 3, and it sharpens the point rather than weakening it. Series
count is bounded by *routes × status codes you can actually emit* — a number you can write down
by reading the code. It is not bounded by URLs, which is a number the internet chooses for you.
Five now, five after ten thousand distinct probe URLs. Say that, then run `probe` and show the
count sitting still while requests pour in.

### 3 · The logs — 2 min

Switch to the tailing terminal.

- One JSON object per line. Point at `correlation_id`, `service`, `context_type`, `duration_ms`.
- **SAY:** why `correlation_id` and not `request_id` — Day 8's cron has no HTTP request behind
  it but still needs correlating through the same logger, and `context_type` distinguishes the
  source. *(This is a plan deviation. Say it as a decision, not an oversight.)*

**Then volunteer the problem.** This is the highest-credibility move in the whole demo:

> **SAY:** the dashboard found a bug in my logging within an hour of existing. Every Prometheus
> scrape and every Docker healthcheck writes two log lines. With no users at all this service
> writes about 28,800 lines a day. The metrics middleware excludes `/metrics`; the logging
> middleware doesn't.

Then say what you decided to do about it and why. Engineers who surface their own findings
read as engineers who look.

### 4 · Where the numbers come from — 3 min

Prometheus `/targets` tab.

- Two targets, both UP. **SAY:** Prometheus *pulls* — the app exposes current values and never
  pushes anything anywhere. It doesn't know Prometheus exists.
- Switch to `/rules`. Three rules, loaded and evaluating.
- **SAY:** the error rule alerts on a **ratio**, not an absolute count, and why the absolute
  version is inverted in practice.
- **SAY:** why `RequestsStuckInFlight` exists as a separate rule — during a hang nothing
  completes, both halves of the ratio fall to zero, and the ratio alert is blind.

If he asks how fast you'd know: **6–10 minutes depending on severity.** Don't say "instantly."

### 5 · How it's built — 3 min

Editor, `docker-compose.yml` and the `grafana/provisioning` tree.

- **SAY:** the dashboard is a JSON file in git, provisioned at boot, not built by clicking.
- **SAY:** what survives `docker compose down -v` and what doesn't — and that the answer is
  different for the two volumes.

Optional, if it's going well and you have the nerve — it's genuinely impressive and takes
40 seconds:

```bash
docker compose down -v && docker compose up -d
```

The dashboard comes back from the files with an empty chart. Data gone, dashboard intact.
**Only do this if you've rehearsed it.** Rebuild takes ~30s from cache and you lose your
traffic history.

### 6 · Jaeger and what's next — 2 min

- Jaeger UI, reachable, one service listed: `jaeger-all-in-one`, its own self-instrumentation.
- **SAY:** it's running a day early on purpose so Day 6 has an export target ready. Empty is
  the expected state, not a fault.
- **SAY:** what lands next — tracing Day 6, `trace_id` in every log line, silent-failure
  detection Day 8.

### 7 · Close — 1 min

Name the known gaps yourself before he finds them: no Alertmanager, nothing produces 5xx yet,
the `499` path has never fired, no Postgres or domain code.

---

## The failure demo — 4 min, insert after section 4

`/debug/slow` and `/debug/fail` landed on Day 4, so all four signals can now be driven live.
Each of these was measured working; none of it is theoretical.

**a · Move the in-flight gauge.** In a spare terminal:

```bash
./scripts/traffic.sh slow &
```

Gauge goes 0 → ~25 and the latency percentiles jump to the top bucket.

**SAY:** the gauge counts requests *held inside the handler*, not load. Ordinary traffic never
moves it — measured, 401 concurrent connections still read 0 — because those requests are
queued in the kernel, upstream of the instrumented span. It moves when something awaited stops
coming back. **That's why it's the signal that survives a hang: it's driven by arrival, and
during a hang arrival is the half that still happens.**

**b · Fire the 499 path.**

```bash
curl --max-time 1 'localhost:3000/debug/slow?ms=8000'
```

Show the log line: `status_code: 499`, `duration_ms: 1005`.

**SAY:** this branch was written on Day 3 and had never once executed, because every real
request finished in 2 ms and there was nothing slow enough to abandon. Then why it matters —
`res.statusCode` initialises to 200, so an abandoned request would otherwise be counted as a
**success**, which is worse than not counting it.

**c · Drive the error ratio into an alert.**

```bash
./scripts/traffic.sh errors 0.6 &
```

Ratio climbs to ~36%. Then open Prometheus `/rules` — `HighErrorRatio` goes **pending**
within a minute, with an `activeAt` timestamp.

**SAY:** pending, not firing, because of `for: 5m`. Then what that clause buys and what it
costs — you have real numbers for this now.

> **Stop both generators before moving on:** `./scripts/traffic.sh stop`, then let the
> dashboard recover for a minute so you don't close on a red screen.

**Rehearse this section.** It is the strongest four minutes in the demo and the only part
with live failure in it — which also makes it the part most likely to go wrong on the day.

## Questions to expect, and which ones you owe

Rehearse these out loud. If a sentence doesn't come out in one go, that's the one to work on.

| Question | Status |
|---|---|
| Why is `unmatched` one series? | ✅ closed Day 3 — you have this |
| What does `docker compose down -v` destroy? | ✅ covered today, verify you can split the two volumes |
| Why Winston over pino? | ⚠️ "the plan said so" is a weak answer. Know the tradeoff. |
| Why `correlation_id` not `request_id`? | ⚠️ a decision, not an oversight — say it that way |
| In `prometheus.yml`, why `booking-api:3000` in one job but `localhost:9090` in the other? | ❗ **unanswered — you owe me this one** |
| Why does a metric exist when the log already has status and duration? | ⚠️ query-time vs write-time aggregation. Missed twice, corrected Day 3. |
| How would you know you're down before a user tells you? | ❗ keys on **absence of expected success**, not presence of an error |

## If something breaks live

| Symptom | Do this |
|---|---|
| Panels show No data | `./scripts/traffic.sh wave 600 &`, wait 30s. Say what you're doing. |
| A target is DOWN | Don't panic — open the logs and diagnose out loud. It's a better demo than a green screen. |
| Grafana won't load | `docker compose restart grafana`, ~10s |
| Everything is broken | `docker compose down && docker compose up -d && ./scripts/verify.sh` |

Narrate any recovery. Debugging your own stack calmly in front of your EM is a stronger signal
than a demo where nothing went wrong.

## Evidence

The recording **is** the deliverable — it satisfies the definition of done by itself, provided
its path lands in `STATUS.md`.

Folder: `~/Videos/2_week_training_plan_videos/` (recreated on this machine — the Day 1 baseline
recording lives on the old one and did not transfer).

Recording with OBS on Wayland/Hyprland: use the **PipeWire** screen capture source, not X11.
Check the mic is actually armed and levels are moving **before** take 1, not after.

Keep take 1 rather than deleting it. It is the only live-pressure rehearsal before Day 9, and
what you notice watching it back belongs in the weak-spot list.

Afterwards: note anything you fumbled, skipped, or could not explain in one pass, plus whatever
Harvey comes back with in chat. Unanswered questions go straight to the weak-spot list — those
are Day 10 retest content and they are worth more than the recording going smoothly.
