export interface BufferAtomicType {
  BufferType: number;
}

export interface OptionalType {
  OptionalType: TypeSignature;
}

export const ResponseTypeOk = 0;
export const ResponseTypeError = 1;

export interface ResponseType {
  ResponseType: {
    [ResponseTypeOk]: TypeSignature;
    [ResponseTypeError]: TypeSignature;
  };
}

export interface TupleAtomicType {
  TupleType: {
    type_map: {
      [name: string]: TypeSignature;
    };
  };
}

export type AtomicType =
  | "NoType"
  | "IntType"
  | "BoolType"
  | "PrincipalType"
  | BufferAtomicType
  | OptionalType
  | ResponseType
  | TupleAtomicType;

export interface TypeSignature {
  atomic_type: AtomicType;
  list_dimensions?: number | null;
}

export interface FunctionArg extends TypeSignature {
  name: string;
}

export const FunctionArgTypes = 0;
export const FunctionReturnType = 1;

export interface FunctionTypeSignatureArray {
  [FunctionArgTypes]: FunctionArg[];
  [FunctionReturnType]: TypeSignature;
}

export interface FunctionTypeSignature {
  Fixed: FunctionTypeSignatureArray;
  // Variadic?: FunctionTypeSignatureArray;
}

export interface ContractInterface {
  private_function_types: {
    [name: string]: FunctionTypeSignature;
  };
  public_function_types: {
    [name: string]: FunctionTypeSignature;
  };
  read_only_function_types: {
    [name: string]: FunctionTypeSignature;
  };
  variable_types: {
    [name: string]: TypeSignature;
  };
  map_types: {
    [name: string]: TypeSignature[];
  };
}
