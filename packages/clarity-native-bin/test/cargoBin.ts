import { assert, expect, should } from "chai";
import fs from "fs";
import "mocha";
import * as index from "../src";

describe("install via build from source", () => {
  it("clear default install", () => {
    const filePath = index.getDefaultBinaryFilePath({ checkExists: false });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  it("get binary throws if not exists after source install", async () => {
    assert.throws(() => {
      index.getDefaultBinaryFilePath({ checkExists: true });
    });
  });

  it("default install from source", async () => {
    const success = await index.installDefaultPath({ fromSource: true });
    assert.isTrue(success);
  });

  it("native binary exists after install to default path from source", async () => {
    index.getDefaultBinaryFilePath({ checkExists: true });
  });
});
