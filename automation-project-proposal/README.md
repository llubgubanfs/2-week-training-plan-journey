# Automation project proposal — Course Companion

**Status:** proposal drafted 2026-08-24, awaiting Harvey's review. Not started.

## Where this comes from

Item 4 of Harvey's ad-hoc activity plan (post-2-week-plan, undated):

> Propose a project that would help automate a task or activity in FS Learning.
> Ex. (1) a learning activity that could speed up learning using AI. (2) Integration
> with GP or the likes.

## Ideas considered

| Idea | Verdict | Why |
|---|---|---|
| **Course Companion** — AI knowledge checks + weak-spot tracking per GP course | **Chosen** | The one idea with on-disk evidence: it productizes the exact loop the 2-week plan ran on me. Hits both of Harvey's examples at once (AI learning activity *and* GP integration). |
| EM-side training-plan automation (baseline grading, progress dashboards, retest generation) | **Folded in as phase 2** | Highest business value — the training-plan workflow is run by hand today, and my own baseline scores never came back because grading is manual. But it automates the EM's own workflow, so it should follow a proven learner-side MVP rather than lead. |
| "Ask the Portal" — semantic Q&A over transcribed course videos, answers with course + timestamp citations | Deferred | Very buildable and benefits everyone, but no personal-evidence story, and it needs a transcript corpus that doesn't exist yet. |
| Author publishing pipeline — auto transcript, description, skill tags, chapters on course upload | Deferred | Safe and useful (and the enabler for "Ask the Portal"), but small; reads as tooling, not a project proposal. |
| Objective-to-course learning path recommender | Deferred | Value depends entirely on catalog coverage and how well-maintained Career Growth data is — weakest standalone pitch. |

## What it is

Growth Portal courses today are watch-only. The signals that exist are a progress percentage
and the "I learned something useful" button — nothing verifies that the viewer *understood*
the material, and nothing checks whether it *stuck* a week later.

The Course Companion closes that loop, per course:

1. **Generate** — a short knowledge check (3–5 questions) is generated from the course's
   transcript using Claude, reviewed by the course author or an EM before it goes live.
2. **Answer** — the learner takes the check when they finish the course.
3. **Score** — a comprehension score is recorded alongside the existing completion signal.
4. **Track** — missed questions land on the learner's **personal weak-spot list**, tagged by
   course and concept.
5. **Resurface** — weak spots come back later as a short spaced retest, so the score reflects
   retention, not just same-day recall.

## Why this one — the evidence

This is not a hypothetical mechanism. The 2-week training plan ran exactly this loop manually:
Socratic quizzes before each build session, every miss logged to the weak-spot list in
`journal/STATUS.md`, and Day 10 retest prep driven entirely by that list rather than by
re-reading everything. The retest answers include a question-by-question delta against the
Day 1 baseline (`deliverables/day-10/observability-post-training-answers.md`). The proposal is
to automate the loop that already worked, and give it to every GP course.

## Phasing

| Phase | What | GP change needed |
|---|---|---|
| **MVP** | Standalone service alongside GP: takes a course transcript, generates a reviewable quiz, serves it, stores scores and the weak-spot list. Demoable end-to-end on one real course. | None |
| **1.5 — GP integration** | Knowledge check surfaced at course completion; comprehension score visible on the course card next to progress %. | Yes — UI + API hook |
| **2 — EM view** | Weak-spot rollups per mentee, and baseline/retest generation for training plans — automating the plan workflow that is run by hand today. | Yes |

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| AI-generated questions are wrong or trivial | A quiz is a **draft until a human approves it** — course author or EM reviews before it goes live. |
| Assessment data feels like surveillance / performance rating | Framed and scoped as a **learning signal, not a performance-rating input**: the weak-spot list belongs to the learner; rollups (phase 2) are opt-in and mentorship-oriented. |
| Courses have no transcript | Auto-generate one (speech-to-text) as part of ingestion — a side benefit, since transcripts also make the catalog searchable. |

## Proposed stack

NestJS service + Claude API — matches the team stack; detail belongs in a design doc after the
scope is agreed, not here.

## Deliverables in this directory

- `proposal.html` / `proposal.pdf` — the document for Harvey, same format as the item-2
  (Growth Portal course) proposal.
