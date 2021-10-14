const eslint = require('eslint')
const path = require('path')
const test = require('tape')

const { Linter } = require('../')

async function getStandard () {
  return new Linter({
    cmd: 'pocketlint',
    version: '0.0.0',
    eslint,
    eslintConfig: (await import('../tmp/standard/options.js')).default.eslintConfig
  })
}

test('api: lintFiles', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const result = await standard.lintFiles([], { cwd: path.join(__dirname, '../bin') })
  t.equal(typeof result, 'object', 'result is an object')
  t.equal(result.errorCount, 0)
})

test('api: lintText', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const result = await standard.lintText('console.log("hi there")\n')
  t.equal(typeof result, 'object', 'result is an object')
  t.equal(result.errorCount, 1, 'should have used single quotes')
})

test('api: lintTextSync', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const result = standard.lintTextSync('console.log("hi there")\n')
  t.equal(typeof result, 'object', 'result is an object')
  t.equal(result.errorCount, 1, 'should have used single quotes')
})

test('api: resolveEslintConfig -- avoid this.eslintConfig parser mutation', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const opts = await standard.resolveEslintConfig({ parser: 'blah' })
  t.equal(opts.parser, 'blah')
  t.equal(standard.eslintConfig.parser, undefined)
})

test('api: resolveEslintConfig -- avoid this.eslintConfig global mutation', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const opts = await standard.resolveEslintConfig({ globals: ['what'] })
  t.deepEqual(opts.globals, ['what'])
  t.deepEqual(standard.eslintConfig.globals, [])
})
