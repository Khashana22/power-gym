#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Power Gym – Database Backup Script
# Usage: ./scripts/backup.sh [label]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

LABEL="${1:-manual}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${BACKUP_DIR}/power_gym_${LABEL}_${TIMESTAMP}.sql.gz"

# Load env file if present
if [ -f .env.production ]; then
  set -a
  source .env.production
  set +a
elif [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Verify required vars
: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_NAME:?DB_NAME is required}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

mkdir -p "${BACKUP_DIR}"

echo "📦 [$(date)] Starting backup: ${BACKUP_FILE}"

PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-password \
  -F p \
  | gzip > "${BACKUP_FILE}"

SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
echo "✅ [$(date)] Backup complete: ${BACKUP_FILE} (${SIZE})"

# ── Optional: Upload to S3 ────────────────────────────────────────────────────
if [ -n "${S3_BUCKET:-}" ] && command -v aws &>/dev/null; then
  echo "☁️  Uploading to S3: s3://${S3_BUCKET}/backups/$(basename ${BACKUP_FILE})"
  aws s3 cp "${BACKUP_FILE}" "s3://${S3_BUCKET}/backups/$(basename ${BACKUP_FILE})"
  echo "✅ S3 upload complete"
fi

# ── Auto cleanup: keep last 30 local backups ──────────────────────────────────
KEEP_COUNT="${BACKUP_KEEP_COUNT:-30}"
cd "${BACKUP_DIR}"
ls -t power_gym_*.sql.gz 2>/dev/null | tail -n +$((KEEP_COUNT + 1)) | xargs -r rm --
echo "🧹 Kept last ${KEEP_COUNT} backups"
