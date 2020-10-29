#!/usr/bin/env node
const path = require('path')
const eslint = require('eslint')
const opts = {
  cmd: 'pocketlint',
  version: '0.0.0',
  eslint,
  eslintConfig: {
    configFile: path.join(__dirname, 'standard.json'),
    useEslintrc: false
  }
}

require('../../').cli(opts)
