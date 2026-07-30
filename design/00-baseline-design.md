# Day 1 baseline design — reconstruction

> **Fill this in yourself, from memory, alone. Today.**
>
> Why today: this is a hard prereq for Day 7 (extend it with a waitlist) and Day 9 (re-present it from scratch, graded). The diagram from the live session wasn't saved, and your recall of what you drew is decaying by the hour. 30 minutes now saves an hour of guessing on Day 7.
>
> Don't ask Claude what the answers should be — Days 7 and 9 are graded on your independent reasoning. Write down what you *actually said*, including the parts you now think were wrong. The gap between what you drew and what you'd draw today is the most useful thing on this page.

**Session:** Wed 2026-07-29, 11:30–12:00, live with Harvey Martus
**Status:** ⬜ not yet filled in

---

## The prompt as given

> Design the backend for a multi-tenant co-working space platform where members reserve desks and meeting rooms across many locations. A desk can never be double-booked. The design must scale to 200 locations. Walk through the components, the data flow, where caching fits, and how background jobs are structured.

---

## 1. What I clarified before designing

<!-- Which questions did you actually ask? Which assumptions did you state? -->

## 2. Scale assumptions I used

<!-- Did you do the arithmetic out loud? Locations x desks, bookings/day, peak. If you skipped this, write "skipped" — that's a finding, not a failure. -->

## 3. Components I drew

<!-- List the boxes. Note which you added unprompted vs. after a question from Harvey. -->

## 4. Data model

<!-- Tables/entities. How exactly is double-booking prevented, and where does that enforcement live? -->

## 5. Data flow — reserving a desk

<!-- Walk the request through the components, in order. -->

## 6. Where caching fit

<!-- What was cached, where, TTL, and how it got invalidated. -->

## 7. Background jobs

<!-- What ran off the request path, what triggered each. -->

## 8. Multi-tenancy

<!-- How did you handle "multi-tenant"? Shared tables + tenant column, schema per tenant, DB per tenant? Did it come up at all? -->

## 9. Scaling to 200 locations

<!-- What you said breaks first, and what you'd do about it. -->

---

## Harvey's follow-up questions

<!-- As many as you can recall, and how you answered. These are the best possible predictor of Day 9 — the same probes tend to come back. -->

| Question | How I answered | How I'd answer now |
|---|---|---|
|  |  |  |

---

## My own post-mortem

**What I think went well:**

**What felt weak in the moment:**

**What I'd draw differently now:**

**Questions I couldn't answer:**

---

## Artifacts

- [ ] Excalidraw file exported to `design/` (recreate it — do not skip; Day 9 needs the muscle memory, not just the notes)
- [ ] Diagram matches the skeleton in `design/skeleton.md`
