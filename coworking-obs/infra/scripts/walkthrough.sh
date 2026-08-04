#!/usr/bin/env bash
#
# Stepper for the Day 5 recorded walkthrough. Keeps the commands in the right
# order so the running order never has to be remembered mid-narration.
#
#   ./scripts/walkthrough.sh          # run every beat in order
#   ./scripts/walkthrough.sh 5        # jump straight to beat 5 (retakes)
#   ./scripts/walkthrough.sh --list   # show the running order, run nothing
#
# It prints the command and waits for Enter. It deliberately prints NOTHING
# else — this is on camera, and a terminal full of narration is a terminal
# visibly being read from. The words live in
# deliverables/day-05/walkthrough-script.md; keep that on a second screen or
# on paper, not on the one being recorded.
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
  "5c|failure demo: rule state (expect pending)|curl -s localhost:9090/api/v1/rules | python3 -c 'import json,sys; [print(f\"  {r[\\\"name\\\"]:<24} {r[\\\"state\\\"]}\") for g in json.load(sys.stdin)[\"data\"][\"groups\"] for r in g[\"rules\"]]'"
  "5|reset: stop every generator, restore the wave|./scripts/traffic.sh stop && ./scripts/traffic.sh wave 3600 &"
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
