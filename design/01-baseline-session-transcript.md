# Day 1 system design session — full transcript

> Source: `recording_system_design_baseline.mp4` (22:13), transcribed via Whisper (Groq).
> Speakers are not labelled by the tool; Harvey is the one giving the prompt and asking questions.

## Transcript

_Source: whisper (groq)._

```
[00:00] I'll have a test run and see how it works.
[00:05] Yeah, basically you're alginic.
[00:12] Alright, okay.
[00:15] So, I believe you have received already the
[00:18] the observability questionnaire.
[00:23] Oh, yes sir.
[00:23] Alright, and the one that we will be conducting
[00:27] is the system design
[00:30] the assessment
[00:32] alright
[00:33] so hopefully you have
[00:36] the exam
[00:37] draw
[00:38] draw that I owe
[00:41] and I need you to share your screen also
[00:44] and I will prompt you what would you
[00:46] going to design within
[00:47] 20 minutes
[00:48] so please
[00:52] share your screen
[00:53] and by the way, I'll be recording this one.
[00:59] Okay, okay, sir.
[00:59] Yeah.
[01:01] Okay, so that's it.
[01:11] Actually, you can use any
[01:14] but yeah, what was
[01:16] that is like Scaledro.
[01:18] Alright, so here's
[01:20] the design.
[01:21] what we are going to do.
[01:25] So, you are going
[01:26] So, you are going to design
[01:30] the back-end for a
[01:32] multi-tenant co-working space
[01:34] platform where members
[01:36] reserve desks
[01:38] and meeting rooms across many
[01:40] locations. Okay?
[01:43] So, a desk can have
[01:44] or can never be
[01:46] double book and the
[01:48] design must scale to 200
[01:50] locations. Now, walk me through the components,
[01:55] the data flow, where caching fits, and how
[01:58] background jumps are structured.
[02:02] Okay, okay, sir. So,
[02:06] I'd like to
[02:08] do a re-walkthrough on that summary again, sir.
[02:15] Okay. So, this is a
[02:18] So, the multi-tenant co-working space platform.
[02:28] Okay.
[02:30] Co-working space platform.
[02:33] Okay.
[02:33] Wherein members reserves desks and meeting rooms across many locations.
[02:40] Desks and meeting rooms across locations.
[02:45] and the desk
[02:49] can never be double book
[02:51] and the design must
[02:55] scale to 200 locations
[02:58] and then we need
[03:03] at most
[03:07] or at least
[03:08] 200 locations
[03:10] Alright, so you have to
[03:16] design or walk me through
[03:17] the components
[03:20] that are involved
[03:21] the data flow
[03:23] where the caching fits
[03:25] and how backpatch jumps are structured
[03:28] Okay, so
[03:32] I can already see that these are the
[03:35] entities that will be
[03:37] working on with this
[03:39] application.
[03:41] So, I'll
[03:42] try to design first the
[03:45] relationship between these
[03:47] entities.
[03:49] So, at the top level,
[03:51] we have the location.
[03:54] So,
[03:55] each
[03:57] location
[03:58] can have
[04:00] many rooms.
[04:05] many rooms.
[04:07] So, basically,
[04:08] each user should
[04:10] be able to look up
[04:12] many
[04:13] branches or
[04:16] of this
[04:18] co-working space.
[04:20] And then each room,
[04:22] I'm assuming, many desks.
[04:26] Or are there any constraints there to
[04:28] how many there are
[04:30] desks?
[04:33] Oh yeah, each room
[04:34] should have one desk.
[04:36] Is that correct sir?
[04:40] Yeah for the desk
[04:41] Actually if you have
[04:44] Checked the
[04:45] Current
[04:46] Usually a desk
[04:49] Could be
[04:52] It's like
[04:54] Think of it as like in a
[04:56] Internet cafe
[04:57] For each PC that's equivalent
[05:00] To a desk
[05:02] Ah okay okay
[05:03] Yeah
[05:04] And a room could be a separate one.
[05:11] Okay.
[05:14] So, it's not necessary that the desk should be inside the room.
[05:20] Okay, okay. Okay, sir. I think I understand.
[05:22] Because that's a room.
[05:24] So okay So this is entirely separate to the room So I guessing there a limit on each limit for the rooms and then desk has a constraint of one so that we avoid double booking
[05:45] So, yeah.
[05:55] So, I'll just define some higher level components here.
[06:01] Let's say client.
[06:04] And then we have the server layer.
[06:08] This is just an encapsulation as of now.
[06:10] and then let's define the persistence layer, create a database, and then for the cache right here, it should sit between our application logic and between the database.
[06:29] so each request for each user should hit the server and then right here let's try to
[06:41] So we have an authentication service.
[06:54] So first each user should be authenticated and authorized to access the resources or perform any bookings and whatnot.
[07:24] each location so they should be they should be able to select which location they would they
[07:39] would have to make a booking I'll just write some walkthroughs here so first they would have to
[07:47] select a location and then choose whether it is a room or a desk so if you go through the
[08:11] flow of for the room we should check if the capacity of that of how many our book is within
[08:32] the limit and then for the desk it says a hard limit of one basically that's I think the MVP
[08:47] for this current flow so let's define a booking service so that way users would then hit the
[09:07] service if they apply for a booking for a room or a desk now okay so 200 locations
[09:37] yeah I'll take how we do it like this
[09:56] a booking service and then yeah so the booking service could act as a way to apply bookings
[10:11] and then could be a way to take a look at are there any available desk or rooms for that
[10:22] specific location so during this operation during read operations we could we could first hit the
[10:38] cash cash layer so we could if we encounter the cash miss we could do a a backfield backfield
[10:52] mechanism during cache missed actual during cache miss right there let me just do that rose
[11:18] so essentially if we are doing read operations it would first try to get it from the cache
[11:26] if we do a cache miss we will do a backfill on the cache and then yeah we return that data into the
[11:35] service and into the client and to avoid double booking on desks this is more of there are layers
[11:48] to how I would apply validation and constraints for this for example on the service on the
[11:57] application level itself we could check see for a given flow so taking cooking service
[12:13] you would validate validate the validation layer invalidate if this is this a valid date for booking
[12:32] the slots are free are there I mean is there any free desk or rooms so given the flow for the rooms
[12:51] the desk so if go to a flow like this then four rooms yeah so I think the validation would go
[13:13] through here dedicated validations for both services so and then we would perform a write
[13:36] to the database to persist after that both both operations and then so this is basically the
[13:52] application level checking first and then on on the persistence level one thing I would ensure
[13:59] sure know that there would be no double be booking on a desk I would define a an entity that could be
[14:08] desk bookings and it would contain a composite key for the desk ID the user ID and then an optional
[14:32] or maybe we could include the location ID just to ensure that this is a unique constraint so if
[14:43] every if there would be instances that both to request would go through during a booking on the
[14:51] database level one should fail or we could catch an exception for a unique constraint exception
[15:01] that way we would avoid double booking so for the requirement that this would be scalable for at
[15:16] least 200 locations this would call for how I would define the schema or the relational database for
[15:27] this one so yeah so given on we could define that we have a table for locations yeah so
[15:47] So this could be our schema of relationships.
[15:56] And then we have our locations.
[16:00] We can have many locations, and then each location can have their own rooms and their own desks.
[16:17] as men
[16:27] desks so if we structure it like this we could have a way to increase how many locations we
[16:49] could have how many each rooms for each location how many desk for each location basically tying
[16:57] everything together with a unique ID tracing back to which location each room
[17:04] and desk is and then I think you mentioned earlier sir about cron jobs
[17:10] right so I guess the question there what what's the use for the background job
[17:20] yeah so where does cron jobs come into play in the system so since this is a
[17:33] booking platform so ideally users would book first there or the given room or
[17:43] given desk that they are trying to book with so we would need to monitor of
[17:49] Of course, the host, I forgot about the booking and each user should be able to have their
[17:57] own booking.
[17:58] That is, it should be a tracking or booking.
[18:04] So the booking could be tied to which room or to which desk also.
[18:16] when we define a entity for creating bookings or also the user also so so each booking should also
[18:26] have a status yeah so basically if the moment they are they booked the desk or the room should have a
[18:37] a pending or if maybe a book status so if if give if the scenario is if the
[18:47] booking has already or their booking time has elapsed and they probably did
[18:53] not go to the location to to use the desk or the room so there should be a
[19:03] way to free free up that desk or that that specific room because of course some it might
[19:14] be useful for others so a good use case for cron jobs here would be monitoring the statuses or the
[19:25] bookings for these bookings so this could be a we have a scheduler so depending on the framework in
[19:36] the stock this could be this could lie inside the application itself and then yeah so given
[19:45] a specific schedule so maybe every 10 minutes at first or maybe an offset and then this should
[19:58] execute a worker so this worker depending on its job so in this case this should say booking status
[20:07] monitor worker say so the job of this worker should query or should have a connection to
[20:18] the database should query any bookings that may have expired so yeah so if it catches any bookings
[20:31] that has expired it then frees up that slot for for that specific room or desk
[20:45] so yeah okay I think we need to wrap up now let me take a screenshot long and
[20:59] we'll see yeah should i yeah that one okay or should i send the files or escalator file
[21:07] i don't know uh yeah you can send them okay yeah we'll see after two weeks or week three okay
[21:18] Okay, okay sir. This is pre-assessment.
[21:23] This is my diagram.
[21:28] Just send it to the ZOE Arctic.
[21:33] Okay, okay sir.
[21:48] Yes sir, I've sent the file.
[21:54] Alright, thank you.
[21:57] Alright, that's it.
[21:59] Thank you.
[22:00] Thank you, thank you sir.
[22:03] Alright, bye bye.
[22:06] Bye bye.
```

---
_Work dir: `/tmp/watch-baseline` — delete when done._
