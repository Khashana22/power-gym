#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Power Gym – Database Restore Script
# Usage: ./scripts/restore.sh <backup_file.sql.gz>
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BACKUP_FILE="${1:?Usage: $0 <backup_file.sql.gz>}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

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

: "${DB_USER:?DB_USER is required}"
: "${DB_PASSWORD:?DB_PASSWORD is required}"
: "${DB_NAME:?DB_NAME is required}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "⚠️  WARNING: This will OVERWRITE the database '${DB_NAME}'!"
echo "   Backup file: ${BACKUP_FILE}"
read -p "   Type 'yes' to confirm: " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 1
fi

echo "🔄 [$(date)] Starting restore from: ${BACKUP_FILE}"

# Create a safety backup first
SAFETY_BACKUP="./backups/pre_restore_safety_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p ./backups
echo "📦 Creating safety backup before restore: ${SAFETY_BACKUP}"
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
  --no-password -F p | gzip > "${SAFETY_BACKUP}"
echo "✅ Safety backup created"

# Drop and recreate the database
echo "🗑️  Dropping existing database..."
PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" \
  -c "DROP DATABASE IF EXISTS ${DB_NAME};" postgres

PGPASSWORD="${DB_PASSWORD}" psql \
  -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" \
  -c "CREATE DATABASE ${DB_NAME};" postgres

echo "📥 Restoring from backup..."
if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --no-password
else
  PGPASSWORD="${DB_PASSWORD}" psql \
    -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
    --no-password -f "${BACKUP_FILE}"
fi

echo "✅ [$(date)] Restore complete from: ${BACKUP_FILE}"
echo "   Safety backup is at: ${SAFETY_BACKUP}"
