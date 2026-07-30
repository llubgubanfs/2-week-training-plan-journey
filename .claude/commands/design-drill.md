---
description: Timed 15-minute system design prompt, then critique against the Day 9 rubric
argument-hint: "[optional: specific prompt, or blank to pick one]"
---

Run a timed system design drill. This trains the two things Leander named as weak on Day 1: **thinking on his feet** and **drawing under time pressure**.

## Setup

If `$ARGUMENTS` is empty, pick an unused prompt from `design/drills/` — check which have already been run. Use a resource-allocation-with-exclusivity problem so the skeleton in `design/skeleton.md` transfers, but **not** the co-working prompt itself (that's the graded one; drilling it directly just rehearses an answer instead of building the skill):

- Event ticketing — seats can't be double-sold, on-sale spike
- Fleet dispatch — one driver per ride, geographic partitioning
- Clinic appointments — one slot per doctor, no-show reallocation
- Parking garage — one bay per car, real-time occupancy
- Library lending — one copy per borrower, hold queue

## Rules

1. State the prompt, tell him the clock starts now, **15 minutes**.
2. **Then stay out of the way.** Do not offer hints, do not answer questions about the design, do not react to partial work. If he asks "should I use X?", reply that it's his call and the clock is running. Days 7 and 9 are graded on independent reasoning.
3. He works in Excalidraw and reports back — either a description or an exported image into `design/drills/`.

## Critique — after he's done, not during

Score each dimension 0–2 and give the total out of 12, matching the Day 9 assessment shape:

| Dimension | Looking for |
|---|---|
| Requirements & scope | Did he clarify before designing? Did he state the invariant explicitly? |
| Scale math | Did he put numbers on it out loud, or hand-wave? |
| Data model & invariant | Is the exclusivity constraint enforced where it can't be bypassed? |
| Data flow | Can he walk one request end-to-end through every box? |
| Caching | What, where, TTL, and **invalidation** — not just "add Redis" |
| Failure modes & observability | What breaks, and how would he know? |

Then give exactly three things: **the strongest move he made**, **the one thing that would cost the most points**, and **one specific drill for next time**.

Log recurring weaknesses to the weak-spot list in `journal/STATUS.md`. Save the drill and critique to `design/drills/NN-<slug>.md`.
