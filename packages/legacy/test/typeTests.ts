import { assert } from '../assertUtil';
import { CargoLocalNodeExecutor, LocalNodeExecutor } from '../localNodeExec';
import {
  FunctionArgTypes,
  FunctionReturnType,
  ContractInterface
} from '../ContractTypes';

describe('contract interface type checking', () => {
  let localNode: LocalNodeExecutor;
  let namesContractInterface: ContractInterface;
  let typeTestContractInterface: ContractInterface;

  before(async () => {
    localNode = await CargoLocalNodeExecutor.createEphemeral();

    await localNode.launchContract('tokens', 'tokens.scm');

    const namesCheckResult = await localNode.checkContract('names.scm');
    assert.isTrue(namesCheckResult.isValid, namesCheckResult.message);
    namesContractInterface = namesCheckResult.contractInterface;

    const typeTestCheckResult = await localNode.checkContract(
      'type-interface-test'
    );
    assert.isTrue(typeTestCheckResult.isValid, typeTestCheckResult.message);
    typeTestContractInterface = typeTestCheckResult.contractInterface;
  });

  it('null const variable', async () => {
    const exNullConst =
      typeTestContractInterface.variable_types['example-null-const'];
    assert.equal(exNullConst.atomic_type, 'VoidType');
  });

  it('null check function', async () => {
    const getNullVarFn =
      typeTestContractInterface.private_function_types['get-null-var'].Fixed;
    assert.equal(getNullVarFn[FunctionReturnType].atomic_type, 'VoidType');
  });

  it('null arg input function', async () => {
    const echoNullVarFn =
      typeTestContractInterface.private_function_types['echo-null-var'].Fixed;
    assert.equal(echoNullVarFn[FunctionArgTypes][0].atomic_type, 'VoidType');
    assert.equal(echoNullVarFn[FunctionReturnType].atomic_type, 'VoidType');
  });

  it('check private function types', async () => {
    const priceFuncSig =
      namesContractInterface.private_function_types['price-function'];
    assert.isOk(priceFuncSig.Fixed);
    const priceFuncArgs = priceFuncSig.Fixed[FunctionArgTypes];
    assert.equal(priceFuncArgs[0].atomic_type, 'IntType');
    const priceFuncReturnType = priceFuncSig.Fixed[FunctionReturnType];
    assert.equal(priceFuncReturnType.atomic_type, 'IntType');
  });

  it('check public function types', async () => {
    const preorderFuncSig =
      namesContractInterface.public_function_types['preorder'];
    assert.isOk(preorderFuncSig.Fixed);
    assert.deepEqual(preorderFuncSig.Fixed[FunctionArgTypes][0].atomic_type, {
      BufferType: 20
    });
    assert.equal(
      preorderFuncSig.Fixed[FunctionArgTypes][1].atomic_type,
      'IntType'
    );
    assert.equal(
      preorderFuncSig.Fixed[FunctionReturnType].atomic_type,
      'BoolType'
    );

    const registerFuncSig =
      namesContractInterface.public_function_types['register'];
    assert.isOk(registerFuncSig.Fixed);
    assert.equal(
      registerFuncSig.Fixed[FunctionArgTypes][0].atomic_type,
      'PrincipalType'
    );
    assert.equal(
      registerFuncSig.Fixed[FunctionArgTypes][1].atomic_type,
      'IntType'
    );
    assert.equal(
      registerFuncSig.Fixed[FunctionArgTypes][2].atomic_type,
      'IntType'
    );
    assert.equal(
      registerFuncSig.Fixed[FunctionReturnType].atomic_type,
      'BoolType'
    );
  });

  it('check variable types', async () => {
    const burnAddressVarType =
      namesContractInterface.variable_types['burn-address'];
    assert.equal(burnAddressVarType.atomic_type, 'PrincipalType');
  });

  it('check map types', async () => {
    const nameMap = namesContractInterface.map_types['name-map'];
    assert.deepEqual(nameMap[0].atomic_type, {
      TupleType: {
        type_map: {
          name: {
            atomic_type: 'IntType',
            list_dimensions: null
          }
        }
      }
    });
    assert.deepEqual(nameMap[1].atomic_type, {
      TupleType: {
        type_map: {
          owner: {
            atomic_type: 'PrincipalType',
            list_dimensions: null
          }
        }
      }
    });

    const preorderMap = namesContractInterface.map_types['preorder-map'];
    assert.deepEqual(preorderMap[0].atomic_type, {
      TupleType: {
        type_map: {
          'name-hash': {
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
            atomic_type: 'PrincipalType',
            list_dimensions: null
          },
          paid: {
            atomic_type: 'IntType',
            list_dimensions: null
          }
        }
      }
    });
  });

  after(async () => {
    // Cleanup node.
    await localNode.close();
  });
});
