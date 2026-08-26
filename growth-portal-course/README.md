# Growth Portal course — Observability

**Status:** scope + schedule locked 2026-08-24. Revising as of 2026-08-26 to incorporate
Harvey's review feedback (see below) — some items resolved, some still open. Day 1 not yet
started.

## Where this comes from

Item 2 of Harvey's ad-hoc activity plan (post-2-week-plan, undated):

> Choose a topic in your 2-weeks training plan and create a course that we will be posted in
> Growth Portal. I would prefer a topic that has growth area in your training plan, like
> observability. Create a plan how to execute this and propose a schedule.

Topic chosen: **observability** — the explicit Growth Area from the 2-week plan, and the one
Harvey named as an example. Almost all source material already exists on disk from Days 2, 3,
6 and 8 of `2-week-training-plan-journey`, plus the weak-spot list in `journal/STATUS.md`.

## Feedback from Harvey

Received after the 2026-08-24 lock, on an earlier video/proposal. Verbatim:

> This is a good start, minimize the jargon, and here are my comments see below
>
> 1. Avoid discussing "gaps" in the content. The knowledge gap may be your starting point, but
>    remember that this will be published in GP as a learning resource for others.
> 2. Observability is a broad subject. Research its different areas, then define which specific
>    topics you intend to cover.
> 3. Explain when each approach should, and should not be used or implemented.
> 4. Demonstrate how structured logging can be applied across the codebase. This may include
>    source code, application configuration, external services, infrastructure, and other
>    relevant components.
> 5. Decide whether the video will provide a high-level overview or an implementation-level
>    discussion. This will help you control its scope and depth.
> 6. The recording estimate appears overly optimistic and may not be realistic. Add enough
>    buffer for preparation, demonstrations, retakes, and editing.

| # | Point | Status |
|---|---|---|
| (preamble) | Minimize jargon | Resolved — see [Jargon](#jargon-plain-language-first-name-the-term-second) below |
| 1 | Avoid "gaps" framing | Resolved — see [Framing](#framing-standard-not-gap) below |
| 2 | Research the landscape, name specific topics | Resolved (predates this revision) — see [Topics considered and ruled out](#topics-considered-and-ruled-out) below |
| 3 | Should/shouldn't per approach | Resolved — drafted for the original 4 modules, plus the host-metrics addition (see Module 3 in Structure below) |
| 4 | Demonstrate structured logging beyond application code | Resolved — see [Demonstrating structured logging beyond application code](#demonstrating-structured-logging-beyond-application-code) below |
| 5 | Overview vs. implementation depth, deliberately decided | Resolved — see [Depth](#depth-a-familiarity-driven-split-not-one-global-ratio) below |
| 6 | Recording estimate too optimistic | Resolved via a new Day 0, and via re-sizing Day 2 (Module 3 script + buffer both grew once host metrics was added) — see [Schedule](#schedule-6-hrsday-buffer-kept-for-other-ad-hoc-items-outside-this-block) below |

## Addressing the feedback

### Framing: standard, not gap

Point 1 said avoid framing content around "gaps." Resolution: frame every module as **"here's
the team's standard"** rather than **"here's what you don't know."** Same content, opposite
framing — a standard has to specify something concrete (a correlation-id format, a metric-tagging
rule, a dead-man's-switch threshold), so it also naturally pulls toward implementation depth
rather than staying abstract. This is also how the course avoids talking down to anyone who's
already done observability work at a client engagement: it reads as calibration to a shared
convention, not remedial teaching.

### Jargon: plain-language-first, name-the-term second

Point (preamble) said minimize jargon. Resolution: every concept gets explained in two beats —
plain language first, with no label attached, then the field term is named once the plain
description has already landed. Example (silent failure detection): "a service can stop doing
its job without crashing or logging an error — nothing alerts you because nothing *looks* wrong.
The fix is something that expects to hear from the service on a schedule and alarms if that goes
quiet. This pattern is called a **dead man's switch**." The proposal doc can carry field
terminology as evidence the research happened (point 2); the course script — especially Module 1
— keeps jargon out until the plain-language beat has already done the work.

### Topics considered and ruled out

Point 2 said research the landscape and name what's in/out. Considered and ruled out, with
reasons: alerting/on-call escalation, SLOs/error budgets, log aggregation platforms
(ELK/Loki/Splunk), APM/RUM, synthetic monitoring, chaos engineering, cost/cardinality as its own
topic. Kept: the 4 topics in the Structure table below, plus host-level metrics as an addition to
Module 3 (see Depth section).

### Depth: a familiarity-driven split, not one global ratio

Point 5 asked for a deliberate overview-vs-implementation call. Harvey phrased it as a binary
("whether... or"); the actual answer is a deliberate *split*, not a single global ratio — worth
saying explicitly when this goes back to him, so it doesn't read as dodging the either/or.

The split is driven by what the audience already has a mental peg for:

| Topic | Passive familiarity | Design/implementation skill |
|---|---|---|
| Structured logging | known (`console.log`) | unknown (structured format, correlation IDs) |
| Metrics (app-level) | known (seen a dashboard) | unknown (tagging, cardinality) |
| Distributed tracing | unknown | unknown |
| Silent failure detection | unknown | unknown |

Logging and metrics get short concept-grounding and most of the module time on the actual
standard, since the audience already has something to hang it on. Tracing and dead-man's-switch
get proportionally more concept-grounding time before the standard lands, since there's no
passive exposure to build on.

### Demonstrating structured logging beyond application code

Point 4 asked for structured logging demonstrated across source code, application configuration,
external services, infrastructure, and other components — not just business logic. Audited
`coworking-obs/` directly against those 5 categories:

| Category | Status | Evidence |
|---|---|---|
| Source code (business logic) | Weak | Only a demo log in `AppService`; no real domain-endpoint logging |
| Application configuration | **Not found** | No log line tied to config/env loading or validation anywhere |
| External services | **Found, strong** | `downstream.service.ts` ↔ `notifier.service.ts` — await and fire-and-forget modes, success and failure paths, logged on both sides of the hop |
| Infrastructure | **Not found, structurally absent** | No DB, no broker — `bookings.store.ts` is in-memory by design (scope fence), so there's no connection/lifecycle logging possible as-is |
| Other (background jobs) | **Found, strong** | `job-runner.ts` + `expiry-sweep.service.ts` — the Day 8 cron's own job-run correlation id via AsyncLocalStorage, `job started`/`completed`/`failed` |

Decision: **extend `coworking-obs`, don't build a second project.** A separate purpose-built
project would give cleaner coverage of the two missing categories, but it reverses the
2026-08-24 decision to build this course from existing graded-plan material specifically to
avoid new-content overhead — and it would add real build time on top of a schedule Harvey already
called optimistic (point 6), while discarding the external-service and background-job material
that's already strong. Extending keeps that material and only builds what's actually missing.

**Day 0 additions** (see Schedule below) close the two real gaps: Postgres + a startup
connection/health-check log (infrastructure — also closes a gap between the original scope
fence, which called for a composite-unique DB constraint, and the in-memory store that actually
got built), and env-schema validation with a log of what got validated (application
configuration). Host-level metrics (CPU/RAM via cAdvisor, chosen over node_exporter since it
matches the per-container shape of this docker-compose stack) was folded in as a should/shouldn't
addition to Module 3 — app-level metrics answer "is my service healthy," host-level metrics
answer "is the machine underneath it healthy."

## What this is trying to showcase

Not a "here's my reusable project" portfolio piece — deliberately ruled out, since the
deployment/distributed-systems depth behind the demo isn't there yet. Not a personal
growth-narrative either — considered, dropped in favor of a tighter course.

**The actual takeaway: observability concepts — the three pillars and why they tie
together — demonstrated in a real NestJS app, where NestJS is the vehicle, not the subject.**
Anyone learning this on a different stack should still get value from the mechanism being
taught; the framework-specific wiring (`ClsModule`, decorators, etc.) is incidental detail, not
the point.

**Narration discipline, applied to every engineer-deep module:** explain the mechanism in plain
language *before* any code appears on screen, then show the real implementation as "here's what
that looks like in this app." Check: would the explanation sentence still hold if the demo were
Express instead of NestJS? If not, it drifted into framework tutorial territory — rewrite it
before moving on. This matters because it's a documented failure pattern (`journal/STATUS.md`
weak-spot #5): explaining a mechanism by restating the API surface instead of the actual reason
it works.

## Audience

Primarily engineers. Secondary: QA, UI/UX, PMs — people assigned outside the field who may
still watch. This is why the course is tiered rather than pitched at one level throughout.

## Structure

Tiered: one shared/accessible module everyone can follow, then engineer-deep modules that
assume a coding background. No bonus/"what I got wrong" module — considered, dropped once the
differentiator settled on concept-first-and-demonstrated rather than a growth narrative.

| Tier | Module | Source | Content |
|---|---|---|---|
| Shared (everyone) | 1. Why observability, and the 3 pillars | orientation, no direct Day source | No jargon, no code. Coworking-obs told as a before/after story — what we couldn't see, what we can see now, why it matters. |
| Engineer-deep | 2. Structured logging + correlation ids | Day 2/3, `journal/`, ALS decision in `CLAUDE.md`, Day 0 additions (Postgres health-check log, env-validation log) | Why a shared variable can't hold a per-request id across an `await`; `ClsMiddleware`, correlation id creation site; structured logging applied outside request handlers — config validation, infra connection lifecycle. |
| Engineer-deep | 3. Metrics that survive scale | Day 3, Day 0 addition (cAdvisor + Grafana panel) | Why `req.originalUrl` as a label blows up cardinality; route-template labels; counter vs. gauge; error ratio derived, not double-counted. Should/shouldn't addition — host-level metrics (CPU/RAM via cAdvisor): **should** use them to diagnose whether the machine/container itself is the bottleneck (the process genuinely maxed out — the cook chopping as fast as physically possible). **Shouldn't** rely on them to diagnose service slowness generally — healthy CPU/RAM alongside a slow service isn't "no problem found," it's a sign the bottleneck is I/O-bound (a slow downstream call, DB query, disk, or lock — the cook standing idle waiting on a delivery truck), which host metrics are structurally blind to; look at app-level metrics or tracing instead. |
| Engineer-deep | 4. Distributed tracing | Day 6 | Membership (`correlation_id`) vs. structure (span tree); the two-gate span export rule (`end()` + flush). |
| Engineer-deep | 5. Detecting silent failure | Day 8 | Absence-of-success vs. presence-of-error; state vs. step signals; the deadman's-switch problem. |

## Format

Recorded video course, produced (scripted, editable, re-takes allowed) — not a single-take live
defense like Days 9/10. Posted to Growth Portal once reviewed.

## Schedule (6 hrs/day, buffer kept for other ad-hoc items outside this block)

| Day | Blocks |
|---|---|
| 0 | Build day, added 2026-08-26 to close point 4's gaps. Implementation (Postgres + health-check log, env-schema validation, cAdvisor + Prometheus scrape config + Grafana panel) is delegated/parallel — near-zero draw on this day. **1.5h** review/understand what got built, enough to narrate it plainly later · **1h** hands-on verification — run the stack, confirm `verify.sh` green, click through the new panel, hit the health-check endpoint · **1h** buffer (first-time infra — Postgres, an exporter — is where something unexpected tends to surface) |
| 1 | 45m outline doc (this file) · 30m Module 1 material pull · 2.5h Module 1 script · 45m read-back/revise · 1h buffer |
| 2 | 30m re-read Day 2/3 source · 1.75h Module 2 script · 2.25h Module 3 script (grew from 1.75h — the host-metrics addition sizes to roughly ⅓ more, same shape as the block's other 3 items) · 30m capture-clip list · 30m read-aloud check (Modules 2–3) · 1h buffer (grew from 30m to match Days 1/4/5's convention, since the day now carries new-content risk on top of two full module scripts) — **6.5h total, the one day in this schedule that runs longer than the 6hr/day yardstick** |
| 3 | 30m diagram review (exporter → Prometheus → Grafana wiring diagram, production delegated — this is review/revision time; needs to be finished before it's presented live on Day 4) · 30m re-read Day 6/8 source · 1.75h Module 4 script · 1.75h Module 5 script · 30m full run-through/pacing check across all 5 (diagram checked alongside, since it needs to be part of the pacing) · 30m read-aloud check (Modules 4–5) · 30m buffer — **6h total** |
| 4 | 30m setup (screen recorder, audio check, stack up — `docker compose up -d`, `verify.sh` green) · 4.5h recording, re-takes allowed per module · 1h buffer |
| 5 | 1.5h cut/trim · 1h tier labels ("for everyone" / "assumes engineering background") · 1.5h self-review vs. objectives · 30m full watch-through for pacing/coherence · 30m export · 1h buffer |
| 6 | Review pass with Harvey, incorporate feedback, publish to Growth Portal — bound by his turnaround, not hours worked |

Note: this 6-day window runs in parallel with items 3 (SkillIQ) and 4 (automation project idea)
from the same ad-hoc plan, which are self-paced and happen outside this time block — not
stacked on top of it as additional days.

## Content sources (for scripting)

- `journal/day-02-*.md`, `journal/day-03-*.md`, `journal/day-06-*.md`, `journal/day-08-*.md`
- `deliverables/day-02/`, `deliverables/day-03/`, `deliverables/day-06/`, `deliverables/day-08/`
- `journal/STATUS.md` — weak-spot list, for the misconceptions worth addressing head-on in
  Modules 2–5 (not as a dedicated module, but folded into the relevant explanation)
- `coworking-obs/` — the live demo, plus the Day 0 additions (Postgres + health-check log,
  env-schema validation, cAdvisor + Grafana panel) once built

## Open items

None outstanding as of 2026-08-26 — the three items tracked here (host-metrics should/shouldn't,
Module 3 script-time, diagram placement) are all resolved above. Still genuinely pending:
Harvey's sign-off on this revised schedule, and item 4's build work (Day 0) hasn't started.
