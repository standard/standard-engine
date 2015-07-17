module.exports = Cli

var defaults = require('defaults')
var minimist = require('minimist')
var stdin = require('get-stdin')
var fs = require('fs')

function Cli (opts) {
  var standard = require('../').linter(opts)

  opts = defaults(opts, {
    cmd: 'standard-engine',
    tagline: 'JavaScript Custom Style',
    version: require('../package.json').version
  })

  var argv = minimist(process.argv.slice(2), {
    alias: {
      help: 'h',
      verbose: 'v',
      format: 'F'
    },
    boolean: [
      'help',
      'stdin',
      'verbose',
      'version',
      'format'
    ]
  })

  if (argv.format) {
    var typeFormatter = typeof opts.formatter

    if (typeFormatter !== 'object' || typeof opts.formatter.transform !== 'function') {
      console.error('Invalid formatter API')
      process.exit(0)
    }
  }

  // flag `-` is equivalent to `--stdin`
  if (argv._[0] === '-') {
    argv.stdin = true
    argv._.shift()
  }

  if (argv.help) {
    if (opts.tagline) console.log('%s - %s', opts.cmd, opts.tagline)
    console.log(function () {
    /*

    Usage:
        %s <flags> [FILES...]

        If FILES is omitted, then all JavaScript source files (*.js, *.jsx) in the current
        working directory are checked, recursively.

        Certain paths (node_modules/, .git/, coverage/, *.min.js, bundle.js) are
        automatically excluded.

    Flags:
        -v, --verbose   Show error codes. (so you can ignore specific rules)
            --stdin     Read file text from stdin.
            --parser    Use custom js parser (e.g. babel-eslint, esprima-fb)
            --version   Show current version
        -h, --help      Show usage information
    */
    }.toString().split(/\n/).slice(2, -2).join('\n'), opts.cmd)

    if (opts.formatter) console.log('        -F  --format    Automatically format code.')
    console.log('\n')
    if (opts.homepage) console.log('Readme: %s', opts.homepage)
    if (opts.bugs) console.log('Report bugs: %s\n', opts.homepage)

    process.exit(0)
  }

  if (argv.version) {
    console.log(opts.version)
    process.exit(0)
  }

  var lintOpts = {
    parser: argv.parser
  }

  if (argv.stdin) {
    stdin(function (text) {
      if (argv.format) {
        text = opts.formatter.transform(text)
        process.stdout.write(text)
      }
      standard.lintText(text, lintOpts, onResult)
    })
  } else {
    if (argv.format) {
      lintOpts._onFiles = function (files) {
        files.forEach(function (file) {
          var data = fs.readFileSync(file).toString()
          fs.writeFileSync(file, opts.formatter.transform(data))
        })
      }
    }
    standard.lintFiles(argv._, lintOpts, onResult)
  }

  function onResult (err, result) {
    if (err) return onError(err)
    if (result.errorCount === 0) process.exit(0)

    console.error(
      opts.cmd + ': Use %s (%s) ',
      opts.tagline,
      opts.homepage
    )

    result.results.forEach(function (result) {
      result.messages.forEach(function (message) {
        log(
          '  %s:%d:%d: %s%s',
          result.filePath, message.line || 0, message.column || 0, message.message,
          argv.verbose ? ' (' + message.ruleId + ')' : ''
        )
      })
    })

    process.exit(1)
  }

  function onError (err) {
    console.error(opts.cmd + ': Unexpected linter output:\n')
    console.error(err.stack || err.message || err)
    console.error(
      '\nIf you think this is a bug in `%s`, open an issue: %s',
      opts.cmd, opts.bugs
    )
    process.exit(1)
  }

  /**
   * Print lint errors to stdout since this is expected output from `standard-engine`.
   * Note: When formatting code from stdin (`standard --stdin --format`), the transformed
   * code is printed to stdout, so print lint errors to stderr in this case.
   */
  function log () {
    if (argv.stdin && argv.format) {
      arguments[0] = opts.cmd + ': ' + arguments[0]
      console.error.apply(console, arguments)
    } else {
      console.log.apply(console, arguments)
    }
  }
}
