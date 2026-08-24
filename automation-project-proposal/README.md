# Automation project proposal — Training Buddy (Claude Code plugin)

**Status:** proposal drafted 2026-08-24, awaiting Harvey's review. Not started.
Pivoted same day from the original Course Companion draft (see git history) — the plugin
ships the same learning loop with zero product dependencies.

## Where this comes from

Item 4 of Harvey's ad-hoc activity plan (post-2-week-plan, undated):

> Propose a project that would help automate a task or activity in FS Learning.
> Ex. (1) a learning activity that could speed up learning using AI. (2) Integration
> with GP or the likes.

## Ideas considered

| Idea | Verdict | Why |
|---|---|---|
| **Training Buddy** — a Claude Code plugin running a topic-agnostic training-plan loop (orient → quiz → drill → evidence check), generalized from the 2-week plan's commands + working agreement | **Chosen** | The loop already ran a full 10-day plan end-to-end in this repo. The project is generalizing and distributing it — no GP code change, no hosted service, no product-team dependency, and it lands in the company's active Claude push (masterclasses, workshops, badges). |
| Course Companion — AI knowledge checks + weak-spot tracking built into GP courses | Deferred (was the original draft of this proposal) | Same learning loop, but requires GP product changes, a transcript pipeline, and a hosted service before anything is demoable. The plugin proves the loop first; GP integration stays on the roadmap as a later phase. |
| EM-side training-plan automation (baseline grading, progress dashboards, retest generation) | Folded in as a later phase | High value — training plans are run by hand today — but it automates the EM's own workflow, so it should follow a proven mentee-side tool rather than lead. |
| "Ask the Portal" — semantic Q&A over transcribed course videos | Deferred | Buildable and broadly useful, but needs a transcript corpus that doesn't exist yet and has no personal-evidence story. |
| Author publishing pipeline / learning-path recommender | Deferred | Useful tooling, weak standalone proposals. |

## What it is

Training and growth plans at Full Scale are run by hand, per person: the EM writes the plan,
the mentee self-studies, and assessment is manual. Meanwhile the naive way to use AI for
learning — "Claude, teach me X" — fails in a specific, predictable way: **it hands over
answers.** That optimizes for finishing the task, not for being able to reproduce the
reasoning later, which is exactly what a graded assessment (or a client conversation) tests.

Training Buddy is a Claude Code plugin any engineer can point at their own training plan,
whatever the topic. It runs a subject-independent daily loop — the plan file supplies the
material and assessment format, the plugin supplies the discipline:

| Loop stage | What it automates |
|---|---|
| `/day-start` | Orientation: today's objective, prereqs, time budget from the plan file — plus a warm-up quiz on yesterday's material |
| `/quiz` | Socratic quiz, one question at a time, **answers withheld**; escalates recall → application → "what breaks if…"; every miss logged |
| `/explain-back` | Feynman drill: the learner explains a concept, Claude grades it and names the gaps |
| `/drill` | Timed practice exercise **matched to the growth area**, critiqued against a rubric — a whiteboard prompt for system design, a broken scenario for debugging, a review exercise for code quality, a mock stand-up for communication. Drill types come from the plan file, not the plugin. |
| `/day-end` | Verifies the day's evidence exists on disk, updates the status file, drafts the EOD report |

The 2-week plan's versions of these (including its system-design `/design-drill`) are the
prototype — hardwired to one learner, one topic, one assessment. The plugin is the
generalization.

Plus the two assets that made the loop actually work:

- **The buddy contract as plugin rules** — no implementation code until the learner states
  an approach, open design questions turned back into questions, quiz *before* the build
  session. This is the part vanilla Claude usage lacks.
- **The persistent weak-spot list** — every quiz miss is logged with what was answered vs.
  what's true, and retest prep drills that list instead of re-reading everything.

Input is a plan file (topic, days, objectives, deliverables); output is a committed evidence
trail per day — which is also what makes progress **EM-visible without a portal**: the same
journal/deliverable/EOD pattern Harvey reviewed throughout my plan.

## Why this one — the evidence

This is the rare proposal where the prototype predates the proposal. The loop ran one full
training plan end-to-end in this repo: the commands in `.claude/commands/`, the contract in
`CLAUDE.md`, the weak-spot list with 21+ tracked gaps in `journal/STATUS.md`, and the Day 10
retest answered with a question-by-question delta against Day 1 (`deliverables/day-10/`).
That version is one instance; the project is extracting the loop, making it topic-agnostic,
packaging, and documentation — not invention.

## Phasing

| Phase | What | Depends on |
|---|---|---|
| **MVP** | Build the plugin: core loop driven by a plan file (any topic), configurable drill types per growth area, generic weak-spot/status format, docs and an example plan. Pilot on one engineer's growth area — ideally a topic different from mine, to prove the loop is subject-independent. | Nothing — the loop is proven, the material exists |
| **1.5 — EM side** | A plan-authoring command that generates a plan skeleton from a growth area + assessment format, and a weak-spot/progress rollup the EM can read per mentee — trimming the hand-run part of training plans. | MVP feedback |
| **2 — GP integration** | Pull course/objective context from GP so `/day-start` can point at relevant GP courses; optionally post completion or comprehension signals back. | A GP API being available |

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Learners bypass the contract by asking vanilla Claude | The plugin can't prevent it — instead it makes the disciplined path the *convenient* path, and the evidence trail (quiz logs, weak-spot list) shows whether the loop was actually run. |
| The system is overfit to my plan / my topic | The MVP explicitly includes a pilot with a different engineer on a different topic; generalization isn't done until that runs clean. |
| GP integration may not be possible | It's phased last and the plugin is fully useful without it. |

## Deliverables in this directory

- `proposal.html` / `proposal.pdf` — the document for Harvey, same format as the item-2
  (Growth Portal course) proposal.
