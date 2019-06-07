import { assert, expect, should } from "chai";
import fs from "fs";
import "mocha";
import * as index from "../src";

describe("install via dist", () => {
  it("clear default install", () => {
    const filePath = index.getDefaultBinaryFilePath({ checkExists: false });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  it("get binary throws if not exists", async () => {
    assert.throws(() => {
      index.getDefaultBinaryFilePath({ checkExists: true });
    });
  });

  it("default install", async () => {
    await index.installDefaultPath({ fromSource: false });
  });

  it("native binary exists after default install", async () => {
    index.getDefaultBinaryFilePath({ checkExists: true });
  });
});
