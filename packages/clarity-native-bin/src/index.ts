interface CmdLogger {
  warn(input: string | Error): void;
  error(input: string | Error): void;
  log(message?: string, ...args: any[]): void;
}
