
<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @blockstack/clarity-cli
$ clarity COMMAND
running command...
$ clarity (-v|--version|version)
@blockstack/clarity-cli/0.1.14-alpha.0 darwin-x64 node-v12.16.1
$ clarity --help [COMMAND]
USAGE
  $ clarity COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`clarity help [COMMAND]`](#clarity-help-command)
* [`clarity new PROJECT`](#clarity-new-project)
* [`clarity setup`](#clarity-setup)

## `clarity help [COMMAND]`

display help for clarity

```
USAGE
  $ clarity help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.1/src/commands/help.ts)_

## `clarity new PROJECT`

Generate new project

```
USAGE
  $ clarity new PROJECT

OPTIONS
  -h, --help      show CLI help
  --skip_install  Skip running `npm install` after project generation.

EXAMPLE
  $ clarity new <PROJECT_NAME>
```

_See code: [src/commands/new.ts](https://github.com/blockstack/clarity-js-sdk/blob/master/packages/clarity-cli/src/commands/new.ts)_

## `clarity setup`

Install blockstack-core and its dependencies

```
USAGE
  $ clarity setup

OPTIONS
  --from_source  Compile binary from Rust source instead of downloading distributable.
  --overwrite    Overwrites an existing installed clarity-cli bin file.

EXAMPLE
  $ clarity setup
```

_See code: [src/commands/setup.ts](https://github.com/blockstack/clarity-js-sdk/blob/master/packages/clarity-cli/src/commands/setup.ts)_
<!-- commandsstop -->
