
# Course Proposal Audit: Observability — 3 Pillars

**Verdict: Do not approve yet — closest to approval of the three proposals audited.** Gate fails on F6 only (blocking on its own); F2 and F5 need light work. Design is largely sound; strongest process quality seen so far (explicit, point-by-point feedback-response log across two prior EM review rounds).

---

## Gate (F1–F7)

| Code | Item | Status | Notes |
|---|---|---|---|
| F1 | Strategic fit | Pass | Origin is the proposer's training plan, but unlike Docker Swarm it explicitly names who else benefits — other engineers plus non-engineering roles (QA, UI/UX, PM). Would be stronger with a concrete incident/demand data point (compare AI Verification's cited production incident), but clears the bar. |
| F2 | Target learners / mandate | Needs work | Audience itself is well defined — two explicit tiers (non-engineering conceptual entry point, engineers technical depth). Still missing: mandatory/elective status and expected headcount. |
| F3 | Duplication / tech choice | Pass | Exemplary. Directly names topics considered and ruled out — alerting/on-call, SLOs/error budgets, log aggregation platforms, APM/RUM, synthetic monitoring, chaos engineering, cardinality — with reasoning. This is landscape research done right; use as the reference example. |
| F4 | Build feasibility | Pass | Exemplary. 9 days against a fixed 8-hour day, ~2h daily headroom explicitly reserved for concurrent ad-hoc work (SkillIQ, automation proposal), highest-risk module isolated into its own recording day specifically to contain retake spirals. Most realistic schedule of the three proposals audited. |
| F5 | Success metric / Rocks hookup | Needs work | Pre/post assessment mechanism, ownership (GP-native, hosted and graded by GP), and timing are all defined. Missing: how the result connects to Rocks or checkpoint-rating tracking. |
| F6 | Maintenance owner | Fail | Not addressed. Blocking on its own. Lower urgency than a version-pinned tool proposal, but the demo app (Postgres, env-schema validation, host-metrics exporter) still needs someone responsible as dependencies drift. |
| F7 | Platform / infra fit | Pass | Video-only delivery with a GP-native quiz means there's no learner-side environment to provision at all — this sidesteps the infra problem that weakened both prior proposals. The demo-app build is delegated and reviewed, not something learners need to replicate. |

---

## Design (C1–C7)

| Code | Item | Status | Notes |
|---|---|---|---|
| C1 | Objectives | Needs work | No numbered, assessable objective list — the Objective section is a single descriptive paragraph, and the module "Covers" column does the real work of stating outcomes but isn't formatted as one. Content is there; formalize it. |
| C2 | Learner analysis | Pass | Two-tier structure is a genuine audience analysis, not just a label. Stack-agnostic design principle ("the framework is the vehicle, not the subject... reasoning transfers to a different stack") substitutes reasonably for an explicit prerequisites list. |
| C3 | Assessment | Needs work | Mechanism, ownership, and sequencing (question bank written after scripts lock, so it tests real content) are well thought through. Missing: pass threshold. Worth naming explicitly: a whole-course quiz measures recall, not applied behavior change — a reasonable tradeoff for video-only delivery, but state it as a deliberate choice. |
| C4 | Curriculum | Needs work | Per-module content is specific and mechanism-first. Missing: per-module duration estimate. Note: the whole-course-only assessment (vs. per-module) was an explicit EM decision, not an oversight — don't re-flag that as a gap. |
| C5 | Instructional strategy | Pass | Stated plainly: scripted, edited, produced video, not a single take, posted to GP with tier labels for self-selection. |
| C6 | Materials | Pass | Demo app and at least one wiring diagram (Module 3) are referenced as supporting material. Would be marginally stronger with an explicit list of what ships alongside the video (repo link, diagrams), but not a real gap for a video-centric course. |
| C7 | Feedback loops | Needs work | Same pattern seen in the AI Verification audit: whole-course pre/post only, no mid-course checkpoint. The proposal itself flags Module 3 as highest-risk — that's exactly where a lightweight self-check would catch confusion early. This recurring gap across proposals suggests the template should prompt for it explicitly rather than relying on each proposer to think of it. |

---

## Alignment note

The question bank doesn't exist yet — it's correctly deferred to Day 7, after all five module scripts lock, so it tests real content instead of a draft. That's good sequencing, but it means alignment can't be verified at proposal stage. Flag for the Day 8 EM review: confirm the question bank actually covers all five module topics (including the Module 3 host-metrics addition), not just the three original pillars.

No scope-split needed — module count and schedule are tightly matched, and F3's landscape research already shows deliberate scope discipline (same strength seen in the AI Verification proposal, absent from Docker Swarm).

---

## Priority revision list

1. F6 — name a maintenance owner for the course and its demo app.
2. F2 — state mandatory/elective status and expected headcount.
3. F5 — define how the pre/post assessment result connects to Rocks or checkpoint tracking.
4. C1 — reformat the module "Covers" descriptions into a numbered, assessable objective list.
5. C3 — set a pass threshold for the post-assessment; name the recall-vs-applied-skill tradeoff explicitly as a deliberate choice.
6. Day 8 review — verify the Day-7 question bank covers all five module topics once it's written.
7. C4 — add a rough per-module duration estimate.
8. C7 — decide and state whether a lightweight mid-course check (e.g., after Module 3) is warranted, or confirm whole-course-only is intentional.

Strongest points, worth reusing as reference examples in the template: F3's landscape research, F4's risk-isolated scheduling, and the explicit feedback-response log itself — no other audited proposal has shown a reviewer's critique mapped point-by-point to a specific fix. That pattern is worth requiring in the template for any revised submission.
