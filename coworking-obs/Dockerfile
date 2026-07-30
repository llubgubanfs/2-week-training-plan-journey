# syntax=docker/dockerfile:1
#
# One Dockerfile, both apps. Select which with --build-arg APP=booking-api|notifier
#   docker build --build-arg APP=booking-api -t booking-api .
# docker-compose.yml (Day 4) passes this arg per service.

FROM node:24-alpine AS base
RUN apk add --no-cache tini && npm install -g pnpm@11.9.0
WORKDIR /app

# ── deps: full install (devDeps needed to compile) ──
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── build: compile the one app we were asked for ──
FROM deps AS build
ARG APP
RUN test -n "$APP" || (echo "APP build-arg is required" && exit 1)
COPY . .
RUN pnpm exec nest build "$APP"

# ── runtime: prod deps + compiled output only ──
FROM base AS runtime
ARG APP
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
# Copy only the one app we built, to a fixed path. ARG expands here (build time),
# which lets CMD below stay in exec form with no variable to interpolate.
COPY --from=build /app/dist/apps/${APP} ./dist
USER node
# tini as PID 1, then node as a normal child.
#
# Two separate traps here, both measured rather than assumed:
#   1. Shell-form CMD would fork node under /bin/sh, which never forwards signals.
#   2. Even in exec form with node as PID 1, the kernel skips default signal
#      dispositions for PID 1 — and node installs no SIGTERM handler of its own,
#      so the signal is silently ignored.
# Either way `docker stop` burns the full 10s grace period and then SIGKILLs,
# giving in-flight requests and cron runs no chance to finish. tini fixes both:
# node runs as a child, where SIGTERM terminates normally.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
