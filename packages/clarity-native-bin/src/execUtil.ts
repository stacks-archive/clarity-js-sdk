import { spawn, SpawnOptions } from "child_process";
import { promisify } from "util";
import { pipeline, Readable, Transform, Writable, WritableOptions } from "stream";

const pipelineAsync = promisify(pipeline);

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

export async function executeCommand(
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
