.PHONY: bin

all: format

format:
	./node_modules/.bin/prettier --write .

build:
	./node_modules/.bin/tsc

bin:
	node ./bin/instagram.js
