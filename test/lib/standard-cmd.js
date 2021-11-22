#!/usr/bin/env node
const path = require('path')
const eslint = require('eslint')

const opts = {
  cmd: 'pocketlint',
  version: '0.0.0',
  eslint,
  eslintConfig: {
    overrideConfigFile: path.join(__dirname, 'standard.json')
  }
}

require('../../').cli(opts)
