.PHONY: help
help:
	@echo " "
	@echo "make cmds:"
	@echo "  make setup       - Build Docker container and install all dependencies"
	@echo "  make run         - Start all services (Postgres, Backend, Frontend)"
	@echo "  make stop        - Stop all services"
	@echo "  make clean       - Remove all generated files and Docker volumes"
	@echo " "

include .env frontend/.env
export

# ------------------------------------------------------
# ---------------------    cmds    ---------------------

# ----- setup -----

.PHONY: setup
setup:
	@echo "📦 Installing backend dependencies..."
	@npm install --prefix backend
	@echo "📦 Installing frontend dependencies..."
	@npm install --prefix frontend
	@echo " "
	@echo " if first time:"
	@echo " setup serverless env and run:"
	@echo " -> make deploy-serverless"
	@echo " "

# ----- run -----

.PHONY: run
run: stop run-all

.PHONY: run-clean
run-clean: clean-stop setup
	@make run-all

.PHONY: run-all
run-all:
	@echo "🚀 Starting all services..."
	@make db-up
	@make apps-up
	@make open

# ----- open -----

.PHONY: open
open:
	@open http://localhost:$(VITE_PORT)

# ----- up -----

# running apps in separate terminals using `eks_nodejs` (an alias registered in `mkcli` (https://github.com/alekomom/mkcli) )
.PHONY: apps-up
apps-up:
	@osascript -e 'tell application "Terminal" to do script "eks_nodejs frontend-up"'
	@osascript -e 'tell application "Terminal" to do script "eks_nodejs backend-up"'

.PHONY: frontend-up
frontend-up:
	@echo "🚀 Starting frontend..."
	@npm run dev --prefix frontend

.PHONY: backend-up
backend-up:
	@echo "🚀 Starting backend..."
	@npm run dev --prefix backend

# ----- stop -----

.PHONY: stop
stop:
	@echo "🛑 Stopping all services..."
	@docker-compose down

.PHONY: clean-stop
clean-stop: stop
	@echo "🧹 Cleaning up..."
	@rm -rf node_modules frontend/node_modules frontend/dist
	@docker-compose down -v --remove-orphans
	@echo "✅ Cleanup complete"

# ------------------------------------------------------------
# ---- serverless

.PHONY: deploy-serverless
deploy-serverless:
	@echo "🚀 Deploying serverless functions..."
	@./scripts/deploy-serverless.sh

# ------------------------------------------------------------
# ---- db

.PHONY: db-inspect
db-inspect:
	@echo "🔍 Inspecting database schema..."
	@docker exec -it $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "\d jobs"
	@docker exec -it $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "\d jobs.count"

.PHONY: db-shell
db-shell:
	@echo "🐚 Opening database shell..."
	@docker exec -it $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

.PHONY: db-reset
db-reset: stop
	@echo "🗑️  Resetting database..."
	@docker-compose down -v
	@make db-init

.PHONY: db-up
db-up:
	@echo "starting docker compose up -d postgres"
	@docker-compose up -d postgres
	@echo "waiting for database to be ready..."
	@while ! docker exec $(DB_CONTAINER_NAME) pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB); do sleep 1; done
	@echo "database is ready"


.PHONY: db-init
db-init:
	@echo "⏳ Waiting for database to be ready..."
	@while ! docker exec $(DB_CONTAINER_NAME) pg_isready -U $(POSTGRES_USER) -d $(POSTGRES_DB); do sleep 1; done
	@echo "🗄️  Initializing database schema..."
	@echo "debug db-init, vars: $(DB_CONTAINER_NAME), $(POSTGRES_USER), $(POSTGRES_DB)"
	@docker exec -i $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) < db/database.sql
	@echo "✅ Database initialized"

.PHONY: db-count
db-count:
	@echo "📊 Counting database records..."
	@docker exec -it $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "SELECT 'jobs' as table_name, COUNT(*) as count FROM jobs;"
	@docker exec -it $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "SELECT 'job_logs' as table_name, COUNT(*) as count FROM job_logs;"
	@docker exec -it $(DB_CONTAINER_NAME) psql -U $(POSTGRES_USER) -d $(POSTGRES_DB) -c "SELECT 'users' as table_name, COUNT(*) as count FROM users;"
