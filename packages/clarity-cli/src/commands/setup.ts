import { Command, flags } from "@oclif/command";
import { promisify } from "util";
import { SpawnOptions, spawn } from "child_process";
import { pipeline, Writable, WritableOptions, Readable } from "stream";

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

  const readStdout = readStream(proc.stdout, true);
  const readStderr = readStream(proc.stderr, true);

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

  const [stdoutData, stderrData] = await Promise.all([
    readStdout,
    readStderr,
    writeStdin
  ]);

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
  _write(
    chunk: any,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
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
  ignoreErrors = false
): Promise<Buffer> {
  const memStream = new MemoryStream();
  if (ignoreErrors) {
    try {
      await pipelineAsync(stream, memStream);
    } catch (error) {
      console.debug(`readStream error: ${error}`);
    }
  } else {
    await pipelineAsync(stream, memStream);
  }
  return memStream.getData();
}

async function installNode() {
  var args = [
    "clone",
    "--single-branch",
    "--branch=develop",
    "https://github.com/blockstack/blockstack-core.git"
  ];
  var result = await executeCommand("git", args, {
    cwd: "/tmp"
  });

  args = ["install", "--force", "--bin=blockstack-core"];
  result = await executeCommand("cargo", args, {
    cwd: "/tmp/blockstack-core"
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
}
