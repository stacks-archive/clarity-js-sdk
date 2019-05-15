import path from 'path';
import fs from 'fs';
import os from 'os';
import { executeCommand } from './processUtil';
import './globalUtil';
import { ContractInterface } from './ContractTypes';

const CONTRACT_FILE_EXT = '.scm';

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
    yield path.resolve('contracts', file);
    yield path.resolve(__dirname, 'contracts', file);
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
  } else if (
    path.sep == path.win32.sep &&
    contractFile.includes(path.posix.sep)
  ) {
    contractFile = contractFile.replace(/\//g, path.sep);
  }

  for (const filePath of getLocations(contractFile)) {
    if (fileExists(filePath)) {
      return filePath;
    }
  }

  throw new Error(`Could not find contract file: ${contractFile}`);
}


export class LocalExecutionError extends Error {
  readonly code: number;
  readonly commandOutput: string;
  readonly errorOutput: string;
  constructor(
    message: string,
    code: number,
    commandOutput: string,
    errorOutput: string
  ) {
    super(message);
    this.message = message;
    this.name = this.constructor.name;
    this.code = code;
    this.commandOutput = commandOutput;
    this.errorOutput = errorOutput;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class LaunchedContract {
  readonly localNodeExecutor: LocalNodeExecutor;
  public readonly contractName: string;

  constructor(localNodeExecutor: LocalNodeExecutor, contractName: string) {
    this.localNodeExecutor = localNodeExecutor;
    this.contractName = contractName;
  }

  execute(
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<{ debugOutput: string }> {
    return this.localNodeExecutor.execute(
      this.contractName,
      functionName,
      senderAddress,
      ...args
    );
  }

  eval(evalStatement: string): Promise<string>;
  eval(
    evalStatement: string,
    includeDebugOutput: true
  ): Promise<{ result: string; debugOutput: string }>;
  eval(
    evalStatement: string,
    includeDebugOutput: boolean = false
  ): Promise<string | { result: string; debugOutput: string }> {
    return this.localNodeExecutor.eval(
      this.contractName,
      evalStatement,
      includeDebugOutput
    );
  }
}

export interface CheckContractResult {
  isValid: boolean;
  message: string;
  code: number;
  contractInterface?: ContractInterface;
}

export interface LocalNodeExecutor {
  initialize(): Promise<void>;
  checkContract(contractFilePath: string): Promise<CheckContractResult>;
  launchContract(
    contractName: string,
    contractFilePath: string
  ): Promise<LaunchedContract>;
  execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<{ debugOutput: string }>;
  eval(contractName: string, evalStatement: string): Promise<string>;
  eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput: true
  ): Promise<{ result: string; debugOutput: string }>;
  eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput?: boolean
  ): Promise<string | { result: string; debugOutput: string }>;
  evalRaw(
    evalStatement: string
  ): Promise<{ result: string; debugOutput: string }>;
  getBlockHeight(): Promise<bigint>;
  mineBlock(time?: number | bigint): Promise<void>;
  mineBlocks(count: number | bigint): Promise<void>;
  close(): Promise<void>;
}

export function getTempDbPath() {
  const uniqueID = `${(Date.now() / 1000) | 0}-${Math.random()
    .toString(36)
    .substr(2, 6)}`;
  const dbFile = `blockstack-local-${uniqueID}.db`;
  return path.join(os.tmpdir(), dbFile);
}

export class CargoLocalNodeExecutor implements LocalNodeExecutor {
  public readonly dbFilePath: string;
  readonly coreSrcDir: string;
  private closeActions: (() => Promise<any>)[] = [];

  static getCoreSrcDir() {
    const dir = path.resolve(path.dirname(__dirname), 'blockstack-core');
    return dir;
  }

  /**
   * Instantiates a new executor.
   * Before returning, ensures cargo is setup and working with `cargoBuild`,
   * and node is ready with `initialize`.
   */
  static async create(
    dbFilePath: string,
    coreSrcDir?: string
  ): Promise<CargoLocalNodeExecutor> {
    const executor = new CargoLocalNodeExecutor(dbFilePath, coreSrcDir);
    await executor.cargoBuild();
    await executor.initialize();
    return executor;
  }

  /**
   * Instantiates a new executor pointed at a new temporary database file.
   * The temp file is deleted when `close` is invoked.
   * Before returning, ensures cargo is setup and working with `cargoBuild`,
   * and node is ready with `initialize`.
   */
  static async createEphemeral(
    coreSrcDir?: string
  ): Promise<CargoLocalNodeExecutor> {
    const instance = await this.create(getTempDbPath(), coreSrcDir);
    instance.closeActions.push(() => fs.promises.unlink(instance.dbFilePath));
    return instance;
  }

  constructor(
    dbFilePath: string,
    coreSrcDir = CargoLocalNodeExecutor.getCoreSrcDir()
  ) {
    this.dbFilePath = dbFilePath;
    this.coreSrcDir = coreSrcDir;
  }

  /**
   * Use cargo to build the Blockstack node rust src.
   */
  async cargoBuild() {
    const args = [
      'build',
      '--bin=blockstack-core',
      '--package=blockstack-core'
    ];
    const result = await executeCommand('cargo', args, {
      cwd: this.coreSrcDir
    });
    if (result.exitCode !== 0) {
      throw new Error(`Cargo build failed: ${result.stderr}, ${result.stdout}`);
    }
  }

  /**
   * Run command against a local Blockstack node VM.
   * Uses `cargo run` with the configured rust src.
   * @param localArgs Local test node commands.
   */
  async cargoRunLocal(localArgs: string[], opts?: { stdin: string }) {
    const args = [
      'run',
      '--bin=blockstack-core',
      '--package=blockstack-core',
      '--quiet',
      '--',
      'local',
      ...localArgs
    ];
    const result = await executeCommand('cargo', args, {
      cwd: this.coreSrcDir,
      stdin: opts && opts.stdin
    });

    // Normalize first EOL, and trim the trailing EOL.
    result.stdout = result.stdout
      .replace(/\r\n|\r|\n/, '\n')
      .replace(/\r\n|\r|\n$/, '');

    // Normalize all stderr EOLs, trim the trailing EOL.
    result.stderr = result.stderr
      .replace(/\r\n|\r|\n/g, '\n')
      .replace(/\r\n|\r|\n$/, '');

    return result;
  }

  async initialize(): Promise<void> {
    const result = await this.cargoRunLocal(['initialize', this.dbFilePath]);
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Initialize failed with bad exit code ${result.exitCode}: ${
          result.stderr
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== 'Database created.') {
      throw new LocalExecutionError(
        `Initialize failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
  }

  async checkContract(contractFilePath: string): Promise<CheckContractResult> {
    const filePath = getContractFilePath(contractFilePath);
    const result = await this.cargoRunLocal([
      'check',
      filePath,
      this.dbFilePath,
      '--output_analysis'
    ]);
    if (result.exitCode !== 0) {
      return {
        isValid: false,
        message: result.stderr,
        code: result.exitCode
      };
    } else {
      const contractInterface = JSON.parse(result.stdout) as ContractInterface;
      return {
        isValid: true,
        message: result.stdout,
        code: result.exitCode,
        contractInterface: contractInterface
      };
    }
  }

  async launchContract(
    contractName: string,
    contractFilePath: string
  ): Promise<LaunchedContract> {
    const filePath = getContractFilePath(contractFilePath);
    const result = await this.cargoRunLocal([
      'launch',
      contractName,
      filePath,
      this.dbFilePath
    ]);
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Launch contract failed with bad exit code ${result.exitCode}: ${
          result.stderr
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== 'Contract initialized!') {
      throw new LocalExecutionError(
        `Launch contract failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    return new LaunchedContract(this, contractName);
  }

  async execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<{ debugOutput: string }> {
    const result = await this.cargoRunLocal([
      'execute',
      this.dbFilePath,
      contractName,
      functionName,
      senderAddress,
      ...args
    ]);
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Execute expression on contract failed with bad exit code ${
          result.exitCode
        }: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== 'Transaction executed and committed.') {
      throw new LocalExecutionError(
        `Execute expression on contract failed with bad output: ${
          result.stdout
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    return {
      debugOutput: result.stderr
    };
  }

  async evalRaw(
    evalStatement: string
  ): Promise<{ result: string; debugOutput: string }> {
    const result = await this.cargoRunLocal(['eval_raw', this.dbFilePath], {
      stdin: evalStatement
    });
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Eval raw expression failed with bad exit code ${result.exitCode}: ${
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
        `Eval raw expression failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Get the output string with the prefix message and last EOL trimmed.
    const outputResult = result.stdout.substr(successPrefix[0].length);
    return {
      result: outputResult,
      debugOutput: result.stderr
    };
  }

  eval(contractName: string, evalStatement: string): Promise<string>;
  eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput: true
  ): Promise<{ result: string; debugOutput: string }>;
  async eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput?: boolean
  ): Promise<string | { result: string; debugOutput: string }> {
    const result = await this.cargoRunLocal(
      ['eval', contractName, this.dbFilePath],
      {
        stdin: evalStatement
      }
    );
    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Eval expression on contract failed with bad exit code ${
          result.exitCode
        }: ${result.stderr}`,
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
        result: outputResult,
        debugOutput: result.stderr
      };
    } else {
      return outputResult;
    }
  }

  async mineBlock(time?: number | bigint): Promise<void> {
    const args = ['mine_block', `--data=${this.dbFilePath}`];
    if (time) {
      args.push(`--time=${time.toString()}`);
    }
    const result = await this.cargoRunLocal(args);

    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Mine block failed with bad exit code ${result.exitCode}: ${
          result.stderr
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== 'Simulated block mine!') {
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
      'mine_blocks',
      `--data=${this.dbFilePath}`,
      `--count=${count.toString()}`
    ]);

    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Mine blocks failed with bad exit code ${result.exitCode}: ${
          result.stderr
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== 'Simulated block mine!') {
      throw new LocalExecutionError(
        `Mine blocks failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
  }

  async getBlockHeight(): Promise<bigint> {
    const result = await this.cargoRunLocal([
      'get_block_height',
      this.dbFilePath
    ]);

    if (result.exitCode !== 0) {
      throw new LocalExecutionError(
        `Get block height failed with bad exit code ${result.exitCode}: ${
          result.stderr
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Check and trim success prefix line.
    const successPrefix = result.stdout.match(
      /(Simulated block height: (\r\n|\r|\n))/
    );
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
