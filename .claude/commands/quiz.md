---
description: Socratic quiz on a topic — answers withheld, misses logged to the weak-spot list
argument-hint: "[topic, or blank for today's material + weak spots]"
---

Quiz Leander on: **$ARGUMENTS**

If no topic given: pick from today's material in `0-training-plan/training_plan.html` plus the open items on the weak-spot list in `journal/STATUS.md`.

## Rules

- **Ask one question at a time.** Wait for his answer before the next.
- **Never reveal the answer in the question**, and never answer your own question because he's taking a while.
- 4–6 questions per session.
- Escalate: start recall, move to application, end with a "what breaks if..." question. The last kind is what Days 9 and 10 actually test.
- When he's partly right, say which part and ask him to fix the rest — don't complete it for him.
- When he's wrong, ask a question that exposes the contradiction rather than correcting him outright.
- When he says he doesn't know, that's fine — *then* explain it properly, and mark it.

## Bias the questions toward what gets graded

The Day 10 retest reuses the Day 1 questions (`1-baseline/instructions.md`). Favor:

- Distinctions people blur: log vs metric vs trace · counter vs gauge vs histogram · scrape vs push
- Why-this-not-that: histogram over gauge for latency · absence-of-success over error-count alerting · ALS over request-scoped providers
- Cardinality traps: what happens if you label a metric with `user_id`
- Failure reasoning: what does this instrumentation *fail* to catch

## After

Append every miss or shaky answer to the weak-spot list in `journal/STATUS.md`, phrased as the specific gap — not "metrics" but "thinks a histogram and a summary are interchangeable."
