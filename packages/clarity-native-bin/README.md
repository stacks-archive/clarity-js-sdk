# @blockstack/clarity-native-bin

This package installs the system-specific native [`clarity-cli`](https://github.com/blockstack/blockstack-core/blob/develop/src/clarity_cli.rs) binary. 

The JS module also provides programmatic access to the binary file path and the installation functions. 

## Installation

An installation script runs automatically when this package is installed via `npm install` (or an equivalent package install tool/command). Pre-built dist files are downloaded if the platform & arch is supported, otherwise, it attempts to compile the binary from source. 


#### Controlling Installation Options

Force install via source compilation by specifying either the `BLOCKSTACK_CORE_SOURCE_TAG` or `BLOCKSTACK_CORE_SOURCE_BRANCH` 
environment variables. The variable must be available during the npm install script. If found then the script will not attempt to download 
a pre-compiled distributable. The value must be set to a git tag or branch on the `https://github.com/blockstack/blockstack-core.git` 
repo. 

For example, to specify a feature branch for use during local development in this SDK monorepo:
```
BLOCKSTACK_CORE_SOURCE_BRANCH="feature/new-thingy" npm run rebuild
```


## Source Compilation Requirements

If compiling from source then the Rust toolchain and a C compiler must be available. 

* Specifically, `cargo` must be available in PATH. [rustup](https://rustup.rs/) is the recommended toolchain installer. 
* See C compiler requirement details at [cc-rs](https://github.com/alexcrichton/cc-rs) (gcc, clang, and msvc are supported). 


