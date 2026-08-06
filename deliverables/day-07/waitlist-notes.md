# Day 7 — Real-time waitlist extension

**Track:** System Design · **Date:** Thu 2026-08-06 · **Defends on:** Day 9 (Mon Aug 10)

Extension to the Day 1 co-working design: **when a desk frees up early, it reallocates to the next
waitlisted member without ever double-booking during the handoff.**

| Evidence | Path |
|---|---|
| Diagram | `waitlist-design.excalidraw` · `waitlist-design.png` |

---

## The flow

**Joining.** The waitlist service inserts `(user_id, desk_id, timestamp)`. The timestamp is the
ordering key, so promotion is FIFO. `unique (user_id, desk_id)` stops the same member queuing twice
for the same desk.

**A desk becomes free** by early release, or by the scheduled worker sweeping an expired booking.
Either way it publishes `desk.freed`, so the waitlist logic does not need to know which happened.

**Promotion.** The waitlist service consumes `desk.freed`, takes the oldest entry for that desk, and
moves it `waiting → promoted`. It is not deleted. It publishes `waitlist.promoted`.

**Booking.** The booking service consumes `waitlist.promoted`, claims the desk through the ordinary
claim path, marks the entry `fulfilled`, and publishes `booking.created`.

**Notification.** The notification service consumes `booking.created` and pushes to the member.

All five hops go through the broker, so nothing blocks the member who released the desk.

## How double-booking is prevented during the handoff

**There is no separate handoff path.** A promotion is not a special kind of booking — the booking
service claims the desk with the same statement it uses for a walk-in:

```sql
UPDATE desks SET status = 'reserved', ...
WHERE  id = ? AND location_id = ? AND status = 'available';
-- then: affected rows > 0
```

Two concurrent claims serialise on the row. The second one matches nothing and fails cleanly. The
database does the check, so no application path can bypass it.

The consequence, stated deliberately: **a walk-in can beat a promotion to the desk.** That is
correct — the system never double-books, it just does not guarantee the promoted member wins the
race. What it must then do is keep the queue moving.

## Failure modes

Both are silent: nothing throws, because nothing failed — something never happened.

| Failure | | Detected by |
|---|---|---|
| **Lost promotion** — entry promoted, booking never created | permanent | entries in `promoted` with no booking, `promoted_at` older than 60s |
| **Stalled queue** — claim failed, nobody re-promoted | permanent | a desk `available` while entries exist on its waitlist, for more than 60s |

Both are permanent — nothing retries, so they do not heal on the next cycle.

**Why the entry is a state change and not a delete:** a deleted row cannot be queried, so a
promotion lost between the delete and the booking would leave no evidence anywhere. Keeping it in
`promoted` until the booking service confirms is what makes the failure detectable at all.

**Why the stalled-queue signal keys on the symptom:** a free desk with people queued for it is wrong
regardless of cause, so it catches failures that have not been thought of yet.

**Tracing:** `trace_id` does not cross a message broker on its own. It has to travel in the message
envelope, or the trace ends at the publisher and the promotion cannot be followed end to end.

## Decisions

- **FIFO by timestamp** — the fairness rule that is easiest to explain and defend. Priority tiers
  would need a business reason this prompt does not supply.
- **Both constraints live in the database** — `status = 'available'` on the claim,
  `unique (user_id, desk_id)` on the queue. Enforcement that has to be remembered gets forgotten.
- **One `desk.freed` event, two producers** — early release and expiry converge, so promotion has
  one trigger to handle.

<!-- STILL OPEN — decide before Day 9, both are likely probes:
     · Auto-assign vs offer-with-timeout. The design books the promoted member outright, with no
       acceptance step. Simpler, no timers — but someone can be assigned a desk at 3am they no
       longer want. Intended, and why?
     · Can a stale read from the 120s availability cache cause a double-booking? Work it through
       against the claim statement above and write the answer down. -->
