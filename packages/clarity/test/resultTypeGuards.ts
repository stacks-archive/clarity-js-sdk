import { assert, expect, should } from "chai";
import "mocha";
import { Result, ResultInterface } from "../src";
import { CheckResult, Receipt } from "../src/core/types";

describe("Result type guards", () => {
  it("Receipt interface result", () => {
    const receipt: Receipt = {
      success: true,
      result: "test",
      error: "error msg"
    };
    const extracted = Result.extract(receipt);
    if (extracted.success) {
      const val: string = extracted.result;
      assert.ok(val);
    } else {
      const err: string = extracted.error;
      assert.ok(err);
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
      const val: Date = extracted.result;
      assert.ok(val);
    } else {
      const error: number = extracted.error;
      assert.ok(error);
    }
  });

  it("Unwraps okay result", () => {
    const example = {
      success: true,
      result: 123,
      error: "err msg"
    };
    assert.equal(Result.unwrap(example), 123);
  });

  it("Throws error string on failed unwrap", () => {
    const example = {
      success: false,
      result: 123,
      error: "err msg"
    };
    assert.throws(() => Result.unwrap(example), "err msg");
  });

  it("Throws error instance on failed unwrap", () => {
    const example = {
      success: false,
      result: 123,
      error: new Error("error instance msg")
    };
    assert.throws(() => Result.unwrap(example), "error instance msg");
  });

  it("Result unwrapping - error string thrown", () => {
    const example = {
      success: false,
      result: 123,
      error: "error string msg"
    };

    try {
      Result.unwrap(example);
      assert.fail("should have thrown");
    } catch (error) {
      assert.instanceOf(error, Error);
      assert.equal(error.message, "error string msg");
    }
  });

  it("Result unwrapping - object is thrown", () => {
    const example = {
      success: false,
      result: 123,
      error: { odd: "object" }
    };

    try {
      Result.unwrap(example);
      assert.fail("should have thrown");
    } catch (error) {
      assert.deepEqual(error, { odd: "object" });
    }
  });

  it("Result matching - okay result", () => {
    const example = {
      success: true,
      result: 123,
      error: new Error("error instance msg")
    };

    const matched = Result.match(
      example,
      val => "okay" + val,
      err => {
        throw err;
      }
    );

    const matchResult: string = matched;
    assert.equal(matchResult, "okay123");
  });

  it("Result matching - error result", () => {
    const example = {
      success: false,
      result: 123,
      error: new Error("error instance msg")
    };

    assert.throws(() => {
      Result.match(
        example,
        val => "okay" + val,
        err => {
          throw err;
        }
      );
    }, "error instance msg");
  });

  it("Result matching - map error", () => {
    const example = {
      success: false,
      result: 123,
      error: new Error("error instance msg")
    };
    const matched = Result.match(example, val => "okay" + val, err => "not okay: " + err.message);
    assert.equal(matched, "not okay: error instance msg");
  });
});
