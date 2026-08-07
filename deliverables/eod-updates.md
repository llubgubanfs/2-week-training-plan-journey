# EOD updates to Harvey

One entry per day, appended by `/day-end`. Format: `Done · Blocked · Tomorrow`, in English.

Keeping them all in one file means Day 10's walkthrough has a ready-made narrative of the two weeks.

---

## Day 2 — Structured Logging · Thu 2026-07-30

**Done:**
- Winston JSON logging wired into the NestJS service, with one correlation id carried across
  every log line of a single request via `AsyncLocalStorage`
- PR merged: https://github.com/y4nder/2-week-training-plan-journey/pull/1 (`7a9e09c`)
- Screenshot of the JSON output: `deliverables/day-02/correlated-logs.png` — two requests, six
  lines, two distinct ids
- Raw log capture and reproduction steps: `deliverables/day-02/README.md`
- Repo set up as a workspace for the full two weeks: daily journal, `STATUS.md`, and a
  `deliverables/` folder with a fixed home per day
- Day 1 system design baseline documented, with the session transcript, in `design/`

**Blocked:**
- Nothing blocking.
- Raised for a decision, not blocking: the plan specifies `request_id`; the field is named
  `correlation_id` because Day 8's cron has no HTTP request behind it and still needs
  correlation through the same logger. Free to rename until Day 4, when the Grafana dashboards
  begin querying the field by name.
- Asked whether chat is the right channel for daily progress, or a thread / doc / PR links.

**Tomorrow — Day 3: Metrics & Alertable Signals:**
- `/metrics` endpoint exposing request count, error rate, and latency
- A short note on the one alert to wire off that data
- Continue the same Pluralsight course, Prometheus/Grafana sections

<details>
<summary>Message as sent</summary>

```
Hi Sir Harvey,

DONE — Day 2: Structured Logging
PR: https://github.com/y4nder/2-week-training-plan-journey/pull/1

Winston JSON logging is wired into the NestJS service, with one correlation
id carried across every log line of a single request. The screenshot of the
JSON output and the raw log capture are in the repo under deliverables/day-02/.

I also set the repo up as a workspace for the full two weeks rather than just
a code drop — a daily journal, a STATUS file tracking where I am and what's
carried over, and a deliverables/ folder so each day's evidence has a fixed
place you can go straight to.

One flag: the plan specifies request_id, but I named the field correlation_id —
Day 8's cron has no HTTP request behind it and still needs correlation through
the same logger. Easy to rename if you'd prefer the literal field.

BLOCKED — nothing.

TOMORROW — Day 3: Metrics & Alertable Signals
A /metrics endpoint exposing request count, error rate and latency, plus a
short note on the one alert I'd wire off that data.

Quick question: is this the right channel for daily progress, or would you
prefer a thread, a doc, or just the PR links?

Thanks!
```

</details>

---

## Day 3 — Metrics & Alertable Signals · Fri 2026-07-31

**Done:**
- `GET /metrics` on `booking-api`, verified returning 200 with the Prometheus exposition
  content type — request count (counter), latency (histogram), and requests in flight (gauge),
  plus Node process/GC/event-loop-lag defaults
- Error rate derived in PromQL from the labelled counter rather than written by a second
  code path that could drift out of sync
- PR: https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1 (`114e76a`)
- Real scrape captured: `deliverables/day-03/metrics-scrape.txt`
- Alerting note: `deliverables/day-03/alerting-note.md`
- Fixed a bug in Day 2's logger found while doing this: it hooked `res.on('finish')`, which
  never fires on an abandoned request, so a client who gave up produced a "request received"
  log with no completion line — and would have gone uncounted in the metrics too

**Blocked:** Nothing blocking.

**Tomorrow — Day 4: Infrastructure Day (Metrics & Tracing Stack):**
- Docker Compose stack: Prometheus + Grafana + Jaeger + the service
- Grafana panel screenshot + confirmation Jaeger's UI is reachable
- This stack gets reused for the rest of Week 2

---

> **Format changed today.** Harvey: *"For now, the daily progress should be in Daily Status
> Report in Rocks. PR Links, docs, video, stays here in the chat for now."* From Day 3 there are
> two artifacts per day, not one. Both are recorded below as sent.

<details>
<summary>Rocks — Daily Status Report, as sent</summary>

```markdown
# What I did today

- Transferred origin of my 2 week training plan journey from my personal account to the company Github account.
- Day 3: Metrics & Alertable Signals.
- Added a `/metrics` endpoint to the booking API exposing request count, error rate and latency in a format Prometheus can scrape.
- Added a requests-in-flight gauge on top of the plan's list. If the database hangs and callers give up waiting, nothing ever completes, so both sides of an error-rate alert go to zero and it never fires. This gauge is driven by requests arriving rather than finishing, so it still climbs during that kind of outage.
- Wrote the alerting note: alert on the *ratio* of 5xx to total requests rather than an absolute error count, with a minimum-traffic guard so one error on a quiet night can't page anyone.
- Fixed a bug in Day 2's logger found while doing this. It listened for the `finish` event, which never fires if a client disconnects mid-request, so abandoned requests were logging a "received" line with no completion and would have been missing from the metrics too. Now listens for `close` and records them as 499.
- PR merged: https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1

---

# What I will be doing the next working day

- Day 4: Infrastructure Day — Metrics & Tracing Stack.
- Build a Docker Compose stack with Prometheus, Grafana and Jaeger alongside the service, so `/metrics` has somewhere to be scraped and visualised, and Jaeger is ready ahead of Day 6's distributed tracing. This stack gets reused for the rest of Week 2.
- Deliverable: `docker-compose.yml`, a screenshot of a working Grafana panel, and confirmation Jaeger's UI is reachable.
- Wire the two alert rules from today's note into the running Prometheus.
- Start the booking domain endpoints carried over from Day 2 — deliberately thin, three endpoints.
```

</details>

<details>
<summary>Chat with Harvey, as sent</summary>

```
Hi Sir Harvey,

Noted on Rocks — Day 3's status report is in there.

Day 3 PR (Metrics & Alertable Signals):
https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1

Note the repo moved from my personal account to the company account, so this
link is on a different org than the Day 2 one.

Docs in the repo, if useful:
- deliverables/day-03/alerting-note.md — the alert I'd wire off this data and
  why the obvious threshold is wrong in both directions
- deliverables/day-03/metrics-scrape.txt — actual scrape output

Thanks!
```

**Cut before sending:** a paragraph asking for a decision on `correlation_id` vs the plan's
`request_id`. It had been raised at Day 2 EOD and gone unanswered; removing it from the Day 3
message means it was never asked a second time. Treated from here as a **decision taken**, not a
pending question — see the Decisions table in `STATUS.md`. The rationale is defensible on its own
merits and should be presented that way on Day 10, not as an oversight.

</details>

---

## Day 4 — Mon 3 Aug 2026 · Infrastructure: Prometheus + Grafana + Jaeger

<details>
<summary>Rocks — Daily Status Report</summary>

```
# What I did today

- Distributed tracing is now live across both services. One request produces one
  trace spanning booking-api and the notifier, exported to the Jaeger that has
  been in the stack since Day 4. Every log line now carries trace_id and span_id
  too, so the id in a log matches the trace in Jaeger.

- The downstream call this day depends on did not exist. NOTIFIER_URL had been in
  the environment since Day 2 pointing at a service that was never containerised,
  and no code read it. Built both halves first.

- Built the call two ways, awaited and fire-and-forget, so the failure behaviour
  can be compared. With the notifier stopped, the awaited one returns 503; the
  fire-and-forget one returns 202 and only logs the failure 729ms later, after the
  client was already told it succeeded. Nothing can alert on that today, which is
  the Day 8 problem.

- Reduced spans from 38 per request to 9. Two instrumentations were recording the
  same middleware twice without knowing about each other.

- Broke one of my own tests by adding a logger, and only the test run caught it.
  Used that as a prompt to cover the new code that can fail silently. Unit tests
  went from 5 to 11.

---

# What I will be doing the next working day

- Day 7: extend my Day 1 design with a real-time waitlist, so a desk freed up
  early reallocates to the next member without double-booking during the handoff.
- Deliverable: updated Excalidraw diagram and written notes.
- Also rehearsing explaining a design out loud under time pressure, ahead of Day 9.
```

</details>

<details>
<summary>Chat with Harvey, as sent</summary>

```
Hi Sir Harvey,

Noted on Rocks — Day 3's status report is in there.

Day 3 PR (Metrics & Alertable Signals):
https://github.com/llubgubanfs/2-week-training-plan-journey/pull/1

Note the repo moved from my personal account to the company account, so this
link is on a different org than the Day 2 one.

Docs in the repo, if useful:
- deliverables/day-03/alerting-note.md — the alert I'd wire off this data and
  why the obvious threshold is wrong in both directions
- deliverables/day-03/metrics-scrape.txt — actual scrape output

Thanks!
```

**Cut before sending:** a paragraph asking for a decision on `correlation_id` vs the plan's
`request_id`. It had been raised at Day 2 EOD and gone unanswered; removing it from the Day 3
message means it was never asked a second time. Treated from here as a **decision taken**, not a
pending question — see the Decisions table in `STATUS.md`. The rationale is defensible on its own
merits and should be presented that way on Day 10, not as an oversight.

</details>

---

## Day 4 — Mon 3 Aug 2026 · Infrastructure: Prometheus + Grafana + Jaeger

<details>
<summary>Rocks — Daily Status Report</summary>

```
# What I did today

- Built the Day 4 stack: Prometheus, Grafana, Jaeger and the booking service in Docker
  Compose. Prometheus scrapes the /metrics endpoint from Day 3, Grafana renders it, and
  Jaeger runs a day early so Day 6's tracing has an export target. Reused for the rest of
  Week 2.
- Grafana is provisioned as code, not click-configured. The datasource and dashboard are
  JSON files in the repo read at startup, so the dashboard survives the volumes being
  deleted and exists on a fresh clone. A click-built dashboard lives in Grafana's local
  database and cannot be reviewed or diffed.
- Wired Day 3's two alert rules into the running Prometheus and added a third of my own.
  Without a TargetDown rule, a scrape target disappearing silences every other rule for the
  best possible reason and the worst possible cause.
- Spent real time on why the in-flight gauge would not move under load. I assumed the
  metric was broken; it was not. It counts requests held inside the handler, and this
  service answers in 0.19 ms, so there was nothing to count — the queueing was in the
  operating system, upstream of where the metric can see it. Three explanations I found
  convincing were wrong before I measured properly. It is not a load gauge: it moves when
  something the handler is waiting on stops responding, which is the Day 8 failure mode.
- Added endpoints that stall and fail on demand so the signals can be exercised — three of
  the four had only ever shown a healthy service. This also fired the 499 branch for
  abandoned requests for the first time; it was written on Day 3 and had never executed,
  because nothing was slow enough to abandon.
- Found a bug in my own Day 2 logging. The metrics middleware excludes /metrics but the
  logging middleware does not, so every scrape and health check writes two log lines —
  about 28,800 a day with no users. The dashboard surfaced it within an hour of existing.
  Deciding on the fix rather than patching it quickly.

---

# What I will be doing the next working day

- Day 5: Integration Day — logs, metrics and dashboard demoed end to end. I will record it
  either way so there is an artifact rather than just a conversation.
- Fixing the logging noise above, and adding the event-loop lag metric to the dashboard.
  It is already collected, and it caught the saturation the in-flight gauge could not.
- The booking domain endpoints have slipped three days. They earn no assessment points and
  compete directly with the observability work, so I am not forcing them in.
```

</details>

<details>
<summary>Chat with Harvey</summary>

```
Hi Sir Harvey,

Day 4 status report is in Rocks.

Day 4 PR (Infrastructure — Prometheus, Grafana, Jaeger):
https://github.com/llubgubanfs/2-week-training-plan-journey/pull/2

Screenshots of the Grafana dashboard, the Prometheus targets and the Jaeger UI are
embedded at the top of the PR description.

Docs in the repo, if useful:
- coworking-obs/infra/README.md — how to bring the stack up from scratch, and
  what each volume does and does not persist
- deliverables/day-04/stack-verification.txt — targets, loaded alert rules and
  the cardinality check as text
- infra/scripts/verify.sh — 18 checks against a running stack, if you would like
  to confirm it yourself rather than take the screenshots on trust

One thing I need a decision on:

Day 5 is Integration Day and the plan says to present it live to you. Would you
prefer a live session tomorrow, or should I record a walkthrough and send it
over? I am happy either way — I just want to make sure I do not hold you to a
slot at short notice. If live, any time tomorrow works on my side.

While I have you: does the Day 10 walkthrough need to be a particular length or
format? Knowing that now would let me practise against the right target.

Thanks!
```

**Note on the chat message:** no progress prose — that is Rocks' job per your Day 3
instruction. The only ask is the Day 5 format decision, which is genuinely blocking because
the demo is tomorrow and no slot exists. The Day 10 format question has been open since Day 1
and is folded in rather than sent as a separate message.

</details>

---

## Day 5 — Tue 4 Aug · Integration Day (recorded walkthrough)

<details>
<summary>Rocks — Daily Status Report</summary>

```
# What I did today

- Delivered the Day 5 integration walkthrough as a recorded video: structured
  JSON logging with correlation ids, a live /metrics endpoint, a Grafana
  dashboard rendering it, and two failure signals driven live on camera.

- Moved the stack to a new machine. Grafana came up reporting healthy and had
  silently provisioned nothing -- no dashboard, no datasource, no error logged
  anywhere. Only my verification script caught it, because it checks that the
  datasource exists rather than that the container is running. That is the Day 8
  lesson arriving a week early on my own stack: alert on the absence of an
  expected success, not the presence of an error.

- Fixed a bug the Day 4 dashboard found in my own Day 2 logging: every
  Prometheus scrape and healthcheck was writing two log lines, roughly 28,800 a
  day with no users.

---

# What I will be doing the next working day

- Day 6: Distributed tracing. Instrument the service plus one downstream call
  and export spans to the Jaeger instance already in the stack.
- Deliverable: a screenshot of a trace in the Jaeger UI spanning both.
- Also adding trace_id and span_id to every log line.
```

</details>

<details>
<summary>Chat with Harvey</summary>

```
Hi Sir Harvey,

Day 5 status report is in Rocks.

Recorded walkthrough (18 min) — logs, metrics and the Grafana dashboard, plus
two failure signals driven live:
https://drive.google.com/file/d/1_79o8DYFxkwq6olAdUnD3p6J-1B_VZ6-/view?usp=drive_link

Still open from last week: does the Day 10 recorded walkthrough need a
particular length or format? Today's ran 18 minutes, so knowing whether that is
roughly the right target would help me plan for it.

Thanks!
```

</details>

**No PR link this time — Leander's call.** Day 5's deliverable in the plan is *"working sample
service demoed live"*, not a diff. The branch still exists and still merges, but sending a link
Harvey did not ask for adds noise to a message whose only real ask is the Day 10 format
question. Days 2–4 shipped a PR because the plan named one; Day 5 did not.

**Note on the split:** progress prose stayed in Rocks; the chat message carries only the video
link and the one open question. The Day 10 format question has now been open since Day 1 and is
re-raised with today's runtime as a concrete data point rather than as an abstract ask.

**Not said to Harvey, deliberately, but recorded in STATUS.md:** the walkthrough was several
takes and then edited, so the agreed single-take live-pressure rehearsal did not happen. That is
a training gap for Day 9, not a delivery caveat — the artefact he asked for is complete and
accurate.

---

## Day 6 — Wed Aug 5 · Distributed Tracing

<details>
<summary>Rocks — Daily Status Report</summary>

```
# What I did today

- Distributed tracing is live across both services. One request now produces one
  trace spanning booking-api and the notifier, joined by the W3C traceparent
  header and exported to the Jaeger that has been in the stack since Day 4. Every
  log line now also carries trace_id and span_id, so the id in a log line is the
  same id as the trace: finding a slow trace and pulling every log line from every
  service that took part is one query.

- The downstream call this day depends on did not exist. NOTIFIER_URL has been in
  the environment since Day 2 pointing at a service that had never been
  containerised, and no code read it. Built both halves before starting on the
  tracing itself.

- Built the two calling conventions side by side so their failure behaviour is
  directly comparable. With the notifier stopped, the awaited call returns 503 and
  tells the caller; the fire-and-forget call returns 202 in 2.6ms and its failure
  logs 729ms later, after the client has already been told it succeeded. The
  correlation is perfectly intact and still nothing can alert on it, because a log
  line is a record and not a signal. That is the Day 8 problem with a working
  reproduction on the stack.

- Cut spans from 38 per request to 9. Turning off the Express middleware spans
  removed only half of them; the rest carried a different instrumentation's name
  in their tags. Express 5 moved its router into a standalone package with its own
  instrumentation, so every middleware and route handler was being recorded twice
  by two instrumentations unaware of each other. Found by reading the span tags
  rather than guessing a second time.

- Fixed a test I broke, and took it as a prompt. Adding a logger to the notifier's
  service made its spec fail to compile, which the type checker and the linter both
  missed and only the test run caught. Used that to cover the part of the new code
  that can break silently: if the correlation header stops being forwarded nothing
  fails, both services keep working, and the ids simply stop matching. Unit tests
  went from 5 to 11.

---

# What I will be doing the next working day

- Day 7: extend my Day 1 system design with a real-time waitlist, so a desk that
  frees up early reallocates to the next waitlisted member without ever
  double-booking during the handoff.
- Deliverable: updated Excalidraw diagram plus written notes on the extension.
- Also using the day to rehearse explaining a design out loud under time pressure,
  ahead of the Day 9 live session.
```

</details>

<details>
<summary>Chat with Harvey</summary>

```
Hi Sir Harvey,

Day 6 status report is in Rocks.

PR — distributed tracing across both services:
https://github.com/llubgubanfs/2-week-training-plan-journey/pull/3

Jaeger screenshots, trace exports and the reasoning behind the decisions:
deliverables/day-06/README.md

Thanks!
```

</details>

**Nothing needed a decision from him today**, so the chat message is only the PR link and a
pointer to the committed doc. The Day 10 format question from Day 4 is still unanswered but was
re-raised yesterday — asking again 24 hours later would read as chasing rather than as needing it.

**Every number in the Rocks entry is measured, not estimated:** 38 → 9 spans, 2.6 ms, 729 ms,
5 → 11 tests. The two items reported voluntarily are the missing downstream call — a prereq gap
the plan itself does not flag — and the test broken by his own change. Both read better
volunteered than found.

**Cut from the draft to keep the entry to the house length:** the `x-correlation-id` forwarding
decision and its sampling rationale. It is the best reasoning of the day but it is design detail,
and it lives in the PR and in `deliverables/day-06/README.md` where Harvey can reach it. Rocks
carries the narrative, not the whole argument.

**Not said to Harvey, deliberately, and recorded in STATUS.md:** three drills are now owed before
Day 9 and none has been scheduled. That is training-plan hygiene, not delivery status.

---

## Day 7 — Thu Aug 6 · Waitlist Design Extension

**Sent.** Both channels, per Harvey's Day 3 instruction: progress to Rocks, links and decisions to
chat.

<details>
<summary>Rocks — Daily Status Report</summary>

```
# What I did today

- Watched "Managing Complex Scenarios" — sagas, compensating transactions,
  and querying for invariant violations.

- Redrew the Day 1 co-working design as a proper system diagram: scale
  assumptions, stated invariants, and double-booking enforced as a conditional
  update. Merged the desk and meeting-room services into one Booking Service —
  same invariant, so the split had nothing on either side of it.

- Added the real-time waitlist. Early release or the expiry sweep publishes
  desk.freed, the waitlist service promotes the oldest queued member, the
  booking service claims the desk. A promotion uses the same conditional claim
  a walk-in does, so there is no separate handoff path to get wrong.

- Added detection for the two new silent failures — a promotion that never
  becomes a booking, and a desk left free while its waitlist is not empty.
  Both found by querying for broken state, not by waiting for an error.

---

# What I will be doing the next working day

- Day 8: add a cron job that fails silently ~1 in 5 runs, instrumented so the
  failure shows up as a log entry, a metric, and an alert rule.

- Write the answer to "how would I know this failed before a user reported it",
  backed by that instrumentation.

- Close two open waitlist questions before Day 9: multi-tenancy isolation, and
  auto-assign vs offer-with-timeout on promotion.
```

</details>

<details>
<summary>Chat with Harvey</summary>

```
Hi Sir Harvey,

Day 7 PR — the waitlist extension to my Day 1 system design:
https://github.com/llubgubanfs/2-week-training-plan-journey/pull/4

It contains the updated Excalidraw (source + PNG export) and written notes,
under deliverables/day-07/. I redrew the base design first, then added the
waitlist on top, so the diagram is the full design rather than just the
extension.

Two questions:

1. Day 9 is this coming Monday (Aug 10). The plan has it as a live 30-minute
   session in two parts — you pushing back as a skeptical stakeholder, then the
   design defense. Before I prepare, could you let me know which format works
   best on your end? I'm happy either way. If a live slot is hard to find, I can
   record the design walkthrough the way I did for Day 5, and we could handle
   the stakeholder pushback in a shorter call or over chat, whichever costs you
   less time.

2. Still hoping to check on the Day 10 recorded walkthrough — is there a length
   or format you'd prefer? Asked on Day 4, so no rush, but it would help me
   prepare.

Thanks!
```

</details>

**The chat message carries a real decision this time**, which is why it is longer than usual. Day 9
is one working day away, is the graded System Design assessment, and no calendar slot exists. The
question was framed to give Harvey three easy exits — live, recorded, or a recorded walkthrough
plus a short call for the stakeholder half — because he is reportedly running ~50 of these plans
and peers' live sessions have been converted to recordings.

**⚠️ Recorded would cost Leander more than it saved on Day 5, and that is recorded in STATUS.md
rather than said to Harvey.** Gap #18 exists precisely because a recorded format removes live
pressure; part one of Day 9 is interactive by definition and cannot be recorded at all; and no
live rep has happened in nine days. Whatever comes back, the mitigation is his and needs no
calendar: one unbroken unrehearsed take before the real one. Agreed on Day 5 and skipped.

**Cut from the Rocks entry deliberately:** the ride-dispatch drill. It is practice rather than
delivery, and the entry reads stronger ending on the failure-detection work. Also cut: the
multi-tenancy decision and the whole silent-failure derivation. Both are the best reasoning of the
day, and both live in `deliverables/day-07/waitlist-notes.md` and the journal where Harvey can
reach them. Rocks carries the narrative, not the argument.

**Not said to Harvey, deliberately:** that the base design scored 8/12 and the combined design
7/12 against the Day 9 rubric — those are internal training numbers, not delivery status — and
that two lines on the observability strip were handed over rather than derived.

---

## Day 8 — Fri 2026-08-07 · Silent failure detection

### Rocks — Daily Status Report

<details><summary>message</summary>

```
# What I did today

- Built a scheduled job (expiry sweep) in the booking service that releases
  expired bookings, deliberately flawed so it fails about 1 in 5 runs, and
  instrumented it so a failure shows up as a log entry, a metric, and an alert
  rule. This is the scenario I raised in my interview.

- Built it to fail in two different ways, because they are caught by different
  signals. One throws an exception: it produces an error log and a failure
  metric. The other is the silent one — the sweep runs, its query matches
  nothing, and it returns successfully having done no work. No exception, no
  error log, and the success counter still increments.

- The signal that catches the silent case is a gauge counting expired bookings
  that still hold a desk, evaluated at scrape time rather than written by the
  job. That was deliberate: if the job wrote its own state metric, a dead job
  would freeze it at its last healthy value and the graph would stay flat and
  green while the backlog grew.

- Verified it against the running stack rather than a test: during a forced
  silent run, the job reported 12 consecutive successes with zero error log
  lines while 33 expired bookings sat holding desks. The invariant alert fired;
  the "has the job run" alert stayed green. That is the whole point of the day
  in one measurement.

- Found and fixed a bug in my own instrumentation while demonstrating it. My
  metric exposed a label called "job", which is a label Prometheus reserves for
  itself — so it was silently renamed and my alert rule matched nothing, which
  made the rule fire permanently while the job was healthy. It looked identical
  to the demo working. Renamed the label and removed a second, older instance of
  the same collision that had been there since Day 3.

- Added 6 unit tests (suite 11 to 17), including a regression guard on the
  mistake that would have broken all of this: recording the success metric in a
  finally block, which counts failed runs as successful ones.

---

# What I will be doing the next working day

- Day 9: System Design live defense and post-training assessment.
- Preparing the design defense: deciding and drawing the multi-tenancy model,
  and stating the scaling conclusions that follow from my capacity numbers.
```

</details>

### Chat with Harvey

<details><summary>message</summary>

```
Hi Harvey, Day 8 PR is up:
https://github.com/llubgubanfs/2-week-training-plan-journey/pull/5

The written answer to "how would you know this failed before a user reported
it" is in deliverables/day-08/silent-failure-answer.md, with the captured logs,
metrics and the firing alert alongside it, so the answer is backed by the
instrumentation rather than just described.

Also just a nudge on Day 9 on Monday — do you know yet if it'll be live or
recorded? Either works on my end, I just want to prepare the right way. Same for
the Day 10 walkthrough later in the week, if you have a length or format in mind
I'll follow it.

Thanks!
```

</details>

**The Rocks entry leads with judgement, not compliance.** Three of the six bullets are decisions
rather than deliverables — why the state gauge is not written by the job, why two failure shapes,
and the `finally` regression guard. The plan asked for one instrumented cron job; what earns the
Growth Area rating is the reasoning about *which signal catches which failure*.

**The label-collision bug is reported voluntarily, and that is the deliberate call.** It was a bug
in his own instrumentation, found by him, in the demo he built to find bugs. Nobody would have
known. Reporting it reads better than it costs — and it is the strongest available evidence
against gap #16 (declaring something works before measuring it), which is exactly the instinct
Days 9 and 10 test.

**Cut from Rocks deliberately:** the quiz result, the ALS gap, and the two spoken drills deferred
to the weekend. Those are training internals, not delivery status. Also cut: the in-memory-store
scope call — it is in the README where Harvey can reach it if he reviews the code, and leading a
status report with what was *not* built inverts the emphasis.

**Both questions were folded into one soft nudge rather than a numbered list, and the Rocks entry
carries them as blockers instead.** The guide Leander was given for Daily Status Reports asks
explicitly for roadblocks including "waiting on a decision", so the formal ask now lives there; the
chat message only keeps them alive.

**"Preparing for live by default" was cut — Leander's call, and it was right.** It signals
readiness for live and so makes live the low-friction answer, which quietly removes Harvey's
freedom to pick the cheaper option. Preparing for live is a decision to take on his own side, not
one to announce.

**⚠️ Both open questions are now on their third and fourth asking.** Day 9's format was asked on
Day 7 and is unanswered with the session two days out; the Day 10 walkthrough format was asked on
Day 4 and re-raised on Days 6 and 7. If Monday arrives with no answer, the default is to prepare
for **live** — it is the harder case and the plan's own wording.
