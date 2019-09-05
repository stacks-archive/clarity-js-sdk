import { ClarityContractInterface } from "./contractInterface";
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

export interface LaunchContractResult extends ResultInterface<string, string> {
  contractInterfaceJson?: string;
}

export interface CheckResult extends ResultInterface<ClarityContractInterface, string> {}

const ff = new Uint8Array(3);
ff[3] = 2345;

type ByteRange = 0 | 1 | 2 | 3 | 4 | 5;

class TestArr extends Uint8Array {
  constructor(length: number) {
    super(length);
  }
  [index: number]: ByteRange;
}

const tA = new TestArr(234);
tA[0] = 3;

const aa = new Uint8ClampedArray(4);
aa[77] = 345465;
