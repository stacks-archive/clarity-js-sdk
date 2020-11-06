import { ContractInterface } from "./contractInterface";
import { ResultInterface } from "./result";

export interface Var {
  name: string;
}

/**
 * Describes a function of a smart contract. This can be
 * a public or read-only function.
 */
export interface Method {
  /**
   * function name
   */
  name: string;
  /**
   * list of function arguments. Arguments are converted to Clarity Values following
   * the same rules as if you would enter the values into the command line
   */
  args: string[];
}

export interface Receipt extends ResultInterface<string, string> {
  debugOutput?: string;
}

export interface CheckResult extends ResultInterface<ContractInterface, string> {}
