.PHONY: bin

all: format

format:
	./node_modules/.bin/prettier --write .

build:
	rm -rf dist; \
	./node_modules/.bin/tsc; \
	./node_modules/.bin/prettier --write .

bin:
	node ./bin/instagram.js
