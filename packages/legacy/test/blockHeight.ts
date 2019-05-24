import { assert } from '../assertUtil';
import {
  CargoLocalNodeExecutor,
  LaunchedContract,
  LocalNodeExecutor
} from '../localNodeExec';

describe('block height testing', () => {
  let localNode: LocalNodeExecutor;

  let blockHeightTestContract: LaunchedContract;

  const DEMO_ADDRESS = 'SZ2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKQ9H6DPR';

  before(async () => {
    localNode = await CargoLocalNodeExecutor.createEphemeral();
  });

  it('set local node block height', async () => {
    await localNode.mineBlocks(7);
  });

  it('check block height contract', async () => {
    const checkResult = await localNode.checkContract('block-height-test.scm');
    assert.isTrue(checkResult.isValid, checkResult.message);
  });

  it('launch block height contract', async () => {
    blockHeightTestContract = await localNode.launchContract(
      'block-height-tests',
      'block-height-test.scm'
    );
  });

  it('get deployed block height', async () => {
    const deployHeight = await blockHeightTestContract.eval(
      '(get-height-info 123)'
    );
    assert.equal(deployHeight, '26');
    const heightAtDeployment = await blockHeightTestContract.eval(
      'height-at-launch'
    );
    assert.equal(heightAtDeployment, '26');
  });

  it('print current block height [eval]', async () => {
    const result = await blockHeightTestContract.eval(
      '(print-current-block-height)',
      true
    );
    assert.equal(result.result, '26');
    assert.equal(result.debugOutput, 'Int(26)');
  });

  it('print current block height [execute]', async () => {
    const result = await blockHeightTestContract.execute(
      'print-current-block-height-public',
      DEMO_ADDRESS
    );
    assert.equal(result.debugOutput, 'Int(26)');
  });

  it('increment block height', async () => {
    const currentHeightOutput = await blockHeightTestContract.eval(
      '(get-current-block-height)'
    );
    assert.equal(currentHeightOutput, '26');
    const newHeight = BigInt(currentHeightOutput) + BigInt(8);
    await localNode.mineBlocks(newHeight);
    const getHeightCheck = await localNode.getBlockHeight();
    assert.equal(getHeightCheck.toString(), '60');
    const newHeightOutput = await blockHeightTestContract.eval(
      '(get-current-block-height)'
    );
    assert.equal(newHeightOutput, '60');
  });

  it('estimate current timestamp', async () => {
    const heightAtLaunch = BigInt(
      await blockHeightTestContract.eval('height-at-launch')
    );
    const timestampAtLaunch = BigInt(
      await blockHeightTestContract.eval('time-at-launch')
    );
    await localNode.mineBlocks(33);
    const currentBlockHeight = await localNode.getBlockHeight();

    const expectedTimestamp =
      (currentBlockHeight - heightAtLaunch) * BigInt(60 * 10) +
      timestampAtLaunch;

    const result = await blockHeightTestContract.eval(
      '(estimate-current-timestamp)'
    );
    assert.equal(result, expectedTimestamp.toString());
  });

  after(async () => {
    // Cleanup node.
    await localNode.close();
  });
});
