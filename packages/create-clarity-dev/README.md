# create-clarity-dev

A Clarity development environment generator, usable as an [npm init initializer](https://docs.npmjs.com/cli/init#description). 


Generates a TypeScript project that contains a `hello-world.clar` sample smart contract and 
a minimal Mocha test suite using the Clarity SDK. 

## Quick Start

#### Generate a project

```
npm init clarity-dev my-proj
cd my-proj
```
_Replace `my-proj` with your app name. The app directory is created if it does not already exist._

#### Run tests:
```
npm test
```

_Expected output:_
```
  hello world contract test suite
    ✓ should have a valid syntax
    deploying an instance of the contract
      ✓ should return 'hello world'
      ✓ should echo number

  3 passing
```

---

## Troubleshooting


#### Project Generator

The package is a thin wrapper around the [yeoman](https://www.npmjs.com/package/yo) based [Clarity app generator package](https://www.npmjs.com/package/generator-clarity-dev). Initializers for use with [`npm init`](https://docs.npmjs.com/cli/init#description) require a package with the naming scheme `create-<initializer>`. 


* Alternate install commands

  #### Using the `yo` generator
  > ```
  > npm install -g yo generator-clarity-dev
  > yo clarity-dev
  > ```
  _See [generator-clarity-dev](/packages/generator-clarity-dev/README.md#troubleshooting) for more details._

  #### Using `npx` directly
  > ```
  > npx create-clarity-dev
  > ```


#### clarity-native-bin

If seeing error messages related to the _clarity-native-bin_ package then see its [README](/packages/clarity-native-bin/README.md) for more details.


