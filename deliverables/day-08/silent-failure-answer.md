# How would I know this failed before a user reported it?

**Day 8 · Fri 2026-08-07 · Observability track**

The written half of the Day 8 deliverable. The instrumentation it refers to is in
[`README.md`](README.md); the measurements quoted below are in `metrics-silent.txt`,
`sweep-logs-silent.jsonl` and `alerts-firing.json` in this directory.

---

I detect silent cron job failures by monitoring the invariant the job is responsible for
maintaining rather than trusting the job to report its own health. In my implementation, the
system recorded twelve consecutive successful sweep executions while an independently collected
state metric remained non-zero, causing the invariant alert to fire even though the heartbeat
alert stayed green, demonstrating that I page on the violated state and use the job's execution
metrics only for diagnosis.

---

## The measurement behind it

Taken from the running stack during a forced silent-failure run, all at one instant:

```
job_runs_total{outcome="success"}   12      every run reported success
error-level sweep log lines          0      nothing threw, so nothing logged
bookings_expired_pending            33      desks not returning to circulation

ExpirySweepNotRunning         silent        "did the job run?"
ExpiredBookingsNotSwept       firing        "is the invariant broken?"
```
