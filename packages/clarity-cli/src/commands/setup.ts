import { Command, flags } from "@oclif/command";
import { spawn, SpawnOptions } from "child_process";
// @ts-ignore
import { isNonGlibcLinux } from "detect-libc";
import * as fs from "fs-extra";
import * as https from "https";
import fetch from "node-fetch";
import * as os from "os";
import * as path from "path";
import { pipeline, Readable, Transform, Writable, WritableOptions } from "stream";
import * as tar from "tar";
import { promisify } from "util";
import { getPackageDir } from "../index";

const CORE_SRC_GIT_SDK_TAG = "clarity-sdk-v0.0.2";

const DIST_DOWNLOAD_URL =
  "https://github.com/blockstack/smart-contract-sdk/releases/" +
  "download/{tag}/clarity-cli-{platform}-{arch}.tar.gz";

const CORE_SRC_GIT_REPO = "https://github.com/blockstack/blockstack-core.git";

export default class Setup extends Command {
  static description = "install blockstack-core and its dependencies";

  static examples = [`$ clarity setup`];

  static flags = {
    from_source: flags.boolean({
      description: "Compile binary from Rust source instead of downloading distributable.",
      default: false
    }),
    overwrite: flags.boolean({
      description: "Overwrites an existing installed clarity-cli bin file.",
      default: false
    })
  };

  static args: any[] = [];

  async run() {
    const { args, flags } = this.parse(Setup);

    let success: boolean;
    if (flags.from_source) {
      success = await cargoInstall(this, flags);
    } else {
      success = await fetchDistributable(this, flags);
    }

    if (!success) {
      this.exit(1);
    } else {
      this.log("Installed clarity-cli successful.");
    }
  }
}

interface CmdLogger {
  warn(input: string | Error): void;
  error(input: string | Error): void;
  log(message?: string, ...args: any[]): void;
}

async function executeCommand(
  command: string,
  args?: string[],
  opts?: ExecuteOptions
): Promise<ExecutionResult> {
  const spawnOpts: SpawnOptions = {};
  if (opts) {
    if (opts.cwd) {
      spawnOpts.cwd = opts.cwd;
    }
    if (opts.env) {
      spawnOpts.env = opts.env;
    }
  }
  const proc = spawn(command, args, spawnOpts);

  const readStdout = readStream(proc.stdout, true, opts && opts.monitorStdoutCallback);
  const readStderr = readStream(proc.stderr, true, opts && opts.monitorStderrCallback);

  let writeStdin: Promise<void> = Promise.resolve();
  if (opts && opts.stdin) {
    if (typeof opts.stdin === "string") {
      proc.stdin.end(opts.stdin, "utf8");
    } else {
      writeStdin = pipelineAsync(opts.stdin, proc.stdin).catch((error: any) => {
        console.error(`spawn stdin error: ${error}`);
      });
    }
  }

  proc.on("error", (error: any) => {
    console.error(`Unexpected process exec error: ${error}`);
  });

  const exitCode = await new Promise<number>(resolve => {
    proc.once("close", (code: number) => {
      resolve(code);
    });
  });

  const [stdoutData, stderrData] = await Promise.all([readStdout, readStderr, writeStdin]);

  const stdoutStr = stdoutData.toString("utf8");
  const stderrStr = stderrData.toString("utf8");

  return {
    stdout: stdoutStr,
    stderr: stderrStr,
    exitCode: exitCode
  };
}

const pipelineAsync = promisify(pipeline);

class MemoryStream extends Writable {
  buffers: Buffer[] = [];
  constructor(opts?: WritableOptions) {
    super(opts);
  }
  _write(chunk: any, encoding: string, callback: (error?: Error | null) => void): void {
    if (chunk instanceof Buffer) {
      this.buffers.push(chunk);
    } else {
      this.buffers.push(Buffer.from(chunk, encoding));
    }
    callback(null);
  }
  getData() {
    if (this.buffers.length === 1) {
      return this.buffers[0];
    }
    return Buffer.concat(this.buffers);
  }
}

async function readStream(
  stream: Readable,
  ignoreErrors = false,
  monitorCallback?: (data: Buffer) => void
): Promise<Buffer> {
  const memStream = new MemoryStream();
  async function startReadInternal() {
    const streamArr: (NodeJS.ReadableStream | NodeJS.WritableStream)[] = [stream];
    if (monitorCallback) {
      const monitorStream = new Transform({
        transform: (chunk, encoding, callback) => {
          monitorCallback(chunk instanceof Buffer ? chunk : Buffer.from(chunk, encoding));
          callback(undefined, chunk);
        }
      });
      streamArr.push(monitorStream);
    }
    streamArr.push(memStream);
    await pipelineAsync(streamArr);
  }
  if (ignoreErrors) {
    try {
      await startReadInternal();
    } catch (error) {
      console.log(`ignored readStream error: ${error}`);
    }
  } else {
    await startReadInternal();
  }
  return memStream.getData();
}

// TODO: Implement a "install from src" provider, and move these rust toolchain dependent
//       functions into that provider.

function getClarityBinDir() {
  const thisPackageDir = getPackageDir();
  const binDir = path.join(thisPackageDir, `.clarity-bin_${CORE_SRC_GIT_SDK_TAG}`);
  return binDir;
}

function getClarityBinFilePath() {
  return path.join(getClarityBinDir(), "bin", "clarity-cli");
}

async function fetchDistributable(
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

function checkDirWritePermissions(logger: CmdLogger, dir: string): boolean {
  try {
    fs.accessSync(dir, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    logger.error(err);
    logger.error(`Permission error: cannot write to directory "${dir}"`);
    logger.error("Try running with sudo or elevated permissions.");
    return false;
  }
  return true;
}

async function cargoInstall(
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

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecuteOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdin?: Readable | string;
  monitorStdoutCallback?: (data: Buffer) => void;
  monitorStderrCallback?: (data: Buffer) => void;
}
