# Day 10 — Integration Day: Final Walkthrough & Observability Retest

**Track:** Observability (+ recap) · **Date:** Tue 2026-08-11 · **GRADED — post-training assessment**
**Last day of the plan.**

## The plan's entry

> Give a walkthrough of the observability work — structured logging, metrics, tracing, and the
> silent-failure demo — then complete your Observability post-training assessment using the same
> format as Day 1. Your System Design retest already happened on Day 9, so today is lighter.

**Deliverable:** recorded walkthrough + the Observability post-training score.
**Prereqs:** Day 6 trace · Day 8 instrumented cron job · Day 9 System Design retest (already scored).
**Target:** 7 / 10. Baseline: `1-baseline/observability-structured-logging-answers.md`, not yet
scored by Harvey.

## Scope — what the walkthrough has to cover

| Week 1 | Week 2 |
|---|---|
| structured JSON logging + `correlation_id` (Day 2) | distributed tracing across two services (Day 6) |
| `/metrics`: count, error ratio, latency (Day 3) | the silently-failing cron + its three signals (Day 8) |
| Prometheus + Grafana + Jaeger stack (Day 4) | |

Day 5's recording covered the Week 1 half only, and it was scripted and edited. The two topics it
never reached — *Winston vs pino* and *why a metric when the log already has status and duration* —
are the near-certain follow-ups.

---

## What I did

- Brought the Day 4 stack up cold and got `verify.sh` fully green.
- Warm-up quiz on the two topics the Day 5 recording never reached — **Winston vs pino** and
  **why a metric when the log already has `status_code` and `duration_ms`**. Both answered at
  length and both hold up. Q3 (per-tenant PromQL) was cut — running low, my call.
- Extended `infra/scripts/walkthrough.sh` from 8 beats to 19: tracing, the silent-failure demo,
  the label-collision proof, and a reset. Every new beat run against the live stack.
- Wrote a run sheet and an HTML teleprompter — full spoken script, per-segment screen map, six
  measured hazards, live segment timer. **Both removed before merge, deliberately:** they were
  prep aids for recording, not artefacts the deliverable asks for, and shipping them puts review
  attention on scaffolding instead of on the work.
- **Recorded the walkthrough** and uploaded it.
- **Sat the Observability post-training assessment** — same five questions as Day 1, written
  unaided in one pass: `deliverables/day-10/observability-post-training-answers.md`.

## What I learned

**Four things in my own material were wrong, and running them is what found each one.**

1. **The stepper's rule-state beat had never worked.** Written on Day 5, committed, never executed.
   `f"{r[\"name\"]}"` puts a backslash inside an f-string expression and Python rejects it outright.
   Same shape as the Day 8 `exported_job` bug: looks right, was never run.
2. **`SWEEP_FAILURE_RATE_PCT=20` makes the demo silently not work.** Only one run in five fails, the
   other four sweep the backlog clean, the gauge never crosses `> 5`, and the alert never fires.
   At `100` it climbs 0 → 42 and fires in 4½ minutes. The first draft of the run sheet would have
   produced a demo that quietly does nothing.
3. **`count(http_requests_total)` is not the ~135 figure.** That query returns 2. The 135 from Day 3
   is the whole registry projected for the finished service (~15 counter + ~120 histogram). Saying
   "135" with a `2` on screen is the Day 5 failure exactly — the script said two lines, the panel
   had four.
4. **`tracked` climbing is not evidence of the silent failure.** It climbs at three per tick in the
   *healthy* state too, because the seeder runs either way. Only `swept: 0` discriminates.
   **A constant cannot explain a variable** — my own diagnostic, applied against my own script.

**Two operational findings worth keeping.** Metrics do not exist in `/metrics` until the first
request is served — prom-client creates the labelled child on first increment, so a cold stack
reads as broken instrumentation. And Jaeger's API returns traces in unstable order, so `limit=1`
gives an arbitrary recent trace; export lag is ~5s, not 3.

## What I got stuck on

- **Staging, not content.** The first draft put logs *and* metrics both in the terminal and never
  showed Grafana at all — eleven minutes of unbroken terminal on the most visual thing I built.
  Fixed by splitting §3 (Grafana for the panels, then terminal for the proof) and adding an explicit
  screen badge per segment. I had to ask twice about tracing and silent-failure staging before it
  was unambiguous, which means the run sheet was under-specified, not that the material was unclear.
- **Q3 of the warm-up quiz went unanswered** — "the invariant" and "the cardinality" as one-word
  answers, where Q1 and Q2 had been full. Named at the time as running low rather than pushed
  through. Logged to the weak-spot list because the *terseness* is the risk in a live format, not
  the knowledge.

## Score and Harvey's feedback

**Pending.** Answers submitted; target 7 / 10.

## Plan close-out — both tracks

| Track | Baseline (Day 1) | Target | Post-training | Status |
|---|---|---|---|---|
| Observability & Structured Logging | not scored by EM | 7 / 10 | submitted Day 10 | ⏳ awaiting Harvey |
| System Design | not scored by EM | 8 / 12 | Day 9 live defense | ⏳ see Day 9 journal |

**Neither baseline number ever came back from Harvey**, so both post-training scores will land
without a measured delta unless he supplies them. Raised in the chat message.
