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
    await localNode.setBlockHeight(BigInt('117'));
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
    assert.equal(deployHeight, '117');
    const heightAtDeployment = await blockHeightTestContract.eval(
      'height-at-launch'
    );
    assert.equal(heightAtDeployment, '117');
  });

  it('print current block height [eval]', async () => {
    const result = await blockHeightTestContract.eval(
      '(print-current-block-height)',
      true
    );
    assert.equal(result.result, '117');
    assert.equal(result.debugOutput, 'Int(117)');
  });

  it('print current block height [execute]', async () => {
    const result = await blockHeightTestContract.execute(
      'print-current-block-height-public',
      DEMO_ADDRESS
    );
    assert.equal(result.debugOutput, 'Int(117)');
  });

  it('increment block height', async () => {
    const currentHeightOutput = await blockHeightTestContract.eval(
      '(get-current-block-height)'
    );
    assert.equal(currentHeightOutput, '117');
    const newHeight = BigInt(currentHeightOutput) + BigInt(100);
    await localNode.setBlockHeight(newHeight);
    const getHeightCheck = await localNode.getBlockHeight();
    assert.equal(getHeightCheck, BigInt('217'));
    const newHeightOutput = await blockHeightTestContract.eval(
      '(get-current-block-height)'
    );
    assert.equal(newHeightOutput, '217');
  });

  it('estimate current timestamp', async () => {
    const heightAtLaunch = BigInt(
      await blockHeightTestContract.eval('height-at-launch')
    );
    const timestampAtLaunch = BigInt(
      await blockHeightTestContract.eval('time-at-launch')
    );
    const currentBlockHeight = await localNode.incrementBlockHeight(33);

    const expectedTimestamp =
      (currentBlockHeight - heightAtLaunch) * BigInt(60 * 10) +
      timestampAtLaunch;

    const result = await blockHeightTestContract.eval(
      '(estimate-current-timestamp)'
    );
    assert.equal(BigInt(result), expectedTimestamp);
  });

  after(async () => {
    // Cleanup node.
    await localNode.close();
  });
});
