/*! standard-engine. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
module.exports.cli = require('./bin/cmd')

module.exports.linter = Linter

var os = require('os')
var path = require('path')
var pkgConf = require('pkg-conf')
var fs = require('fs')

var CACHE_HOME = require('xdg-basedir').cache || os.tmpdir()

var DEFAULT_EXTENSIONS = [
  '.js',
  '.jsx',
  '.mjs',
  '.cjs'
]

var DEFAULT_IGNORE = [
  '**/*.min.js',
  'coverage/**',
  'node_modules/**',
  'vendor/**'
]

function Linter (opts) {
  if (!(this instanceof Linter)) return new Linter(opts)
  if (!opts) opts = {}

  if (!opts.cmd) throw new Error('opts.cmd option is required')
  if (!opts.eslint) throw new Error('opts.eslint option is required')

  this.cmd = opts.cmd
  this.eslint = opts.eslint
  this.cwd = opts.cwd || process.cwd()
  this.customParseOpts = opts.parseOpts

  var m = opts.version && opts.version.match(/^(\d+)\./)
  var majorVersion = (m && m[1]) || '0'

  // Example cache location: ~/.cache/standard/v12/
  var cacheLocation = path.join(CACHE_HOME, this.cmd, `v${majorVersion}/`)

  this.eslintConfig = Object.assign({
    cache: true,
    cacheLocation,
    envs: [],
    fix: false,
    globals: [],
    plugins: [],
    ignorePattern: [],
    extensions: DEFAULT_EXTENSIONS,
    useEslintrc: false
  }, opts.eslintConfig)

  if (this.eslintConfig.configFile != null) {
    this.eslintConfig.resolvePluginsRelativeTo =
      path.dirname(this.eslintConfig.configFile)
  }
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
 * @param {string=} opts.filename         path of file containing the text being linted
 * @param {boolean=} opts.usePackageJson  use options from nearest package.json? (default: true)
 */
Linter.prototype.lintTextSync = function (text, opts) {
  opts = this.parseOpts(opts)
  return new this.eslint.CLIEngine(opts.eslintConfig).executeOnText(text, opts.filename)
}

Linter.prototype.lintText = function (text, opts, cb) {
  if (typeof opts === 'function') return this.lintText(text, null, opts)
  var result
  try {
    result = this.lintTextSync(text, opts)
  } catch (err) {
    return process.nextTick(cb, err)
  }
  process.nextTick(cb, null, result)
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
 * @param {boolean=} opts.usePackageJson  use options from nearest package.json? (default: true)
 * @param {function(Error, Object)} cb    callback
 */
Linter.prototype.lintFiles = function (files, opts, cb) {
  var self = this
  if (typeof opts === 'function') return self.lintFiles(files, null, opts)
  opts = self.parseOpts(opts)

  if (typeof files === 'string') files = [files]
  if (files.length === 0) files = ['.']

  var result
  try {
    result = new self.eslint.CLIEngine(opts.eslintConfig).executeOnFiles(files)
  } catch (err) {
    return cb(err)
  }

  if (opts.fix) {
    self.eslint.CLIEngine.outputFixes(result)
  }

  return cb(null, result)
}

Linter.prototype.parseOpts = function (opts) {
  var self = this

  opts = {
    eslintConfig: { ...self.eslintConfig },
    usePackageJson: true,
    useGitIgnore: true,
    gitIgnoreFile: ['.gitignore', '.git/info/exclude'],
    cwd: self.cwd,
    fix: false,
    ignore: [],
    ...opts
  }

  if (!Array.isArray(opts.gitIgnoreFile)) {
    opts.gitIgnoreFile = [opts.gitIgnoreFile]
  }

  opts.eslintConfig.cwd = opts.cwd
  opts.eslintConfig.fix = opts.fix

  var packageOpts = opts.usePackageJson
    ? pkgConf.sync(self.cmd, { cwd: opts.cwd })
    : {}

  var rootPath = opts.usePackageJson
    ? path.dirname(pkgConf.filepath(packageOpts))
    : null

  if (!packageOpts.noDefaultIgnore) {
    addIgnore(DEFAULT_IGNORE)
  }
  addIgnore(packageOpts.ignore)

  if (opts.useGitIgnore) {
    opts.gitIgnoreFile
      .map(gitIgnoreFile => {
        try {
          return fs.readFileSync(path.join(rootPath, gitIgnoreFile), 'utf8')
        } catch (err) {
          return null
        }
      })
      .filter(Boolean)
      .forEach(gitignore => {
        addIgnore(gitignore.split(/\r?\n/))
      })
  }

  addGlobals(packageOpts.globals || packageOpts.global)
  addGlobals(opts.globals || opts.global)

  addPlugins(packageOpts.plugins || packageOpts.plugin)
  addPlugins(opts.plugins || opts.plugin)

  addEnvs(packageOpts.envs || packageOpts.env)
  addEnvs(opts.envs || opts.env)

  setParser(packageOpts.parser || opts.parser)

  if (self.customParseOpts) {
    var rootDir
    if (opts.usePackageJson) {
      var filePath = pkgConf.filepath(packageOpts)
      rootDir = filePath ? path.dirname(filePath) : opts.cwd
    } else {
      rootDir = opts.cwd
    }
    opts = self.customParseOpts(opts, packageOpts, rootDir)
  }

  function addIgnore (ignore) {
    if (!ignore) return
    opts.eslintConfig.ignorePattern = opts.eslintConfig.ignorePattern.concat(ignore)
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
