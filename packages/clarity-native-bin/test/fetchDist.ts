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

  it("get binary throws if not exists after dist install", async () => {
    assert.throws(() => {
      index.getDefaultBinaryFilePath({ checkExists: true });
    });
  });

  it("default install from dist", async () => {
    await index.installDefaultPath({ fromSource: false });
  });

  it("native binary exists after install to default path from dist download", async () => {
    index.getDefaultBinaryFilePath({ checkExists: true });
  });
});
