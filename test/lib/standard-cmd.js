#!/usr/bin/env node
var path = require('path')
var eslint = require('eslint')
var opts = {
  cmd: 'pocketlint',
  version: '0.0.0',
  eslint: eslint,
  eslintConfig: {
    configFile: path.join(__dirname, 'standard.json'),
    useEslintrc: false
  }
}

require('../../').cli(opts)
