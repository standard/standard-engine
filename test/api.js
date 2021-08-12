const path = require('path')
const eslint = require('eslint')
const test = require('tape')

let Linter = require('../').linter

function getStandard () {
  return new Linter({
    cmd: 'pocketlint',
    version: '0.0.0',
    eslint,
    eslintConfig: require('../tmp/standard/options').eslintConfig
  })
}

function getStandardRcConfig () {
  return new Linter({
    // start in dir containing rc file
    cwd: path.resolve(__dirname, 'lib'),
    cmd: 'pocketlint',
    version: '0.0.0',
    eslint: eslint,
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
  const opts = standard.parseOpts({ parser: 'blah' })
  t.equal(opts.parser, 'blah')
  t.equal(standard.eslintConfig.parser, undefined)
})

test('api: parseOpts -- avoid self.eslintConfig global mutation', function (t) {
  t.plan(2)
  const standard = getStandard()
  const opts = standard.parseOpts({ globals: ['what'] })
  t.deepEqual(opts.globals, ['what'])
  t.deepEqual(standard.eslintConfig.globals, [])
})

test('api: parseOpts -- load config from rc file', function (t) {
  t.plan(2)
  const standard = getStandardRcConfig()
  const opts = standard.parseOpts()
  t.deepEqual(opts.globals, undefined)
  t.deepEqual(opts.eslintConfig.globals, ['foorc'])
})

test('api: parseOpts -- load config from XDG config base dir', function (t) {
  process.env.XDG_CONFIG_HOME = path.join(__dirname, 'lib', '.xdgconfig')

  delete require.cache[require.resolve('xdg-basedir')]
  delete require.cache[require.resolve('../')]

  // re-require to ensure env variable is used
  Linter = require('../').linter

  t.plan(2)
  const standard = getStandard()
  const opts = standard.parseOpts()

  t.deepEqual(opts.globals, undefined)
  t.deepEqual(opts.eslintConfig.globals, ['xdgrc'])
})
