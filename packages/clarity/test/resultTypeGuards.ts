import { assert, expect, should } from "chai";
import "mocha";
import { Result, ResultInterface } from "../src";
import { CheckResult, Receipt } from "../src/core/types";

describe("Result type guards", () => {
  it("Receipt result", () => {
    const receipt: Receipt = {
      success: true,
      result: "test",
      error: "error msg"
    };
    const extracted = Result.extract(receipt);
    if (extracted.success) {
      const resultVal: string = extracted.value;
      assert.ok(resultVal);
    } else {
      const resultVal: string = extracted.value;
      assert.ok(resultVal);
    }
  });

  it("Loose matching result interface", () => {
    const example = {
      success: false,
      result: new Date() as Date | undefined,
      error: 123 as number | undefined
    };
    const extracted = Result.extract(example);
    if (extracted.success) {
      const resultVal: Date = extracted.value;
      assert.ok(resultVal);
    } else {
      const resultVal: number = extracted.value;
      assert.ok(resultVal);
    }
  });

  it("Unwraps okay result", () => {
    const example = {
      success: true,
      result: 123,
      error: "err msg"
    };
    assert.equal(Result.get(example), 123);
  });

  it("Throws error string on failed unwrap", () => {
    const example = {
      success: false,
      result: 123,
      error: "err msg"
    };
    assert.throws(() => Result.get(example), "err msg");
  });

  it("Throws error instance on failed unwrap", () => {
    const example = {
      success: false,
      result: 123,
      error: new Error("error instance msg")
    };
    assert.throws(() => Result.get(example), "error instance msg");
  });
});
