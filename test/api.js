import eslint from 'eslint'
import { Linter } from '../index.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { eslintConfig } from '../tmp/standard/options'
import test from 'tape'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function getStandard () {
  return new Linter({
    cmd: 'pocketlint',
    version: '0.0.0',
    eslint,
    eslintConfig
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
