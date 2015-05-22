# standard-engine Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

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
