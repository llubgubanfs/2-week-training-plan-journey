# The talk-track — 30 minutes, 9 sections

## Why this exists

Harvey's Day 1 prompt asked you to walk through "the components, the data flow, where caching fits, and how background jobs are structured." That's a **structure** request. The order below maps onto it directly, so following it means you're answering the question that was asked.

**Say the section name out loud before you start it.** "Okay — data model." Two benefits: it signals structure to the interviewer, and it buys you three seconds of thinking time that sounds deliberate rather than stalled.

---

## 1. Clarify requirements · 2 min

Ask before you draw. Three or four questions, no more — endless clarifying reads as stalling.

- Functional: what must it do? What's explicitly out of scope?
- **The invariant**, stated back in your own words: *a desk can never be double-booked.*
- Non-functional: how many locations, how many members, what's the read/write mix?
- What's the peak? (For co-working: everyone books around 9am. Spiky, not uniform.)

> Ending with *"I'll assume X unless you'd rather I didn't"* lets you move without waiting for permission.

## 2. Scale math, out loud · 2 min

Do the arithmetic aloud. Wrong-but-reasoned beats silent-and-vague. Derive:

- Locations × desks per location = total bookable resources
- Bookings per day → per second **average**
- Then the **peak multiplier** — the 9am rush is the number that actually sizes the system
- Read:write ratio (availability views vastly outnumber reservations — this is what justifies the cache)

This section alone separates candidates. Most skip it.

## 3. Data model & the invariant · 3 min

Core tables, then immediately: **where is double-booking made impossible?**

You're already rated Strong here — the composite unique constraint is your strongest card. Play it explicitly and say *why the constraint lives in the database* rather than in application code.

Anticipate: *"what if two requests arrive at the same millisecond?"* You have the answer. Make sure you say it without being asked.

## 4. API surface · 2 min

Endpoints, one line each. Don't design request bodies — nobody scores that. Note which are read-heavy (→ cache) and which mutate the invariant (→ transaction).

## 5. Walk the hot path end-to-end · 5 min

**The highest-value section.** Take one request — *member reserves a desk* — and narrate it through every box on the diagram, numbering the arrows as you go.

Client → LB → API → auth → validate → cache check → transaction → constraint → commit → event emitted → response.

If you can do this fluently, you've demonstrated the data flow question completely. Practise this section more than the others.

## 6. Caching · 3 min

Not "add Redis." Answer four things:

- **What** is cached (availability views, not reservations)
- **Where** it sits
- **TTL**
- **Invalidation** — what happens the instant a booking is made

You're rated Strong on cache invalidation and used the dependency-graph framing well in the interview. Reuse it. Also name the risk out loud: stale availability shown to a user who then fails to book. How do you make that failure graceful?

## 7. Background jobs · 3 min

What runs off the request path and why:

- Notifications
- Waitlist promotion (the Day 7 extension)
- Expiring unconfirmed holds
- Reconciliation / cleanup

For each: what triggers it, what happens if it runs twice (**idempotency**), and what happens if it doesn't run at all.

## 8. Failure modes & observability · 3 min

Almost nobody volunteers this, and it's your Growth Area — so volunteering it is disproportionate signal.

- What breaks first under load?
- What happens if the DB fails over mid-transaction? If the queue backs up? If a worker dies holding a job?
- **How would you know?** Name the specific metric and the specific alert. By Day 8 you'll have built exactly this, so speak from the implementation, not from theory.

## 9. Scaling to 200 locations · 3 min

The prompt's explicit ask. What breaks first as you go from 5 to 200, and what do you do about it?

- Does the DB partition by location/tenant? Why or why not?
- Do the 9am peaks across timezones overlap or spread the load?
- What's the first bottleneck — and be honest that you'd measure before optimising.

---

## Under pushback (Day 9, part one)

Harvey plays a **skeptical stakeholder on the cost of the waitlist feature**. That is not a technical question and a technical answer scores badly.

- Acknowledge the concern as legitimate before defending anything
- Frame in **business terms**: cost to build and run vs. revenue from desks that would otherwise sit empty
- Offer the **cheaper alternative** you already considered and say why you'd still recommend yours — or concede if it's genuinely better
- Offer a **phased version**: what's the smallest thing that delivers most of the value?
- Say what you'd **cut first** if the budget were halved

"Handling disagreement with authority" is a graded behavioural competency. Changing your mind when given a good reason is a strength here, not a loss. Digging in on a bad position is the actual failure mode.
