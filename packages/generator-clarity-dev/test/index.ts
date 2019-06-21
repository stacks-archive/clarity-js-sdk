import fs from "fs";
import path from "path";
import assert = require("yeoman-assert");
import yo_env = require("yeoman-environment");
import Generator = require("yeoman-generator");
import helpers = require("yeoman-test");

describe("generator tests", () => {
  let testingDir: string;
  let generator: Generator;

  before(async () => {
    testingDir = path.join(__dirname, "../.yo-test");
    await new Promise((resolve, reject) => {
      helpers.testDirectory(testingDir, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

  it("generate a project", async () => {
    const appPath = path.join(__dirname, "../generators/app");
    generator = helpers.createGenerator("clarity-dev", [appPath], ["example-proj"], {
      skipInstall: false
    });

    // Setup local dependencies.
    const moduleClarityCore = path.join(__dirname, "../../clarity");
    const moduleClarityNativeBin = path.join(__dirname, "../../clarity-native-bin");
    generator.npmInstall([moduleClarityCore, moduleClarityNativeBin]);

    // Run yo-generator to output project.
    await Promise.resolve(generator.run());

    const outputDir = generator.destinationRoot();
    assert.strictEqual(path.basename(outputDir), "example-proj");
  });

  it("generated files", () => {
    assert.file([
      ".gitignore",
      "package.json",
      "tsconfig.json",
      "contracts/sample/hello-world.clar",
      "test/hello-world.ts",
      "test/mocha.opts",
      ".vscode/extensions.json",
      ".vscode/launch.json"
    ]);
  });

  it("run npm test", () => {
    // Ensure `npm test` succeeds in generated project.
    generator.spawnCommandSync("npm", ["test"]);
  });

  after(async () => {
    // Clean temp output dir.
    await new Promise((resolve, reject) => {
      helpers.testDirectory(testingDir, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
});
