export interface ClarityContractInterface {
  functions: ClarityFunctionType[];
  variables: ClarityVariableType[];
  maps: ClarityMapType[];
}

export interface ClarityMapType {
  name: string;
  key_name: string;
  key_type: ClarityAtomType;
  value_name: string;
  value_type: ClarityAtomType;
}

export const enum ClarityVariableAccessType {
  constant = "constant",
  variable = "variable"
}

export interface ClarityVariableType {
  name: string;
  type: ClarityAtomType;
  access: ClarityVariableAccessType;
}

export interface ClarityFunctionArgType {
  name: string;
  type: ClarityAtomType;
}

export interface ClarityFunctionType {
  name: string;
  access: ClarityFunctionAccessType;
  args: ClarityFunctionArgType[];
  outputs: { type: ClarityAtomType };
}

export const enum ClarityFunctionAccessType {
  private = "private",
  public = "public",
  read_only = "read_only"
}

export interface ClarityTupleType {
  tuple: {
    [index: number]: {
      name: string;
      type: ClarityAtomType;
    };
  };
}

export interface ClarityBufferType {
  buffer: {
    length: number;
  };
}

export interface ClarityOptionalType {
  optional: ClarityAtomType;
}

export interface ClarityResponseType {
  response: {
    ok: ClarityAtomType;
    error: ClarityAtomType;
  };
}

export interface ClarityListType {
  list: {
    type: ClarityAtomType;
    length: number;
    dimension: number;
  };
}

export type ClarityNoneType = "none";
export type ClarityInt128Type = "int128";
export type ClarityBoolType = "bool";
export type ClarityPrincipalType = "principal";

export type ClarityAtomType =
  | ClarityNoneType
  | ClarityInt128Type
  | ClarityBoolType
  | ClarityPrincipalType
  | ClarityBufferType
  | ClarityTupleType
  | ClarityOptionalType
  | ClarityResponseType
  | ClarityListType;
