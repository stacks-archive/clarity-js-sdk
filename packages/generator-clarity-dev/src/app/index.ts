import semver = require("semver");
import Generator = require("yeoman-generator");

const generatorPackage: PackageJson = require("../../package.json");

type Mutable<T> = { -readonly [P in keyof T]: Mutable<T[P]> };
type PackageJson = Mutable<Required<import("package-json").FullVersion>>;

const version = generatorPackage.engines.node;
if (!semver.satisfies(process.version, version)) {
  console.error(
    `Node.js version ${version} is required. Installed version ${
      process.version
    } is not compatible.`
  );
  process.exit(1);
}

function inheritDependencies(src: PackageJson, target: PackageJson, names: string[]) {
  for (const name of names) {
    target.dependencies[name] = src.dependencies[name];
  }
}

function inheritDevDependencies(src: PackageJson, target: PackageJson, names: string[]) {
  for (const name of names) {
    target.devDependencies[name] = src.devDependencies[name];
  }
}

module.exports = class extends Generator {
  constructor(args: string | string[], options: any) {
    super(args, options);

    // const sampleConfig: Generator.OptionConfig = {};
    // This method adds support for a `--sample` flag
    // this.option("sample", sampleConfig);
  }

  async prompting() {
    /*
    const answers = await this.prompt([
      {
        type: "input",
        name: "name",
        message: "Your project name",
        default: this.appname // Default to current folder name
      },
      {
        type: "confirm",
        name: "cool",
        message: "Would you like to enable the Cool feature?"
      }
    ]);

    this.log("app name", answers.name);
    this.log("cool feature", answers.cool);
    */
  }

  writing() {
    const copyFiles = (filePaths: string[]) => {
      for (const file of filePaths) {
        this.fs.copy(this.templatePath(file), this.destinationPath(file));
      }
    };

    copyFiles([".vscode/", "contracts/", "test/", "tsconfig.json"]);

    this.fs.move(
      this.destinationPath("test/hello-world.ts_template"),
      this.destinationPath("test/hello-world.ts")
    );

    this.fs.copy(this.templatePath("_.gitignore"), this.destinationPath(".gitignore"));
    this.fs.copy(this.templatePath("_package.json"), this.destinationPath("package.json"));

    const pkgJson: PackageJson = {
      dependencies: {},
      devDependencies: {},
      scripts: {
        test: "mocha"
      }
    } as any;

    inheritDependencies(generatorPackage, pkgJson, [
      "@blockstack/clarity",
      "@blockstack/clarity-native-bin"
    ]);
    inheritDevDependencies(generatorPackage, pkgJson, [
      "typescript",
      "ts-node",
      "chai",
      "@types/chai",
      "mocha",
      "@types/mocha"
    ]);

    this.fs.extendJSON(this.destinationPath("package.json"), pkgJson);
  }

  install() {
    this.installDependencies({
      bower: false
    });
  }
};
