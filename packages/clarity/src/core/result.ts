export interface ResultInterface<ResultType, ErrorType> {
  success: boolean;
  error?: ErrorType;
  result?: ResultType;
}

type ExtractOk<T extends ResultInterface<unknown, unknown>> = T extends ResultInterface<
  infer U,
  unknown
>
  ? U
  : never;

type ExtractErr<T extends ResultInterface<unknown, unknown>> = T extends ResultInterface<
  unknown,
  infer U
>
  ? U
  : never;

/**
 * Type guard for objects that define `ResultInterface`.
 * If `success` is true then the `result` property is marked as defined,
 * otherwise, the `error` property is marked as defined.
 */
export function matchResult<TReturn, T extends ResultInterface<unknown, unknown>>(
  input: T,
  ok: (val: ExtractOk<T>) => TReturn,
  error: (err: ExtractErr<T>) => TReturn
): TReturn {
  const extracted = extractResult(input);
  if (extracted.success) {
    return ok(extracted.result);
  } else {
    return error(extracted.error);
  }
}

/**
 * Type guard for objects that define `ResultInterface`.
 * If `success` is true then the `result` property is marked as defined,
 * otherwise, the `error` property is marked as defined.
 */
export function extractResult<T extends ResultInterface<unknown, unknown>>(
  input: T
): { success: true; result: ExtractOk<T> } | { success: false; error: ExtractErr<T> } {
  if (input.success) {
    return { success: true, result: input.result as ExtractOk<T> };
  } else {
    return { success: false, error: input.error as ExtractErr<T> };
  }
}

/**
 * Unwraps an object that defines `ResultInterface`.
 * If `success` is true then the object's `result` value is returned.
 * Otherwise, an error is thrown with the given object's `error` value.
 * The type of the `error` value determines what gets thrown:
 * * If `error` is an instance of an `Error` object then it is directly thrown.
 * * If `error` is a string then an `Error` will be constructed with the string and thrown.
 * * If `error` is of neither type then the object is thrown directly (not generally recommended).
 */
export function unwrapResult<T extends ResultInterface<unknown, unknown>>(input: T): ExtractOk<T> {
  if (!input.success) {
    if (input.error) {
      if (input.error instanceof Error) {
        throw input.error;
      } else if (typeof input.error === "string") {
        throw new Error(input.error);
      } else {
        throw input.error;
      }
    } else {
      throw new Error("Result not successful and did not include an error message.");
    }
  }
  return input.result as ExtractOk<T>;
}

const getWrappedResult = (input: ResultInterface<string, unknown>, r: RegExp) => {
  if (input.result) {
    const match = r.exec(input.result);
    if (!match) {
      throw new Error(`Unable to unwrap result: ${input.result}`);
    }
    return match[1];
  }
  throw new Error(`Unable to unwrap result: ${input}`);
};

export function unwrapUInt(input: ResultInterface<string, unknown>): number {
  const match = getWrappedResult(input, /^\(ok\su(\d+)\)$/);
  return parseInt(match);
}

export function unwrapInt(input: ResultInterface<string, unknown>): number {
  const match = getWrappedResult(input, /^\(ok\s(\d+)\)$/);
  return parseInt(match);
}

export function unwrapString(input: ResultInterface<string, unknown>, encoding = "hex"): string {
  let match;
  if (encoding === "hex") {
    match = getWrappedResult(input, /^\(ok\s0x(\w+)\)$/);
  } else if (encoding === "utf8") {
    match = getWrappedResult(input, /^\(ok\s\u"(.+)\"\)$/);
  } else {
    match = getWrappedResult(input, /^\(ok\s(.+)\)$/);
  }
  return Buffer.from(match, encoding).toString();
}

export function unwrapBool(input: ResultInterface<string, unknown>): boolean {
  const match = getWrappedResult(input, /^\(ok\s(true|false)\)$/);
  return match === 'true' 
}

export const Result = {
  unwrap: unwrapResult,
  extract: extractResult,
  match: matchResult,
  unwrapUInt,
  unwrapInt,
  unwrapString,
  unwrapBool
};
