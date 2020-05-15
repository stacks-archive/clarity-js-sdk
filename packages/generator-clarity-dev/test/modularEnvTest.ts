import path = require("path");
import assert = require("yeoman-assert");
import YeoEnv = require("yeoman-environment");
import helpers = require("yeoman-test");
import * as modularGen from "../src/modularGen";
import utils = require("./util");

describe("generator tests [env instance usage]", () => {
  const projectName = "example-mod-env-output";
  let testingDir: string;
  let env: YeoEnv<YeoEnv.Options>;
  let runEnv: () => Promise<unknown>;

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

  it("create app generator", async () => {
    const result = modularGen.createAppGen({
      args: [projectName, "hello-world"],
      options: { skipInstall: true }
    });
    env = result.env;
    runEnv = result.run;
  });

  it("generate a project", async () => {
    await runEnv();
  });

  it("validate output directory", () => {
    const expectedOutDir = path.resolve(path.join(testingDir, projectName));
    assert.file(path.join(expectedOutDir, "package.json"));
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

describe("counter tutorial setup", () => {
  const projectName = "example-mod-env-counter-output";
  let testingDir: string;
  let env: YeoEnv<YeoEnv.Options>;
  let runEnv: () => Promise<unknown>;

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

  it("create app generator", async () => {
    const result = modularGen.createAppGen({
      args: [projectName, "counter"],
      options: { skipInstall: true }
    });
    env = result.env;
    runEnv = result.run;
  });

  it("generate a project", async () => {
    await runEnv();
  });

  it("generates the counter tutorial files", async () => {
    assert.file(utils.EXPECTED_COUNTER_FILES);
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
