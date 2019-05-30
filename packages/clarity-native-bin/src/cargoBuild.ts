import * as fs from "fs-extra";
import { executeCommand } from "./execUtil";

async function checkCargoStatus(logger: CmdLogger): Promise<boolean> {
  const result = await executeCommand("cargo", ["--version"]);
  if (result.exitCode === 0 && result.stdout.startsWith("cargo ")) {
    return true;
  }
  if (result.stdout) {
    logger.error(result.stdout);
  }
  if (result.stderr) {
    logger.error(result.stderr);
  }
  logger.error("Rust's cargo is required and does not appear to be installed.");
  logger.error("Install cargo with rustup: https://rustup.rs/");
  return false;
}

export async function cargoInstall(
  logger: CmdLogger,
  opts: {
    from_source: boolean;
    overwrite: boolean;
  }
): Promise<boolean> {
  if (!(await checkCargoStatus(logger))) {
    return false;
  }

  const clarityBinPath = getClarityBinFilePath();
  if (!opts.overwrite && fs.existsSync(clarityBinPath)) {
    logger.error(`Clarity bin already exists at "${clarityBinPath}".`);
    logger.error("Use the 'overwrite' argument to rebuild and overwrite.");
    return false;
  }

  const thisPackageDir = getPackageDir();
  if (!checkDirWritePermissions(logger, thisPackageDir)) {
    return false;
  }

  const binDir = getClarityBinDir();
  if (!fs.existsSync(binDir)) {
    fs.mkdirpSync(binDir);
  }

  const args = [
    "install",
    "--git",
    CORE_SRC_GIT_REPO,
    "--tag",
    CORE_SRC_GIT_SDK_TAG,
    "--bin=clarity-cli",
    "--root",
    binDir
  ];
  if (opts.overwrite) {
    args.push("--force");
  }
  logger.log(`Running: cargo ${args.join(" ")}`);
  const result = await executeCommand("cargo", args, {
    cwd: binDir,
    monitorStdoutCallback: stdoutData => {
      process.stdout.write(stdoutData);
    },
    monitorStderrCallback: stderrData => {
      process.stderr.write(stderrData);
    }
  });

  if (result.exitCode !== 0) {
    logger.error(`Cargo build failed: ${result.stderr}, ${result.stdout}`);
    return false;
  }
  return true;
}
