# Checks the project: make
#
# Every target installs what it needs into node_modules, ignored by Git. The
# version of Node.js comes from .tool-versions when asdf is installed.

.PHONY: all check clean doctoc doctoc-check format format-check lint lint-fix run test

all: check

## Run every check: table of contents, formatting, linting, tests.
check: doctoc-check format-check lint test

## Check that the README's table of contents is up to date.
doctoc-check: node_modules
	npm run doctoc

## Update the README's table of contents with doctoc.
doctoc: node_modules
	npm run doctoc:write

## Check that every file is formatted with Prettier.
format-check: node_modules
	npm run format

## Format every file with Prettier.
format: node_modules
	npm run format:write

## Check the code with ESLint.
lint: node_modules
	npm run lint

## Run the automated tests.
test: node_modules
	npm test

## Run the application in development mode, restarting it when its code or .env
## changes.
run: node_modules
	npm run dev

## Delete the database and the installed dependencies.
clean:
	rm -rf db.json node_modules

node_modules: package.json package-lock.json
	npm ci
	@touch node_modules
