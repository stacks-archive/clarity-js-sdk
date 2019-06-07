import * as fs from "fs";
import fetch from "node-fetch";
import * as os from "os";
import * as path from "path";
import * as tar from "tar";
import { detectLibc } from "./detectLibc";
import { getExecutableFileName, makeUniqueTempDir } from "./fsUtil";
import { ILogger } from "./logger";
import { pipelineAsync } from "./streamUtil";

const DIST_DOWNLOAD_URL_TEMPLATE =
  "https://github.com/blockstack/clarity-js-sdk/releases/" +
  "download/{tag}/clarity-cli-{platform}-{arch}.tar.gz";

const enum SupportedDistPlatform {
  WINDOWS = "win",
  MACOS = "mac",
  LINUX = "linux",
  LINUX_MUSL = "linux-musl"
}

const enum SupportedDistArch {
  x64 = "x64"
}

/**
 * Gets a download url for a dist archive containing a binary that
 * can run in the currently executing system OS and architecture.
 * Returns false if system is incompatible with known available distributables.
 */
export function getDownloadUrl(logger: ILogger, versionTag: string): string | false {
  let arch: SupportedDistArch;
  switch (os.arch()) {
    case "x64":
      arch = SupportedDistArch.x64;
      break;
    default:
      logger.error(`System arch "${os.arch()}" not supported. Must build from source.`);
      return false;
  }

  let platform: SupportedDistPlatform;
  switch (os.platform()) {
    case "win32":
    case "cygwin":
      platform = SupportedDistPlatform.WINDOWS;
      break;
    case "darwin":
      platform = SupportedDistPlatform.MACOS;
      break;
    case "linux":
      if (detectLibc().isNonGlibcLinux) {
        platform = SupportedDistPlatform.LINUX_MUSL;
      } else {
        platform = SupportedDistPlatform.LINUX;
      }
      break;
    default:
      logger.error(`System platform "${os.platform()}" not supported. Must build from source.`);
      return false;
  }

  const downloadUrl = DIST_DOWNLOAD_URL_TEMPLATE.replace("{tag}", versionTag)
    .replace("{platform}", platform)
    .replace("{arch}", arch);
  return downloadUrl;
}

/**
 * Returns true if install was successful.
 * @param opts
 */
export async function fetchDistributable(opts: {
  logger: ILogger;
  overwriteExisting: boolean;
  outputFilePath: string;
  versionTag: string;
}): Promise<boolean> {
  const downloadUrl = getDownloadUrl(opts.logger, opts.versionTag);
  if (!downloadUrl) {
    return false;
  }

  opts.logger.log(`Fetching ${downloadUrl}`);
  const httpResponse = await fetch(downloadUrl, { redirect: "follow" });
  if (!httpResponse.ok) {
    opts.logger.error(`Bad http response ${httpResponse.status} ${httpResponse.statusText}`);
    return false;
  }

  const tempExtractDir = makeUniqueTempDir();
  opts.logger.log(`Extracting to temp dir ${tempExtractDir}`);

  const tarStream = tar.extract({ cwd: tempExtractDir });
  await pipelineAsync(httpResponse.body, tarStream);

  const binFileName = getExecutableFileName("clarity-cli");
  const tempBinFilePath = path.join(tempExtractDir, binFileName);

  opts.logger.log(`Moving ${tempBinFilePath} to ${opts.outputFilePath}`);
  fs.renameSync(tempBinFilePath, opts.outputFilePath);
  fs.rmdirSync(tempExtractDir);

  return true;
}
