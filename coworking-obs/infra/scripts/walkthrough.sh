#!/usr/bin/env bash
#
# Stepper for the recorded walkthroughs. Keeps the commands in the right order
# so the running order never has to be remembered mid-narration.
#
#   ./scripts/walkthrough.sh          # run every beat in order
#   ./scripts/walkthrough.sh 5        # jump straight to beat 5 (retakes)
#   ./scripts/walkthrough.sh --list   # show the running order, run nothing
#
# Beats §2–§5 are Week 1 (Day 5's demo). Beats §6–§8 are Week 2 — tracing,
# the silent-failure demo, and the bug the demo found in itself — added for
# the Day 10 final walkthrough.
#
# It prints the command and waits for Enter. It deliberately prints NOTHING
# else — this is on camera, and a terminal full of narration is a terminal
# visibly being read from. Keep whatever you are narrating from on a second
# screen or on paper, not on the one being recorded.
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'

# beat|label|command
BEATS=(
  "2|cardinality: how many series exist at all|curl -sG localhost:9090/api/v1/query --data-urlencode 'query=count(http_requests_total)' | python3 -c 'import json,sys; print(json.load(sys.stdin)[\"data\"][\"result\"][0][\"value\"][1])'"
  "2|cardinality: what the series actually are|curl -s localhost:3000/metrics | grep '^http_requests_total{'"
  "5a|failure demo: hold requests inside the handler|./scripts/traffic.sh slow 120 &"
  "5b|failure demo: client abandons mid-request (499)|curl --max-time 1 'localhost:3000/debug/slow?ms=8000'"
  "5b|failure demo: show the 499 log line|docker compose logs booking-api --tail 400 | grep 499 | tail -3"
  "5c|failure demo: drive the error ratio|./scripts/traffic.sh errors 0.6 120 &"
  "5c|failure demo: rule state (expect pending)|curl -s localhost:9090/api/v1/rules | python3 -c 'import json,sys; [print(\"  %-26s %s\" % (r[\"name\"], r[\"state\"])) for g in json.load(sys.stdin)[\"data\"][\"groups\"] for r in g[\"rules\"]]'"
  "5|reset: stop every generator, restore the wave|./scripts/traffic.sh stop && ./scripts/traffic.sh wave 3600 &"
  "6a|tracing: one request that crosses the service boundary|curl -s -o /dev/null -w 'status=%{http_code} in %{time_total}s\\n' localhost:3000/downstream-immediate"
  "6a|tracing: one trace id, two services, as data not a screenshot|curl -s 'localhost:16686/api/traces?service=booking-api&operation=GET%20/downstream-immediate&limit=10' | python3 -c 'import json,sys; ts=json.load(sys.stdin)[\"data\"]; d=max(ts, key=lambda t: min(s[\"startTime\"] for s in t[\"spans\"])); print(\"  trace_id:\", d[\"traceID\"]); print(\"  services:\", \", \".join(sorted(set(p[\"serviceName\"] for p in d[\"processes\"].values())))); print(\"  spans:   \", len(d[\"spans\"]))'"
  "6b|tracing: fire-and-forget returns before the work is done|curl -s -o /dev/null -w 'status=%{http_code} in %{time_total}s\\n' localhost:3000/fire-and-forget"
  "7a|silent failure: switch the sweep to silent-only, no rebuild|SWEEP_FAILURE_MODE=silent SWEEP_FAILURE_RATE_PCT=100 docker compose up -d booking-api   # rate MUST be 100: at 20 the healthy runs clear the backlog and the alert never fires"
  "7b|silent failure: every run reports success|curl -s localhost:3000/metrics | grep '^job_runs_total'"
  "7b|silent failure: and the job writes zero error lines|echo \"error-level sweep lines: \$(docker compose logs booking-api --no-log-prefix 2>/dev/null | grep -cE 'level.:.error')\""
  "7c|silent failure: meanwhile the invariant is breaking|curl -s localhost:3000/metrics | grep '^bookings_expired_pending'"
  "7c|silent failure: the state rule fires, the step rule stays quiet|curl -s localhost:9090/api/v1/rules | python3 -c 'import json,sys; [print(\"  %-26s %s\" % (r[\"name\"], r[\"state\"])) for g in json.load(sys.stdin)[\"data\"][\"groups\"] for r in g[\"rules\"]]'"
  "8|the bug the demo found: the selector the alert was written with|curl -sG localhost:9090/api/v1/query --data-urlencode 'query=job_last_success_timestamp_seconds{job=\"expiry-sweep\"}' | python3 -c 'import json,sys; print(json.load(sys.stdin)[\"data\"][\"result\"] or \"[]  <- matched nothing\")'"
  "8|the bug the demo found: what Prometheus actually stored|curl -sG localhost:9090/api/v1/query --data-urlencode 'query=job_last_success_timestamp_seconds' | python3 -c 'import json,sys; [print(\" \", r[\"metric\"]) for r in json.load(sys.stdin)[\"data\"][\"result\"]]'"
  "9|reset: sweep healthy again, alerts clear|SWEEP_FAILURE_MODE=none docker compose up -d booking-api"
)

if [ "${1:-}" = "--list" ]; then
  i=1
  for b in "${BEATS[@]}"; do
    IFS='|' read -r beat label _ <<< "$b"
    printf "  %2d.  §%-3s %s\n" "$i" "$beat" "$label"
    i=$((i + 1))
  done
  exit 0
fi

START_AT="${1:-1}"

i=1
for b in "${BEATS[@]}"; do
  if [ "$i" -lt "$START_AT" ]; then i=$((i + 1)); continue; fi
  IFS='|' read -r beat label cmd <<< "$b"

  printf '\n%s[%s]%s %s\n' "$DIM" "$beat" "$RESET" "$label"
  printf '%s$ %s%s\n' "$BOLD" "$cmd" "$RESET"
  printf '%s   ↵ to run · s to skip · q to quit%s ' "$DIM" "$RESET"
  # Prefer the terminal so the prompt still works if stdout is piped. Falls back
  # to stdin, and tolerates neither being readable rather than dying on set -u.
  key=""
  if ! { read -r key < /dev/tty; } 2>/dev/null; then
    read -r key 2>/dev/null || key=""
  fi

  case "$key" in
    q|Q) echo; exit 0 ;;
    s|S) echo "   skipped"; i=$((i + 1)); continue ;;
  esac

  echo
  eval "$cmd"
  i=$((i + 1))
done

printf '\n%send of running order%s\n' "$DIM" "$RESET"
