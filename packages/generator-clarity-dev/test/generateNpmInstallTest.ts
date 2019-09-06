import path = require("path");
import assert = require("yeoman-assert");
import Generator = require("yeoman-generator");
import helpers = require("yeoman-test");
import utils = require("./util");

describe("generate project with `npm install` and `npm test`", () => {
  let testingDir: string;
  let generator: Generator;
  const projectName = "example-proj-npm-testing";

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

  it("create app generator instance", async () => {
    const appPath = path.join(__dirname, "../generators/app");
    generator = helpers.createGenerator(appPath, [], [projectName], {
      skipInstall: false
    });
  });

  it("setup local mono-repo dependencies", async () => {
    // Setup local dependencies.
    const moduleClarityCore = path.join(__dirname, "../../clarity");
    const moduleClarityNativeBin = path.join(__dirname, "../../clarity-native-bin");
    generator.npmInstall([moduleClarityCore, moduleClarityNativeBin]);
  });

  it("generate project output", async () => {
    // Run yo-generator to output project.
    await Promise.resolve(generator.run());

    // Validate output directory.
    const outputDir = generator.destinationRoot();
    assert.strictEqual(path.basename(outputDir), path.basename(projectName));
  });

  it("generated files", () => {
    assert.file(utils.EXPECTED_OUTPUT_FILES);
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
