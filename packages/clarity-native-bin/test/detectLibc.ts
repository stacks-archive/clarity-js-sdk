import { assert, expect, should } from "chai";
import { detectLibc } from "../src/detectLibc";

describe("detect libc", () => {
  it("detect libc does not throw", () => {
    assert.doesNotThrow(() => {
      detectLibc();
    });
  });
});
