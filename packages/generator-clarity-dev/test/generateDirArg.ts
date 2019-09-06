import path = require("path");
import assert = require("yeoman-assert");
import yo_env = require("yeoman-environment");
import Generator = require("yeoman-generator");
import helpers = require("yeoman-test");
import utils = require("./util");

describe("specify output directory arg", () => {
  let testingDir: string;
  let generator: Generator;
  const projectName = "example-proj-dir-arg";

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
    generator = helpers.createGenerator(appPath, [], [projectName], {
      skipInstall: true
    });

    // Run yo-generator to output project.
    await Promise.resolve(generator.run());

    // Validate output directory.
    const outputDir = generator.destinationRoot();
    assert.strictEqual(path.basename(outputDir), path.basename(projectName));
  });

  it("generated files", () => {
    assert.file(utils.EXPECTED_OUTPUT_FILES);
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
