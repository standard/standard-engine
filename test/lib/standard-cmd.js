#!/usr/bin/env node
const path = require('path')
const eslint = require('eslint')
const prettier = require('prettier')

const opts = {
  cmd: 'pocketlint',
  version: '0.0.0',
  eslint,
  prettier,
  eslintConfig: {
    configFile: path.join(__dirname, 'standard.json'),
    useEslintrc: false
  }
}

require('../../').cli(opts)
