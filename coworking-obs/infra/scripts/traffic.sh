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
#   ./traffic.sh errors 0.6 300  # 60% 5xx for 5 minutes
#   ./traffic.sh stop            # kill EVERY backgrounded run
#   ./traffic.sh status          # list what is currently running
#
# Run it in the background and keep working:
#   ./traffic.sh wave 900 &
#
# Several generators are meant to run at once — the demo layers `slow` and
# `errors` on top of a long `wave`. Each run registers its own file under
# RUNDIR, so `stop` can find all of them. It used to be a single fixed path
# that every new run overwrote, which meant `stop` silently killed only the
# most recent generator and orphaned the rest with no record of their PIDs.
set -uo pipefail

MODE="${1:-mixed}"
DURATION="${2:-0}"                       # 0 = run until interrupted
BASE="${BOOKING_API_URL:-http://localhost:3000}"
RUNDIR="${TMPDIR:-/tmp}/coworking-traffic"

# True only if $1 is alive AND is one of ours. PIDs get recycled, and a stale
# entry pointing at a reused number would otherwise make `stop` kill an
# unrelated process — and its children, which is the part that would hurt.
is_ours() {
  [ -n "${1:-}" ] && kill -0 "$1" 2>/dev/null &&
    tr '\0' ' ' < "/proc/$1/cmdline" 2>/dev/null | grep -q 'traffic\.sh'
}

# Depth-first kill of a process and every descendant.
#
# `pkill -P` reaches direct children only, which is not enough here: hit() is a
# shell function, so `hit ... &` forks a subshell and curl is that subshell's
# child — a grandchild of the script. Killing the script and its subshells left
# live curls behind, holding /debug/slow connections open and the in-flight
# gauge off zero for several more seconds. Children before parents, so nothing
# gets reparented out of reach mid-sweep.
kill_tree() {
  local p="$1" c
  for c in $(pgrep -P "$p" 2>/dev/null); do kill_tree "$c"; done
  kill "$p" 2>/dev/null
}

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

if [ "$MODE" = "status" ]; then
  found=0
  for f in "$RUNDIR"/*; do
    [ -e "$f" ] || continue
    pid=$(basename "$f")
    if is_ours "$pid"; then
      echo "  running: pid=$pid mode=$(cat "$f" 2>/dev/null)"
      found=$((found + 1))
    else
      rm -f "$f"                        # stale — process is gone
    fi
  done
  [ "$found" -eq 0 ] && echo "no traffic generators running"
  exit 0
fi

if [ "$MODE" = "stop" ]; then
  stopped=0
  for f in "$RUNDIR"/*; do
    [ -e "$f" ] || continue
    pid=$(basename "$f")
    mode=$(cat "$f" 2>/dev/null)
    if is_ours "$pid"; then
      # Whole tree. `slow` and `abandon` hold dozens of backgrounded curls open
      # for several seconds; leaving those alive keeps the in-flight gauge
      # pinned after the script that spawned them is gone — the exact symptom
      # this fix exists to prevent.
      kill_tree "$pid"
      echo "  stopped pid=$pid mode=$mode"
      stopped=$((stopped + 1))
    fi
    rm -f "$f"
  done

  # Backstop for anything the loop above cannot see: a generator started before
  # this fix shipped registered no file at all. Must exclude this very process —
  # `stop` matches the same pattern, and a bare `pkill -f traffic.sh` would kill
  # the stopper mid-sweep.
  others=$(pgrep -f 'traffic\.sh' 2>/dev/null | grep -v "^$$\$" || true)
  if [ -n "$others" ]; then
    for p in $others; do
      kill_tree "$p"
      stopped=$((stopped + 1))
    done
    echo "  swept untracked run(s): $(echo "$others" | tr '\n' ' ')"
  fi

  [ "$stopped" -eq 0 ] && echo "no traffic generators running"
  exit 0
fi

if ! curl -sf -o /dev/null --max-time 3 "$BASE/metrics"; then
  echo "cannot reach $BASE/metrics — is the stack up? (docker compose ps)" >&2
  exit 1
fi

mkdir -p "$RUNDIR"
echo "$MODE" > "$RUNDIR/$$"
START=$(date +%s)
# EXIT covers the normal end-of-duration path as well as the signal paths, so a
# run can never leave its registration behind to be reported as live later.
trap 'rm -f "$RUNDIR/$$"' EXIT
trap 'echo; echo "traffic stopped after $(( $(date +%s) - START ))s"; exit 0' INT TERM

expired() {
  [ "$DURATION" -gt 0 ] && [ $(( $(date +%s) - START )) -ge "$DURATION" ]
}

echo "mode=$MODE target=$BASE duration=${DURATION:-until Ctrl-C}s pid=$$"
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
    # Maximum throughput. Fires 80 requests at once with no pacing.
    #
    # This will NOT move http_requests_in_flight, and that was measured rather
    # than assumed. The gauge spans Express middleware entry to res 'close',
    # which for a handler that synchronously returns a string is ~0.19ms. By
    # Little's Law the occupancy of that region is throughput x duration — under
    # 1 even at ~4,900 req/s. Requests queue in the kernel accept queue and
    # libuv, upstream of the instrumented span, so socket concurrency never
    # becomes middleware concurrency. 401 established TCP connections still
    # produced a gauge reading of 0 across 96 samples.
    #
    # The gauge only climbs when requests are held INSIDE the span — an awaited
    # DB call or a hanging downstream. That is Day 8's failure mode and it will
    # work; it just cannot be demonstrated against a static string.
    #
    # What DOES register this load: nodejs_eventloop_lag_p99_seconds, which goes
    # from sub-millisecond at idle to ~10ms here.
    while ! expired; do hitn 80; sleep 2; done
    ;;

  slow)
    # Holds ~25 requests open at a time in /debug/slow. This is the only mode
    # that moves http_requests_in_flight, because it is the only one that keeps
    # requests inside the instrumented span rather than queued upstream of it.
    # Expect the gauge to sit around 25 and the latency percentiles to jump to
    # the top histogram bucket.
    while ! expired; do
      i=0
      while [ "$i" -lt 25 ]; do hit "/debug/slow?ms=6000" & i=$((i+1)); done
      sleep 3
    done
    wait
    ;;

  abandon)
    # Clients that give up after 1s on an 8s response. Produces status_code=499
    # — the branch written on Day 3 that nothing could reach until /debug/slow
    # existed, because every real request completed in ~2ms.
    while ! expired; do
      i=0
      while [ "$i" -lt 8 ]; do
        curl -s -o /dev/null --max-time 1 "$BASE/debug/slow?ms=8000" 2>/dev/null &
        i=$((i+1))
      done
      sleep 2
    done
    wait
    ;;

  errors)
    # Drives the error ratio. Second argument is the failure rate, not a
    # duration: ./traffic.sh errors 0.2 sends 20% 5xx.
    #
    # The rate is the interesting dial. rate() over a window is a moving
    # average, so an instant break crosses the threshold at t = (T/E) x W —
    # a total outage trips the 5% rule in 15s, a 10% error rate takes 150s.
    # This mode's SECOND argument is the rate, so the duration moves to the
    # third: ./traffic.sh errors 0.6 300. It used to hard-set DURATION=0 and
    # ignore whatever was passed, so `errors 0.6 300` ran forever while looking
    # like it would stop on its own.
    RATE_ARG="${2:-1}"
    DURATION="${3:-0}"
    echo "  failure rate: $RATE_ARG  duration=${DURATION}s (0 = until stopped)"
    while ! expired; do
      i=0
      while [ "$i" -lt 6 ]; do hit "/debug/fail?rate=$RATE_ARG"; i=$((i+1)); done
      hitn 4
      sleep 1
    done
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

echo "done after $(( $(date +%s) - START ))s"   # registration cleared by the EXIT trap
