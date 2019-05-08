import path from 'path';
import { assert } from '../assertUtil';
import { getContractFilePath } from '../localNodeExec';

describe('contract path tests', () => {
  it('resolve file name', () => {
    const filePath = getContractFilePath('tokens.scm');
    assert.endsWith(filePath, path.normalize('/contracts/tokens.scm'));
  });

  it('resolve file name without extension', () => {
    const filePath = getContractFilePath('tokens');
    assert.endsWith(filePath, path.normalize('/contracts/tokens.scm'));
  });

  it('resolve relative file path', () => {
    const filePath = getContractFilePath('./tokens');
    assert.endsWith(filePath, path.normalize('/contracts/tokens.scm'));
  });

  it('resolve relative file path with backward slash', () => {
    const filePath = getContractFilePath('.\\tokens');
    assert.endsWith(filePath, path.normalize('/contracts/tokens.scm'));
  });

  it('resolve relative file path with forward slash', () => {
    const filePath = getContractFilePath('./tokens');
    assert.endsWith(filePath, path.normalize('/contracts/tokens.scm'));
  });

  it('resolve relative contracts file path', () => {
    const filePath = getContractFilePath('contracts/tokens');
    assert.endsWith(filePath, path.normalize('/contracts/tokens.scm'));
  });
});
