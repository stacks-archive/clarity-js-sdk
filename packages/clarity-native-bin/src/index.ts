import * as fs from "fs";
import * as path from "path";
import { cargoInstall } from "./cargoBuild";
import { fetchDistributable } from "./fetchDist";
import { getExecutableFileName, verifyOutputFile } from "./fsUtil";
import { ILogger } from "./logger";

/**
 * Should correspond to both a git tag on the blockstack-core repo and a
 * set of clarity-binary distributables uploaded to the cloud storage endpoint.
 */
export const CORE_SDK_TAG = "clarity-sdk-v0.0.2";

/**
 * Resolve the directory of the currently executing package
 * @see https://stackoverflow.com/a/49455609/794962
 */
function getThisPackageDir(): string {
  const packagePath = path.dirname(require.resolve("../package.json"));
  return packagePath;
}

/**
 * Returns the full file path of the native clarity-cli executable.
 * Throws an error if it does not exist.
 * @param checkExists If true then an error is thrown if the file does not exist.
 */
export function getDefaultBinaryFilePath({
  checkExists = true
}: { checkExists?: boolean } = {}): string {
  const thisPkgDir = path.resolve(getThisPackageDir());
  const binFileName = getExecutableFileName("clarity-cli");
  const binFilePath = path.join(thisPkgDir, ".native-bin", CORE_SDK_TAG, binFileName);
  if (checkExists && !fs.existsSync(binFilePath)) {
    throw new Error(`Native binary does not appear to be installed at ${binFilePath}`);
  }
  return binFilePath;
}

export async function installDefault({
  checkExists = false,
  fromSource = false
}: { checkExists?: boolean; fromSource?: boolean } = {}) {
  const installPath = getDefaultBinaryFilePath({ checkExists: checkExists });
  const logger: ILogger = {
    error: (input: string | Error): void => {
      console.error(input);
    },
    log: (message?: string): void => {
      console.log(message);
    }
  };
  const success = await install({
    fromSource: fromSource,
    logger: logger,
    overwriteExisting: true,
    outputFilePath: installPath,
    versionTag: CORE_SDK_TAG
  });
  if (!success) {
    process.exit(1);
  }
}

export async function install(opts: {
  fromSource: boolean;
  logger: ILogger;
  overwriteExisting: boolean;
  outputFilePath: string;
  versionTag: string;
}): Promise<boolean> {
  const outputIsValid = await verifyOutputFile(
    opts.logger,
    opts.overwriteExisting,
    opts.outputFilePath
  );
  if (!outputIsValid) {
    return false;
  }

  if (opts.fromSource) {
    return cargoInstall(opts);
  } else {
    return fetchDistributable(opts);
  }
}
