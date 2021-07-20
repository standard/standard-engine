#!/usr/bin/env node
import path from 'node:path'
import eslint from 'eslint'
import { Cli } from '../../bin/cmd.js'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const opts = {
  cmd: 'pocketlint',
  version: '0.0.0',
  eslint,
  eslintConfig: {
    configFile: path.join(__dirname, 'standard.json'),
    useEslintrc: false
  }
}

Cli(opts)
