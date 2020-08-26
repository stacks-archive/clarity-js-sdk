import * as fs from 'fs-extra';
import * as path from 'path';
import { executeCommand } from './execUtil';
import { getExecutableFileName, makeUniqueTempDir } from './fsUtil';
import { ILogger } from './logger';

const CORE_GIT_REPO = 'https://github.com/blockstack/blockstack-core.git';

async function checkCargoStatus(logger: ILogger): Promise<boolean> {
  const result = await executeCommand('cargo', ['--version']);
  if (result.exitCode === 0 && result.stdout.startsWith('cargo ')) {
    return true;
  }
  if (result.stdout) {
    logger.error(result.stdout);
  }
  if (result.stderr) {
    logger.error(result.stderr);
  }
  logger.error("Rust's cargo is required and does not appear to be installed.");
  logger.error('Install cargo with rustup: https://rustup.rs/');
  return false;
}

export async function cargoInstall(opts: {
  logger: ILogger;
  overwriteExisting: boolean;
  outputFilePath: string;
  gitBranch?: string;
  gitTag?: string;
  gitCommitHash?: string;
}): Promise<boolean> {
  if (!(await checkCargoStatus(opts.logger))) {
    return false;
  }

  const gitSpecifierOpts: string[] = [];
  if (opts.gitBranch) {
    gitSpecifierOpts.push('--branch', opts.gitBranch);
  }
  if (opts.gitTag) {
    gitSpecifierOpts.push('--tag', opts.gitTag);
  }
  if (opts.gitCommitHash) {
    gitSpecifierOpts.push('--rev', opts.gitCommitHash);
  }

  if (gitSpecifierOpts.length === 0) {
    throw new Error('Must provide a git branch, tag, or commit hash.');
  } else if (gitSpecifierOpts.length > 2) {
    throw new Error('Only one git branch, tag, or commit hash can be specified.');
  }

  const tempCompileDir = makeUniqueTempDir();
  opts.logger.log(`Compiling to temp dir ${tempCompileDir}`);

  const args = [
    'install',
    '--git',
    CORE_GIT_REPO,
    ...gitSpecifierOpts,
    '--bin=clarity-cli',
    '--root',
    tempCompileDir,
  ];
  if (opts.overwriteExisting) {
    args.push('--force');
  }

  opts.logger.log(`Running: cargo ${args.join(' ')}`);
  const result = await executeCommand('cargo', args, {
    cwd: tempCompileDir,
    monitorStdoutCallback: stdoutData => {
      opts.logger.log(stdoutData);
    },
    monitorStderrCallback: stderrData => {
      opts.logger.error(stderrData);
    },
  });

  if (result.exitCode !== 0) {
    opts.logger.error(`Cargo build failed with exit code ${result.exitCode}`);
    return false;
  }

  const binFileName = getExecutableFileName('clarity-cli');
  const tempCompileBinDir = path.join(tempCompileDir, 'bin');
  const tempBinFilePath = path.join(tempCompileBinDir, binFileName);

  opts.logger.log(`Moving ${tempBinFilePath} to ${opts.outputFilePath}`);
  fs.moveSync(tempBinFilePath, opts.outputFilePath);

  return true;
}
