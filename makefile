PKG_MGR=pnpm

.PHONY=build

install:
	$(PKG_MGR) install

compiler.js:
	$(PKG_MGR) build:compiler

	cp -f ./package.json ./build/

cli.js: compiler.js
	$(PKG_MGR) build:cli
