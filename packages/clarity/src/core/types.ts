import { ResultInterface } from "./result";

export interface Var {
  name: string;
}

export interface Method {
  name: string;
  args: string[];
}

export interface Receipt extends ResultInterface<string, string> {
  debugOutput?: string;
}

// tslint:disable-next-line: ban-types
export interface CheckResult extends ResultInterface<Object, string> {}
