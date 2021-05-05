import { assert } from "chai"
import { Result, ResultInterface } from "../src"

describe("Unwrapping data types", () => {
  it("Unwraps ok uint ", () => {
    const example:ResultInterface<string, unknown> = {
      success: true,
      result: "(ok u123)",
      error: ""
    };
    assert.equal(Result.unwrapUInt(example), 123);
  });

  it("Unwraps ok int", () => {
    const example:ResultInterface<string, unknown> = {
      success: true,
      result: "(ok 123)",
      error: ""
    };
    assert.equal(Result.unwrapInt(example), 123);
  });

  it("Unwraps ok hex string", () => {
    const example:ResultInterface<string, unknown> = {
      success: true,
      result: "(ok 0x68656c6c6f20776f726c64)",
      error: ""
    };
    assert.equal(Result.unwrapString(example), "hello world");
  });

  it("Unwraps ok utf-8 string", () => {
    const example:ResultInterface<string, unknown> = {
      success: true,
      result: `(ok u"\u{d83e}\u{dd84} Stacks")`,
      error: ""
    };
    assert.equal(Result.unwrapString(example, "utf8"), "🦄 Stacks");
  });

  it("Unwraps ok base64 string", () => {
    const example:ResultInterface<string, unknown> = {
      success: true,
      result: '(ok "aGVsbG8gd29ybGQ=")',
      error: ""
    };
    assert.equal(Result.unwrapString(example, "base64"), "hello world");
  });

  it("Unwraps ok boolean (true)", () => {
    const example:ResultInterface<string, unknown> = {
      success: true,
      result: '(ok true)',
      error: ""
    };
    assert.equal(Result.unwrapBool(example), true);
  });

  it("Unwraps ok boolean (false)", () => {
    const example:ResultInterface<string, unknown> = {
      success: true,
      result: '(ok false)',
      error: ""
    };
    assert.equal(Result.unwrapBool(example), false);
  });
})