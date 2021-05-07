all: format

format:
	npx prettier --write .

build:
	./node_modules/.bin/tsc