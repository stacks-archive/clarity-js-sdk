import fs = require("fs");
import githubUsername = require("github-username");
import path = require("path");
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

async function getGithubUsername(generator: Generator): Promise<string | undefined> {
  let result: string | undefined;
  if (generator.options.githubUsername) {
    result = generator.options.githubUsername as string;
  }
  if (!result) {
    try {
      result = await generator.user.github.username();
    } catch (error) {
      // ignore
    }
  }
  if (!result) {
    try {
      result = await githubUsername(generator.user.git.email());
    } catch (error) {
      // ignore
    }
  }
  return result;
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

const PROJECT_DIR = "project_name";
const EXAMPLE_SAMPLE = "sample";
const EXAMPLE_COUNTER = "counter";
const EXAMPLE_ARGUMENT = "example";

module.exports = class extends Generator {
  packageJsonTemplateData: any;
  answers?: Generator.Answers;

  constructor(args: string | string[], options: any) {
    super(args, options);
    this.argument(PROJECT_DIR, { type: String, required: false });
    this.argument(EXAMPLE_ARGUMENT, { type: String, required: false, default: EXAMPLE_SAMPLE });
  }

  async prompting() {
    const isDirEmpty = (dir: string) => {
      const dirEntries = fs.readdirSync(dir);
      return dirEntries.length === 0;
    };

    let projDirArg: string | undefined = this.options[PROJECT_DIR];
    this.answers = {
      example: this.options[EXAMPLE_ARGUMENT],
    };

    let destRoot: string | undefined;
    if (projDirArg) {
      const normalizedPath = projDirArg.replace(/\/|\\/g, path.sep);
      projDirArg = normalizedPath;
      destRoot = this.destinationRoot(projDirArg);
    } else {
      destRoot = this.destinationRoot();
      projDirArg = path.basename(destRoot);

      if (!isDirEmpty(destRoot)) {
        this.answers = await this.prompt([
          {
            name: PROJECT_DIR,
            message: "Project name",
            default: "clarity-dev-project"
          },
          {
            name: EXAMPLE_ARGUMENT,
            message: "Sample - one of [sample, counter]",
            choices: ["sample", "counter"],
            default: "sample",
          }
        ]);
        projDirArg = this.answers[PROJECT_DIR];
        destRoot = this.destinationRoot(projDirArg);
      }
    }

    if (!projDirArg) {
      this.log("Missing project name!");
      process.exit(1);
      return;
    }

    // Make the project name a save npm package name.
    const normalizePackageName = (name: string) => {
      let result = path.basename(name);
      result = result.toLowerCase();
      result = result.replace(/[^a-zA-Z0-9_-]/g, "");
      result = result.replace(/^[_-]+|[_-]+$/g, "");
      return result;
    };

    const packageName = normalizePackageName(projDirArg);
    const githubUsername = await getGithubUsername(this).catch(_ => undefined);
    const authorName = this.user.git.name();
    const authorEmail = this.user.git.email();
    const repo = githubUsername ? `https://github.com/${githubUsername}/${packageName}.git` : "";

    this.packageJsonTemplateData = {
      name: packageName,
      authorName: authorName,
      authorEmail: authorEmail,
      authorUsername: githubUsername,
      repository: repo
    };
  }

  writing() {
    const copyFiles = (filePaths: string[]) => {
      for (const file of filePaths) {
        this.fs.copy(this.templatePath(file), this.destinationPath(file));
      }
    };

    copyFiles([".vscode/", "tsconfig.json", "test/mocha.opts"]);

    if (!this.answers || !this.answers.example) {
      this.log("Missing sample argument!");
      process.exit(1);
      return;
    }

    switch (this.answers.example) {
      case EXAMPLE_COUNTER:
        copyFiles(["contracts/counter.clar", "test/counter.ts_template"]);
        this.fs.move(
          this.destinationPath("test/counter.ts_template"),
          this.destinationPath("test/counter.ts")
        );
        break;
      default:
        copyFiles(["contracts/sample/hello-world.clar", "test/hello-world.ts_template"]);
        this.fs.move(
          this.destinationPath("test/hello-world.ts_template"),
          this.destinationPath("test/hello-world.ts")
        );
        break;
    }

    this.fs.copy(this.templatePath("_.gitignore"), this.destinationPath(".gitignore"));
    try {
      this.fs.copyTpl(
        this.templatePath("_package.json"),
        this.destinationPath("package.json"),
        this.packageJsonTemplateData
      );
    } catch (error) {
      this.log(`Error generating package.json: ${error}`);
    }

    const pkgJson: PackageJson = {
      dependencies: {},
      devDependencies: {}
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
    if (!this.options["skip-install"] && !this.options.skipInstall) {
      this.installDependencies({
        bower: false
      });
    }
  }

  end() {
    const outputPath = this.destinationRoot();
    this.log(`Project created at ${outputPath}`);
  }
};
