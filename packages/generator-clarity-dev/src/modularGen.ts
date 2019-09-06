import path = require("path");
import YeoEnv = require("yeoman-environment");
import Generator = require("yeoman-generator");

export const GENERATOR_NAME = "clarity:dev";

export function createAppGen({
  args,
  options
}: {
  args?: string | string[];
  options?: {
    [key: string]: any;
    skipInstall?: boolean;
  };
} = {}) {
  const appPath = path.join(__dirname, "../generators/app");
  const env = YeoEnv.createEnv();
  env.register(appPath, GENERATOR_NAME);

  const createInstance = () => {
    const genOpts = { arguments: args, options: options };
    const instance = (env.create(GENERATOR_NAME, genOpts) as unknown) as Generator;
    return {
      generator: instance,
      run: () => Promise.resolve(instance.run()) as Promise<unknown>
    };
  };

  const runFn = () => {
    const runArgs = [GENERATOR_NAME];
    if (typeof args === "string") {
      runArgs.push(args);
    } else if (Array.isArray(args)) {
      runArgs.push(...args);
    }
    const runResult = env.run(runArgs, options as object, undefined!);
    return Promise.resolve(runResult) as Promise<unknown>;
  };

  return { run: runFn, env: env, createInstance: createInstance };
}
