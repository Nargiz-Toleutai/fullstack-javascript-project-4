install:
	npm ci
page-loader-h:
	node index.js -h
lint:
	npx eslint .
test:
	npm test
test-coverage:
	npm test -- --coverage --coverageProvider=v8