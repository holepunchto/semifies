const test = require('brittle')
const satisfies = require('../')

const include = require('./fixtures/include')
const exclude = require('./fixtures/exclude')

test('fixtures - include', function (t) {
  for (const [range, version] of include) {
    const ok = satisfies(version, range)
    t.ok(ok, `satisfies('${version}', '${range}')`)
  }
})

test('fixtures - exclude', function (t) {
  for (const [range, version] of exclude) {
    const ok = satisfies(version, range)
    t.ok(!ok, `!satisfies('${version}', '${range}')`)
  }
})
