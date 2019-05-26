export { run } from "@oclif/command";
import * as path from "path";

/**
 * Resolve the directory the currently executing package
 * @see https://stackoverflow.com/a/49455609/794962
 */
export function getPackageDir(): string {
  const packagePath = path.dirname(require.resolve("../package.json"));
  return packagePath;
}
