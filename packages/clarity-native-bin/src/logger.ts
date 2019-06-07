export interface ILogger {
  error(input: string | Error): void;
  log(message?: string): void;
}
