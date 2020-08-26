import { ContractInterface } from './contractInterface';
import { ResultInterface } from './result';

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

export interface CheckResult extends ResultInterface<ContractInterface, string> {}
