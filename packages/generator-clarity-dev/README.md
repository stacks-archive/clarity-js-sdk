# generator-clarity-dev

A Clarity development environment [Yeoman](https://yeoman.io/) generator.


Generates a TypeScript project that contains a `hello-world.clar` sample smart contract and 
a minimal Mocha test suite using the Clarity SDK. 

## Quick Start

#### Create project directory:
```
mkdir hello-clarity
cd hello-clarity
```

#### Run project generator:
```
npm init yo clarity-dev
```

#### Run tests:
```
npm test
```

_Expected output:_
```
  hello world contract test suite
    ✓ should have a valid syntax
    deploying an instance of the contract
      ✓ should print hello world message
      ✓ should echo number

  3 passing
```

---

## Troubleshooting


#### Project Generator

* Ensure all checks pass when running `npx yo doctor`.
  > ```
  > Yeoman Doctor - Running sanity checks on your system
  > ✔ Global configuration file is valid
  > ✔ NODE_PATH matches the npm root
  > ✔ Node.js version
  > ✔ No .bowerrc file in home directory
  > ✔ No .yo-rc.json file in home directory
  > ✔ npm version
  > ✔ yo version

* Alternate install commands
  > The above `npm init ...` command uses the [`create-yo`](https://github.com/boneskull/create-yo) utility to avoid global package installs. If running into problems then try with regular `yo` installation:
  > ```
  > npm install -g yo generator-clarity-dev
  > yo clarity-dev
  > ```

#### clarity-native-bin

If seeing error messages related to the _clarity-native-bin_ package then see its [README](/packages/clarity-native-bin/README.md) for more details.


