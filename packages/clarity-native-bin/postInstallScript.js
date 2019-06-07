try {
  require("./lib/directInstall");
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.warn("Typescript lib has not been compiled. Attempting install with \"npx ts-node\".");
    tsNodeInstall();
  } else {
    throw e;
  }
}

function tsNodeInstall() {
  const childProcess = require("child_process");
  const path = require("path");
  const result = childProcess.execFileSync("npx", ["ts-node", path.join(__dirname, "src", "directInstall.ts")]);
  console.log(result.toString());
}
