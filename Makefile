.PHONY: help
help:
	@echo "DevOps Cockpit POC - Available Commands:"
	@echo "  make setup       - Build Docker container and install all dependencies"
	@echo "  make dev         - Start all services (Postgres, Backend, Frontend)"
	@echo "  make stop        - Stop all services"
	@echo "  make clean       - Remove all generated files and Docker volumes"
	@echo "  make db-init     - (Re)Initialize the database schema"
	@echo "  make db-inspect  - Inspect current database schema"
	@echo "  make db-shell    - Open PostgreSQL shell"
	@echo "  make db-migrate  - Run database migration for missing columns"
	@echo "  make db-reset    - Reset database completely"

include .env
export

.PHONY: setup
setup:
	@docker-compose up -d postgres
	@echo "📦 Installing backend dependencies..."
	@npm install --prefix backend
	@echo "📦 Installing frontend dependencies..."
	@cd frontend && npm install
	@make db-init

.PHONY: run
run: stop db-init dev


.PHONY: db-init
db-init:
	@echo "⏳ Waiting for database to be ready..."
	@while ! docker exec $(DB_CONTAINER_NAME) pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB); do sleep 1; done
	@echo "🗄️  Initializing database schema..."
	@docker exec -i $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) < db/database.sql
	@echo "✅ Database initialized"

.PHONY: dev
dev:
	@echo "🚀 Starting all services..."
	@docker-compose up -d postgres
	@npm run --prefix frontend dev & npm run dev:backend --prefix backend

.PHONY: stop
stop:
	@echo "🛑 Stopping all services..."
	@docker-compose down

.PHONY: clean
clean: stop
	@echo "🧹 Cleaning up..."
	@rm -rf node_modules frontend/node_modules frontend/dist
	@docker-compose down -v --remove-orphans
	@echo "✅ Cleanup complete"

.PHONY: deploy-serverless
deploy-serverless:
	@echo "🚀 Deploying serverless functions..."
	@./scripts/deploy-serverless.sh

.PHONY: db-inspect
db-inspect:
	@echo "🔍 Inspecting database schema..."
	@docker exec -it $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "\d jobs"

.PHONY: db-shell
db-shell:
	@echo "🐚 Opening database shell..."
	@docker exec -it $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

.PHONY: db-migrate
db-migrate:
	@echo "🔄 Running database migration..."
	@docker exec -i $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'ssh';"
	@docker exec -i $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS exit_code INTEGER;"
	@docker exec -i $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);"
	@docker exec -i $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);"
	@echo "✅ Database migration complete"

.PHONY: db-reset
db-reset: stop
	@echo "🗑️  Resetting database..."
	@docker-compose down -v
	@make db-init
