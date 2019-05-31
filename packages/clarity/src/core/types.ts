export interface Var {
  name: string;
}

export interface Method {
  name: string;
  args?: string[];
}

export interface Receipt {
  success: boolean;
  error?: string;
  data?: any;
}

export interface BufferAtomicType {
  BufferType: number;
}

export interface TupleAtomicType {
  TupleType: {
    type_map: {
      [name: string]: TypeSignature;
    };
  };
}

export type AtomicType =
  | "VoidType"
  | "IntType"
  | "BoolType"
  | "PrincipalType"
  | BufferAtomicType
  | TupleAtomicType;

export interface TypeSignature {
  atomic_type: AtomicType;
  list_dimensions?: number;
}

export const FunctionArgTypes = 0;
export const FunctionReturnType = 1;

export interface FunctionTypeSignatureArray {
  [FunctionArgTypes]: TypeSignature[];
  [FunctionReturnType]: TypeSignature;
}

export interface FunctionTypeSignature {
  Fixed: FunctionTypeSignatureArray;
  // Variadic?: FunctionTypeSignatureArray;
}

export interface SmartContractInterface {
  private_function_types: {
    [name: string]: FunctionTypeSignature;
  };
  public_function_types: {
    [name: string]: FunctionTypeSignature;
  };
  variable_types: {
    [name: string]: TypeSignature;
  };
  map_types: {
    [name: string]: TypeSignature[];
  };
}

export interface CheckResult {
  success: boolean;
  SCI: SmartContractInterface;
}
