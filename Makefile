.PHONY: help install build typecheck test clean

help: ## Show this help
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk -F ':.*?## ' '{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install npm dependencies
	npm install

build: ## Compile TypeScript to dist/
	npm run build

typecheck: ## Type-check without emitting
	npm run typecheck

test: build ## Run the test suite
	node --test 'tests/**/*.test.js'

clean: ## Remove build artifacts
	npm run clean
