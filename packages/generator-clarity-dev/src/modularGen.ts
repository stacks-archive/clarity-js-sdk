import path = require("path");
import YeoEnv = require("yeoman-environment");
import Generator = require("yeoman-generator");

export function createAppGen({
  args,
  options
}: {
  args?: string | string[];
  options?: {
    [key: string]: any;
  };
} = {}) {
  const appPath = path.join(__dirname, "../generators/app");
  const generatorName = "clarity:dev";
  const env = YeoEnv.createEnv();
  env.register(appPath, generatorName);

  const genOpts = { arguments: args, options: options };
  const instance = (env.create(generatorName, genOpts) as unknown) as Generator;

  const runFn = () => {
    return Promise.resolve(instance.run()) as Promise<unknown>;
  };

  return { run: runFn, env: env, generator: instance };
}
