const test = require('tape')

const { stringArrayToObj } = require('../lib/utils')

test('utils: stringArrayToObj', t => {
  t.test('stringArrayToObj accepts string input', t => {
    t.plan(1)

    const result = stringArrayToObj('foo')

    t.deepEqual(result, { foo: true }, 'string becomes key with true value in result')
  })

  t.test('stringArrayToObj accepts array input', t => {
    t.plan(1)

    const result = stringArrayToObj(['foo', 'bar'])

    t.deepEqual(result, { foo: true, bar: true }, 'string array becomes keys with true values in result')
  })

  t.test('stringArrayToObj clones input base', t => {
    t.plan(3)

    const base = { car: 123 }
    const result = stringArrayToObj('foo', base)

    t.deepEqual(result, { foo: true, car: 123 }, 'object gets value added')
    t.notStrictEqual(result, base, 'object is cloned')
    t.deepEqual(base, { car: 123 }, 'base remains untouched')
  })
})
