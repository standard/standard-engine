module.exports = Cli

var defaults = require('defaults')
var minimist = require('minimist')
var stdin = require('get-stdin')

function Cli (opts) {
  var standard = require('../lib/linter')(opts)

  opts = defaults(opts, {
    cmd: 'standard-engine',
    tagline: 'JavaScript Custom Style'
  })

  var argv = minimist(process.argv.slice(2), {
    alias: {
      help: 'h',
      verbose: 'v'
    },
    boolean: [
      'help',
      'stdin',
      'verbose',
      'version'
    ]
  })

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
            --version   Show current version.
        -h, --help      Show usage information.

    */
    }.toString().split(/\n/).slice(2, -2).join('\n'), opts.cmd)

    if (opts.homepage) console.log('Readme: %s', opts.homepage)
    if (opts.bugs) console.log('Report bugs: %s\n', opts.homepage)

    process.exit(0)
  }

  if (argv.version) {
    console.log(require('../package.json').version)
    process.exit(0)
  }

  if (argv.stdin) {
    stdin(function (text) {
      standard.lintText(text, onResult)
    })
  } else {
    var lintOpts = {}
    standard.lintFiles(argv._, lintOpts, onResult)
  }

  function onResult (err, result) {
    if (err) return error(err)
    if (result.errorCount === 0) process.exit(0)

    console.error(
      'Error: Use %s (%s) ',
      opts.tagline,
      opts.homepage
    )

    result.results.forEach(function (result) {
      result.messages.forEach(function (message) {
        console.error(
          '  %s:%d:%d: %s%s',
          result.filePath, message.line || 0, message.column || 0, message.message,
          argv.verbose ? ' (' + message.ruleId + ')' : ''
        )
      })
    })

    process.exit(1)
  }

  function error (err) {
    console.error('Unexpected Linter Output:\n')
    console.error(err.stack || err.message || err)
    console.error(
      '\nIf you think this is a bug in `%s`, open an issue: %s',
      opts.cmd, opts.bugs
    )
    process.exit(1)
  }
}
