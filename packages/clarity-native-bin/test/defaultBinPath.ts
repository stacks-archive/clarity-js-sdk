import { assert } from "chai";
import path from "path";
import { getDefaultBinaryFilePath } from "../src";

describe("default bin path", () => {
  it("get binary throws if not exists", async () => {
    assert.throws(() => {
      getDefaultBinaryFilePath({ checkExists: true, versionTag: "bogus-version-tag" });
    });
  });

  it("get default install path", () => {
    const filePath = getDefaultBinaryFilePath({ checkExists: false });
    assert.ok(filePath);
    assert.ok(path.isAbsolute(filePath));
  });
});
