import { assert } from "chai";
import * as fs from "fs";
import * as path from "path";
import { ClarityContractInterface } from "../src/core/contractInterface";

/*
describe("contract interface type checking", () => {
  let namesContract: ClarityContractInterface;
  let tokensContract: ClarityContractInterface;
  let nonFungibleToken: ClarityContractInterface;

  before(() => {
    function loadSampleContract(file: string) {
      const fileContent = fs.readFileSync(
        path.join(__dirname, "contract-interface-samples", file),
        { encoding: "utf8" }
      );
      const fileJson = JSON.parse(fileContent);
      return fileJson as ClarityContractInterface;
    }

    namesContract = loadSampleContract("names.json");
    tokensContract = loadSampleContract("tokens.json");
    nonFungibleToken = loadSampleContract("non-fungible-token.json");
  });

  it("check private function types", () => {
    const priceFuncSig = namesContract.private_function_types["price-function"];
    assert.isOk(priceFuncSig.Fixed);
    const priceFuncArgs = priceFuncSig.Fixed[FunctionArgTypes];
    assert.equal(priceFuncArgs[0].atomic_type, "IntType");
    const priceFuncReturnType = priceFuncSig.Fixed[FunctionReturnType];
    assert.equal(priceFuncReturnType.atomic_type, "IntType");
  });

  it("check public function types", () => {
    const preorderFuncSig = namesContract.public_function_types.preorder;
    assert.isOk(preorderFuncSig.Fixed);
    assert.deepEqual(preorderFuncSig.Fixed[FunctionArgTypes][0].atomic_type, {
      BufferType: 20
    });
    assert.equal(preorderFuncSig.Fixed[FunctionArgTypes][1].atomic_type, "IntType");
    const preorderFuncReturnType = preorderFuncSig.Fixed[FunctionReturnType]
      .atomic_type as ResponseType;
    assert.equal(preorderFuncReturnType.ResponseType[ResponseTypeOk].atomic_type, "IntType");
    assert.deepEqual(preorderFuncReturnType.ResponseType[ResponseTypeError].atomic_type, {
      BufferType: 21
    });

    const registerFuncSig = namesContract.public_function_types.register;
    assert.isOk(registerFuncSig.Fixed);
    assert.equal(registerFuncSig.Fixed[FunctionArgTypes][0].atomic_type, "PrincipalType");
    assert.equal(registerFuncSig.Fixed[FunctionArgTypes][1].atomic_type, "IntType");
    assert.equal(registerFuncSig.Fixed[FunctionArgTypes][2].atomic_type, "IntType");
    const registerFuncReturnType = registerFuncSig.Fixed[FunctionReturnType]
      .atomic_type as ResponseType;
    assert.equal(registerFuncReturnType.ResponseType[ResponseTypeOk].atomic_type, "IntType");
    assert.deepEqual(registerFuncReturnType.ResponseType[ResponseTypeError].atomic_type, {
      BufferType: 31
    });
  });

  it("check variable types", () => {
    const burnAddressVarType = namesContract.variable_types["burn-address"];
    assert.equal(burnAddressVarType.atomic_type, "PrincipalType");
  });

  it("check map types", () => {
    const nameMap = namesContract.map_types["name-map"];
    assert.deepEqual(nameMap[0].atomic_type, {
      TupleType: {
        type_map: {
          name: {
            atomic_type: "IntType",
            list_dimensions: null
          }
        }
      }
    });
    assert.deepEqual(nameMap[1].atomic_type, {
      TupleType: {
        type_map: {
          owner: {
            atomic_type: "PrincipalType",
            list_dimensions: null
          }
        }
      }
    });

    const preorderMap = namesContract.map_types["preorder-map"];
    assert.deepEqual(preorderMap[0].atomic_type, {
      TupleType: {
        type_map: {
          "name-hash": {
            atomic_type: {
              BufferType: 20
            },
            list_dimensions: null
          }
        }
      }
    });
    assert.deepEqual(preorderMap[1].atomic_type, {
      TupleType: {
        type_map: {
          buyer: {
            atomic_type: "PrincipalType",
            list_dimensions: null
          },
          paid: {
            atomic_type: "IntType",
            list_dimensions: null
          }
        }
      }
    });
  });
});

*/
