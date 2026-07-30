# The 90-second skeleton

## Why this exists

On Day 1 you said diagramming under time pressure was weak. The fix isn't "get better at drawing" — it's **removing drawing as a decision**. If the layout is always the same, your hands go on autopilot and your whole brain stays on the reasoning, which is the part actually being scored.

Practise drawing this blank, from memory, until you can do it in **under 90 seconds**. Five reps. Then again the morning of Day 9.

## The layout

Always this arrangement. Same boxes, same positions, every time.

```
   ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌─────────┐
   │ clients │ ──> │  LB/edge │ ──> │   API   │ <-> │  cache  │
   └─────────┘     └──────────┘     └────┬────┘     └─────────┘
                                         │
                                         v
                                  ┌─────────────┐     ┌──────────┐
                                  │ DB primary  │ ──> │ replica  │
                                  └──────┬──────┘     └──────────┘
                                         │
                                         v
                                  ┌─────────┐     ┌──────────┐
                                  │  queue  │ ──> │ workers  │
                                  └─────────┘     └──────────┘

   ══════════════════════════════════════════════════════════════
     observability:  logs  ·  metrics  ·  traces
```

## How to use it live

Draw the skeleton **first**, before you've fully understood the problem. It buys you 90 seconds of thinking time that looks like progress, and it gives the interviewer something to follow.

Then every prompt becomes *"populate the skeleton"* rather than *"invent a picture"*:

- **Cross out what you don't need.** Deleting a box out loud — "no replica here, reads are low" — reads as judgment, not omission.
- **Split a box when the design demands it.** API splits into read path and write path. Workers split per job type.
- **Label the arrows** with what actually flows: `POST /reservations`, `desk.released`, `cache invalidate`.
- **Number the arrows 1..n** when you walk the hot path. Then you can point instead of re-explaining.

## The three things people forget under pressure

1. **The invariant, written on the diagram.** For the co-working prompt: *one desk, one time range, one reservation.* Write it in a box next to the DB. It's the whole point of the question and it should be visibly load-bearing.
2. **Where the constraint is enforced.** An arrow into the DB with `UNIQUE(desk_id, time_range)` next to it says more than three sentences.
3. **The observability strip.** Nearly everyone omits it. Yours is the training plan's Growth Area — putting it on the diagram unprompted is free signal.

## Multi-tenancy note

The Day 1 prompt is explicitly **multi-tenant** across many locations. Decide before Day 9 how tenancy shows up on the diagram — shared tables with a tenant column, schema per tenant, or database per tenant — and be ready to defend the choice on operational cost, not just correctness. Don't leave it implicit; interviewers probe it.
