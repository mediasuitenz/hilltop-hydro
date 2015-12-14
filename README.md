#hilltop hydro

Provides api access to the hilltop API served by Marlborough district council, see http://hydro.marlborough.govt.nz/ for more information on the supported measurements.

## Installation

```
npm install --save @mediasuitenz/hilltophydro
```

## Usage
This module returns promises

### Get data for a measurement
TODO

### Get sites for a measurement
TODO

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

### creating a release

See the following npm scripts in `package.json`
You will only need to run *one* of these.
```
npm run deploy:patch
npm run deploy:minor
npm run deploy:major
```
