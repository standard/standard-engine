#!/usr/bin/env node
var path = require('path')
var opts = {
  eslintConfig: {
    configFile: path.join(__dirname, 'tmp', 'standard', 'rc', '.eslintrc'),
    useEslintrc: false
  }
}

require('../lib/cli.js')(opts)
