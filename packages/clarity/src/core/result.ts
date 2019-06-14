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
function extract<T extends ResultInterface<unknown, unknown>>(
  input: T
): { success: true; value: ExtractOk<T> } | { success: false; value: ExtractErr<T> } {
  if (input.success) {
    return { success: true, value: input.result as ExtractOk<T> };
  } else {
    return { success: false, value: input.error as ExtractErr<T> };
  }
}

/**
 * Unwraps an object that defines `ResultInterface`.
 * If `success` is false then an error is thrown with the given object's `error` value.
 * Otherwise, returns the object's `result` value.
 */
function get<T extends ResultInterface<unknown, unknown>>(input: T): ExtractOk<T> {
  if (!input.success) {
    if (input.error) {
      if (input.error instanceof Error) {
        throw input.error;
      } else if (typeof input.error === "string") {
        throw new Error(input.error);
      }
    } else {
      throw new Error("Result not successful and did not include an error message.");
    }
  }
  return input.result as ExtractOk<T>;
}

export const Result = {
  get,
  extract
};
