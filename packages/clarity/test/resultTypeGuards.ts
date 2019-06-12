import { assert, expect, should } from "chai";
import "mocha";
import { Result } from "../src";
import { CheckResult, Receipt } from "../src/core/types";

describe("Result type guards", () => {
  it("CheckResult success", () => {
    const checkResult: CheckResult = {
      success: true
    };
    assert.isTrue(Result.isOk(checkResult));
    assert.isFalse(Result.isError(checkResult));
  });

  it("CheckResult error", () => {
    const checkResult: CheckResult = {
      success: false
    };
    assert.isTrue(Result.isError(checkResult));
    assert.isFalse(Result.isOk(checkResult));
  });

  it("Receipt success", () => {
    const receipt: Receipt = {
      success: true
    };
    assert.isTrue(Result.isOk(receipt));
    assert.isFalse(Result.isError(receipt));
  });

  it("Receipt error", () => {
    const receipt: Receipt = {
      success: false
    };
    assert.isTrue(Result.isError(receipt));
    assert.isFalse(Result.isOk(receipt));
  });
});
