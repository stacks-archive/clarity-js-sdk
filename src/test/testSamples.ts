import { assert } from '../assertUtil';
import {
  CargoLocalNodeExecutor,
  LaunchedContract,
  LocalNodeExecutor
} from '../localNodeExec';

describe('sample contracts', () => {
  let localNode: LocalNodeExecutor;

  let tokensContract: LaunchedContract;
  let namesContract: LaunchedContract;

  const DEMO_ADDRESS = 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR';

  before(async () => {
    localNode = await CargoLocalNodeExecutor.createEphemeral();
  });

  it('check names contract fails', async () => {
    const checkResult = await localNode.checkContract('names.scm');
    assert.isFalse(checkResult.isValid, checkResult.message);
    assert.equal(checkResult.code, 1);
    assert.equal(
      checkResult.message,
      'Type check error.\nNoSuchContract("tokens")\nNear:\n( contract-call! tokens token-transfer burn-address name-price )'
    );
  });

  it('launch tokens contract', async () => {
    tokensContract = await localNode.launchContract('tokens', 'tokens.scm');
  });

  it('check names contract succeeds', async () => {
    const checkResult = await localNode.checkContract('names.scm');
    assert.isTrue(checkResult.isValid, checkResult.message);
  });

  it('launch names contract', async () => {
    namesContract = await localNode.launchContract('names', 'names.scm');
  });

  it('execute token mint', async () => {
    await tokensContract.execute('mint!', DEMO_ADDRESS, '100000');
  });

  it('get token balance', async () => {
    const tokenBalance = await tokensContract.eval(
      `(get-balance '${DEMO_ADDRESS})`
    );
    assert.equal(tokenBalance, '110000');
  });

  it('preorder name', async () => {
    const nameHash = await namesContract.eval('(hash160 (xor 10 8888))');
    assert.equal(nameHash, '0xb572fb1ce2e9665f1efd0994fe077b50c3a48fde');

    await namesContract.execute('preorder', DEMO_ADDRESS, nameHash, '1000');
  });

  it('balance reduced after name preorder', async () => {
    const balanceResult = await tokensContract.eval(
      `(get-balance '${DEMO_ADDRESS})`
    );
    assert.equal(balanceResult, '109000');
  });

  it('register name', async () => {
    await namesContract.execute(
      'register',
      DEMO_ADDRESS,
      `'${DEMO_ADDRESS}`,
      '10',
      '8888'
    );
  });

  it('get owner address for name', async () => {
    const nameOwner = await namesContract.eval(
      '(get owner (fetch-entry name-map (tuple (name 10))))'
    );
    assert.equal(nameOwner, "'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR");
  });

  after(async () => {
    // Cleanup node.
    await localNode.close();
  });
});
