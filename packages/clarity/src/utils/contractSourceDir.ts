import * as path from "path";
import { fileExists } from "./fsUtil";

export const CONTRACT_FILE_EXT = ".scm";

export function getContractFilePath(contractFile: string): string {
  function* getLocations(file: string): IterableIterator<string> {
    yield path.resolve(file);
    yield path.resolve("contracts", file);
    yield path.resolve(__dirname, "contracts", file);
    yield path.resolve(__dirname, file);
    if (!file.endsWith(CONTRACT_FILE_EXT)) {
      for (const f of getLocations(file + CONTRACT_FILE_EXT)) {
        yield f;
      }
    }
  }

  // Normalize OS path separators.
  if (path.sep === path.posix.sep && contractFile.includes(path.win32.sep)) {
    contractFile = contractFile.replace(/\\/g, path.sep);
  } else if (path.sep === path.win32.sep && contractFile.includes(path.posix.sep)) {
    contractFile = contractFile.replace(/\//g, path.sep);
  }

  for (const filePath of getLocations(contractFile)) {
    if (fileExists(filePath)) {
      return filePath;
    }
  }

  throw new Error(`Could not find contract file: ${contractFile}`);
}
