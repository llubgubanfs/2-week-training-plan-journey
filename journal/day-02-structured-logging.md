# Day 2 — Structured Logging

**Date:** Thu 2026-07-30 · Track: Observability · Branch: `day-02-structured-logging`

**Objective:** replace `console.log` with structured JSON logging, with a request-id correlated across a single request.

**Deliverable:** PR/diff with the structured logger wired in + a screenshot of sample JSON log output.

**Course:** Pluralsight — *Node.js Microservices: Monitoring and Logging*, structured-logging section.

---

## Time budget (~4 hrs, today is partly gone)

| | Task | Est |
|---|---|---|
| ✅ | Workspace + monorepo scaffold *(Claude)* | 30m |
| ⬜ | Pluralsight structured-logging module | 45m |
| ⬜ | Winston JSON logger + ALS request-id — **explain-first** | 90m |
| ⬜ | Reconstruct Day 1 design from memory | 30m |
| ⬜ | Journal + EOD | 15m |
| ⏭ | Booking domain endpoints — *can slip to Day 3* | 45m |

---

## Before building — answer these

`/quiz structured logging` covers these. Commit to an answer before any code gets written.

1. Why is a JSON log line more useful than `console.log('user ' + id + ' booked desk ' + deskId)`? Give the concrete operational reason, not "it's structured."
2. What is a correlation id *for*? What question does it let you answer that you couldn't before?
3. Where should the request-id be generated — client, load balancer, or app? What breaks with each choice?
4. Which fields belong on **every** log line, regardless of what's being logged?
5. What must never go into a log line?

## My approach — state this before Claude writes anything

<!-- How are you getting the request-id from the middleware down to a service method five calls deep, without threading it through every function signature? Commit to an approach here. -->

**My proposal:**

**Failure case Claude raised:**

**Where I landed, and why:**

---

## What I built

<!-- Filled in as you go -->

## What I learned

## What I got stuck on

<!-- The most valuable section for Day 9/10 prep. Be specific. -->

## Evidence

- [ ] PR opened against `master`, English title and body
- [ ] Screenshot: `deliverables/day-02-log-samples/` — must show the **same `request_id` across multiple lines of one request**, not just one pretty JSON line
- [ ] Path recorded in `journal/STATUS.md`

---

## Notes from scaffolding

Already done, and worth knowing since you'll be asked to explain the repo on Day 5:

- **NestJS monorepo mode**, not a pnpm workspace — `apps/booking-api`, `apps/notifier`, `libs/observability` aliased `@app/observability`. One dependency tree, shared lib via tsconfig path, no workspace tooling.
- **Two generator bugs fixed:** both apps defaulted to port 3000, and the notifier read a lowercase `process.env.port`. Both would have collided the moment Compose brought them up together.
- **Both apps bind `0.0.0.0`**, not Nest's default localhost. Bound to localhost inside a container, a published port is unreachable from outside — a classic first-Docker-deploy failure.
- **`@nestjs/config` is global** in both apps; every value comes from env. Nothing hardcoded, so the same image runs locally, in Compose, and on a host if we deploy on Day 8.
- **`tini` is PID 1 in the images.** Without it `docker stop` took the full 10s grace period and then SIGKILLed — because as PID 1 the kernel skips default signal dispositions and node installs no SIGTERM handler. With tini: 148ms. Worth understanding before Day 8, since a container that ignores SIGTERM kills a cron run mid-flight with no chance to record the outcome.
- Winston and `nest-winston` are installed but **not wired** — that's yours.
- **No `nestjs-cls` dependency.** Node's built-in `AsyncLocalStorage` from `node:async_hooks` is enough, and hand-rolling it once is worth more than importing it.
