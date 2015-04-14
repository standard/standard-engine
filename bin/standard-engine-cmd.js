#!/usr/bin/env node

var opts = {
  tagline: 'JavaScript Custom Style',
  readme: 'https://github.com/flet/standard-engine',
  bugs: 'https://github.com/flet/standard-engine/issues',
  eslintConfig: {
    useEslintrc: false
  }
}

require('./cmd')(opts)
