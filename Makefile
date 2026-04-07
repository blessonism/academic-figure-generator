.PHONY: help dev dev-backend up down build logs migrate seed test lint format frontend-test frontend-lint frontend-build check clean

COMPOSE_DEV = docker compose -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PROD = docker compose -f docker-compose.yml -f docker-compose.prod.yml

help: ## Show help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ===== Development =====

dev: ## Start all services in development mode
	$(COMPOSE_DEV) up --build

up: ## Start all services (detached)
	$(COMPOSE_DEV) up -d --build

dev-backend: ## Start backend stack only for local frontend development
	$(COMPOSE_DEV) up --build postgres redis minio migrate backend celery-worker celery-beat

down: ## Stop all services
	$(COMPOSE_DEV) down

build: ## Build all images
	$(COMPOSE_DEV) build

logs: ## Tail logs
	$(COMPOSE_DEV) logs -f

# ===== Database =====

migrate: ## Run database migrations
	$(COMPOSE_DEV) run --rm migrate

migrate-create: ## Create a new migration (usage: make migrate-create MSG="add users table")
	$(COMPOSE_DEV) exec backend alembic revision --autogenerate -m "$(MSG)"

seed: ## Seed database with initial data
	$(COMPOSE_DEV) exec backend python -m scripts.seed_color_schemes

# ===== Testing =====

test: ## Run tests
	$(COMPOSE_DEV) exec backend pytest -v
	npm --prefix frontend run test -- --run

test-cov: ## Run tests with coverage
	$(COMPOSE_DEV) exec backend pytest --cov=app --cov-report=html -v

# ===== Code Quality =====

lint: ## Run linter
	$(COMPOSE_DEV) exec backend ruff check app/
	$(COMPOSE_DEV) exec backend ruff format --check app/
	npm --prefix frontend run lint

frontend-test: ## Run frontend tests
	npm --prefix frontend run test -- --run

frontend-lint: ## Run frontend lint
	npm --prefix frontend run lint

frontend-build: ## Build frontend bundle
	npm --prefix frontend run build

check: lint test frontend-build ## Run full backend/frontend quality checks

format: ## Auto-format code
	$(COMPOSE_DEV) exec backend ruff check --fix app/
	$(COMPOSE_DEV) exec backend ruff format app/

# ===== Production =====

prod-up: ## Start production services
	$(COMPOSE_PROD) up -d --build

prod-down: ## Stop production services
	$(COMPOSE_PROD) down

# ===== Utilities =====

shell: ## Open a shell in the backend container
	$(COMPOSE_DEV) exec backend bash

dbshell: ## Open PostgreSQL shell
	$(COMPOSE_DEV) exec postgres psql -U afg_user -d academic_figure_generator

redis-cli: ## Open Redis CLI
	$(COMPOSE_DEV) exec redis redis-cli

clean: ## Remove all containers, volumes, and images
	$(COMPOSE_DEV) down -v --rmi all --remove-orphans
