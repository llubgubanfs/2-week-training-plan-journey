# Day 5 — Tue Aug 4 · Integration Day + live EM demo

**Track:** Observability
**Prereqs:** Day 2 structured logger ✅ · Day 3 `/metrics` ✅ · Day 4 Grafana stack ✅
**Objective:** Bring Week 1 together — one service carrying structured logs, a live `/metrics`
endpoint, and a Grafana dashboard rendering it — and present it live to Harvey.

**New machine, fresh clone.** Days 1–4 ran elsewhere. Nothing about the repo changed; the
environment around it did.

---

## Orientation findings (checked on disk, not taken from STATUS.md)

- **All three prereqs are real.** `libs/observability/src/` carries `logging/`, `metrics/`,
  `cls/` and `debug/`; `infra/` carries the compose file, the Prometheus rules, and the
  provisioned Grafana datasource + dashboard. Nothing to rebuild.
- **🔴 `docker compose` does not exist on this machine.** Docker Engine 29.4.0 is installed and
  the daemon is up, but only the `buildx` CLI plugin is present in
  `/usr/libexec/docker/cli-plugins/`. Every command in the run sheet starts with
  `docker compose`. Fix: `sudo dnf install docker-compose` (Fedora's package installs the
  Compose v2 plugin into that exact directory).
- **🟠 Push identity is not set up.** The clone's remote is **HTTPS**, no credential helper is
  configured, the SSH key on this machine authenticates as **`y4nder`**, and `gh` is logged in
  as `y4nder`. STATUS.md's note that "`git push` is unaffected (SSH, as `llubgubanfs`)"
  described the *old* machine. Not a blocker for the demo; a blocker at day-end.
- **`.env` is absent and that is fine** — every variable in `docker-compose.yml` has a default
  (`${GRAFANA_PORT:-3030}` and so on). Confirmed by reading the file, not assumed.
- **STATUS.md was stale on two lines** — Day 4's PR #2 is *merged* (`a1c3895`), and `gh` on this
  machine does have an account attached, so the browser-only PR workaround still applies.

## Deliverable Harvey will look at

| Evidence | Path | Status |
|---|---|---|
| Working service demoed live — logs + metrics + dashboard | live session | ⬜ |
| Screen recording (a live demo leaves no artifact) | `~/Videos/2_week_training_plan_videos/` | ⬜ |
| Run sheet the demo followed | `deliverables/day-05/demo-run-sheet.md` | ✅ written Day 4 |
| Post-demo notes: what he asked, what went unanswered | this file | ⬜ |

## Warm-up quiz — 2.5 / 3

1. **`booking-api:3000` vs `localhost:9090` in `prometheus.yml` — half.** Right on *why* each is
   what it is: Docker's embedded DNS for the cross-container target, own-loopback for the
   self-scrape. Did not attempt the half that was asked — what breaks on a swap. It is
   asymmetric, and measured live: `localhost:3000` inside the Prometheus container is
   *connection refused* and does **not** fall through to the host's published port, so that
   target goes DOWN; `prometheus:9090` resolves to 172.18.0.4 and works unchanged.
   Volunteered a bonus claim that the self-scrape distinguishes "app down" from "stack down"
   → new gap **#17**: the watcher cannot watch itself.
2. **`down -v` and the two volumes — full. Gap #15 closed unprompted.** Split the volumes
   without prompting; dashboard rebuilds from the provisioned JSON, "comes back, although
   empty." He argued the losing side of this on Day 4.
3. **Counter reset on restart — near-full. Gap #14 closed unprompted.** Said the total
   **"in heap"** goes to zero and `rate()` treats the decrease as a reset. "In heap" is the
   exact word he got wrong on Day 4. Follow-up answered correctly same session: `rate()` hides
   the negative spike, it does not recover the requests lost across the restart window.

**Follow-ups, both answered after the quiz.** #17 corrected unaided once pointed at the shape —
Alertmanager deadman's switch, routed to a receiver outside the stack, alerting on the heartbeat
*stopping*. Q1's swap answered after narrowing: right that `localhost` inside the Prometheus
container is its own loopback; the published-port NAT detail and the asymmetry were handed over.

---

## What I did

- Migrated the stack to a new machine: installed the Compose plugin, fixed SELinux labelling on
  the bind mounts, and wired a `llubgubanfs` push identity via a dedicated SSH key and a
  `github-llubgubanfs` host alias — leaving the global `y4nder` identity untouched.
- Excluded `/metrics` from the logging middleware. ~28,800 lines/day → 0, measured.
- Fixed `traffic.sh stop`, which only stopped one generator of several.
- Wrote a ~9-minute walkthrough script and a command stepper, then recorded, edited and
  delivered an 18:43 narrated walkthrough to Harvey via Drive.

## What I learned

- **The two failure modes of a broken bind mount look nothing alike.** Prometheus crash-looped
  with an error every 400ms. Grafana came up healthy and provisioned nothing, silently. The
  difference is not SELinux — it is that one component treats its config as required at startup
  and the other treats it as best-effort. **A health check that asks "is it running" cannot tell
  these apart. One that asks "does the datasource exist" can.**
- **`sum by (route)` discards every other label.** Four lines on the panel, five series in the
  registry, and both numbers are right — `/debug/fail` emits a 200 and a 500 and they are summed
  into one line. Aggregation reduces dimensionality; the panel is not a window onto the raw
  series.
- **`localhost` inside a container is that container.** A published port is a NAT rule in the
  *host's* network namespace, so `localhost:3000` from inside the Prometheus container is
  refused rather than falling through to the host. Same mechanism as the Day 2 fix to bind
  `0.0.0.0` instead of localhost, seen from the other side.
- **Nest runs module-bound middleware in registration order** — which became load-bearing the
  moment `ClsMiddleware` and `HttpLoggingMiddleware` stopped sharing an `apply()` call.

## What I got stuck on

**Explaining the "request rate by route" panel out loud.** This is the one worth writing down
honestly. The cardinality argument — why `unmatched` is a single line, why route templates bound
cardinality and raw URLs do not — is marked **closed** in the weak-spot list. I produced it
cleanly and unprompted in a quiz on Day 3, and again in review today.

It did not survive being narrated. It took several takes, and the video was edited.

Two things contributed and neither of them changes the conclusion. That section was rewritten
twice on the same day, so I was narrating material I had only just read. And it was supplied to
me as a script, which meant I was reading it rather than reconstructing it.

**The conclusion is that written recall and spoken explanation are different skills, and only the
second one is graded.** Days 9 and 10 are live, single-take, with no edit pass. A polished edit
is the one artefact that cannot tell me whether I could have done it live.

**The mitigation I agreed to and then skipped.** The plan was one unbroken unrehearsed take,
never submitted, purely as live-pressure rehearsal — then a second take for Harvey. I went
straight to the polished path. So the live rehearsal is still owed, and Day 9 is five days out.

## Questions Harvey asked, and which ones I could not answer

Nothing yet — the recording was delivered asynchronously, so any follow-ups will arrive in chat.

**Two topics I did not cover, and both were deliberate omissions in the script because I do not
own them:**

1. **Why Winston over pino.** Never answered cleanly. "The plan said so" is the answer I would
   give today, and it is the weak one.
2. **Why a metric exists when the log already carries status and duration.** Missed twice — I
   called `/metrics` "an aggregator for those log lines," which it is not. The concept is
   write-time vs query-time aggregation.

Harvey has now watched a walkthrough where neither came up. **That makes them the most likely
Day 10 follow-ups, not the least.** Both go into retest prep.

## Open questions for Harvey

- Does the Day 10 recorded walkthrough need a particular length or format? Today's ran 18
  minutes against a 9-minute plan. Asked in the Day 4 chat message, still unanswered — re-raised
  in tonight's message with today's runtime as a concrete data point.
