const eslint = require('eslint')
const Linter = require('../').linter
const path = require('path')
const test = require('tape')

function getStandard () {
  return new Linter({
    cmd: 'pocketlint',
    version: '0.0.0',
    eslint,
    eslintConfig: require('../tmp/standard/options').eslintConfig
  })
}

test('api: lintFiles', function (t) {
  t.plan(3)
  const standard = getStandard()
  standard.lintFiles([], { cwd: path.join(__dirname, '../bin') }, function (err, result) {
    t.error(err, 'no error while linting')
    t.equal(typeof result, 'object', 'result is an object')
    t.equal(result.errorCount, 0)
  })
})

test('api: lintText', function (t) {
  t.plan(3)
  const standard = getStandard()
  standard.lintText('console.log("hi there")\n', function (err, result) {
    t.error(err, 'no error while linting')
    t.equal(typeof result, 'object', 'result is an object')
    t.equal(result.errorCount, 1, 'should have used single quotes')
  })
})

test('api: lintTextSync', function (t) {
  t.plan(2)
  const standard = getStandard()
  const result = standard.lintTextSync('console.log("hi there")\n')
  t.equal(typeof result, 'object', 'result is an object')
  t.equal(result.errorCount, 1, 'should have used single quotes')
})

test('api: parseOpts -- avoid self.eslintConfig parser mutation', function (t) {
  t.plan(2)
  const standard = getStandard()
  const opts = standard.resolveEslintConfig({ parser: 'blah' })
  t.equal(opts.parser, 'blah')
  t.equal(standard.eslintConfig.parser, undefined)
})

test('api: parseOpts -- avoid self.eslintConfig global mutation', function (t) {
  t.plan(2)
  const standard = getStandard()
  const opts = standard.resolveEslintConfig({ globals: ['what'] })
  t.deepEqual(opts.globals, ['what'])
  t.deepEqual(standard.eslintConfig.globals, [])
})
