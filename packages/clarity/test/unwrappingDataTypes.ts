import { assert } from "chai"
import { Result, ResultInterface } from "../src"

describe("Unwrapping data types", () => {
  it("Unwraps uint ", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: "(ok u123)",
      error: ""
    };
    assert.equal(Result.unwrapUInt(example), 123);
  });

  it("Unwraps int", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: "(ok 123)",
      error: ""
    };
    assert.equal(Result.unwrapInt(example), 123);
  });

  it("Unwraps hex string", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: "(ok 0x68656c6c6f20776f726c64)",
      error: ""
    };
    assert.equal(Result.unwrapString(example), "hello world");
  });

  it("Unwraps empty hex string", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: "(ok 0x)",
      error: ""
    };
    assert.equal(Result.unwrapString(example), "");
  });

  it("Unwraps utf-8 string", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: `(ok u"\u{d83e}\u{dd84} Stacks")`,
      error: ""
    };
    assert.equal(Result.unwrapString(example, "utf8"), "🦄 Stacks");
  });

  it("Unwraps empty utf-8 string", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: `(ok u"")`,
      error: ""
    };
    assert.equal(Result.unwrapString(example, "utf8"), "");
  });

  it("Unwraps base64 string", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: '(ok "aGVsbG8gd29ybGQ=")',
      error: ""
    };
    assert.equal(Result.unwrapString(example, "base64"), "hello world");
  });

  it("Unwraps empty base64 string", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: '(ok "")',
      error: ""
    };
    assert.equal(Result.unwrapString(example, "base64"), "");
  });

  it("Unwraps not encoded string", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: '(ok "hello world")',
      error: ""
    };
    assert.equal(Result.unwrapString(example, ""), "hello world");
  });

  it("Unwraps not encoded empty string", () => {
    const example: ResultInterface<string, unknown> = {
      success: true,
      result: '(ok "")',
      error: ""
    };
    assert.equal(Result.unwrapString(example, ""), "");
  });
})
