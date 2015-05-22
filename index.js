module.exports.cli = require('./bin/cmd')

module.exports.linter = Linter

var defaults = require('defaults')
var dezalgo = require('dezalgo')
var eslint = require('eslint')
var extend = require('xtend')
var findRoot = require('find-root')
// var fs = require('fs')
var glob = require('glob')
var parallel = require('run-parallel')
var path = require('path')
var uniq = require('uniq')

var DEFAULT_PATTERNS = [
  '**/*.js',
  '**/*.jsx'
]

var DEFAULT_IGNORE_PATTERNS = [
  'coverage/',
  'node_modules/',
  '**/*.min.js',
  '**/bundle.js'
]

function Linter (opts) {
  var self = this
  if (!(self instanceof Linter)) return new Linter(opts)
  opts = opts || {}
  self.cmd = opts.cmd || 'standard'
  self.eslintConfig = defaults(opts.eslintConfig, {
    useEslintrc: false
  })
  if (!self.eslintConfig) {
    throw new Error('No eslintConfig passed.')
  }
}

/**
 * Lint text to enforce JavaScript Style.
 *
 * @param {string} text                 file text to lint
 * @param {Object} opts                 options object
 * @param {Array.<String>} opts.ignore  file globs to ignore (has sane defaults)
 * @param {string} opts.cwd             current working directory (default: process.cwd())
 * @param {function(Error, Object)} cb  callback
 */
Linter.prototype.lintText = function (text, opts, cb) {
  var self = this
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  opts = self.parseOpts(opts)
  cb = dezalgo(cb)

  var result
  try {
    result = new eslint.CLIEngine(self.eslintConfig).executeOnText(text)
  } catch (err) {
    return cb(err)
  }
  return cb(null, result)
}

/**
 * Lint files to enforce JavaScript Style.
 *
 * @param {Array.<string>} files        file globs to lint
 * @param {Object} opts                 options object
 * @param {Array.<String>} opts.ignore  file globs to ignore (has sane defaults)
 * @param {string} opts.cwd             current working directory (default: process.cwd())
 * @param {function(Error, Object)} cb  callback
 */
Linter.prototype.lintFiles = function (files, opts, cb) {
  var self = this
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  opts = self.parseOpts(opts)
  cb = dezalgo(cb)

  if (typeof files === 'string') files = [ files ]
  if (files.length === 0) files = DEFAULT_PATTERNS

  // traverse filesystem
  parallel(files.map(function (pattern) {
    return function (cb) {
      glob(pattern, {
        cwd: opts.cwd,
        ignore: opts.ignore,
        nodir: true
      }, cb)
    }
  }), function (err, results) {
    if (err) return cb(err)

    // flatten nested arrays
    var files = results.reduce(function (files, result) {
      result.forEach(function (file) {
        files.push(path.resolve(opts.cwd, file))
      })
      return files
    }, [])

    // de-dupe
    files = uniq(files)

    // undocumented – do not use (used by bin/cmd.js)
    if (opts._onFiles) opts._onFiles(files)

    var result
    try {
      result = new eslint.CLIEngine(self.eslintConfig).executeOnFiles(files)
    } catch (err) {
      return cb(err)
    }
    return cb(null, result)
  })
}

Linter.prototype.parseOpts = function (opts) {
  var self = this

  if (!opts) opts = {}
  opts = extend(opts)

  if (!opts.cwd) opts.cwd = process.cwd()

  // Add user ignore patterns to default ignore patterns
  var ignore = (opts.ignore || []).concat(DEFAULT_IGNORE_PATTERNS)

  var root
  try {
    root = findRoot(opts.cwd)
  } catch (e) {}

  if (root) {
    // Add ignore patterns from the closest `package.json`
    try {
      var packageOpts = require(path.join(root, 'package.json'))[self.cmd]
      if (packageOpts) ignore = ignore.concat(packageOpts.ignore)
    } catch (e) {}

    // Temporarily disabled until this is made more reliable
    // Add ignore patterns from project root `.gitignore`
    // try {
    //   var gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8')
    //   ignore = ignore.concat(gitignore.split(/\r?\n|\r/).filter(nonEmpty))
    // } catch (e) {}
  }

  // Remove leading "current folder" prefix
  ignore = ignore.map(function (pattern) {
    return pattern.indexOf('./') === 0 ? pattern.slice(2) : pattern
  })

  // Allow "folder/" to ignore all sub-folders and files, a la .gitignore
  opts.ignore = []
  ignore.forEach(function (pattern) {
    opts.ignore.push(pattern)
    opts.ignore.push(pattern + '/**')
  })

  return opts
}

// function nonEmpty (line) {
//   return line.trim() !== '' && line[0] !== '#'
// }
