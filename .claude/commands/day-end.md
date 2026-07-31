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

## 4. Draft the two daily updates

Harvey's instruction (Day 3): **progress goes to Rocks, links and docs go to chat.** Draft both, in English, and show them for approval before he sends. Record both in `deliverables/eod-updates.md`.

### 4a. Rocks — Daily Status Report

The progress narrative. Bullets, plain, first person:

```
# What I did today

- <what shipped, specific>
- <anything done beyond what the plan asked for — this is the signal>

---

# What I will be doing the next working day

- Day N+1: <topic from the plan>
- <the concrete deliverable>
```

Lead with judgement, not compliance. "Built the endpoint the plan asked for" is table stakes; the decisions taken *around* it are what move the Growth Area rating. If a bug was found in his own earlier work, say so — voluntarily reporting it reads better than it costs.

### 4b. Chat with Harvey

Short and operational: PR link, pointers to the committed docs, and **anything needing a decision from him**. No progress prose — that's Rocks' job, and duplicating it ignores an explicit instruction.

Keep both factual. If something didn't get finished it goes in the next-day list — not omitted.
