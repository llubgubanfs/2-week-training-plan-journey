#!/usr/bin/env bash
#
# Proves the stack is actually working, rather than that four containers are
# running. Every check hits a real endpoint and reads the answer.
#
#   ./verify.sh
#
# Exit code is the number of failed checks, so it works in CI or a pre-demo
# sanity pass.
#
set -uo pipefail

API="${BOOKING_API_URL:-http://localhost:3000}"
PROM="${PROMETHEUS_URL:-http://localhost:9090}"
GRAF="${GRAFANA_URL:-http://localhost:3030}"
JAEG="${JAEGER_URL:-http://localhost:16686}"
GRAF_AUTH="${GRAFANA_ADMIN_USER:-admin}:${GRAFANA_ADMIN_PASSWORD:-admin}"

FAILED=0
pass() { printf '  \033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[31m✗\033[0m %s\n' "$1"; FAILED=$((FAILED+1)); }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

q() { curl -s -G "$PROM/api/v1/query" --data-urlencode "query=$1"; }

head_ "Containers"
for c in coworking-booking-api coworking-prometheus coworking-grafana coworking-jaeger; do
  state=$(docker inspect -f '{{.State.Status}}' "$c" 2>/dev/null || echo missing)
  [ "$state" = "running" ] && pass "$c $state" || fail "$c $state"
done

head_ "booking-api"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$API/metrics" || echo 000)
[ "$code" = "200" ] && pass "GET /metrics → 200" || fail "GET /metrics → $code"
ctype=$(curl -s -o /dev/null -w '%{content_type}' --max-time 5 "$API/metrics" || true)
case "$ctype" in
  text/plain*) pass "exposition content-type: $ctype" ;;
  *)           fail "unexpected content-type: $ctype" ;;
esac
for m in http_requests_total http_request_duration_seconds_bucket http_requests_in_flight; do
  curl -s --max-time 5 "$API/metrics" | grep -q "^$m" \
    && pass "exposes $m" || fail "missing $m"
done

head_ "Prometheus"
curl -s --max-time 5 "$PROM/api/v1/targets" | python3 -c "
import json, sys
mark = lambda ok: '  \033[32m' + chr(10003) + '\033[0m' if ok else '  \033[31m' + chr(10007) + '\033[0m'
try:
    targets = json.load(sys.stdin)['data']['activeTargets']
except Exception:
    print(mark(False), 'targets API unreachable'); sys.exit(1)
bad = 0
for t in targets:
    ok = t['health'] == 'up'
    job = t['labels']['job']
    print(mark(ok), 'target %s -> %s %s' % (job, t['health'].upper(), t.get('lastError', '')))
    bad += 0 if ok else 1
sys.exit(bad)
" || FAILED=$((FAILED+1))

curl -s --max-time 5 "$PROM/api/v1/rules" | python3 -c "
import json, sys
mark = lambda ok: '  \033[32m' + chr(10003) + '\033[0m' if ok else '  \033[31m' + chr(10007) + '\033[0m'
try:
    groups = json.load(sys.stdin)['data']['groups']
except Exception:
    print(mark(False), 'rules API unreachable'); sys.exit(1)
rules = [r for g in groups for r in g['rules']]
if not rules:
    print(mark(False), 'no alerting rules loaded'); sys.exit(1)
bad = 0
for r in rules:
    ok = r.get('health') == 'ok'
    print(mark(ok), 'rule %s health=%s state=%s' % (r['name'], r.get('health'), r.get('state')))
    bad += 0 if ok else 1
sys.exit(bad)
" || FAILED=$((FAILED+1))

head_ "Grafana"
health=$(curl -s --max-time 5 "$GRAF/api/health" | python3 -c 'import json,sys;print(json.load(sys.stdin)["database"])' 2>/dev/null || echo unreachable)
[ "$health" = "ok" ] && pass "API health: database ok" || fail "API health: $health"

ds=$(curl -s -u "$GRAF_AUTH" --max-time 5 "$GRAF/api/datasources" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))' 2>/dev/null || echo 0)
[ "$ds" -ge 1 ] && pass "$ds provisioned datasource(s)" || fail "no provisioned datasource"

dash=$(curl -s -u "$GRAF_AUTH" --max-time 5 "$GRAF/api/search?query=" | python3 -c 'import json,sys;print(len(json.load(sys.stdin)))' 2>/dev/null || echo 0)
[ "$dash" -ge 1 ] && pass "$dash provisioned dashboard(s)" || fail "no provisioned dashboard"

# The check that matters: not "is the datasource configured" but "does a query
# actually travel Grafana → Prometheus → TSDB and come back".
proxy=$(curl -s -u "$GRAF_AUTH" --max-time 5 "$GRAF/api/datasources/proxy/uid/prometheus/api/v1/query?query=up" \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["status"])' 2>/dev/null || echo failed)
[ "$proxy" = "success" ] && pass "live PromQL query through Grafana's proxy" || fail "Grafana cannot query Prometheus ($proxy)"

head_ "Jaeger"
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$JAEG" || echo 000)
[ "$code" = "200" ] && pass "UI → 200" || fail "UI → $code"
# Jaeger self-instruments, so "jaeger-all-in-one" is always present and is NOT
# your app. Until Day 6 exports spans, that is the only name you should see.
svc=$(curl -s --max-time 5 "$JAEG/api/services" | python3 -c "
import json, sys
d = json.load(sys.stdin)['data'] or []
print(', '.join(d) if d else 'none')" 2>/dev/null || echo err)
pass "reporting services: $svc"
case "$svc" in
  *booking-api*) pass "booking-api is exporting spans — Day 6 has landed" ;;
  *)             pass "no app spans yet — expected until Day 6" ;;
esac

head_ "Cardinality guard"
series=$(q 'count(http_requests_total)' | python3 -c 'import json,sys;r=json.load(sys.stdin)["data"]["result"];print(r[0]["value"][1] if r else 0)' 2>/dev/null || echo 0)
if [ "$series" = "0" ]; then
  pass "no traffic recorded yet — run ./traffic.sh first"
elif [ "$series" -le 20 ]; then
  pass "http_requests_total series: $series (route templates, not raw URLs)"
else
  fail "http_requests_total series: $series — suspiciously high, check the route label"
fi

printf '\n'
if [ "$FAILED" -eq 0 ]; then
  printf '\033[32mall checks passed\033[0m\n'
else
  printf '\033[31m%s check(s) failed\033[0m\n' "$FAILED"
fi
exit "$FAILED"
