/*! standard-engine. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

const fs = require('fs')
const path = require('path')

const pkgConf = require('pkg-conf')

/** @typedef {import('../').CLIEngineOptions} CLIEngineOptions */

const DEFAULT_EXTENSIONS = [
  '.js',
  '.jsx',
  '.mjs',
  '.cjs'
]

const DEFAULT_IGNORE = [
  '**/*.min.js',
  'coverage/**',
  'node_modules/**',
  'vendor/**'
]

/**
 * @param {unknown} value
 * @returns {string[]}
 */
const ensureStringArrayValue = (value) => {
  if (!Array.isArray(value)) return []

  /** @type {string[]} */
  const result = []

  for (const item of value) {
    if (typeof item === 'string') result.push(item)
  }

  return result
}

/**
 * @param {CLIEngineOptions} eslintConfig
 * @param {string|string[]} [extensions]
 */
const addExtensions = (eslintConfig, extensions) => {
  if (!extensions) return
  eslintConfig.extensions = (eslintConfig.extensions || []).concat(extensions)
}

/**
 * @param {CLIEngineOptions} eslintConfig
 * @param {string|string[]} [ignore]
 */
const addIgnore = (eslintConfig, ignore) => {
  if (!ignore) return
  if (typeof eslintConfig.ignorePattern === 'string') {
    eslintConfig.ignorePattern = [eslintConfig.ignorePattern]
  }
  // FIXME: This can be either string or string[]?
  eslintConfig.ignorePattern = (eslintConfig.ignorePattern || []).concat(ignore)
}

/**
 * @param {CLIEngineOptions} eslintConfig
 * @param {CLIEngineOptions} baseEslintConfig
 * @param {string|string[]} [globals]
 */
const addGlobals = (eslintConfig, baseEslintConfig, globals) => {
  if (!globals) return
  eslintConfig.globals = (baseEslintConfig.globals || []).concat(globals)
}

/**
 * @param {CLIEngineOptions} eslintConfig
 * @param {CLIEngineOptions} baseEslintConfig
 * @param {string|string[]} [plugins]
 */
const addPlugins = (eslintConfig, baseEslintConfig, plugins) => {
  if (!plugins) return
  eslintConfig.plugins = (baseEslintConfig.plugins || []).concat(plugins)
}

/**
 * @param {CLIEngineOptions} eslintConfig
 * @param {CLIEngineOptions} baseEslintConfig
 * @param {string|string[]|{[key: string]: string}} [envs]
 */
const addEnvs = (eslintConfig, baseEslintConfig, envs) => {
  if (!envs) return
  if (!Array.isArray(envs) && typeof envs !== 'string') {
    // envs can be an object in `package.json`
    const envsObj = envs
    envs = []
    for (const key in envsObj) {
      const value = envsObj[key]
      if (value) envs.push(value)
    }
  }
  eslintConfig.envs = (baseEslintConfig.envs || []).concat(envs)
}

/**
 * @param {CLIEngineOptions} eslintConfig
 * @param {string} [parser]
 */
const setParser = (eslintConfig, parser) => {
  if (!parser) return
  eslintConfig.parser = parser
}

/**
 * @typedef ResolveOptions
 * @property {string} cmd
 * @property {string} cwd
 * @property {boolean} [fix]                automatically fix problems
 * @property {string[]|string} [ignore]
 * @property {string[]|string} [extensions]
 * @property {string[]|string} [globals]    custom global variables to declare
 * @property {string[]|string} [global]
 * @property {string[]|string} [plugins]    custom eslint plugins
 * @property {string[]|string} [plugin]
 * @property {string[]|string} [envs]       custom eslint environment
 * @property {string[]|string} [env]
 * @property {string} [parser]              custom js parser (e.g. babel-eslint)
 * @property {boolean} [useGitIgnore]       use .gitignore? (default: true)
 * @property {boolean} [usePackageJson]     use options from nearest package.json? (default: true)
 * @property {boolean} [noDefaultIgnore]
 * @property {boolean} [noDefaultExtensions]
 */

/**
 * @callback CustomEslintConfigResolver
 * @param {Readonly<CLIEngineOptions>} eslintConfig
 * @param {Readonly<ResolveOptions>} opts
 * @param {import('pkg-conf').Config} packageOpts
 * @param {string} rootDir
 * @returns {CLIEngineOptions}
 */

/**
 * @param {Readonly<ResolveOptions>} rawOpts
 * @param {Readonly<CLIEngineOptions>} baseEslintConfig
 * @param {CustomEslintConfigResolver} [customEslintConfigResolver]
 * @returns {CLIEngineOptions}
 */
const resolveEslintConfig = function (rawOpts, baseEslintConfig, customEslintConfigResolver) {
  const opts = {
    usePackageJson: true,
    // TODO: Document
    useGitIgnore: true,
    // TODO: Document
    gitIgnoreFile: ['.gitignore', '.git/info/exclude'],
    ...rawOpts
  }

  const eslintConfig = {
    ...baseEslintConfig,
    cwd: opts.cwd,
    fix: !!opts.fix
  }

  /** @type {import('pkg-conf').Config} */
  let packageOpts = {}
  let rootPath = ''

  if (opts.usePackageJson || opts.useGitIgnore) {
    packageOpts = pkgConf.sync(opts.cmd, { cwd: opts.cwd })
    const packageJsonPath = pkgConf.filepath(packageOpts)
    if (packageJsonPath) rootPath = path.dirname(packageJsonPath)
  }

  if (!opts.usePackageJson) packageOpts = {}

  addIgnore(eslintConfig, ensureStringArrayValue(packageOpts.ignore))
  addIgnore(eslintConfig, opts.ignore)

  // TODO: Document noDefaultIgnore
  if (!packageOpts.noDefaultIgnore && !opts.noDefaultIgnore) {
    addIgnore(eslintConfig, DEFAULT_IGNORE)
  }

  addExtensions(eslintConfig, ensureStringArrayValue(packageOpts.extensions))
  addExtensions(eslintConfig, opts.extensions)

  // TODO: Document noDefaultExtensions
  if (!packageOpts.noDefaultExtensions && !opts.noDefaultExtensions) {
    addExtensions(eslintConfig, DEFAULT_EXTENSIONS)
  }

  if (opts.useGitIgnore && rootPath !== '') {
    (Array.isArray(opts.gitIgnoreFile) ? opts.gitIgnoreFile : [opts.gitIgnoreFile])
      .map(gitIgnoreFile => {
        try {
          return fs.readFileSync(path.join(rootPath, gitIgnoreFile), 'utf8')
        } catch (err) {
          return null
        }
      })
      .filter(Boolean)
      .forEach(gitignore => {
        gitignore && addIgnore(eslintConfig, gitignore.split(/\r?\n/))
      })
  }

  addGlobals(eslintConfig, baseEslintConfig, ensureStringArrayValue(packageOpts.globals || packageOpts.global))
  // TODO: Document
  addGlobals(eslintConfig, baseEslintConfig, opts.globals || opts.global)

  addPlugins(eslintConfig, baseEslintConfig, ensureStringArrayValue(packageOpts.plugins || packageOpts.plugin))
  // TODO: Document
  addPlugins(eslintConfig, baseEslintConfig, opts.plugins || opts.plugin)

  addEnvs(eslintConfig, baseEslintConfig, ensureStringArrayValue(packageOpts.envs || packageOpts.env))
  // TODO: Document
  addEnvs(eslintConfig, baseEslintConfig, opts.envs || opts.env)

  setParser(eslintConfig, typeof packageOpts.parser === 'string' ? packageOpts.parser : opts.parser)

  if (customEslintConfigResolver) {
    let rootDir
    if (opts.usePackageJson) {
      const filePath = pkgConf.filepath(packageOpts)
      rootDir = filePath ? path.dirname(filePath) : opts.cwd
    } else {
      rootDir = opts.cwd
    }
    return customEslintConfigResolver(eslintConfig, opts, packageOpts, rootDir)
  } else {
    return eslintConfig
  }
}

module.exports = { resolveEslintConfig }
