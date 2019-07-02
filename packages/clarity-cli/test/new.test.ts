import { expect, test } from "@oclif/test";
import fs from "fs-extra";
import os from "os";
import path from "path";

describe("new project", () => {
  let testingDir = "";
  let outputDir = "";
  before(() => {
    testingDir = path.resolve(path.join(path.dirname(__dirname), ".yo-test"));
    fs.mkdirSync(testingDir, { recursive: true });
    outputDir = fs.mkdtempSync(`${testingDir}${path.sep}`);
  });

  it("runs new project", () => {
    test
      .stdout()
      .command(["new", outputDir, "--skip_install"])
      .finally(ctx => {
        // tslint:disable-next-line: no-unused-expression
        expect(ctx.error).to.be.undefined;
      });
  });

  after(() => {
    try {
      fs.removeSync(testingDir);
    } catch (error) {
      console.debug(`Unexpected error cleaning temp dir: ${testingDir}`);
    }
  });
});
