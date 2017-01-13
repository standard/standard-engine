module.exports.cli = require('./bin/cmd')

module.exports.linter = Linter

var deglob = require('deglob')
var homeOrTmp = require('home-or-tmp')
var path = require('path')
var pkgConf = require('pkg-conf')

var DEFAULT_PATTERNS = [
  '**/*.js',
  '**/*.jsx'
]

var DEFAULT_IGNORE = [
  '**/*.min.js',
  '**/bundle.js',
  'coverage/**',
  'node_modules/**',
  'vendor/**'
]

function Linter (opts) {
  var self = this
  if (!(self instanceof Linter)) return new Linter(opts)
  if (!opts) opts = {}

  self.cmd = opts.cmd || 'standard'
  self.eslint = opts.eslint
  self.cwd = opts.cwd
  if (!self.eslint) throw new Error('opts.eslint option is required')
  self.customParseOpts = opts.parseOpts

  self.eslintConfig = Object.assign({
    cache: true,
    cacheLocation: path.join(homeOrTmp, '.standard-cache/'),
    envs: [],
    fix: false,
    globals: [],
    ignore: false,
    plugins: [],
    useEslintrc: false
  }, opts.eslintConfig)
}

/**
 * Lint text to enforce JavaScript Style.
 *
 * @param {string} text                   file text to lint
 * @param {Object=} opts                  options object
 * @param {boolean=} opts.fix             automatically fix problems
 * @param {Array.<string>=} opts.globals  custom global variables to declare
 * @param {Array.<string>=} opts.plugins  custom eslint plugins
 * @param {Array.<string>=} opts.envs     custom eslint environment
 * @param {string=} opts.parser           custom js parser (e.g. babel-eslint)
 * @param {function(Error, Object)} cb    callback
 */
Linter.prototype.lintText = function (text, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.lintText(text, null, opts)
  opts = self.parseOpts(opts)

  var result
  try {
    result = new self.eslint.CLIEngine(opts.eslintConfig).executeOnText(text, opts.filename)
  } catch (err) {
    return nextTick(cb, err)
  }
  return nextTick(cb, null, result)
}

/**
 * Lint files to enforce JavaScript Style.
 *
 * @param {Array.<string>} files          file globs to lint
 * @param {Object=} opts                  options object
 * @param {Array.<string>=} opts.ignore   file globs to ignore (has sane defaults)
 * @param {string=} opts.cwd              current working directory (default: process.cwd())
 * @param {boolean=} opts.fix             automatically fix problems
 * @param {Array.<string>=} opts.globals  custom global variables to declare
 * @param {Array.<string>=} opts.plugins  custom eslint plugins
 * @param {Array.<string>=} opts.envs     custom eslint environment
 * @param {string=} opts.parser           custom js parser (e.g. babel-eslint)
 * @param {function(Error, Object)} cb    callback
 */
Linter.prototype.lintFiles = function (files, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.lintFiles(files, null, opts)
  opts = self.parseOpts(opts)

  if (typeof files === 'string') files = [ files ]
  if (files.length === 0) files = DEFAULT_PATTERNS

  var deglobOpts = {
    ignore: opts.ignore,
    cwd: opts.cwd,
    useGitIgnore: true,
    usePackageJson: false
  }

  deglob(files, deglobOpts, function (err, allFiles) {
    if (err) return cb(err)

    var result
    try {
      result = new self.eslint.CLIEngine(opts.eslintConfig).executeOnFiles(allFiles)
    } catch (err) {
      return cb(err)
    }

    if (opts.fix) {
      self.eslint.CLIEngine.outputFixes(result)
    }

    return cb(null, result)
  })
}

Linter.prototype.parseOpts = function (opts) {
  var self = this

  if (!opts) opts = {}
  opts = Object.assign({}, opts)
  opts.eslintConfig = Object.assign({}, self.eslintConfig)
  opts.eslintConfig.fix = !!opts.fix

  if (!opts.cwd) opts.cwd = self.cwd || process.cwd()
  var packageOpts = pkgConf.sync(self.cmd, { cwd: opts.cwd })

  if (!opts.ignore) opts.ignore = []
  addIgnore(packageOpts.ignore)
  addIgnore(DEFAULT_IGNORE)

  addGlobals(packageOpts.globals || packageOpts.global)
  addGlobals(opts.globals || opts.global)

  addPlugins(packageOpts.plugins || packageOpts.plugin)
  addPlugins(opts.plugins || opts.plugin)

  addEnvs(packageOpts.envs || packageOpts.env)
  addEnvs(opts.envs || opts.env)

  setParser(packageOpts.parser || opts.parser)

  if (self.customParseOpts) {
    var filepath = pkgConf.filepath(packageOpts)
    var rootDir = filepath ? path.dirname(filepath) : opts.cwd
    opts = self.customParseOpts(opts, packageOpts, rootDir)
  }

  function addIgnore (ignore) {
    if (!ignore) return
    opts.ignore = opts.ignore.concat(ignore)
  }

  function addGlobals (globals) {
    if (!globals) return
    opts.eslintConfig.globals = self.eslintConfig.globals.concat(globals)
  }

  function addPlugins (plugins) {
    if (!plugins) return
    opts.eslintConfig.plugins = self.eslintConfig.plugins.concat(plugins)
  }

  function addEnvs (envs) {
    if (!envs) return
    if (!Array.isArray(envs) && typeof envs !== 'string') {
      // envs can be an object in `package.json`
      envs = Object.keys(envs).filter(function (env) { return envs[env] })
    }
    opts.eslintConfig.envs = self.eslintConfig.envs.concat(envs)
  }

  function setParser (parser) {
    if (!parser) return
    opts.eslintConfig.parser = parser
  }

  return opts
}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    cb(err, val)
  })
}
