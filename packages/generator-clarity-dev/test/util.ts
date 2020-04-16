const baseFiles = [
  ".gitignore",
  "package.json",
  "tsconfig.json",
  "test/mocha.opts",
  ".vscode/extensions.json",
  ".vscode/launch.json"
];

export const EXPECTED_OUTPUT_FILES = [
  ...baseFiles,
  "contracts/hello-world.clar",
  "test/hello-world.ts",
];

export const EXPECTED_COUNTER_FILES = [
  ...baseFiles,
  "contracts/counter.clar",
  "test/counter.ts",
];
