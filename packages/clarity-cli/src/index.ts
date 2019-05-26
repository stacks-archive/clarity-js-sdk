export { run } from "@oclif/command";
import path from "path";


/**
 * Resolve the directory the currently executing package
 * @see https://stackoverflow.com/a/49455609/794962
 */
function getPackageDir(): string {
  const packagePath = path.dirname(require.resolve("../package.json"));
  return packagePath;
}

export const PACKAGE_DIR = getPackageDir();
