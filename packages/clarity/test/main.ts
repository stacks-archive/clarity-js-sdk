import { assert, expect, should } from "chai";
import * as path from "path";
import * as index from "../src";
import { fileExists, getTempFilePath } from "../src/utils/fsUtil";
import { executeCommand } from "../src/utils/processUtil";

describe("process exec", () => {
  it("reads stdout", async () => {
    const result = await executeCommand("echo", ["hello world"]);
    assert.equal(result.stdout.trim(), "hello world");
  });
});

describe("fs util", () => {
  it("get temp file path", async () => {
    const tempFilePath = getTempFilePath("example_{uniqueID}_file");
    assert.ok(tempFilePath);
    const fileName = path.basename(tempFilePath);
    assert.isTrue(fileName.startsWith("example_"));
    assert.isTrue(fileName.endsWith("_file"));
    assert.isTrue(path.isAbsolute(tempFilePath));
  });

  it("random temp file does not exist", () => {
    const tempFilePath = getTempFilePath();
    const isFileExists = fileExists(tempFilePath);
    assert.isFalse(isFileExists);
  });
});
