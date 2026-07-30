---
description: Close out the day — verify evidence exists, update STATUS.md, draft the EOD message to Harvey
---

Close out the training day.

## 1. Verify the deliverable — evidence, not vibes

Look up today's deliverable in `0-training-plan/training_plan.html` and **check it actually exists on disk**:

- Files/screenshots present under `deliverables/`?
- Code committed, not just sitting dirty in the working tree?
- If the deliverable is "a working X", **run it** and paste the real output.

A day is not done because the code works. It is done when the artifact Harvey will look at exists and is committed. If evidence is missing, say so plainly and do not mark the day complete.

## 2. Update `journal/STATUS.md`

- Flip today's row in the calendar table
- Fill in the day log: what got done, what's pending, notes worth keeping
- Move anything unfinished into **Carry-over**
- Append any new quiz misses or review gaps to the **weak-spot list**
- Add any new questions for Harvey

## 3. Finish the day's journal entry

Complete `journal/day-NN-*.md` — especially *what he got stuck on*, which is the highest-value part for Day 9/10 prep.

## 4. Draft the EOD message

Append to `deliverables/eod-updates.md` and show it for approval before he sends it. Format, in English, short enough to paste into chat:

```
Day N — <topic>

Done:
- <specific, with evidence: PR link, screenshot name, endpoint that responds>

Blocked:
- <blocker, or "Nothing blocking">

Tomorrow:
- <Day N+1 objective from the plan>
```

Keep it factual. If something didn't get finished, it goes under Blocked or Tomorrow — not omitted.
