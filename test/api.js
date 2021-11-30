const eslint = require('eslint')
const path = require('path')
const test = require('tape')

const { StandardEngine } = require('../')

async function getStandard () {
  /** @type {string} */
  const configFile = (await import('../tmp/standard/options.js')).default.eslintConfig.configFile
  return new StandardEngine({
    cmd: 'pocketlint',
    version: '0.0.0',
    eslint,
    eslintConfig: { overrideConfigFile: configFile }
  })
}

test('api: lintFiles', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const result = await standard.lintFiles([], { cwd: path.join(__dirname, '../bin') })
  t.ok(Array.isArray(result), 'result is an array')
  t.equal((result[0] || {}).errorCount, 0)
})

test('api: lintText', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const result = await standard.lintText('console.log("hi there")\n')
  t.ok(Array.isArray(result), 'result is an array')
  t.equal((result[0] || {}).errorCount, 1, 'should have used single quotes')
})

test('api: resolveEslintConfig -- avoid this.eslintConfig parser mutation', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const opts = await standard.resolveEslintConfig({ parser: 'blah' })
  t.equal((opts.baseConfig || {}).parser, 'blah')
  t.equal((standard.eslintConfig.baseConfig || {}).parser, undefined)
})

test('api: resolveEslintConfig -- avoid this.eslintConfig global mutation', async function (t) {
  t.plan(2)
  const standard = await getStandard()
  const opts = await standard.resolveEslintConfig({ globals: ['what'] })
  t.deepEqual((opts.baseConfig || {}).globals, { what: true })
  t.strictEqual((standard.eslintConfig.baseConfig || {}).globals, undefined)
})
