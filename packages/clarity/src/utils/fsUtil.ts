import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

export function getTempFilePath(fileNameTemplate = 'temp-{uniqueID}-file') {
  const uniqueID = `${(Date.now() / 1000) | 0}-${Math.random().toString(36).substr(2, 6)}`;
  const fileName = fileNameTemplate.replace('{uniqueID}', uniqueID);
  return path.join(os.tmpdir(), fileName);
}

export function fileExists(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}
