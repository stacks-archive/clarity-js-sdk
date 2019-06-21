import filenamify = require("filenamify");
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

module.exports = class extends Generator {
  packageJsonTemplateData: any;

  constructor(args: string | string[], options: any) {
    super(args, options);
    this.argument(PROJECT_DIR, { type: String, required: false });
  }

  async prompting() {
    const isDirEmpty = (dir: string) => {
      const dirEntries = fs.readdirSync(dir);
      return dirEntries.length === 0;
    };

    let projDirArg: string | undefined = this.options[PROJECT_DIR];

    let destRoot: string | undefined;
    if (projDirArg) {
      // Normalize file path.
      let pathParts = projDirArg.split(/\/|\\/g);
      pathParts = pathParts.map((part: string) => filenamify(part, { replacement: "-" }));
      projDirArg = path.join(...pathParts);
      destRoot = this.destinationRoot(projDirArg);
    } else {
      destRoot = this.destinationRoot();
      projDirArg = path.basename(destRoot);

      if (!isDirEmpty(destRoot)) {
        const answers = await this.prompt([
          {
            name: PROJECT_DIR,
            message: "Project name",
            default: "clarity-dev-project"
          }
        ]);
        projDirArg = answers[PROJECT_DIR];
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

    copyFiles([".vscode/", "contracts/", "test/", "tsconfig.json"]);

    this.fs.move(
      this.destinationPath("test/hello-world.ts_template"),
      this.destinationPath("test/hello-world.ts")
    );

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
    if (!this.options["skip-install"]) {
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
