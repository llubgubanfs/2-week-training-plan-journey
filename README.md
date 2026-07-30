# 2-Week Training Plan — Leander Lorenz Lubguban

Full Scale · Job Grade 2 · Full-Stack (Node/NestJS + React) · EM: Harvey Martus

**Where am I? → [`journal/STATUS.md`](journal/STATUS.md)** — current day, what's done, what's carried over, weak-spot list.

## Two graded tracks

| Track | Retest | Target |
|---|---|---|
| Observability & Structured Logging | Day 10 · Tue Aug 11 | 7 / 10 |
| System Design | Day 9 · Mon Aug 10 | 8 / 12 |

## Layout

| Path | What's in it |
|---|---|
| `0-training-plan/` | The plan itself — source of truth for each day's objective and deliverable |
| `1-baseline/` | Day 1 assessment questions and answers |
| `journal/` | `STATUS.md` + one file per day |
| `design/` | System Design track: skeleton, talk-track, Q&A bank, drills, diagrams |
| `deliverables/` | What Harvey actually looks at — screenshots, written answers, EOD messages |
| `coworking-obs/` | **The project.** One codebase spanning Days 2–10, not per-day throwaways. |

## The project

NestJS monorepo. A deliberately thin desk-booking domain, wrapped in the instrumentation that's actually being assessed.

```
coworking-obs/
├── apps/booking-api/      :3000  — Days 2, 3, 5, 8
├── apps/notifier/         :3001  — Day 6 downstream, for cross-service tracing
├── libs/observability/    @app/observability — logger, metrics, tracing
├── infra/                 Prometheus + Grafana provisioning (Day 4)
└── docker-compose.yml     Day 4 — reused for all of Week 2
```

```bash
cd coworking-obs
cp .env.example .env
pnpm install
pnpm run start:dev              # booking-api on :3000
pnpm run start:dev:notifier     # notifier on :3001
pnpm run build                  # both apps
```

## Scope fence

The booking domain stays thin **on purpose**. Relational schema, indexing, and transactions are already rated Strong — domain work earns zero assessment points and competes with the Growth Area. So: 3 endpoints, one real constraint (the composite unique preventing double-booking), no auth, no UI, under ~300 lines. Anything taking more than 15 minutes gets a TODO.

The assessment is the instrumentation wrapped *around* the domain.

## Working with Claude

`CLAUDE.md` holds the working agreement. The short version: **explain-first**. Leander states his approach before any implementation code gets written, reviews every diff, and must be able to explain any line back. Days 9 and 10 are live with no agent present — everything is arranged to protect that.

| Command | Purpose |
|---|---|
| `/day-start` | Objective, prereqs, time budget; warm-up quiz on yesterday |
| `/day-end` | Verify evidence exists, update STATUS.md, draft the EOD message |
| `/quiz [topic]` | Socratic, answers withheld; misses logged |
| `/design-drill` | Timed 15-min design prompt, then critique |
| `/explain-back [topic]` | Feynman — he explains, Claude grades |

## Definition of done

A day is not done because the code works. It's done when the evidence Harvey will look at exists on disk, is committed, and its path is in `STATUS.md`.

Branch per day (`day-02-structured-logging`), PR into `master`, in English.
