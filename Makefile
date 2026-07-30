# ─────────────────────────────────────────────────────────────────────────────
# Power Gym – Makefile
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help dev prod stop logs backup restore health deploy ssl-setup \
        migrate seed prisma-studio test build clean

COMPOSE_DEV  = docker-compose.yml
COMPOSE_PROD = docker-compose.prod.yml
ENV_FILE     = .env.production

# ── Colors ────────────────────────────────────────────────────────────────────
BLUE  = \033[0;34m
GREEN = \033[0;32m
RESET = \033[0m

help: ## Show this help
	@echo ""
	@echo "  $(BLUE)Power Gym Management System$(RESET)"
	@echo "  Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "    $(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ── Development ───────────────────────────────────────────────────────────────
dev: ## Start development environment (DB only via Docker, backend+frontend locally)
	docker compose -f $(COMPOSE_DEV) up -d
	@echo ""
	@echo "  $(GREEN)✅ Database started$(RESET)"
	@echo "  Run backend:  cd backend && npm run start:dev"
	@echo "  Run frontend: cd frontend && npm run dev"

dev-stop: ## Stop development environment
	docker compose -f $(COMPOSE_DEV) down

migrate: ## Run Prisma migrations (backend)
	cd backend && npx prisma migrate dev

migrate-prod: ## Run Prisma migrations in production
	docker compose -f $(COMPOSE_PROD) run --rm backend npx prisma migrate deploy

seed: ## Seed the database
	cd backend && npx prisma db seed

prisma-studio: ## Open Prisma Studio
	cd backend && npx prisma studio

# ── Production ────────────────────────────────────────────────────────────────
prod: ## Build and start production environment
	@[ -f $(ENV_FILE) ] || (echo "❌ $(ENV_FILE) not found. Copy from .env.production.example" && exit 1)
	docker compose -f $(COMPOSE_PROD) up -d --build

stop: ## Stop production environment
	docker compose -f $(COMPOSE_PROD) down

restart: ## Restart production environment
	docker compose -f $(COMPOSE_PROD) restart

logs: ## Follow production logs
	docker compose -f $(COMPOSE_PROD) logs -f --tail=100

logs-backend: ## Follow backend logs only
	docker compose -f $(COMPOSE_PROD) logs -f --tail=100 backend

logs-nginx: ## Follow nginx logs only
	docker compose -f $(COMPOSE_PROD) logs -f --tail=100 nginx

# ── Deployment ────────────────────────────────────────────────────────────────
deploy: ## Full production deployment (pull, build, migrate, restart)
	bash ./scripts/deploy.sh

deploy-no-backup: ## Deploy without pre-deploy backup
	bash ./scripts/deploy.sh --skip-backup

ssl-setup: ## Setup SSL certificates (usage: make ssl-setup DOMAIN=example.com EMAIL=you@example.com)
	@[ -n "$(DOMAIN)" ] || (echo "❌ DOMAIN is required. Usage: make ssl-setup DOMAIN=example.com EMAIL=you@example.com" && exit 1)
	@[ -n "$(EMAIL)"  ] || (echo "❌ EMAIL is required"  && exit 1)
	bash ./scripts/setup-ssl.sh $(DOMAIN) $(EMAIL)

# ── Database ──────────────────────────────────────────────────────────────────
backup: ## Create database backup
	bash ./scripts/backup.sh

backup-label: ## Create labeled backup (usage: make backup-label LABEL=before-migration)
	bash ./scripts/backup.sh $(LABEL)

restore: ## Restore database (usage: make restore FILE=./backups/power_gym_xxx.sql.gz)
	@[ -n "$(FILE)" ] || (echo "❌ FILE is required. Usage: make restore FILE=./backups/backup.sql.gz" && exit 1)
	bash ./scripts/restore.sh $(FILE)

# ── Monitoring ────────────────────────────────────────────────────────────────
health: ## Run health checks
	bash ./scripts/health-check.sh

status: ## Show container status
	docker compose -f $(COMPOSE_PROD) ps

# ── Development Utilities ─────────────────────────────────────────────────────
test: ## Run backend tests
	cd backend && npm test

test-cov: ## Run backend tests with coverage
	cd backend && npm run test:cov

build: ## Build backend and frontend
	cd backend && npm run build
	cd frontend && npm run build

clean: ## Remove node_modules and dist
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/.next

install: ## Install all dependencies
	cd backend && npm install
	cd frontend && npm install
