import fs from "fs";
import path from "path";
import assert = require("yeoman-assert");
import helpers = require("yeoman-test");

describe("generator tests", () => {
  let testingDir: string;

  before(() => {
    // testingDir = fs.mkdtempSync(path.join(__dirname, ".tmp-yo-test"));
    // console.log(`__TEMP DIR: ${testingDir}`);
    // helpers.setUpTestDirectory(testingDir);
  });

  it("generate a project", async () => {
    const appPath = path.join(__dirname, "../generators/app");
    testingDir = await Promise.resolve(
      helpers
        .run(appPath)
        // .inDir(testingDir)
        .withOptions({
          skipInstall: false
        })
        .withLocalConfig({ lang: "en" })
    );
    console.log(`__RESULT DIR: ${testingDir}`);
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
});
