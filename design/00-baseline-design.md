# Day 1 baseline design — reconstruction

> **Filled in from memory, alone, before looking at the saved artifacts.** That ordering was
> deliberate: the diagram and a recording both survived, so this page was never the only
> record — it is a *retention measurement* taken before those artifacts could overwrite it.
>
> Don't ask Claude what the answers should be — Days 7 and 9 are graded on your independent
> reasoning. The gap between what you drew and what you'd draw today is the most useful thing
> on this page.

**Session:** Wed 2026-07-29, 11:30–12:00, live with Harvey Martus
**Status:** ✅ filled in from memory — Day 2, before consulting the diagram or recording

**Surviving artifacts:**
- `design/preassessment diagram.excalidraw` — the original canvas
- `~/Videos/2_week_training_plan_videos/recording_system_design_baseline.mp4` — 22 min

---

## The prompt as given

> Design the backend for a multi-tenant co-working space platform where members reserve desks and meeting rooms across many locations. A desk can never be double-booked. The design must scale to 200 locations. Walk through the components, the data flow, where caching fits, and how background jobs are structured.

---

## 1. What I clarified before designing

<!-- Which questions did you actually ask? Which assumptions did you state? -->
I asked about the setup of the entities and clarified some of the constraints of the business rules. like does a meeting room contain the desk or is the meeting room and desk essentially a different concept or entity so I was able to clarify that each location has many rooms then a room could contain many users that can book to it and then a location can contain many desks but a desk has a hard constraint of only one so there should be no double booking on this one.


## 2. Scale assumptions I used

<!-- Did you do the arithmetic out loud? Locations x desks, bookings/day, peak. If you skipped this, write "skipped" — that's a finding, not a failure. -->

skipped

## 3. Components I drew

<!-- List the boxes. Note which you added unprompted vs. after a question from Harvey. -->

yeah so I only drew some components high level components like the client the caching layer and then the database layer and then I also drew a booking service component and then in an authentication service component that was basically useless during my demo I think I didn't connect it properly and then I also made diagrams about what is the flow when applying a booking if it was for a desk or if it was for a room and then added boxes for each validations or I mean each route would have its own validation layer and then both had a persist layer.

## 4. Data model

<!-- Tables/entities. How exactly is double-booking prevented, and where does that enforcement live? -->
I think I defined entities like the user, location, desks, rooms, so locations can have many desks and also as many users and then I also stated that I would define a join table which would signify the booking that was applied so it was a combination of the task id, room id and then the user id and then to prevent double booking I enforced that there should be only one unique combination depending on the desk or if it is a room I think I just realized right now that I didn't really map out the entities properly to enforce how to handle multiple users to be able to book on a room and only one user for the desk yeah, but I tried to enforce it on a database level.


## 5. Data flow — reserving a desk

<!-- Walk the request through the components, in order. -->
Yeah, so the request hits the booking service and then it determines if whether it was for a room or a desk and each route would have their own validation layer and then the persistence layer. I think that's the only component that I was able to present and draw during the live demo for system design.

## 6. Where caching fit

<!-- What was cached, where, TTL, and how it got invalidated. -->
so I didn't really explicitly say what was cached I only stated that frequently accessed data and didn't really specify it yeah and then where was it cached so it was an abstracted representation so yeah I didn't specify where but it was assumed that it would be on a red redis instance time to live configuration I did not say it explicitly and I forgot to mention that also and for invalidation I've already I didn't mention how it would be invalidated. although I did specify a way to backfill the cache when it hits a cache miss or if there's a cache miss so I did a bit of a diagram on the interaction between the database and and the caching layer so that during cache miss it backfills the cache 

## 7. Background jobs

<!-- What ran off the request path, what triggered each. -->
yeah so what ran of the request pass pass was a background job that I pointed out for watching the status of the of the bookings so basically its job is to watch for any bookings that has expired and then based on that on how many or if there were any given if it was a desk or a room I didn't explicitly say how it would handle both scenarios but yeah it was watching for the statuses or the booking appointments then freeing up the slot. I also forgot to mention what would be the ideal Cron schedule for this background job.

## 8. Multi-tenancy

<!-- How did you handle "multi-tenant"? Shared tables + tenant column, schema per tenant, DB per tenant? Did it come up at all? -->
yes my idea for multi-tenancy was that I was basically making a shared basically one database for all locations so my my assumptions was each location is a tenant so I was assuming that given the location that would signify that this is where they would or all of the data are related to that location is yeah isolated to that one so scale up how many locations that's how many tenants yeah I didn't ask what it then it signifies and I think I haven't really made or explored multi-tenancy added score so yeah only one database for this one 

## 9. Scaling to 200 locations

<!-- What you said breaks first, and what you'd do about it. -->
and again, scaling to 200 locations,  'm only limited to my knowledge about using one database for the entire 200 locations so yeah,   only stated that to scale up to 200 locations, we basically would isolate them by location   D and my gut is saying that that is not the right answer '

---

## Harvey's follow-up questions

<!-- As many as you can recall, and how you answered. These are the best possible predictor of Day 9 — the same probes tend to come back. -->

there were no follow-up questions by sir Harvey.

| Question | How I answered | How I'd answer now |
|---|---|---|
|  |  |  |

---

## My own post-mortem

**What I think went well:**
yeah so what I think went well was defining cron job pointing out how to mitigate the double booking and then yeah I think that was the only part or acceptable person I consider went well.
**What felt weak in the moment:**
what felt weak in the moment was me thinking on the spot keeping track of my thoughts basically I didn't have any pattern to follow maybe I'm missing some ceremony when making stem designs yeah.
**What I'd draw differently now:**
I think what I draw differently now I think from what I currently made I think I do over with something that is a proper system design diagram which I did not draw properly.
**Questions I couldn't answer:**
Again, there were no follow-up questions from Sir Harvey because this was the baseline session.

---

## Artifacts

- [x] Excalidraw file in `design/` — the **original**, not a recreation (`preassessment diagram.excalidraw`)
- [ ] Diagram compared against the skeleton in `design/skeleton.md` — what the skeleton has that this doesn't is the Day 9 gap list
- [ ] Recording transcribed and Harvey's follow-ups (if any) recorded above

---

## Diff: memory pass vs. the saved canvas

Run on Day 2, after this page was filled in.

**Recall was accurate on every component.** `client`, `cache`, `database`, `booking service`,
`authentication service`, the `Scheduler` → `booking status monitor worker` cron, the room/desk
split into parallel `validation` → `persist` lanes, and the `backfill during cache miss` edge —
all present on the canvas, all correctly recalled. Nothing was misremembered.

**Three things were *under*-reported.** Section 3 and the post-mortem sell the session short:

1. A numbered decision sequence exists on the canvas and went unmentioned:
   `1. select a location` → `2. choose whether it is a room or a desk` → room: *check capacity
   is within the limit* · desk: *hard limit of 1*. The post-mortem says "I didn't have any
   pattern to follow" — the canvas shows one.
2. A `Schema Relationships` block — `Locations` *has many* `Rooms`/`Desks`, plus a `Booking`
   entity bound to `room`/`desk`/`user` — also unmentioned.
3. Section 4's admission ("didn't map the entities properly") is *confirmed but sharper* than
   written: the canvas holds **two competing table designs** side by side —
   `desk_bookings (desk_id, user_id, location_id)` and `Booking (room, desk, user)`. Two
   half-finished models, not one finished one. That is a specific, fixable finding.

**Resolved by the recording:** the erased `telemetry collector` → `observability backend`
elements were **not** drawn in this session. "Observability" occurs once in 22 minutes, at
[00:18], when Harvey mentions the questionnaire. They are leftovers from separate prep.

---

## Correction pass: memory vs. the recording

Full transcript: `design/01-baseline-session-transcript.md`. Three answers above are wrong.

### 1. Harvey asked two questions — section "Harvey's follow-up questions" is wrong

| When | What Harvey did | What this page claimed |
|---|---|---|
| [04:26–05:04] | **Corrected the entity model.** Leander proposed "each room should have one desk"; Harvey: *"Think of it as like in an internet cafe. For each PC, that's equivalent to a desk… a room could be a separate one."* | Section 1 records this as Leander clarifying. The tape shows a wrong model being corrected. |
| [17:04–17:20] | **Re-prompted background jobs.** *"Where does cron jobs come into play in the system?"* | Recorded as "no follow-up questions." |

The second one reframes the post-mortem. "Defining the cron job" is listed under *what went
well*; on tape it is a **prompted recovery at minute 17** on a quarter of the original prompt
that had been forgotten. The answer once nudged was sound — scheduler → worker → sweep expired
bookings → free the slot — but it was not volunteered.

### 2. Multi-tenancy was never mentioned — section 8 is reconstructed, not recalled

"Tenant" appears twice in the whole recording: Harvey reading the prompt [01:32], Leander
repeating it back [02:18]. Nothing after. Section 8's paragraph about location-as-tenant with
one shared database describes an approach **that was never articulated in the session**.

This is the single contaminated answer on the page, and it is the exact failure mode the
memory-pass-first ordering existed to catch. Left in place deliberately — an unedited example
of memory writing the answer it wishes it had given.

### 3. "Scale to 200 locations" was answered as a modelling question

[09:07] *"okay so 200 locations"* → pause → *"yeah I'll take how we do it like this"* → moved on.
Returned at [15:01] with: define locations → rooms → desks joined by unique IDs.

The transcript contains **no scaling mechanism of any kind** and no quantitative reasoning.
Section 9's instinct ("my gut is saying that is not the right answer") is correct. What the
answer *should* be is deliberately not recorded here — Day 7 and Day 9 are graded on
independent reasoning.

### What the tape shows going better than recorded

- **Double-booking [13:52–15:01] is the strongest passage.** App-level validation, then a
  composite unique constraint on `desk_bookings`, and explicitly the concurrent race:
  *"if both requests would go through… on the database level one should fail, or we could catch
  a unique constraint exception."* Enforcement placed where it cannot be bypassed.
- **Prompt captured verbatim** [02:06–03:28] — asked for a re-read and wrote it down.

### Corrections to session metadata

- Time budget was **20 minutes**, not 15 — Harvey states it at [00:47].
- Wrapped at ~20:45; the remainder is file handover.

**Conclusion.** Recall of *what he drew* is strong. Recall of *how the session went* is not:
two interventions were forgotten, a prompted recovery was remembered as a strength, and one
answer was invented after the fact. For Day 9 that is the more useful finding — the gap is in
reading the room and tracking the question, not in knowing the material.
