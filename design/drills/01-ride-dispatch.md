# Drill 01 — Ride dispatch

**Day 7 · Thu 2026-08-06 · 15 minutes, timed · first drill of the plan**

Diagram: `~/Documents/excalidraws/ride-hailing-system-design-1.png`

## The prompt

> You're designing the dispatch system for a ride-hailing service.
>
> Riders open the app and request a ride from their current location. The system assigns **one
> available driver** to that ride. A driver can be assigned to **at most one ride at a time** —
> never two. Drivers come online and go offline continuously, and their location updates while
> they're driving.
>
> Scale: **60 cities**, ~**500,000 rides per day**, peaks at **8am and 6pm** where a third of the
> day's volume lands in about two hours.
>
> Walk me through: (1) components, (2) data flow for one ride request end to end, (3) where you'd
> cache and what happens when the cached thing changes, (4) background jobs.

Chosen deliberately: resource-allocation-with-exclusivity so the skeleton transfers, but **not**
the co-working prompt (graded Day 9) and not a hold-queue shape (that is the Day 7 deliverable).

## What he drew

Constraints written in the corner first — the procedure was followed. Nine boxes: rider client and
driver client drawn separately, edge/LB, stateless ride-hailing API with N replicas, **hailing
service** and **location service** split apart, primary DB, read replica, a cache labelled "exact
locations of riders and drivers", and a push gateway carrying location deltas.

Routes labelled: `/book`, `/update-location`, `/accept-ride`, `writes booking`, `notify booking
confirmed`.

## Score — 3 / 12 (target 8)

| Dimension | Score | Why |
|---|---|---|
| Requirements & scope | 1 | Constraints written down unprompted — real progress. But **60 cities was never captured at all**, the peak constraint was **misread** as a range, and the invariant was never stated as a rule to enforce. |
| Scale math | 0.5 | `N replicas` and a read replica are named, but no number was converted into anything. No req/s derived. The largest lever in the prompt (60 cities → partitioning) is absent. |
| Data model & invariant | 0 | **Nothing on the diagram prevents one driver being assigned two rides.** No unique constraint, no conditional update, no driver state. This is the prompt's single hard rule. |
| Data flow | 1 | `/book` traces end to end coherently. But **nothing flows into the matching step** — the hailing service has no arrow from the cache or the location service, so the decision has no input. `/accept-ride` is labelled but not routed. |
| Caching | 0.5 | Contents named rather than "add Redis" — credit for that. But no TTL, no invalidation, and **no arrow out of it**, so nothing reads it. The rubric question (what happens when it changes) is unanswered. |
| Failure modes & observability | 0 | Nothing. No failure path, no what-breaks, no observability strip. Cheapest points on the board, given the Growth Area. |

## The strongest move

**Splitting `location service` from `hailing service`.** That is a genuine design insight and most
first attempts do not have it. The two write paths have wildly different rates and wildly different
consistency needs, and putting them in one service means the loud one drowns the quiet one.

The arithmetic that would have turned it into points, and which was available:

- 500k rides/day ÷ 86,400 ≈ **6 bookings/sec** average; a third of the day's volume in two hours ≈
  **23 bookings/sec** at peak. Small.
- Drivers online at peak, pinging every ~4s, is on the order of **thousands of writes/sec**.

Location writes outnumber bookings by roughly **two orders of magnitude**. That single ratio is the
whole justification for the split he had already drawn. The instinct was right; the number was never
reached for.

Second-strongest: drawing rider and driver as **two separate clients**. Most people draw one box and
lose the two-sided nature of the system for the rest of the session.

## The one thing that would cost the most points

**The invariant is not enforced anywhere on the diagram.**

The prompt states one hard rule — a driver is never assigned two rides at once — and there is no
mechanism for it. The hailing service writes a booking to the primary DB with no constraint, no
conditional update, and no driver state anywhere in the picture.

It is worse than a blank, because the cache makes it actively dangerous: driver locations live in a
cache with no invalidation, and if matching reads availability from there, two concurrent requests
can both see the same driver as free. That is the double-assignment, drawn.

**He owns this skill.** On Day 1, on the co-working prompt, he produced app-level validation *and* a
composite unique constraint *and* explicit reasoning about two concurrent requests racing —
unprompted, and it is why he is rated Strong on relational. It did not transfer to a new domain
fifteen minutes after being told the rule out loud. **The gap is transfer, not knowledge.**

## Drill for next time

Before adding any further box, point at the diagram and say out loud:

> **"The rule is X. Here is the single place it is enforced."**

If the finger has nowhere to land, that is the next box — and it goes in before caching, before
replicas, before anything else. Run this on the Day 7 waitlist design today and again on Day 9.

Secondary, and nearly free: **ask "anything I've missed?" after reading the constraints back.** Five
constraints were captured, two were not. That question is the only thing standing between a misread
prompt and fifteen minutes spent answering the wrong question.
