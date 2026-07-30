# Day 9 Q&A bank

> Questions Harvey is likely to ask, collected as we go. **The answers column is yours to fill** — a question with an answer written by Claude is worth nothing on Day 9, when no agent is present.
>
> Working method: attempt an answer cold, then run `/explain-back <topic>` and have Claude grade it. Update the answer with what survived.

---

## On the invariant (your strongest ground)

| Question | My answer | Graded? |
|---|---|---|
| Two members submit for the same desk in the same millisecond. Walk me through what happens. |  | ⬜ |
| Why enforce the constraint in the database rather than in application code? |  | ⬜ |
| What does the losing request get back, and what does the user see? |  | ⬜ |
| Meeting rooms book by time *range*, not a slot. How does the constraint change? |  | ⬜ |

## On caching

| Question | My answer | Graded? |
|---|---|---|
| A member sees a desk as available, tries to book, and it's gone. How do you make that failure graceful? |  | ⬜ |
| What exactly do you invalidate when a booking succeeds? |  | ⬜ |
| Why not just cache for 5 seconds and skip invalidation entirely? |  | ⬜ |

## On background jobs

| Question | My answer | Graded? |
|---|---|---|
| What happens if the waitlist promotion job runs twice on the same release? |  | ⬜ |
| A worker dies holding a job. What happens? |  | ⬜ |
| How do you know the job ran at all? |  | ⬜ (Day 8 answers this) |

## On scale

| Question | My answer | Graded? |
|---|---|---|
| What breaks first going from 5 locations to 200? |  | ⬜ |
| Would you shard? By what key? What does that make hard? |  | ⬜ |
| 9am peaks across timezones — does that help you or hurt you? |  | ⬜ |

## On multi-tenancy

| Question | My answer | Graded? |
|---|---|---|
| Shared tables with a tenant column, schema per tenant, or DB per tenant — and why? |  | ⬜ |
| How do you stop one tenant's traffic degrading everyone else's? |  | ⬜ |

## On the waitlist (Day 7 output feeds this)

| Question | My answer | Graded? |
|---|---|---|
| A desk frees up. Walk the handoff to the next waitlisted member without a double-booking window. |  | ⬜ |
| The promoted member never confirms. Then what? |  | ⬜ |
| 50 people are waitlisted on one desk that frees at 9am. What happens? |  | ⬜ |
| Is it FIFO? Per desk or per location? What if someone is waitlisted on two desks? |  | ⬜ |

---

## Stakeholder pushback — Day 9 part one

Harvey plays a skeptical stakeholder arguing the waitlist isn't worth building. **This is a business conversation, not a technical one.** A technical answer to a cost objection scores badly.

| Challenge | My response | Graded? |
|---|---|---|
| "This is a lot of engineering for an edge case. Why not just let people refresh the page?" |  | ⬜ |
| "What does this actually earn us?" |  | ⬜ |
| "Can we ship half of it?" |  | ⬜ |
| "If I halve your budget, what goes?" |  | ⬜ |

Prep notes for yourself:
- Acknowledge the concern as legitimate **before** defending
- Have a number, even a rough one — desks sitting empty vs. cost to build and run
- Have a genuinely cheaper alternative ready, and be willing to concede if it's actually better. *Handling disagreement with authority* is a graded behavioural competency; conceding to a good argument scores, digging in on a bad position does not.
