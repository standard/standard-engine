/*! standard-engine. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

const os = require('os')
const path = require('path')

const CACHE_HOME = require('xdg-basedir').cache || os.tmpdir()

const { resolveEslintConfig } = require('./lib/resolve-eslint-config')

/** @typedef {ConstructorParameters<typeof import('eslint').CLIEngine>[0]} CLIEngineOptions */
/** @typedef {Omit<import('./lib/resolve-eslint-config').ResolveOptions, 'cmd'|'cwd'>} BaseLintOptions */
/** @typedef {(err: Error|null, result?: import('eslint').CLIEngine.LintReport) => void} LinterCallback */

/**
 * @typedef LinterOptions
 * @property {string} cmd
 * @property {import('eslint')} eslint
 * @property {string} [cwd]
 * @property {CLIEngineOptions} [eslintConfig]
 * @property {import('./lib/resolve-eslint-config').CustomEslintConfigResolver} [resolveEslintConfig]
 * @property {string} [version]
 */

class Linter {
  /**
   * @param {LinterOptions} opts
   */
  constructor (opts) {
    if (!opts || !opts.cmd) throw new Error('opts.cmd option is required')
    if (!opts.eslint) throw new Error('opts.eslint option is required')

    /** @type {string} */
    this.cmd = opts.cmd
    /** @type {import('eslint')} */
    this.eslint = opts.eslint
    /** @type {string} */
    this.cwd = opts.cwd || process.cwd()
    this.customEslintConfigResolver = opts.resolveEslintConfig

    const m = opts.version && opts.version.match(/^(\d+)\./)
    const majorVersion = (m && m[1]) || '0'

    // Example cache location: ~/.cache/standard/v12/
    const cacheLocation = path.join(CACHE_HOME, this.cmd, `v${majorVersion}/`)

    /** @type {CLIEngineOptions} */
    this.eslintConfig = {
      cache: true,
      cacheLocation,
      envs: [],
      fix: false,
      globals: [],
      plugins: [],
      ignorePattern: [],
      extensions: [],
      useEslintrc: false,
      ...(opts.eslintConfig || {})
    }

    if (this.eslintConfig.configFile != null) {
      this.eslintConfig.resolvePluginsRelativeTo = path.dirname(
        this.eslintConfig.configFile
      )
    }
  }

  /**
   * Lint text to enforce JavaScript Style.
   *
   * @param {string} text file text to lint
   * @param {Omit<BaseLintOptions, 'ignore'|'noDefaultIgnore'> & { filename?: string }} [opts] base options + path of file containing the text being linted
   * @returns {import('eslint').CLIEngine.LintReport}
   */
  lintTextSync (text, opts) {
    const eslintConfig = this.resolveEslintConfig(opts)
    const engine = new this.eslint.CLIEngine(eslintConfig)
    return engine.executeOnText(text, (opts || {}).filename)
  }

  /**
   * Lint text to enforce JavaScript Style.
   *
   * @param {string} text file text to lint
   * @param {Omit<BaseLintOptions, 'ignore'|'noDefaultIgnore'> & { filename?: string }} [opts] base options + path of file containing the text being linted
   * @param {LinterCallback} [cb]
   * @returns {void}
   */
  lintText (text, opts, cb) {
    if (typeof opts === 'function') return this.lintText(text, undefined, opts)
    if (!cb) throw new Error('callback is required')

    let result
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
   * @param {BaseLintOptions & { cwd?: string }} [opts] base options + file globs to ignore (has sane defaults) + current working directory (default: process.cwd())
   * @param {LinterCallback} [cb]
   * @returns {void}
   */
  lintFiles (files, opts, cb) {
    if (typeof opts === 'function') { return this.lintFiles(files, undefined, opts) }
    if (!cb) throw new Error('callback is required')

    const eslintConfig = this.resolveEslintConfig(opts)

    if (typeof files === 'string') files = [files]
    if (files.length === 0) files = ['.']

    let result
    try {
      result = new this.eslint.CLIEngine(eslintConfig).executeOnFiles(files)
    } catch (err) {
      return cb(err)
    }

    if (eslintConfig.fix) {
      this.eslint.CLIEngine.outputFixes(result)
    }

    return cb(null, result)
  }

  /**
   * @param {BaseLintOptions & { cwd?: string }} [opts]
   * @returns {CLIEngineOptions}
   */
  resolveEslintConfig (opts) {
    const eslintConfig = resolveEslintConfig(
      {
        cwd: this.cwd,
        ...opts,
        cmd: this.cmd
      },
      this.eslintConfig,
      this.customEslintConfigResolver
    )

    return eslintConfig
  }
}

module.exports.cli = require('./bin/cmd')
module.exports.Linter = Linter
