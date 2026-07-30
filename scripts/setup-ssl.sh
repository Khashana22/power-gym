#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Power Gym – SSL Certificate Setup with Let's Encrypt
# Usage: ./scripts/setup-ssl.sh yourdomain.com your@email.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"
COMPOSE_FILE="docker-compose.prod.yml"

echo ""
echo "🔐 Setting up SSL for ${DOMAIN}..."

# Step 1: Start only nginx in HTTP mode (for ACME challenge)
echo "🚀 Starting Nginx in HTTP-only mode..."
docker compose -f "${COMPOSE_FILE}" up -d nginx

echo "⏳ Waiting for Nginx to start..."
sleep 5

# Step 2: Obtain certificate
echo "📜 Obtaining certificate from Let's Encrypt..."
docker compose -f "${COMPOSE_FILE}" run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}"

echo ""
echo "✅ SSL certificate obtained for ${DOMAIN}"
echo ""
echo "Next steps:"
echo "  1. Update nginx/nginx.conf – replace 'yourdomain.com' with '${DOMAIN}'"
echo "  2. Run: docker compose -f ${COMPOSE_FILE} restart nginx"
echo "  3. Certbot will auto-renew certificates every 12 hours"
