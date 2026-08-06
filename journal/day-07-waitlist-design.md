# Day 7 — Extend the Design: Real-Time Waitlist

**Date:** Thu 2026-08-06 · **Track:** System Design · **Prereq:** Day 1 baseline design

**Objective:** independently extend the Day 1 co-working design with a real-time waitlist —
when a desk frees up early it reallocates to the next waitlisted member, without ever
double-booking during the handoff.

**Deliverable — merged to `master` in [PR #4](https://github.com/llubgubanfs/2-week-training-plan-journey/pull/4) (`a2cbe07`):**

| Evidence | Path |
|---|---|
| Diagram, source + export | `deliverables/day-07/waitlist-design.excalidraw` · `.png` |
| Written notes | `deliverables/day-07/waitlist-notes.md` |
| Drill 01 record + critique | `design/drills/01-ride-dispatch.md` |

---

## Warm-up quiz — ~1.75 / 3

Three questions on Day 6 (tracing). Full grading in `STATUS.md`.

- **Q1 — near full.** What Jaeger shows when a caught rejection is followed by SIGKILL 200ms
  later: *"nothing, because the pod was killed and it stayed in the buffer."* Right answer, right
  mechanism, unprompted. Did not name which of the two gates failed — both spans passed `end()`;
  only the **flush** gate failed.
- **Gap #1 CLOSED.** What a trace answers that `correlation_id` cannot: **structure** — *"a tree…
  how long a process is relative to its parent… what triggered it."* Parentage is exactly what
  timestamps cannot reconstruct. Still not produced: that `traceparent` is a **W3C standard**, so
  uninstrumented libraries join the trace without agreeing a header name.
- **Gap #19 re-missed, 4th instance.** Asked for two causes of a `trace_id` that Jaeger cannot
  find, answered with causes of the *downstream call* failing (timeout, `ECONNREFUSED`) and then
  reached for the absence-of-success theme — the identical adjacent-answer pair recorded on Day 6.
  **The right answer was already written in his own `deliverables/day-06/README.md`:** sampling.
  A log line is never sampled, so it can carry a `trace_id` whose trace was never exported.

## `/design-drill` 01 — ride dispatch, 15 min timed, 3 / 12

First drill of the plan. Deliberately not the co-working prompt (graded Monday) and not a
hold-queue shape (today's deliverable). Full critique in `design/drills/01-ride-dispatch.md`.

The two findings that mattered:

- **Gap #11 confirmed, third instance.** `500k rides/day` was copied into the corner and never
  converted into anything. `60 cities` — the partitioning lever — was never captured at all. The
  arithmetic was cheap and would have paid: ~6 bookings/sec average, ~23/sec peak, against
  thousands of location writes/sec. Two orders of magnitude, which is precisely the justification
  for the `location service` split he had already drawn.
- **Gap #20 opened.** The prompt's one hard rule — never two rides per driver — had no mechanism
  anywhere on the diagram. He produced exactly this shape unaided on Day 1 for desks, which is why
  he is rated Strong on relational. **The gap is transfer under a new frame, not knowledge.**

## The baseline rebuild — 8 / 12

Redrawn from scratch before the waitlist was added, because the Day 1 version was an entity
sketch rather than a system diagram.

| Dimension | Day 1 | Drill 01 | Rebuild |
|---|---|---|---|
| Requirements & scope | — | 1 | 1.5 |
| Scale math | 0 (`skipped`) | 0.5 | 1.5 |
| Data model & invariant | strong verbally, undrawn | 0 | **2** |
| Data flow | — | 1 | 1.5 |
| Caching | — | 0.5 | 1.5 |
| Failure & observability | — | 0 | 0 |
| | | **3** | **8** |

**Gap #20 closed the same day it opened** — the conditional update on the board, on both
resources, as an arrow label rather than a box.

## The waitlist extension

Event-driven, five hops, all through a broker:

```
release / expiry sweep  ──desk.freed──▶  waitlist service
    (oldest entry by timestamp, waiting → promoted)
                        ──waitlist.promoted──▶  booking service
    (conditional claim; on success → fulfilled)
                        ──booking.created──▶  notification → push gateway → member
```

**How double-booking is prevented during the handoff:** there is no separate handoff path. A
promotion is claimed with the identical statement a walk-in uses, so two concurrent claims
serialise on the row and the second matches nothing. A walk-in can therefore beat a promotion —
correct behaviour, not a bug, provided the queue keeps moving afterwards.

## What I learned

**A box earns its place when it can fail, scale or deploy independently.** The practical test:
would it be its own line in `docker compose ps`? Everything else is a label on an arrow, and
labels are cheap. The `compose` file I already wrote *is* a system diagram — the instinct was
there, it just hadn't been recognised as system design because it wasn't drawn.

**The skeleton is free; every box after it must be forced by a line in the prompt.** A diagram
that would be identical for a blog answers nothing about *this* problem, and cannot be defended.

**Subtraction with a reason scores like addition with a reason.** Merging the two booking services
and (in the drill) deleting a read replica because the arithmetic said 23 req/s — both are design
work, and most people only ever do the additive half.

**Exclusivity does not always need machinery.** A unique index, a conditional update, or a lock
service are three very different costs, and the database row is already a lock. Reach for it
before reaching for Redis.

**Detection keys on state, not on errors.** A silent failure has no exception to catch, so the
question is *what row exists right now that shouldn't* — and the answer needs a status predicate
(not just a timestamp) and a grace period, or it fires on every normal cycle and gets muted.

**Transient and permanent failures cannot share a detection mechanism.** A heartbeat proves the
job ran; it says nothing about the row the job structurally cannot see.

**A deleted row cannot be queried.** Which is why the waitlist entry becomes `promoted` rather
than disappearing — otherwise a lost promotion leaves no evidence anywhere.

**A `trace_id` does not cross a message broker on its own.** It has to travel in the message
envelope, or the trace ends at the publisher.

## What I got stuck on

**Defining what a component even is.** The blocker at the start of the day, and it was a
vocabulary gap rather than a reasoning one: thinking in code-level terms and having no confident
altitude to move to. `[client] → [server] → [cache] → [database]` was as far as it went. That is
not wrong — it is the skeleton — but it is generic, and generic cannot be defended. Named
directly, and it turned out to explain **gap #11**: reaching for a data model when asked how
something scales, because the data model was the only vocabulary I owned.

**Multi-tenancy — skipped for the second time.** It is the first word of the prompt and it did not
appear on either version of the board. Decided today that the tenant is the **operator**, because
an operator runs one or more locations — which makes `location_id` a child of the tenant key, not
the tenant key. **The isolation mechanism is still undecided,** and the reason it is hard is worth
keeping: a tenant resolver in the request path cannot cover the expiry sweep, which has no request
and legitimately needs to see every tenant. Either two mechanisms with two chances to diverge, or
enforcement does not belong in the request path at all. Recorded as an open question on the board
rather than drawn as a box I could not defend. Gap **#21**.

**Reading "early" as "expired".** The plan says *when a desk frees up **early***, and the first
version's only trigger was the expiry sweep — a booking ending on time. A member leaving at 2pm on
a booking held until 6pm had no path through the system, which makes the waitlist as slow as no
waitlist. Fixed by adding `POST /booking/desks/:id/release`, but it is the third time this week a
constraint was written down and then not answered.

**Two lines on the observability strip were not mine.** `lost promotion` and `stalled queue` were
handed over under time pressure while shipping. Recorded here so I do not later believe I produced
them. What I owe before Monday is the re-derivation: *a deleted row cannot be queried, so the
failure would leave no evidence* — which is the whole reason for the state change.

**Doing the arithmetic and drawing no conclusion from it.** 14,000 is on the board and nothing
follows from it. One shared database and one shared cache is very likely right at that size, but
unsaid it reads as not having considered it.

**Observability scored 0 on the base rebuild** — the third design artefact in a row with none —
and the sharpest version of that: I drew the expiry worker, which is the silent-failure scenario I
raised in my own interview, and did not instrument it. Corrected before shipping.

## Open questions / carry-over

- **Multi-tenancy isolation mechanism** — decided the tenant, not the enforcement. Monday probe.
- **Auto-assign vs offer-with-timeout on promotion** — currently auto-assign by default rather
  than by decision. Someone can be given a desk at 3am they no longer want.
- **Can a stale read from the 120s availability cache double-book?** Work it through against the
  claim statement and write the answer down.
- **What does the booking row become on release?** The desk goes `available`; the booking's own
  state is undefined, and the expiry sweep must not later trip over it.
- **`/explain-back` on cardinality and on ALS — neither has ever had a spoken rep.** Day 8 is the
  last slot before the graded day.
