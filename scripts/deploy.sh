#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Power Gym – Production Deployment Script
# Usage: ./scripts/deploy.sh [--skip-backup] [--skip-migrate]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SKIP_BACKUP=false
SKIP_MIGRATE=false
COMPOSE_FILE="docker-compose.prod.yml"

for arg in "$@"; do
  case $arg in
    --skip-backup)  SKIP_BACKUP=true ;;
    --skip-migrate) SKIP_MIGRATE=true ;;
  esac
done

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        Power Gym – Production Deployment             ║"
echo "║        $(date '+%Y-%m-%d %H:%M:%S')                  ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── 1. Check prerequisites ────────────────────────────────────────────────────
echo "📋 Checking prerequisites..."
command -v docker >/dev/null || { echo "❌ docker not found"; exit 1; }
command -v docker-compose >/dev/null || command -v docker compose >/dev/null || { echo "❌ docker-compose not found"; exit 1; }
[ -f .env.production ] || { echo "❌ .env.production not found. Copy from .env.production.example"; exit 1; }
echo "  ✅ Prerequisites OK"

# ── 2. Load environment ───────────────────────────────────────────────────────
echo ""
echo "🔑 Loading environment..."
set -a
source .env.production
set +a
echo "  ✅ Environment loaded"

# ── 3. Backup database ────────────────────────────────────────────────────────
if [ "${SKIP_BACKUP}" = false ]; then
  echo ""
  echo "📦 Creating pre-deploy database backup..."
  bash ./scripts/backup.sh pre-deploy || echo "  ⚠️  Backup failed (non-fatal), continuing..."
fi

# ── 4. Pull latest code ───────────────────────────────────────────────────────
echo ""
echo "📥 Pulling latest code..."
git pull origin main
echo "  ✅ Code updated"

# ── 5. Build Docker images ────────────────────────────────────────────────────
echo ""
echo "🏗️  Building Docker images..."
docker compose -f "${COMPOSE_FILE}" build --no-cache
echo "  ✅ Images built"

# ── 6. Run database migrations ────────────────────────────────────────────────
if [ "${SKIP_MIGRATE}" = false ]; then
  echo ""
  echo "🗃️  Running database migrations..."
  docker compose -f "${COMPOSE_FILE}" run --rm backend \
    sh -c "npx prisma migrate deploy"
  echo "  ✅ Migrations complete"
fi

# ── 7. Start services ─────────────────────────────────────────────────────────
echo ""
echo "🚀 Starting services..."
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
echo "  ✅ Services started"

# ── 8. Wait for health ────────────────────────────────────────────────────────
echo ""
echo "⏳ Waiting for services to become healthy..."
sleep 15

# ── 9. Health check ───────────────────────────────────────────────────────────
echo ""
bash ./scripts/health-check.sh "http://localhost:3001" "http://localhost:3000"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ DEPLOYMENT COMPLETE                               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:3000"
echo "  Logs:     docker compose -f ${COMPOSE_FILE} logs -f"
echo ""
