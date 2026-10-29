# Docker owns the runtime. No local Node.js or Nginx installation needed.
.DEFAULT_GOAL := help

PORT ?= 3080
export PORT

.PHONY: all help setup install dev up build running down restart clean open logs ps test test-fast smoke sh shell deploy coolify-check seo

all: help

setup: ## Check Docker and build the development image
	@bash bin/development setup

install: setup

dev: ## Rebuild, start attached, and open the browser when ready
	@bash bin/development dev

up: ## Rebuild and run attached; Ctrl+C stops the stack
	@bash bin/development up

build: ## Build the production image without starting it
	@bash bin/development build

running: ## Check health; exit nonzero when stopped or unhealthy
	@bash bin/development running

down: ## Stop and remove this project's development containers
	@bash bin/development down

restart: ## Restart the development app
	@bash bin/development restart

clean: ## Remove development containers and images; preserve dist source
	@bash bin/development clean

open: ## Wait for readiness and open the app
	@bash bin/development open

logs: ## Follow development logs
	@bash bin/development logs

ps: ## Show development containers
	@bash bin/development ps

test: ## Validate source/assets and smoke-test a production container
	@bash bin/development test

test-fast: ## Validate JavaScript and local links in Docker
	@bash bin/development test-fast

smoke: ## Build and smoke-test the production image
	@bash bin/development smoke

sh: ## Open a shell in the running development app
	@bash bin/development sh

shell: sh

coolify-check: ## Validate the Coolify deployment file without deploying
	@bash bin/development coolify-check

deploy: ## Build and run the production stack on this Docker host
	@bash bin/development deploy

seo: ## Regenerate pre-rendered experiment HTML, metadata and sitemap in Docker
	@bash bin/development seo

help: ## Show task conventions and overrides (default)
	@printf '%s\n' \
	  'Development' \
	  '  make setup       Check Docker and build the development image' \
	  '  make dev         Rebuild, run attached, open browser when ready' \
	  '  make up          Same as dev without opening a browser' \
	  '  make down        Stop/remove development containers' \
	  '  make restart     Restart the development app' \
	  '  make open        Open the healthy app' \
	  '  make running     Check app health (nonzero if stopped/unhealthy)' \
	  '  make ps          Show development containers' \
	  '  make logs        Follow development logs' \
	  '  make sh          Open a shell in the app' \
	  '' \
	  'Build and verify' \
	  '  make build       Build the production image' \
	  '  make seo         Regenerate experiment HTML, metadata, and sitemap' \
	  '  make test-fast   JavaScript syntax, links, and thumbnails in Docker' \
	  '  make smoke       Build and test an isolated production container' \
	  '  make test        Run test-fast and smoke' \
	  '  make coolify-check Validate the Coolify Compose definition' \
	  '' \
	  'Production and cleanup' \
	  '  make deploy      Run production on this Docker host (no source mount)' \
	  '  make clean       Remove dev images/containers; preserve source' \
	  '' \
	  'Options: make dev PORT=3081' \
	  'Aliases: make all -> help; make install -> setup; make shell -> sh' \
	  'Production: docker compose -p fractal-space-production -f docker-compose.production.yml down'
