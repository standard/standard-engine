const test = require('tape')

const { ensureStringArrayValue } = require('../lib/utils')

test('utils: ensureStringArrayValue', t => {
  t.test('ensureStringArrayValue returns empty array on non-array input', t => {
    t.plan(5)

    t.deepEqual(ensureStringArrayValue(), [], 'should return empty array on non-array input')
    t.deepEqual(ensureStringArrayValue(null), [], 'should return empty array on non-array input')
    t.deepEqual(ensureStringArrayValue(true), [], 'should return empty array on non-array input')
    t.deepEqual(ensureStringArrayValue('foo'), [], 'should return empty array on non-array input')
    t.deepEqual(ensureStringArrayValue(123), [], 'should return empty array on non-array input')
  })

  t.test('ensureStringArrayValue clones array', t => {
    t.plan(2)

    const input = ['foo']
    const result = ensureStringArrayValue(input)

    t.deepEqual(result, ['foo'], 'array keeps it content')
    t.notStrictEqual(result, input, 'array is cloned')
  })

  t.test('ensureStringArrayValue removes non-string values', t => {
    t.plan(2)

    const input = ['foo', true, 123, 'bar']
    const result = ensureStringArrayValue(input)

    t.deepEqual(result, ['foo', 'bar'], 'non-string values has been removed')
    t.deepEqual(input, ['foo', true, 123, 'bar'], 'input value remains untouched')
  })
})
