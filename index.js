module.exports = satisfies

function satisfies (v, t) {
  const [version] = parse(v, '')

  for (const checks of compile(t)) {
    if (checkAll(checks, version)) return true
  }

  return false
}

function checkAll (checks, v) {
  for (const [ok, t] of checks) {
    if (!test(v, t, ok)) return false
  }
  return true
}

function match (t) {
  if (t === 'latest') t = '>=0'
  return t.match(/^([^\d+]*)(\d.*)$/) || [null, '', '*.*.*']
}

function compile (t) {
  const result = []

  let checks = []

  const tokens = t.trim().split(/\s+/)

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]

    if (t === '-') continue

    if (t === '||') {
      result.push(checks)
      checks = []
      continue
    }

    // untrim whitespace if this is a range spec
    if (/^[<>=~v^]+$/.test(t) && i + 1 < tokens.length) {
      tokens[i + 1] = t + tokens[i + 1]
      continue
    }

    const res = match(t)

    let cmp = res[1] || '='
    if (cmp.endsWith('v')) cmp = cmp.slice(0, -1)

    let [v, c] = parse(res[2], cmp)

    if (i + 2 < tokens.length && tokens[i + 1] === '-') {
      const m = match(tokens[i + 2])
      tokens[i + 2] = '<=' + (m[2].indexOf('-') === -1 ? m[2] + '.*.*' : m[2])
      c = '>='
    }

    if (c[0] === '~') {
      const digs = res[2].split('-')[0].split('.').length
      checks.push(['>=', v])
      checks.push(['<', digs === 1 ? inc(v, 0) : digs === 2 ? inc(v, 1) : inc(v, 1)])
    } else if (c[0] === '^') {
      const digs = v[0] !== 0 ? 0 : v[1] !== 0 ? 1 : 2
      checks.push(['>=', v])
      checks.push(['<', digs === 0 ? inc(v, 0) : digs === 1 ? inc(v, 1) : inc(v, 2)])
    } else {
      checks.push([c.replace('~', '').replace('^', ''), v])
    }
  }

  if (checks.length) result.push(checks)
  return result
}

function inc (v, n) {
  const cpy = v.slice(0)
  if (v[n] === -1) return cpy
  cpy[n++]++
  for (; n < 3; n++) cpy[n] = 0
  return cpy
}

function num (n) {
  return n === 'x' || n === 'X' || n === '*' || n === 'latest' ? -1 : Number(n)
}

function numOrString (s) {
  return /^\d+$/.test(s) ? Number(s) : s
}

function ok (c, a, b) {
  return b === -1 // -1 means x
    ? c !== '<'
    : (c === '=' ? a === b : c === '>' ? a > b : c === '>=' ? a >= b : c === '<' ? a < b : c === '<=' ? a <= b : false)
}

function parse (v, c) {
  v = v.split('+')[0] // strip build
  const [a, b] = v.split('-')
  const nums = a.split('.').map(num).slice(0, 3)
  const last = Math.max(nums.length - 1, 0)

  if (c === '>') { // coerce to >=
    c = '>='
    nums.push(0, 0, 0)
    nums[last]++
  } else if (c === '') { // no comparision, just zero fill
    nums.push(0, 0, 0)
  } else { // anything else just wilcard
    nums.push(-1, -1, -1)
  }

  if (!b) return [nums.slice(0, 3), c]
  return [nums.slice(0, 3).concat(b.split('.').map(numOrString)), c]
}

function test (v, t, c) {
  if (!ok('=', v[0], t[0])) return ok(c, v[0], t[0])
  if (!ok('=', v[1], t[1])) return ok(c, v[1], t[1])
  if (!ok('=', v[2], t[2])) return ok(c, v[2], t[2])

  // no prerelease - final compare
  if (v.length === 3 && t.length === 3) return ok(c, v[2], t[2])

  // can never be less when comparing to a prerelease
  if (c[0] === '<' && (t.length === 3 || v.length === 3)) return false

  // can sometimes be higher
  if (c[0] === '>') {
    if (v.length === 3) return true
    if (t.length === 3) return false
  }

  for (let i = 3; i < Math.max(v.length, t.length); i++) {
    if (ok(c, v[i] || '', t[i] || '')) return true
  }

  return false
}
