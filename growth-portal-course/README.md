# Growth Portal course — Observability

**Status:** scope + schedule locked 2026-08-24. Day 1 not yet started.

## Where this comes from

Item 2 of Harvey's ad-hoc activity plan (post-2-week-plan, undated):

> Choose a topic in your 2-weeks training plan and create a course that we will be posted in
> Growth Portal. I would prefer a topic that has growth area in your training plan, like
> observability. Create a plan how to execute this and propose a schedule.

Topic chosen: **observability** — the explicit Growth Area from the 2-week plan, and the one
Harvey named as an example. Almost all source material already exists on disk from Days 2, 3,
6 and 8 of `2-week-training-plan-journey`, plus the weak-spot list in `journal/STATUS.md`.

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
| Engineer-deep | 2. Structured logging + correlation ids | Day 2/3, `journal/`, ALS decision in `CLAUDE.md` | Why a shared variable can't hold a per-request id across an `await`; `ClsMiddleware`, correlation id creation site. |
| Engineer-deep | 3. Metrics that survive scale | Day 3 | Why `req.originalUrl` as a label blows up cardinality; route-template labels; counter vs. gauge; error ratio derived, not double-counted. |
| Engineer-deep | 4. Distributed tracing | Day 6 | Membership (`correlation_id`) vs. structure (span tree); the two-gate span export rule (`end()` + flush). |
| Engineer-deep | 5. Detecting silent failure | Day 8 | Absence-of-success vs. presence-of-error; state vs. step signals; the deadman's-switch problem. |

## Format

Recorded video course, produced (scripted, editable, re-takes allowed) — not a single-take live
defense like Days 9/10. Posted to Growth Portal once reviewed.

## Schedule (6 hrs/day, buffer kept for other ad-hoc items outside this block)

| Day | Blocks |
|---|---|
| 1 | 45m outline doc (this file) · 30m Module 1 material pull · 2.5h Module 1 script · 45m read-back/revise · 1h buffer |
| 2 | 30m re-read Day 2/3 source · 1.75h Module 2 script · 1.75h Module 3 script · 30m capture-clip list · 30m read-aloud check (Modules 2–3) · 30m buffer |
| 3 | 30m re-read Day 6/8 source · 1.75h Module 4 script · 1.75h Module 5 script · 30m full run-through/pacing check across all 5 · 30m read-aloud check (Modules 4–5) · 30m buffer |
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
- `coworking-obs/` — the live demo
