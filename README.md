# semifies

Slimmed down satisfies from semver

```
npm install semifies
```

## Usage

``` js
const semifies = require('semifies')

// same-ish as semver.satisfies

console.log(semifies('1.5.0', '^1.3.0')) // true
console.log(semifies('2.0.0', '^1.3.0')) // false
console.log(semifies('2.0.0', '^1.3.0 || ~2.0.0')) // true
```

Passes the test fixtures from semver

## License

Apache-2.0
