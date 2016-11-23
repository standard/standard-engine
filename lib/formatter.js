module.exports = makeFormatter

function makeFormatter (opts, argv) {
  return function (results) {
    var prefix = argv.stdin && argv.fix ? `${opts.cmd}: ` : ''

    return results.reduce(function (lines, result) {
      result.messages.forEach(function (message) {
        var postfix = argv.verbose ? ` (${message.ruleId})` : ''
        lines.push(`${prefix}  ${result.filePath}:${message.line || 0}:${message.column || 0}: ${message.message}${postfix}`)
      })

      return lines
    }, []).join('\n')
  }
}
