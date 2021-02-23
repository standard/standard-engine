#!/usr/bin/env node

const crossSpawn = require('cross-spawn')
const fs = require('fs')
const path = require('path')
const test = require('tape')

const GIT = 'git'
const STANDARD = path.join(__dirname, 'lib', 'standard-cmd.js')
const TMP = path.join(__dirname, '..', 'tmp')

const pkg = {
  name: 'standard',
  repo: 'https://github.com/feross/standard'
}

test('test `standard` repo', function (t) {
  t.plan(1)

  fs.mkdirSync(TMP, { recursive: true })

  const name = pkg.name
  const url = pkg.repo + '.git'
  const folder = path.join(TMP, name)
  fs.access(path.join(TMP, name), fs.R_OK | fs.W_OK, function (err) {
    downloadPackage(function (err) {
      if (err) throw err
      runStandard()
    })

    function downloadPackage (cb) {
      if (err) gitClone(cb)
      else gitPull(cb)
    }

    function gitClone (cb) {
      const args = ['clone', '--depth', 1, url, path.join(TMP, name)]
      spawn(GIT, args, { stdio: 'ignore' }, function (err) {
        if (err) err.message += ' (git clone) (' + name + ')'
        cb(err)
      })
    }

    function gitPull (cb) {
      const args = ['pull']
      spawn(GIT, args, { cwd: folder, stdio: 'ignore' }, function (err) {
        if (err) err.message += ' (git pull) (' + name + ')'
        cb(err)
      })
    }

    function runStandard () {
      const args = []
      if (pkg.args) args.push.apply(args, pkg.args)
      spawn(STANDARD, args, { cwd: folder }, function (err) {
        const str = name + ' (' + pkg.repo + ')'
        if (err) { t.fail(str) } else { t.pass(str) }
      })
    }
  })
})

function spawn (command, args, opts, cb) {
  if (!opts.stdio) opts.stdio = 'inherit'

  const child = crossSpawn(command, args, opts)
  child.on('error', cb)
  child.on('close', function (code) {
    if (code !== 0) return cb(new Error('non-zero exit code: ' + code))
    cb(null)
  })
  return child
}
