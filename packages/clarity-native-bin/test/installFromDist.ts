import { assert } from "chai";
import fs from "fs";
import path from "path";
import { CORE_SDK_TAG, install } from "../src";
import { makeUniqueTempDir } from "../src/fsUtil";
import { ConsoleLogger } from "../src/logger";

describe("install via dist", () => {
  let tempDir: string;
  let filePath: string;

  before(() => {
    tempDir = makeUniqueTempDir();
    filePath = path.join(tempDir, "clarity-bin");
  });

  it("install from dist", async () => {
    const success = await install({
      fromSource: false,
      logger: ConsoleLogger,
      overwriteExisting: false,
      outputFilePath: filePath,
      versionTag: CORE_SDK_TAG
    });
    assert.isTrue(success);
  });

  it("native binary exists after install from dist", async () => {
    assert.isTrue(fs.existsSync(filePath));
    assert.isTrue(fs.lstatSync(filePath).isFile());
  });

  after(() => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });
});
