#hilltop hydro

Provides api access to a hilltop API service, see http://www.hilltop.co.nz/

## Installation

```
npm install --save @mediasuitenz/hilltophydro
```

## Usage
See the docs on the `gh-pages` branch [here](http://mediasuitenz.github.io/hilltop-hydro/)

## Development
This module is unit tested, please include tests with your pull request.

### Get code
```
git clone <thisrepo>
npm install
```

### Run tests
```bash
$ npm run test:watch
# or
$ npm run test
```

### update the docs
When you add comments to code you can update the documentation, running `npm run docs` then push your changes to the `gh-pages` branch
```
$ git checkout gh-pages
$ npm run docs
$ git add .
$ git commit
```

### creating a release

See the following npm scripts in `package.json`
You will only need to run *one* of these.
```
npm run deploy:patch
npm run deploy:minor
npm run deploy:major
```
