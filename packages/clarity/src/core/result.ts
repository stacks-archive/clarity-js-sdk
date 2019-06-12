export interface ResultInterface<ResultType, ErrorType> {
  success: boolean;
  error?: ErrorType;
  result?: ResultType;
}

/**
 * Type guard for objects that define `ResultInterface`.
 * If `success` is false then the `error` property is marked as defined
 * for use with Typescript `strictNullChecks`.
 */
function isError<ResultType, ErrorType, T extends ResultInterface<ResultType, ErrorType>>(
  result: T
): result is T & { success: false; error: ErrorType } {
  return !result.success;
}

/**
 * Type guard for objects that define `ResultInterface`.
 * If `success` is true then the `result` property is marked as defined
 * for use with Typescript `strictNullChecks`.
 */
function isOk<ResultType, ErrorType, T extends ResultInterface<ResultType, ErrorType>>(
  result: T
): result is T & { success: true; result: ResultType } {
  return result.success;
}

export const Result = {
  isError,
  isOk
};
