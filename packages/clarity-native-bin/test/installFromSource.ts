import { assert } from "chai";
import fs from "fs";
import "mocha";
import path from "path";
import { CORE_SDK_TAG, install } from "../src";
import { makeUniqueTempDir } from "../src/fsUtil";
import { ConsoleLogger } from "../src/logger";

describe("install via build from source", () => {
  let tempDir: string;
  let filePath: string;

  before(function() {
    if (process.env.SKIP_SLOW_TESTS) {
      this.skip();
      return;
    }
    tempDir = makeUniqueTempDir();
    filePath = path.join(tempDir, "clarity-bin");
  });

  it("install from source", async () => {
    const success = await install({
      fromSource: true,
      logger: ConsoleLogger,
      overwriteExisting: false,
      outputFilePath: filePath,
      versionTag: CORE_SDK_TAG
    });
    assert.isTrue(success);
  });

  it("native binary exists after install from source", async () => {
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
