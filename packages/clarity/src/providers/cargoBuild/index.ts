import { Provider } from "../../core/provider";
import path from "path";
import fs from "fs";
import os from "os";
import { promisify } from "util";
import { SpawnOptions, spawn } from "child_process";
import { pipeline, Writable, WritableOptions, Readable } from "stream";
import { Receipt } from "../../core";

const CONTRACT_FILE_EXT = ".scm";

const pipelineAsync = promisify(pipeline);

export class MemoryStream extends Writable {
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

export async function readStream(stream: Readable, ignoreErrors = false): Promise<Buffer> {
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

  const [stdoutData, stderrData] = await Promise.all([readStdout, readStderr, writeStdin]);

  const stdoutStr = stdoutData.toString("utf8");
  const stderrStr = stderrData.toString("utf8");

  return {
    stdout: stdoutStr,
    stderr: stderrStr,
    exitCode: exitCode
  };
}

function fileExists(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

export function getContractFilePath(contractFile: string): string {
  function* getLocations(file: string): IterableIterator<string> {
    yield path.resolve(file);
    yield path.resolve("contracts", file);
    yield path.resolve(__dirname, "contracts", file);
    yield path.resolve(__dirname, file);
    if (!file.endsWith(CONTRACT_FILE_EXT)) {
      for (const f of getLocations(file + CONTRACT_FILE_EXT)) {
        yield f;
      }
    }
  }

  // Normalize OS path separators.
  if (path.sep == path.posix.sep && contractFile.includes(path.win32.sep)) {
    contractFile = contractFile.replace(/\\/g, path.sep);
  } else if (path.sep == path.win32.sep && contractFile.includes(path.posix.sep)) {
    contractFile = contractFile.replace(/\//g, path.sep);
  }

  for (const filePath of getLocations(contractFile)) {
    if (fileExists(filePath)) {
      return filePath;
    }
  }

  throw new Error(`Could not find contract file: ${contractFile}`);
}

function getTempDbPath() {
  const uniqueID = `${(Date.now() / 1000) | 0}-${Math.random()
    .toString(36)
    .substr(2, 6)}`;
  const dbFile = `blockstack-local-${uniqueID}.db`;
  return path.join(os.tmpdir(), dbFile);
}

class LocalExecutionError extends Error {
  readonly code: number;
  readonly commandOutput: string;
  readonly errorOutput: string;
  constructor(message: string, code: number, commandOutput: string, errorOutput: string) {
    super(message);
    this.message = message;
    this.name = this.constructor.name;
    this.code = code;
    this.commandOutput = commandOutput;
    this.errorOutput = errorOutput;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class CargoBuildProvider implements Provider {
  public readonly dbFilePath: string;
  readonly coreSrcDir: string;
  private closeActions: (() => Promise<any>)[] = [];

  static getCoreSrcDir() {
    const dir = require("os").homedir() + "/.cargo/bin/";
    return dir;
  }

  /**
   * Instantiates a new executor.
   * Before returning, ensures cargo is setup and working with `cargoBuild`,
   * and node is ready with `initialize`.
   */
  static async create(dbFilePath: string, coreSrcDir?: string): Promise<CargoBuildProvider> {
    const executor = new CargoBuildProvider(dbFilePath, coreSrcDir);
    await executor.initialize();
    return executor;
  }

  /**
   * Instantiates a new executor pointed at a new temporary database file.
   * The temp file is deleted when `close` is invoked.
   * Before returning, ensures cargo is setup and working with `cargoBuild`,
   * and node is ready with `initialize`.
   */
  static async createEphemeral(coreSrcDir?: string): Promise<Provider> {
    const instance = await this.create(getTempDbPath(), coreSrcDir);
    instance.closeActions.push(() => fs.promises.unlink(instance.dbFilePath));
    return instance;
  }

  constructor(dbFilePath: string, coreSrcDir = CargoBuildProvider.getCoreSrcDir()) {
    this.dbFilePath = dbFilePath;
    this.coreSrcDir = coreSrcDir;
  }

  /**
   * Run command against a local Blockstack node VM.
   * Uses `cargo run` with the configured rust src.
   * @param localArgs Local test node commands.
   */
  async cargoRunLocal(localArgs: string[], opts?: { stdin: string }) {
    const args = ["local", ...localArgs];
    const result = await executeCommand("blockstack-core", args, {
      cwd: this.coreSrcDir,
      stdin: opts && opts.stdin
    });

    // Normalize first EOL, and trim the trailing EOL.
    result.stdout = result.stdout.replace(/\r\n|\r|\n/, "\n").replace(/\r\n|\r|\n$/, "");

    // Normalize all stderr EOLs, trim the trailing EOL.
    result.stderr = result.stderr.replace(/\r\n|\r|\n/g, "\n").replace(/\r\n|\r|\n$/, "");

    return result;
  }

  async initialize(): Promise<void> {
    const result = await this.cargoRunLocal(["initialize", this.dbFilePath]);
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Initialize failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Database created.") {
      throw new LocalExecutionError(
        `Initialize failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
  }

  async checkContract(contractFilePath: string): Promise<Receipt> {
    const filePath = getContractFilePath(contractFilePath);
    const result = await this.cargoRunLocal([
      "check",
      filePath,
      this.dbFilePath,
      "--output_analysis"
    ]);
    if (result.exitCode !== 0) {
      return {
        success: false,
        error: result.stderr,
        data: {
          code: result.exitCode
        }
      };
    } else {
      const contractInterface = JSON.parse(result.stdout);
      return {
        success: true,
        data: {
          ...result,
          contractInterface: contractInterface
        }
      };
    }
  }

  async launchContract(contractName: string, contractFilePath: string): Promise<Receipt> {
    const filePath = getContractFilePath(contractFilePath);
    const result = await this.cargoRunLocal(["launch", contractName, filePath, this.dbFilePath]);
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Launch contract failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Contract initialized!") {
      throw new LocalExecutionError(
        `Launch contract failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    return {
      success: true
    };
  }

  async execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<Receipt> {
    const result = await this.cargoRunLocal([
      "execute",
      this.dbFilePath,
      contractName,
      functionName,
      senderAddress,
      ...args
    ]);
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Execute expression on contract failed with bad exit code ${result.exitCode}: ${
          result.stderr
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Transaction executed and committed.") {
      throw new LocalExecutionError(
        `Execute expression on contract failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    return {
      success: true,
      data: {
        debugOutput: result.stderr
      }
    };
  }

  async evalRaw(evalStatement: string): Promise<Receipt> {
    const result = await this.cargoRunLocal(["eval_raw", this.dbFilePath], {
      stdin: evalStatement
    });
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Eval raw expression failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Check and trim success prefix line.
    const successPrefix = result.stdout.match(
      /(Program executed successfully! Output: (\r\n|\r|\n))/
    );
    if (!successPrefix || successPrefix.length < 1) {
      throw new LocalExecutionError(
        `Eval raw expression failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Get the output string with the prefix message and last EOL trimmed.
    const outputResult = result.stdout.substr(successPrefix[0].length);
    return {
      success: true,
      data: { result: outputResult, debugOutput: result.stderr }
    };
  }

  eval(contractName: string, evalStatement: string): Promise<Receipt>;
  eval(contractName: string, evalStatement: string, includeDebugOutput: true): Promise<Receipt>;
  async eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput?: boolean
  ): Promise<Receipt> {
    const result = await this.cargoRunLocal(["eval", contractName, this.dbFilePath], {
      stdin: evalStatement
    });
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Eval expression on contract failed with bad exit code ${result.exitCode}: ${
          result.stderr
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Check and trim success prefix line.
    const successPrefix = result.stdout.match(
      /(Program executed successfully! Output: (\r\n|\r|\n))/
    );
    if (!successPrefix || successPrefix.length < 1) {
      throw new LocalExecutionError(
        `Eval expression on contract failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Get the output string with the prefix message and last EOL trimmed.
    const outputResult = result.stdout.substr(successPrefix[0].length);
    if (includeDebugOutput) {
      return {
        success: true,
        data: {
          result: outputResult,
          debugOutput: result.stderr
        }
      };
    } else {
      return {
        success: true,
        data: {
          result: outputResult
        }
      };
    }
  }

  async mineBlock(time?: number | bigint): Promise<void> {
    const args = ["mine_block"];
    const timeArg = time || Math.round(Date.now() / 1000);
    args.push(timeArg.toString());
    args.push(this.dbFilePath);
    const result = await this.cargoRunLocal(args);

    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Mine block failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Simulated block mine!") {
      throw new LocalExecutionError(
        `Mine block failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
  }

  async mineBlocks(count: number | bigint): Promise<void> {
    const result = await this.cargoRunLocal([
      "mine_blocks",
      `--data=${this.dbFilePath}`,
      `--count=${count.toString()}`
    ]);

    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Mine blocks failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Simulated block mine!") {
      throw new LocalExecutionError(
        `Mine blocks failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
  }

  async getBlockHeight(): Promise<bigint> {
    const result = await this.cargoRunLocal(["get_block_height", this.dbFilePath]);

    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Get block height failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Check and trim success prefix line.
    const successPrefix = result.stdout.match(/(Simulated block height: (\r\n|\r|\n))/);
    if (!successPrefix || successPrefix.length < 1) {
      throw new LocalExecutionError(
        `Get block height failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Get the output string with the prefix message and last EOL trimmed.
    const outputResult = result.stdout.substr(successPrefix[0].length);
    const heightInt = BigInt(outputResult);
    return heightInt;
  }

  async close(): Promise<void> {
    for (const closeAction of this.closeActions) {
      await closeAction();
    }
  }
}
