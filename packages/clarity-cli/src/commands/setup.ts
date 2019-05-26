import { Command, flags } from "@oclif/command";
import { spawn, SpawnOptions } from "child_process";
import * as fs from "fs-extra";
import * as path from "path";
import { pipeline, Readable, Transform, Writable, WritableOptions } from "stream";
import { promisify } from "util";
import { getPackageDir } from "../index";

const CORE_SRC_GIT_REPO = "https://github.com/blockstack/blockstack-core.git";
const CORE_SRC_GIT_SDK_TAG = "clarity-sdk-v0.0.1";

export default class Setup extends Command {
  static description = "Install blockstack-core and its dependencies";

  static examples = [`$ clarity setup`];

  static flags = {};

  static args = [];

  async run() {
    const { args, flags } = this.parse(Setup);
    installNode();
  }
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
        console.debug(`spawn stdin error: ${error}`);
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

async function checkCargoStatus(): Promise<boolean> {
  const result = await executeCommand("cargo", ["--version"]);
  if (result.exitCode === 0 && result.stdout.startsWith("cargo ")) {
    return true;
  }
  if (result.stdout) {
    console.error(result.stdout);
  }
  if (result.stderr) {
    console.error(result.stderr);
  }
  console.error("Rust's cargo is required and does not appear to be installed.");
  console.error("Install cargo with rustup: https://rustup.rs/");
  return false;
}

async function installNode({ forceRebuild = false }: { forceRebuild?: boolean } = {}) {
  if (!(await checkCargoStatus())) {
    process.exit(1);
    return;
  }

  const thisPackageDir = getPackageDir();
  const binDir = path.join(thisPackageDir, `.clarity-bin-${CORE_SRC_GIT_SDK_TAG}`);

  try {
    fs.accessSync(thisPackageDir, fs.constants.R_OK | fs.constants.W_OK);
  } catch (err) {
    console.error(err);
    console.error(`Permission error: cannot write to directory "${binDir}"`);
    console.error("Try running with sudo or elevated permissions.");
  }

  if (!fs.existsSync(binDir)) {
    fs.mkdirpSync(binDir);
  }

  const args = [
    "install",
    "--git",
    CORE_SRC_GIT_REPO,
    "--tag",
    CORE_SRC_GIT_SDK_TAG,
    "--bin=clarity",
    "--root",
    binDir
  ];
  if (forceRebuild === true) {
    args.push("--force");
  }
  console.log(`Running: cargo ${args.join(" ")}`);
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
    throw new Error(`Cargo build failed: ${result.stderr}, ${result.stdout}`);
  }
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
