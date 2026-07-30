#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Power Gym – Health Check Script
# Usage: ./scripts/health-check.sh [api_url]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

API_URL="${1:-http://localhost:3001}"
FRONTEND_URL="${2:-http://localhost:3000}"

PASS=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${url}" 2>/dev/null || echo "000")
  if [[ "${code}" =~ ^(200|301|302|304)$ ]]; then
    echo "  ✅ ${name}: HTTP ${code}"
    PASS=$((PASS + 1))
  else
    echo "  ❌ ${name}: HTTP ${code} (expected 2xx/3xx)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Power Gym – System Health Check"
echo "  $(date)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🔍 Checking services..."
check "Backend Health" "${API_URL}/health"
check "Frontend"       "${FRONTEND_URL}"

echo ""
echo "🐳 Docker containers..."
if command -v docker &>/dev/null; then
  docker ps --format "  {{.Names}}: {{.Status}}" --filter "name=power-gym" 2>/dev/null || echo "  (docker not available)"
fi

echo ""
echo "💾 Disk usage..."
df -h . | tail -1 | awk '{printf "  Used: %s / %s (%s)\n", $3, $2, $5}'

echo ""
echo "📊 Memory usage..."
free -h 2>/dev/null | grep Mem | awk '{printf "  Used: %s / %s\n", $3, $2}' || echo "  (not available on this OS)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $FAIL -eq 0 ]; then
  echo "  ✅ ALL CHECKS PASSED ($PASS/$((PASS + FAIL)))"
else
  echo "  ⚠️  $FAIL CHECK(S) FAILED ($PASS/$((PASS + FAIL)) passed)"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $FAIL
