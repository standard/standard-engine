# standard-engine Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 1.10.2 2015-07-17
  * Merged standard 4.5.4 changes: switch to using `deglob`

## 1.10.1 2015-07-06
  * Removed a stray console.log

## 1.10.0 2015-07-06
  * Fix bug in custom parser option to make it work.
  * Merged from standard: New "globals" option can be set in package.json to define an array of global variables.

## 1.9.0 2015-06-29
 * merge from latest standard 4.4.1 including:
  * Fixes to the gitignore feature
  * added `parser` parameter
  * Lots of repos added to clone.js test and made a lot faster! @feross is the best :)

## 1.8.1 - 2015-06-17
 * Fix NPE error when opts._config is undefined. Thanks @wombleton

## 1.8.0 - 2015-06-16

 * Fix gitignore support for Windows.
 * Refactor to use pkg-config.
 * Update to newer version of eslint to allow extending multiple eslint-config files.

## 1.7.0 - 2015-05-30
### Merged from `standard`
  * NEW FEATURE: Add proper .gitignore support

## 1.6.0 - 2015-05-29
### Merged from `standard`
  * NEW FEATURE: Custom Parsers can now be specified in `package.json`

  To use a custom parser, install it from npm (example: `npm install
  babel-eslint`) and add this to your package.json:
  ```
  {
    "yourcmdname": {
      "parser": "babel-eslint"
    }
  }
  ```
  (Thanks @feross)


## 1.5.0 - 2015-05-25
### Merged from `standard`
  * NEW FEATURE: pass in a formatter to get `--format` as an option for the command line! Thanks @ricardofbarros!

## 1.4.3 - 2015-05-25
### Merged from `standard`
  * Speed increased significantly by reverting a default ignore pattern change.

## 1.4.2 - 2015-05-22
 * Fix bug where absolute paths to files was not working.

## 1.4.1 - 2015-04-21
### Merged from `standard`
 * Fix bug in `parseOpts` to ensure original options are not modified
 * Upgrade to eslint 0.21.0

## 1.4.0 - 2015-04-21
### Merged from `standard`
 * Disable `.gitignore` support for now.

## 1.3.1 - 2015-04-14

### Merged from `standard`
* Fix crash on absolute filesystem path

## 1.3.0 - 2015-04-14
* moved some files back to their original locations to make merging from `standard` easier.

### Merged from `standard`
* Ignore linting for all files in `.gitignore`.
* Removed `/git/**` exclusion as its redundant.
* Output errors to stdout instead of stderr.
* Updated `eslint-plugin-react` and `tape` dependencies.
* Additional tests.
