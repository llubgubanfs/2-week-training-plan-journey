#!/usr/bin/env bash
#
# Traffic generator for the coworking-obs stack.
#
# Grafana panels are only interesting if the underlying numbers move. Everything
# here is plain curl against the running service — it needs no dependencies and
# touches no application code.
#
#   ./traffic.sh                 # mixed, runs until Ctrl-C
#   ./traffic.sh wave 600        # undulating load for 10 minutes
#   ./traffic.sh burst           # quiet, spike, quiet — good for a live demo
#   ./traffic.sh probe           # only bot-probe URLs (the cardinality demo)
#   ./traffic.sh concurrent      # parallel requests, moves the in-flight gauge
#   ./traffic.sh stop            # kill a backgrounded run
#
# Run it in the background and keep working:
#   ./traffic.sh wave 900 &
#
set -uo pipefail

MODE="${1:-mixed}"
DURATION="${2:-0}"                       # 0 = run until interrupted
BASE="${BOOKING_API_URL:-http://localhost:3000}"
PIDFILE="${TMPDIR:-/tmp}/coworking-traffic.pid"

hit()  { curl -s -o /dev/null --max-time 5 "$BASE$1" 2>/dev/null; }
hitn() { i=0; while [ "$i" -lt "$1" ]; do hit "/" & i=$((i+1)); done; wait; }

# Three shapes of unmatched request. The third mints a brand-new URL every call,
# which is the whole point: with req.originalUrl as the metric label this alone
# would create one new time series per second, forever. It collapses to a single
# route="unmatched" series instead.
probe() {
  hit "/wp-admin"
  hit "/.env"
  hit "/nope?id=$(date +%s)-$RANDOM"
}

if [ "$MODE" = "stop" ]; then
  if [ -f "$PIDFILE" ]; then
    pkill -P "$(cat "$PIDFILE")" 2>/dev/null
    kill "$(cat "$PIDFILE")" 2>/dev/null
    rm -f "$PIDFILE"
    echo "stopped"
  else
    echo "no traffic run recorded in $PIDFILE"
  fi
  exit 0
fi

if ! curl -sf -o /dev/null --max-time 3 "$BASE/metrics"; then
  echo "cannot reach $BASE/metrics — is the stack up? (docker compose ps)" >&2
  exit 1
fi

echo $$ > "$PIDFILE"
START=$(date +%s)
trap 'rm -f "$PIDFILE"; echo; echo "traffic stopped after $(( $(date +%s) - START ))s"; exit 0' INT TERM

expired() {
  [ "$DURATION" -gt 0 ] && [ $(( $(date +%s) - START )) -ge "$DURATION" ]
}

echo "mode=$MODE target=$BASE duration=${DURATION:-until Ctrl-C}s"
echo "watch it land:  http://localhost:3030  ·  stop with: $0 stop"

case "$MODE" in
  steady)
    # Flat ~10 req/s. The boring baseline — useful when you want the graph to
    # show that something else you did caused the change.
    while ! expired; do hitn 10; probe; sleep 1; done
    ;;

  wave)
    # Sinusoidal 2..26 req/s over a 3-minute period. Produces a graph that
    # obviously has shape, so "the dashboard is live" needs no explaining.
    while ! expired; do
      t=$(( $(date +%s) - START ))
      n=$(awk -v t="$t" 'BEGIN{ printf "%d", 14 + 12*sin(2*3.14159*t/180) }')
      hitn "$n"
      [ $(( t % 4 )) -eq 0 ] && probe
      sleep 1
    done
    ;;

  burst)
    # 30s quiet, 15s hard spike, 45s quiet — repeating. The spike is the thing
    # to point at during a demo: watch the rate panel jump and, if the spike is
    # big enough, the in-flight gauge lift off zero.
    while ! expired; do
      echo "  … quiet"
      for _ in $(seq 30); do hitn 2; sleep 1; expired && break; done
      echo "  !! burst"
      for _ in $(seq 15); do hitn 60; expired && break; done
      echo "  … recovering"
      for _ in $(seq 45); do hitn 3; probe; sleep 1; expired && break; done
    done
    ;;

  probe)
    # Nothing but unmatched requests. Run this, then show that
    # `count(http_requests_total)` has not moved off 2.
    while ! expired; do probe; sleep 1; done
    ;;

  concurrent)
    # Fires 80 requests at once with no pacing. booking-api answers in ~2ms, so
    # even this only nudges http_requests_in_flight — Prometheus samples every
    # 15s and will usually catch a handful at most. Genuinely moving that gauge
    # needs an endpoint that is slow on purpose; see the note in the run sheet.
    while ! expired; do hitn 80; sleep 2; done
    ;;

  mixed|*)
    # Default. Wave-shaped load with periodic probes and an occasional spike —
    # the most realistic-looking traffic without any configuration.
    while ! expired; do
      t=$(( $(date +%s) - START ))
      n=$(awk -v t="$t" 'BEGIN{ printf "%d", 10 + 8*sin(2*3.14159*t/240) }')
      hitn "$n"
      [ $(( t % 3 )) -eq 0 ] && probe
      [ $(( t % 120 )) -eq 0 ] && { echo "  !! spike"; hitn 70; }
      sleep 1
    done
    ;;
esac

rm -f "$PIDFILE"
echo "done after $(( $(date +%s) - START ))s"
