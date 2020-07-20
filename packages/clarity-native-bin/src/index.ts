import * as fs from "fs-extra";
import * as path from "path";
import { cargoInstall } from "./cargoBuild";
import { fetchDistributable, getDownloadUrl } from "./fetchDist";
import { getExecutableFileName, moveFromPath, verifyOutputFile } from "./fsUtil";
import { ConsoleLogger, ILogger } from "./logger";

/**
 * Should correspond to both a git tag on the blockstack-core repo and a
 * set of clarity-binary distributables uploaded to the cloud storage endpoint.
 */
export const CORE_SDK_TAG = "clarity-sdk-v0.1.1";

export const BLOCKSTACK_CORE_SOURCE_TAG_ENV_VAR = "BLOCKSTACK_CORE_SOURCE_TAG";
export const BLOCKSTACK_CORE_SOURCE_BRANCH_ENV_VAR = "BLOCKSTACK_CORE_SOURCE_BRANCH";
export const BLOCKSTACK_CORE_SOURCE_PATH_ENV_VAR = "BLOCKSTACK_CORE_SOURCE_PATH";

/**
 * A git tag or branch name can be specified as an env var.
 * See [[BLOCKSTACK_CORE_SOURCE_TAG_ENV_VAR]] and [[BLOCKSTACK_CORE_SOURCE_BRANCH_ENV_VAR]].
 * @returns If an environment var is specified then returns the tag/branch string value.
 * Otherwise returns false.
 */
function getOverriddenCoreSource():
  false | { specifier: "branch" | "tag" | "path"; value: string } {
  for (const [key, val] of Object.entries(process.env)) {
    if (val === undefined) {
      continue;
    }
    const keyStr = key.toLocaleUpperCase();
    if (keyStr === BLOCKSTACK_CORE_SOURCE_TAG_ENV_VAR) {
      return { specifier: "tag", value: val };
    } else if (keyStr === BLOCKSTACK_CORE_SOURCE_BRANCH_ENV_VAR) {
      return { specifier: "branch", value: val };
    } else if (keyStr === BLOCKSTACK_CORE_SOURCE_PATH_ENV_VAR) {
      return { specifier: "path", value: val };
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
 * @param versionTag Defaults to the current `CORE_SDK_TAG`.
 */
export function getDefaultBinaryFilePath({
  checkExists = true,
  versionTag
}: { checkExists?: boolean; versionTag?: string } = {}): string {
  if (!versionTag) {
    versionTag = CORE_SDK_TAG;
  }
  const thisPkgDir = path.resolve(getThisPackageDir());
  const binFileName = getExecutableFileName("clarity-cli");
  const binFilePath = path.join(thisPkgDir, ".native-bin", versionTag, binFileName);
  if (checkExists && !fs.existsSync(binFilePath)) {
    throw new Error(`Native binary does not appear to be installed at ${binFilePath}`);
  }
  return binFilePath;
}

export async function installDefaultPath(): Promise<boolean> {
  const installPath = getDefaultBinaryFilePath({ checkExists: false });
  const logger = ConsoleLogger;

  let versionTag: string | undefined = CORE_SDK_TAG;
  let versionBranch: string | undefined;
  let fromSource = false;

  // Check if source git tag/branch was specified using env var
  const sourceOverride = getOverriddenCoreSource();
  if (sourceOverride !== false && sourceOverride.specifier !== "path") {
    logger.log(`Found git source env var ${sourceOverride.specifier}=${sourceOverride.value}`);
    fromSource = true;
    if (sourceOverride.specifier === "branch") {
      versionTag = undefined;
      versionBranch = sourceOverride.value;
    } else {
      versionTag = sourceOverride.value;
    }
  }

  if (!fromSource) {
    const distFileAvailable = getDownloadUrl(logger, CORE_SDK_TAG);
    if (!distFileAvailable) {
      fromSource = true;
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
  } else if (sourceOverride && sourceOverride.specifier === "path") {
    success = moveFromPath({
      logger,
      outputFilePath: installPath,
      inputFilePAth: sourceOverride.value,
    });
  } else {
    success = await fetchDistributable({
      logger: logger,
      overwriteExisting: true,
      outputFilePath: installPath,
      versionTag: versionTag!
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
