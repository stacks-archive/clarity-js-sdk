import fs from "fs-extra";
import { CheckResult, Receipt } from "../../core";
import { Provider } from "../../core/provider";
import { getContractFilePath } from "../../utils/contractSourceDir";
import { getTempFilePath } from "../../utils/fsUtil";
import { executeCommand } from "../../utils/processUtil";

// TODO: This should be moved to a shared file.
export class ExecutionError extends Error {
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
  }
}

export class NativeClarityBinProvider implements Provider {
  /**
   * Instantiates a new executor. Before returning, ensures db is ready with `initialize`.
   * @param dbFilePath File path to the db. If not specified then a temporary file is created
   *                   and gets deleted when `close` is invoked.
   */
  static async create(
    dbFilePath: string,
    clarityBinPath: string
  ): Promise<NativeClarityBinProvider> {
    const executor = new NativeClarityBinProvider(dbFilePath, clarityBinPath);
    await executor.initialize();
    return executor;
  }

  /**
   * Instantiates a new executor pointed at a new temporary database file.
   * The temp file is deleted when `close` is invoked.
   * Before returning, ensures db is ready with `initialize`.
   */
  static async createEphemeral(clarityBinPath: string): Promise<Provider> {
    const tempDbPath = getTempFilePath("blockstack-local-{uniqueID}.db");
    const instance = await this.create(tempDbPath, clarityBinPath);
    instance.closeActions.push(() => {
      try {
        fs.unlinkSync(instance.dbFilePath);
      } catch (error) {
        // console.error(error);
      }
    });
    return instance;
  }

  public readonly dbFilePath: string;
  readonly clarityBinPath: string;
  private closeActions: ((() => Promise<any>) | (() => any))[] = [];

  constructor(dbFilePath: string, clarityBinPath: string) {
    this.dbFilePath = dbFilePath;
    this.clarityBinPath = clarityBinPath;
  }

  /**
   * Run command against a local Blockstack node VM.
   * Uses `clarity-cli` with the configured native bin path.
   * @param args clarity-cli commands.
   */
  async runCommand(args: string[], opts?: { stdin: string }) {
    const result = await executeCommand(this.clarityBinPath, [...args], {
      stdin: opts && opts.stdin
    });

    // Normalize first EOL, and trim the trailing EOL.
    result.stdout = result.stdout.replace(/\r\n|\r|\n/, "\n").replace(/\r\n|\r|\n$/, "");

    // Normalize all stderr EOLs, trim the trailing EOL.
    result.stderr = result.stderr.replace(/\r\n|\r|\n/g, "\n").replace(/\r\n|\r|\n$/, "");

    return result;
  }

  async initialize(): Promise<void> {
    const result = await this.runCommand(["initialize", this.dbFilePath]);
    if (result.exitCode !== 0) {
      throw new ExecutionError(
        `Initialize failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Database created.") {
      throw new ExecutionError(
        `Initialize failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
  }

  async checkContract(contractFilePath: string): Promise<CheckResult> {
    const filePath = getContractFilePath(contractFilePath);
    const result = await this.runCommand(["check", filePath, this.dbFilePath, "--output_analysis"]);
    if (result.exitCode !== 0) {
      return {
        success: false,
        error: result.stderr
      };
    } else {
      const contractInterface = JSON.parse(result.stdout);
      return {
        success: true,
        result: contractInterface
      };
    }
  }

  async launchContract(contractName: string, contractFilePath: string): Promise<Receipt> {
    const filePath = getContractFilePath(contractFilePath);

    const result = await this.runCommand(["launch", contractName, filePath, this.dbFilePath]);
    if (result.exitCode !== 0) {
      throw new ExecutionError(
        `Launch contract failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Contract initialized!") {
      throw new ExecutionError(
        `Launch contract failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    return {
      success: true,
      debugOutput: result.stderr
    };
  }

  async execute(
    contractName: string,
    functionName: string,
    senderAddress: string,
    ...args: string[]
  ): Promise<Receipt> {
    const result = await this.runCommand([
      "execute",
      this.dbFilePath,
      contractName,
      functionName,
      senderAddress,
      ...args
    ]);
    if (result.exitCode !== 0) {
      throw new ExecutionError(
        `Execute expression on contract failed with bad exit code ${result.exitCode}: ${
          result.stderr
        }`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    const executed = result.stdout.startsWith("Transaction executed and committed.");
    const didReturnErr = result.stdout.includes(" Returned: (err");
    if (!executed || didReturnErr) {
      throw new ExecutionError(
        `Execute expression on contract failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    return {
      success: true,
      result: result.stdout,
      debugOutput: result.stderr
    };
  }

  async evalRaw(evalStatement: string): Promise<Receipt> {
    const result = await this.runCommand(["eval_raw", this.dbFilePath], {
      stdin: evalStatement
    });
    if (result.exitCode !== 0) {
      throw new ExecutionError(
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
      throw new ExecutionError(
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
      result: outputResult,
      debugOutput: result.stderr
    };
  }

  async eval(
    contractName: string,
    evalStatement: string,
    includeDebugOutput?: boolean,
    atChaintip: boolean = true,
  ): Promise<Receipt> {
    const result = await this.runCommand([
      `eval${atChaintip ? "_at_chaintip" : ""}`,
      contractName, this.dbFilePath],
      {
        stdin: evalStatement
      }
    );
    if (result.exitCode !== 0) {
      throw new ExecutionError(
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
      throw new ExecutionError(
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
        result: outputResult,
        debugOutput: result.stderr
      };
    } else {
      return {
        success: true,
        result: outputResult
      };
    }
  }

  async mineBlock(time?: number | bigint): Promise<void> {
    const args = ["mine_block"];
    const timeArg = time || Math.round(Date.now() / 1000);
    args.push(timeArg.toString());
    args.push(this.dbFilePath);
    const result = await this.runCommand(args);

    if (result.exitCode !== 0) {
      throw new ExecutionError(
        `Mine block failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Simulated block mine!") {
      throw new ExecutionError(
        `Mine block failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
  }

  async mineBlocks(count: number | bigint): Promise<void> {
    const result = await this.runCommand([
      "mine_blocks",
      `--data=${this.dbFilePath}`,
      `--count=${count.toString()}`
    ]);

    if (result.exitCode !== 0) {
      throw new ExecutionError(
        `Mine blocks failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    if (result.stdout !== "Simulated block mine!") {
      throw new ExecutionError(
        `Mine blocks failed with bad output: ${result.stdout}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
  }

  async getBlockHeight(): Promise<bigint> {
    const result = await this.runCommand(["get_block_height", this.dbFilePath]);

    if (result.exitCode !== 0) {
      throw new ExecutionError(
        `Get block height failed with bad exit code ${result.exitCode}: ${result.stderr}`,
        result.exitCode,
        result.stdout,
        result.stderr
      );
    }
    // Check and trim success prefix line.
    const successPrefix = result.stdout.match(/(Simulated block height: (\r\n|\r|\n))/);
    if (!successPrefix || successPrefix.length < 1) {
      throw new ExecutionError(
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
      await Promise.resolve(closeAction());
    }
  }
}
