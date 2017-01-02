var eslint = require('eslint')
var test = require('tape')
const mock = require('mock-require')
const requireUncached = require('require-uncached')
const clone = require('clone')

const defaultOpts = {
  eslint,
  eslintConfig: require('../tmp/standard/options').eslintConfig
}

const getLinter = () => requireUncached('../').linter

function getStandard () {
  const Linter = getLinter()
  return new Linter(defaultOpts)
}

test('api: lintFiles', function (t) {
  t.plan(3)
  var standard = getStandard()
  standard.lintFiles([], { cwd: 'bin' }, function (err, result) {
    t.error(err, 'no error while linting')
    t.equal(typeof result, 'object', 'result is an object')
    t.equal(result.errorCount, 0)
  })
})

test('api: lintText', function (t) {
  t.plan(3)
  var standard = getStandard()
  standard.lintText('console.log("hi there")\n', function (err, result) {
    t.error(err, 'no error while linting')
    t.equal(typeof result, 'object', 'result is an object')
    t.equal(result.errorCount, 1, 'should have used single quotes')
  })
})

test('api: parseOpts -- avoid self.eslintConfig parser mutation', function (t) {
  t.plan(2)
  var standard = getStandard()
  var opts = standard.parseOpts({parser: 'blah'})
  t.equal(opts.parser, 'blah')
  t.equal(standard.eslintConfig.parser, undefined)
})

test('api: parseOpts -- avoid self.eslintConfig global mutation', function (t) {
  t.plan(2)
  var standard = getStandard()
  var opts = standard.parseOpts({globals: ['what']})
  t.deepEqual(opts.globals, ['what'])
  t.deepEqual(standard.eslintConfig.globals, [])
})

const defaultWhitelist = ['foo', 'bar']
const defaultWhitelistPkgs = ['eslint-config-foo', 'eslint-config-bar']

test('api: whitelist -- provided whitelist, no existing extends', function (t) {
  t.plan(1)
  const opts = clone(defaultOpts)
  opts.whitelist = clone(defaultWhitelist)
  defaultWhitelistPkgs.forEach(name => mock(name, {}))
  const Linter = getLinter()
  let linter = new Linter(opts)
  t.deepEqual(linter.eslintConfig.extends, defaultWhitelist)
  defaultWhitelistPkgs.forEach(name => mock.stop(name))
})

test('api: whitelist -- provided whitelist, string existing extends', function (t) {
  t.plan(1)
  const opts = clone(defaultOpts)
  opts.whitelist = clone(defaultWhitelist)
  opts.eslintConfig.extends = 'baz'
  defaultWhitelistPkgs.forEach(name => mock(name, {}))
  const Linter = getLinter()
  let linter = new Linter(opts)
  const expected = ['baz'].concat(defaultWhitelist)
  t.deepEqual(linter.eslintConfig.extends, expected)
  defaultWhitelistPkgs.forEach(name => mock.stop(name))
})

test('api: whitelist -- provided whitelist, multiple existing extends', function (t) {
  t.plan(1)
  const opts = clone(defaultOpts)
  opts.whitelist = clone(defaultWhitelist)
  opts.eslintConfig.extends = ['baz', 'yad']
  defaultWhitelistPkgs.forEach(name => mock(name, {}))
  const Linter = getLinter()
  let linter = new Linter(opts)
  const expected = ['baz', 'yad'].concat(defaultWhitelist)
  t.deepEqual(linter.eslintConfig.extends, expected)
  defaultWhitelistPkgs.forEach(name => mock.stop(name))
})

test('api: whitelist -- packages not installed', function (t) {
  t.plan(1)
  const opts = clone(defaultOpts)
  opts.whitelist = clone(defaultWhitelist)
  const Linter = getLinter()
  let linter = new Linter(opts)
  t.equals(linter.eslintConfig.extends, undefined)
})

test('api: whitelist -- some packages installed', function (t) {
  t.plan(1)
  const opts = clone(defaultOpts)
  opts.whitelist = clone(defaultWhitelist)
  const Linter = getLinter()
  mock(defaultWhitelistPkgs[0], {})
  let linter = new Linter(opts)
  t.deepEqual(linter.eslintConfig.extends, defaultWhitelist.slice(0, 1))
  mock.stop(defaultWhitelistPkgs[0])
})
