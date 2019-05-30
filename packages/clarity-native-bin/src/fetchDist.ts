import * as os from "os";
// @ts-ignore
import { isNonGlibcLinux } from "detect-libc";
import * as path from "path";
import * as fs from "fs-extra";
import fetch from "node-fetch";
import * as tar from "tar";
import { promisify } from "util";
import { pipeline } from "stream";

const pipelineAsync = promisify(pipeline);

export async function fetchDistributable(
  logger: CmdLogger,
  opts: {
    overwrite: boolean;
  }
): Promise<boolean> {
  let arch: string;
  switch (os.arch()) {
    case "x64":
      arch = "x64";
      break;
    default:
      logger.error(`System arch "${os.arch()}" not supported. Must build from source.`);
      return false;
  }

  let platform: string;
  switch (os.platform()) {
    case "win32":
    case "cygwin":
      platform = "win";
      break;
    case "darwin":
      platform = "mac";
      break;
    case "linux":
      if (isNonGlibcLinux) {
        platform = "linux-musl";
      } else {
        platform = "linux";
      }
      break;
    default:
      logger.error(`System platform "${os.platform()}" not supported. Must build from source.`);
      return false;
  }

  const clarityBinPath = getClarityBinFilePath();
  if (fs.existsSync(clarityBinPath)) {
    if (!opts.overwrite) {
      logger.error(`Clarity bin already exists at "${clarityBinPath}".`);
      logger.error("Use the 'overwrite' argument to rebuild and overwrite.");
      return false;
    }
    fs.unlinkSync(clarityBinPath);
  }

  const downloadUrl = DIST_DOWNLOAD_URL.replace("{tag}", CORE_SRC_GIT_SDK_TAG)
    .replace("{platform}", platform)
    .replace("{arch}", arch);

  logger.log(`Fetching ${downloadUrl}`);
  const httpResponse = await fetch(downloadUrl, { redirect: "follow" });
  if (!httpResponse.ok) {
    logger.error(`Bad http response ${httpResponse.status} ${httpResponse.statusText}`);
    return false;
  }

  const extractDir = path.join(getClarityBinDir(), "bin");
  logger.log(`Extracting to ${extractDir}`);
  fs.mkdirpSync(extractDir);
  const tarStream = tar.extract({ cwd: extractDir });
  await pipelineAsync(httpResponse.body, tarStream);

  return true;
}
