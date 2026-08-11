# Day 9 cram sheet — skim the morning of Mon 2026-08-10

> **What this is:** the procedure, and the one-liners that have survived a challenge. Principles and
> phrasing only.
>
> **What this is not:** answers. The design answers live in `design/qa-bank.md` and that column is
> yours — an answer written for you is worth nothing in a room with no agent in it.

---

## The first 90 seconds — do this before understanding the problem

1. **Read the prompt back out loud**, then write the constraints in the corner as a checklist.
2. **Ask "anything I've missed?"** before drawing. Day 7's drill captured five of seven constraints
   and silently dropped the biggest one.
3. Draw the skeleton from `design/skeleton.md`. Deleting a box out loud — *"no replica here, reads
   are low"* — reads as judgment, not omission.
4. Tick constraints off aloud as you answer them.

## Before answering any follow-up

**Read the question back.** Gap #19 is four misses deep and part one of today is pure interactive
pushback — the exact condition that produces it.

- *"You're asking what **decides** X — so I need to name something that **varies**."*
- **A constant cannot explain a variable.** If the thing you're about to name is identical in both
  cases, it is not the answer, however correct it is.

## When you don't know

- *"That's a guess — here's how I'd check it."* Say it before committing to a cause. Gap #16.
- *"I don't know"* scored better than a plausible story on Day 6. It is an acceptable output.
- When corrected, **say it back**: *"so a desk is independent of a room — noted."* Gap #10.

---

## Lines that are yours — they survived a challenge, use the wording

**On the invariant.** *"Enforcement that has to be remembered gets forgotten."* Both constraints live
in the database: `status = 'available'` on the claim, `unique (user_id, desk_id)` on the queue.

**On the handoff.** *"There is no separate handoff path."* A promotion is claimed with the identical
statement a walk-in uses, so there is nothing bespoke to get wrong. Consequence, stated deliberately
rather than conceded: **a walk-in can beat a promotion, and that is correct** — the system never
double-books, it just doesn't guarantee the promoted member wins the race. What it must then do is
keep the queue moving.

**On why the entry is promoted, not deleted.** *A deleted row cannot be queried, so the failure
leaves no evidence.* Keeping it in `promoted` until the booking service confirms is what makes the
failure detectable at all.

**On the stalled-queue signal.** It keys on the symptom — a free desk with people queued for it is
wrong regardless of cause — so it catches failures nobody has thought of yet.

**On tenancy.** Shared tables with `operator_id`, defended on operational cost:

- schema-per-tenant → **N-way fan-out** for every cross-tenant query, and both your sweep and your
  waitlist detection are cross-tenant
- db-per-tenant → operational cost scales **linearly**: backups, pools, credentials, ×200
- shared tables → cross-tenant aggregation is free, migrations run once

The honest cost, name it before you're asked: **noisy neighbour**, **migration blast radius**, and a
forgotten `WHERE operator_id = ?` leaking one operator's rows to another — structurally impossible
under db-per-tenant, one missing predicate away here. **RLS is "enforcement that has to be remembered
gets forgotten" applied to tenancy** — it moves the predicate from *every developer remembers* to
*the database refuses*. Residual: `SET LOCAL` dies with the transaction, `SET` persists on a pooled
connection.

**On the arrow, not the box.** The conditional update belongs on the arrow into the DB, not in a box:
`UPDATE desks … WHERE id = ? AND location_id = ? AND status = 'available'` → *check affected rows > 0*.
Correct altitude, and it says more than three sentences.

---

## Observability strip — put it on the board unprompted

Four questions, then the two waitlist rows. It is the Growth Area of the plan and it is free signal.

| Question | Signal |
|---|---|
| Is it serving? | request rate, error ratio, latency |
| Did the async work run? | no sweep completed for an operator in > N minutes |
| Is an invariant broken? | `stuck_bookings{operator}` — *label safe: operators bounded* |
| Can I follow one hop? | `trace_id` carried **in the event envelope** — it does not cross a broker on its own |
| Lost promotion | entries in `promoted` with no booking, older than 60s |
| Stalled queue | a desk `available` while entries exist on its waitlist, > 60s |

**Volunteer the hole you found yourself:** the booking service claims the desk, marks the entry
`fulfilled`, then dies before publishing `booking.created`. Desk is `reserved` so stalled-queue is
silent; entry is `fulfilled` so lost-promotion is silent. **The member holds a desk and is never
told.** Saying it before you're asked is worth more than being asked.

## Alerting principles that transfer

- **Key on the absence of expected success, not the presence of an error.** If an error existed to
  log, it wouldn't be a silent failure.
- **A count threshold encodes your traffic; an age threshold encodes your SLO.** `> 5 pending`
  silently assumes a traffic level and breaks at 200 locations; *oldest unswept booking older than N*
  is the same rule at 1 location and at 200.
- **Page on the state signal, diagnose with the step signals.** They are not competing.
- **A signal written by the component it watches freezes at its last healthy value when that
  component dies.** Hence `collect()`, not `.set()`.
- **A firing alert is not evidence that the alert works.** Day 8's `exported_job` collision fired
  permanently while the sweep ran perfectly.

---

## Part one — the stakeholder

It is a **business** conversation. A technical answer to a cost objection scores badly.

- **Acknowledge the concern as legitimate before defending.**
- Have a number, even a rough one — desks sitting empty vs. cost to build and run.
- Have a genuinely cheaper alternative ready, and concede if it is actually better. *Handling
  disagreement with authority* is a graded behavioural competency: conceding to a good argument
  scores, digging in on a bad one does not.

Your responses go in `design/qa-bank.md`, not here.

---

## Still owed before you present — fill these in yourself

- [ ] **Scale math conclusion.** `30 + (5 × 8) = 70 × 200 = 14,000` is capacity. Still missing:
      throughput (bookings/day, peak), and **what the number implies architecturally**. Stating that
      conclusion out loud is what converts 1.5 → 2.
- [ ] **Tenancy on the board.** Decided, not yet drawn. One line, one box, one constraint.
- [ ] **Release leaves the booking row undefined.** `POST /booking/desks/:id/release` frees the desk;
      nothing says what the *booking* becomes, or that the expiry sweep must not later trip over an
      already-released booking.
- [ ] **Auto-assign vs offer-with-timeout** on promotion — intended, and why?
- [ ] **Can a stale read from the 120s availability cache double-book?** Work it against the claim
      statement.
