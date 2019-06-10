const fs = require("fs");
const path = require("path");

// Detect if running in dev environment.
const tsConfigBuildFile = path.join(__dirname, "tsconfig.build.json");
if (fs.existsSync(tsConfigBuildFile)) {
  tsNodeInstall();
} else {
  try {
    require("./lib/directInstall");
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      console.error("Script \"./lib/directInstall.js\" not found, and dev environment to run \"./src/directInstall.ts\" not detected.");
    }
    throw e;
  }
}

function tsNodeInstall() {

  function getTsNodePkg() {
    const tsNodePkgName = "ts-node";
    // Try using the ts-node package version typically specified in env vars by npm.
    const tsNodeDevDep = "npm_package_devDependencies_ts_node";
    if (process.env && process.env[tsNodeDevDep]) {
      return `${tsNodePkgName}@${process.env[tsNodeDevDep]}`;
    } else {
      // Otherwise, try loading the version from the package.json file.
      try {
        const tsNodePkgJsonVersion = require("./package.json")["devDependencies"]["ts-node"];
        return `${tsNodePkgName}@${tsNodePkgJsonVersion}`;
      } catch (err) {
        // ignore
      }
    }
    console.warn("Could not detect ts-node version to use, no version will be specified.");
    return tsNodePkgName;
  }

  const childProcess = require("child_process");
  const tsNodePkg = getTsNodePkg();
  const directInstallTsFile = path.join(__dirname, "src", "directInstall.ts");
  const tsNodeExecArgs = [tsNodePkg, "--project", tsConfigBuildFile, directInstallTsFile];
  console.log(`Running: npx ${tsNodeExecArgs.join(" ")}`);
  const result = childProcess.execFileSync("npx", tsNodeExecArgs);
  console.log(result.toString());
}
