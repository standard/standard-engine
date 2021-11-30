const test = require('tape')

const { ensureArray } = require('../lib/utils')

test('utils: ensureArray', t => {
  t.test('ensureArray converts string to array', t => {
    t.plan(4)

    t.deepEqual(ensureArray('foo'), ['foo'], 'string becomes array containing that string')
    t.deepEqual(ensureArray(), [undefined], 'undefined becomes array containing that undefined')
    t.deepEqual(ensureArray(null), [null], 'null becomes array containing that null')
    t.deepEqual(ensureArray(true), [true], 'true becomes array containing that true')
  })

  t.test('ensureArray clones array', t => {
    t.plan(3)

    const input = ['foo']
    const result = ensureArray(input)

    t.ok(Array.isArray(result), 'array stays an array')
    t.deepEqual(result, ['foo'], 'array keeps it content')
    t.notStrictEqual(result, input, 'array is cloned')
  })
})
