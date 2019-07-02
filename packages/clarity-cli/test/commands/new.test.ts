import { expect, test } from "@oclif/test";
import fs from "fs-extra";
import os from "os";
import path from "path";

describe("new project", () => {
  const testingDir = path.resolve(path.join(path.dirname(__dirname), ".yo-test"));
  fs.mkdirSync(testingDir, { recursive: true });
  const outputDir = fs.mkdtempSync(`${testingDir}${path.sep}`);
  test
    .stdout()
    .command(["new", outputDir, "--skip_install"])
    .it("runs new project", ctx => {
      // tslint:disable-next-line: no-unused-expression
      expect(ctx.error).to.be.undefined;
    });
});
