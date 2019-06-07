# Clarity JS SDK

A development environment, testing framework, and deployment tool for Clarity smart contracts.

### Features:

- TypeScript / JavaScript framework for building smart contracts using test driven development.
- [WIP] Library for interacting with smart contracts from a dapp (a web3 equivalent).
- [WIP] Type declaration generation (`.d.ts`) for easy and safer interactions with smart contracts.
- [roadmap] Language-server-protocol implementation.
- [roadmap] Code coverage generation.


# Usage

## Smart Contract Development

> _Note: This initialization package is not yet ready, the following steps will not yet work._

#### TypeScript

Initialize project:
```
npm init @blockstack/clarity-dev -- ts
```


#### JavaScript
Initialize project:
```
npm init @blockstack/clarity-dev -- js
```

## clarity-cli

```
npm install -g @blockstack/clarity-cli
clarity help
```

See [clarity-cli/README.md](packages/clarity-cli/README.md) for detailed usage. 

## clarity-tutorials

> _TODO: Determine and document intended usage of this package._

```
npm install @blockstack/clarity-tutorials
```

----

# Local Development

Repo structure and project build instructions for contributors. 

### Requirements
* Node.js v10 or higher is required. 
* Several packages require the native [`clarity-cli`](https://github.com/blockstack/blockstack-core/blob/develop/src/clarity_cli.rs) binary 
  -- distributes are automatically installed on MacOS, Windows (64-bit), and Linux (64-bit). 
  > _It will be compiled from source if using an OS or architecture not listed. 
  > This requires the Rust toolchain -- [rustup](https://rustup.rs/) is the recommended installer. 
  > A C compiler must also be available (gcc, clang, and msvc are supported)._

### Build Instructions

* Open terminal / command prompt to the root project directory containg the top-level `package.json`.
* Run `npm install`. _This automatically triggers [`lerna bootstrap`](https://github.com/lerna/lerna) to configure local packages in the repo._

#### Pulling Updates

Run `npm run rebuild` when pulling repo changes to an already setup local environment. This ensures the local environment is setup correctly after any changes to cross-dependencies or new libs. 
> _Rebuild does the following:_
> * Removes `node_modules` directories, removes the compiled `packages/*/lib` directories, removes the `*.tsbuildinfo` cached build metadata. 
> * Runs `lerna bootstrap` to install dependencies and configures cross-dependency symlinks. 
> * Runs `tsc --build [...]` on all packages. 


### Project Structure

This is a multi-package monorepo. 

* TypeScript [module path mapping](https://www.typescriptlang.org/docs/handbook/module-resolution.html#path-mapping) is used for packages with cross-dependencies. These `paths` are specified in the default `tsconfig.json` files. This is the config picked up by an editor/IDE/debugger for mapping absolute package names back to their source code in the monorepo. 
* TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) are used for `npm build` and package publishing. This is configured in the `tsconfig.build.json` files. 
* [Lerna](https://github.com/lerna/lerna) is used to manage multiple packages in the monorepo. 
> _The Lerna features in use:_
> * `lerna bootstrap` - Setup packages in the current Lerna repo; installs all of their dependencies and links any cross-dependencies.
> * `lerna run [npm script]` - Run an npm script in each package that contains that script, e.g. `lerna run lint`.
> * `lerna version` - Identify packages that have been updated since last release, increment package.json versions, commit to git. See [docs](https://github.com/lerna/lerna/tree/master/commands/version#readme) for details.
> * `lerna publish` - Publish packages that have been updated since the last time a release was made. 

#### File Tree

```
.
├── package.json
├── lerna.json
├── tsconfig.json
├── tsconfig.build.json
└── packages/
    ├── lib-a/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── tsconfig.build.json
    │   ├── src/
    │   │   └── index.ts
    │   └── test/
    │       ├── **/*.ts [test source files]
    │       ├── tsconfig.json
    │       └── mocha.opts
    └── lib-a/
        ├── package.json
        ├── tsconfig.json
        ├── tsconfig.build.json
        ├── src/
        │   └── index.ts
        └── test/
            ├── **/*.ts [test source files]
            ├── tsconfig.json
            └── mocha.opts
```

### Publishing

Run the following commands:
```
npm run rebuild
npm run test
npm run version-bump
npm run pub
```
