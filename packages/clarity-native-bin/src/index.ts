import * as fs from "fs";
import * as path from "path";
import { cargoInstall } from "./cargoBuild";
import { fetchDistributable, getDownloadUrl } from "./fetchDist";
import { getExecutableFileName, verifyOutputFile } from "./fsUtil";
import { ILogger } from "./logger";

/**
 * Should correspond to both a git tag on the blockstack-core repo and a
 * set of clarity-binary distributables uploaded to the cloud storage endpoint.
 */
export const CORE_SDK_TAG = "clarity-sdk-v0.0.4";

export const BLOCKSTACK_CORE_SOURCE_TAG_ENV_VAR = "BLOCKSTACK_CORE_SOURCE_TAG";
export const BLOCKSTACK_CORE_SOURCE_BRANCH_ENV_VAR = "BLOCKSTACK_CORE_SOURCE_BRANCH";

/**
 * A git tag or branch name can be specified as an env var.
 * See [[BLOCKSTACK_CORE_SOURCE_TAG_ENV_VAR]] and [[BLOCKSTACK_CORE_SOURCE_BRANCH_ENV_VAR]].
 * @returns If an environment var is specified then returns the tag/branch string value.
 * Otherwise returns false.
 */
function getOverriddenCoreSource(): false | { specifier: "branch" | "tag"; value: string } {
  for (const [key, val] of Object.entries(process.env)) {
    const keyStr = key.toLocaleUpperCase();
    if (keyStr === BLOCKSTACK_CORE_SOURCE_TAG_ENV_VAR) {
      return { specifier: "tag", value: val };
    } else if (keyStr === BLOCKSTACK_CORE_SOURCE_BRANCH_ENV_VAR) {
      return { specifier: "branch", value: val };
    }
  }
  return false;
}

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
 * @param checkExists [Default = true] If true then an error is thrown if the file does not exist.
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

export async function installDefaultPath({
  checkExists = false,
  fromSource = null
}: { checkExists?: boolean; fromSource?: boolean } = {}): Promise<boolean> {
  const installPath = getDefaultBinaryFilePath({ checkExists: checkExists });
  const logger: ILogger = {
    error: (input: string | Error): void => {
      console.error(input);
    },
    log: (message?: string): void => {
      console.log(message);
    }
  };

  let versionTag = CORE_SDK_TAG;
  let versionBranch: string;

  if (!fromSource) {
    // Check if source git tag/branch was specified using env var
    const sourceOverride = getOverriddenCoreSource();
    if (sourceOverride !== false) {
      logger.log(`Found git source env var ${sourceOverride.specifier}=${sourceOverride.value}`);
      fromSource = true;
      if (sourceOverride.specifier === "branch") {
        versionTag = undefined;
        versionBranch = sourceOverride.value;
      } else {
        versionTag = sourceOverride.value;
      }
    } else {
      const distFileAvailable = getDownloadUrl(logger, CORE_SDK_TAG);
      // If the distFile is not available, and `fromSource` is explicitly disabled
      // then return false (failure).
      if (!distFileAvailable && fromSource === false) {
        logger.error("Dist files are not available and `fromSource` is explicitly disabled.");
        return false;
      } else if (!distFileAvailable) {
        // Otherwise, if `fromSource` was left undefined/null then enable it.
        fromSource = true;
      }
    }
  }

  const outputIsValid = verifyOutputFile(logger, true, installPath);
  if (!outputIsValid) {
    return false;
  }

  let success: boolean;
  if (fromSource) {
    success = await cargoInstall({
      logger: logger,
      overwriteExisting: true,
      outputFilePath: installPath,
      gitBranch: versionBranch,
      gitTag: versionTag
    });
  } else {
    success = await fetchDistributable({
      logger: logger,
      overwriteExisting: true,
      outputFilePath: installPath,
      versionTag: versionTag
    });
  }

  return success;
}

export async function install(opts: {
  fromSource: boolean;
  logger: ILogger;
  overwriteExisting: boolean;
  outputFilePath: string;
  versionTag: string;
}): Promise<boolean> {
  const outputIsValid = verifyOutputFile(opts.logger, opts.overwriteExisting, opts.outputFilePath);
  if (!outputIsValid) {
    return false;
  }

  if (opts.fromSource) {
    return cargoInstall({ ...opts, gitTag: opts.versionTag });
  } else {
    return fetchDistributable(opts);
  }
}
