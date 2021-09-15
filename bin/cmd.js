#!/usr/bin/env node

const minimist = require('minimist')
const getStdin = require('get-stdin')

/**
 * @typedef StandardCliOptions
 * @property {import('../').Linter} [linter]
 * @property {string} [cmd]
 * @property {string} [tagline]
 * @property {string} [homepage]
 * @property {string} [bugs]
 */

/**
 * @param {Omit<import('../').LinterOptions, 'cmd'> & StandardCliOptions} rawOpts
 */
function cli (rawOpts) {
  const opts = {
    cmd: 'standard-engine',
    tagline: 'JavaScript Custom Style',
    version: '0.0.0',
    ...rawOpts
  }

  const standard = rawOpts.linter || new (require('../').Linter)(opts)

  const argv = minimist(process.argv.slice(2), {
    alias: {
      global: 'globals',
      plugin: 'plugins',
      env: 'envs',
      help: 'h'
    },
    boolean: [
      'fix',
      'format',
      'help',
      'stdin',
      'version'
    ],
    string: [
      'ext',
      'global',
      'plugin',
      'parser',
      'env'
    ]
  })

  // Unix convention: Command line argument `-` is a shorthand for `--stdin`
  if (argv._[0] === '-') {
    argv.stdin = true
    argv._.shift()
  }

  if (argv.help) {
    if (opts.tagline) console.log('%s - %s (%s)', opts.cmd, opts.tagline, opts.homepage)
    console.log(`
Usage:
    ${opts.cmd} <flags> [FILES...]

    If FILES is omitted, all JavaScript source files (*.js, *.jsx, *.mjs, *.cjs)
    in the current working directory are checked, recursively.

    Certain paths (node_modules/, coverage/, vendor/, *.min.js, and
    files/folders that begin with '.' like .git/) are automatically ignored.

    Paths in a project's root .gitignore file are also automatically ignored.

Flags:
        --fix       Automatically fix problems
        --format    Aggressively format code for consistency
        --version   Show current version
    -h, --help      Show usage information

Flags (advanced):
        --stdin     Read file text from stdin
        --ext       Specify JavaScript file extensions
        --global    Declare global variable
        --plugin    Use custom eslint plugin
        --env       Use custom eslint environment
        --parser    Use custom js parser (e.g. babel-eslint)
    `)
    process.exitCode = 0
    return
  }

  if (argv.version) {
    console.log(opts.version)
    process.exitCode = 0
    return
  }

  const lintOpts = {
    fix: argv.fix,
    format: argv.format,
    extensions: argv.ext,
    globals: argv.global,
    plugins: argv.plugin,
    envs: argv.env,
    parser: argv.parser
  }

  /** @type {string} */
  let stdinText

  if (argv.stdin) {
    getStdin().then(function (text) {
      stdinText = text
      standard.lintText(text, lintOpts, onResult)
    })
  } else {
    standard.lintFiles(argv._, lintOpts, onResult)
  }

  /** @type {import('../').LinterCallback} */
  function onResult (err, result) {
    if (err) return onError(err)
    if (!result) throw new Error('expected a result')

    if (argv.stdin && argv.fix) {
      if (result.results[0] && result.results[0].output) {
        // Code contained fixable errors, so print the fixed code
        process.stdout.write(result.results[0].output)
      } else {
        // Code did not contain fixable errors, so print original code
        process.stdout.write(stdinText)
      }
    }

    if (!result.errorCount && !result.warningCount) {
      process.exitCode = 0
      return
    }

    console.error('%s: %s (%s)', opts.cmd, opts.tagline, opts.homepage)

    // Are any warnings present?
    const isSomeWarnings = result.results.some(function (result) {
      return result.messages.some(function (message) {
        return message.severity === 1
      })
    })

    if (isSomeWarnings) {
      console.error(
        '%s: %s',
        opts.cmd,
        'Some warnings are present which will be errors in the next version (https://standardjs.com'
      )
    }

    // Are any fixable rules present?
    const isSomeFixable = result.results.some(function (result) {
      return result.messages.some(function (message) {
        return !!message.fix
      })
    })

    if (isSomeFixable) {
      console.error(
        '%s: %s',
        opts.cmd,
        'Run `' + opts.cmd + ' --fix` to automatically fix some problems.'
      )
    }

    result.results.forEach(function (result) {
      result.messages.forEach(function (message) {
        log(
          '  %s:%d:%d: %s%s%s',
          result.filePath,
          message.line || 0,
          message.column || 0,
          message.message,
          ' (' + message.ruleId + ')',
          message.severity === 1 ? ' (warning)' : ''
        )
      })
    })

    process.exitCode = result.errorCount ? 1 : 0
  }

  /** @param {Error|unknown} err */
  function onError (err) {
    console.error(opts.cmd + ': Unexpected linter output:\n')
    if (err instanceof Error) {
      console.error(err.stack || err.message)
    } else {
      console.error(err)
    }
    console.error(
      '\nIf you think this is a bug in `%s`, open an issue: %s',
      opts.cmd,
      opts.bugs
    )
    process.exitCode = 1
  }

  /**
   * Print lint errors to stdout -- this is expected output from `standard-engine`.
   * Note: When fixing code from stdin (`standard --stdin --fix`), the transformed
   * code is printed to stdout, so print lint errors to stderr in this case.
   * @type {typeof console.log}
   */
  function log (...args) {
    if (argv.stdin && argv.fix) {
      args[0] = opts.cmd + ': ' + args[0]
      console.error.apply(console, args)
    } else {
      console.log.apply(console, args)
    }
  }
}

module.exports = cli
