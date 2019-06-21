import filenamify = require("filenamify");
import fs = require("fs");
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

const PROJECT_NAME_ARG = "project_name";

module.exports = class extends Generator {
  packageJsonTemplateData: any;

  constructor(args: string | string[], options: any) {
    super(args, options);
    this.argument(PROJECT_NAME_ARG, { type: String, required: false });
  }

  async prompting() {
    const isDirEmpty = (dir: string) => {
      const dirEntries = fs.readdirSync(dir);
      return dirEntries.length === 0;
    };

    let projNameArg: string | undefined = this.options[PROJECT_NAME_ARG];

    const getGithubUsername = async () => {
      if (this.options.githubUsername) {
        return (this.options.githubUsername as string) || "";
      } else {
        try {
          return await this.user.github.username();
        } catch (error) {
          return "";
        }
      }
    };

    let destRoot: string | undefined;
    if (projNameArg) {
      // Normalize file path.
      let pathParts = projNameArg.split(/\/|\\/g);
      pathParts = pathParts.map((part: string) => filenamify(part, { replacement: "-" }));
      projNameArg = path.join(...pathParts);
      destRoot = this.destinationRoot(projNameArg);
    } else {
      destRoot = this.destinationRoot();
      projNameArg = path.basename(destRoot);

      if (!isDirEmpty(destRoot)) {
        const answers = await this.prompt([
          {
            name: PROJECT_NAME_ARG,
            message: "Project name",
            default: "clarity-dev-project"
          }
        ]);
        projNameArg = answers[PROJECT_NAME_ARG];
        destRoot = this.destinationRoot(projNameArg);
      }
    }

    if (!projNameArg) {
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

    const packageName = normalizePackageName(projNameArg);
    const githubUsername = await getGithubUsername();
    const authorName = this.user.git.name();
    const authorEmail = this.user.git.email();
    const repo = githubUsername ? `https://github.com/${githubUsername}/${projNameArg}` : "";

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
