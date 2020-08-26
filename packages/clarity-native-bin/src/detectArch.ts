// Gratefully borrowed from https://github.com/feross/arch/blob/master/index.js
// Note: Modified to only return `x64` when detecting a 32-bit Node.js on 64-bit
// platform, otherwise returns `os.arch()`.

/*
 > In Node.js, the os.arch() method (and process.arch property) returns a string
 > identifying the operating system CPU architecture for which the Node.js binary
 > was compiled. This is not the same as the operating system CPU architecture.
 > For example, you can run Node.js 32-bit on a 64-bit OS. In that situation,
 > os.arch() will return a misleading 'x86' (32-bit) value, instead of 'x64' (64-bit).
 */

import cp from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ConsoleLogger, ILogger } from './logger';

export function detectArch(logger: ILogger = ConsoleLogger): string {
  try {
    /**
     * The running binary is 64-bit, so the OS is clearly 64-bit.
     */
    if (process.arch === 'x64') {
      return 'x64';
    }

    /**
     * On Windows, the most reliable way to detect a 64-bit OS from within a 32-bit
     * app is based on the presence of a WOW64 file: %SystemRoot%\SysNative.
     * See: https://twitter.com/feross/status/776949077208510464
     */
    if (process.platform === 'win32' && os.arch() === 'ia32') {
      let useEnv = false;
      try {
        useEnv = !!(process.env.SYSTEMROOT && fs.statSync(process.env.SYSTEMROOT));
      } catch (err) {
        // ignore
      }

      const sysRoot = useEnv ? process.env.SYSTEMROOT! : 'C:\\Windows';

      // If %SystemRoot%\SysNative exists, we are in a WOW64 FS Redirected application.
      let isWOW64 = false;
      try {
        isWOW64 = !!fs.statSync(path.join(sysRoot, 'sysnative'));
      } catch (err) {
        // ignore
      }
      if (isWOW64) {
        return 'x64';
      }
    }

    /**
     * On Linux, use the `getconf` command to get the architecture.
     */
    if (process.platform === 'linux' && os.arch() === 'ia32') {
      const output = cp.execSync('getconf LONG_BIT', { encoding: 'utf8' });
      if (output === '64\n') {
        return 'x64';
      }
    }
  } catch (error) {
    logger.error(`Unexpected error trying to detect system architecture: ${error}`);
  }

  /**
   * If none of the above, fallback to os.arch()
   */
  return os.arch();
}
