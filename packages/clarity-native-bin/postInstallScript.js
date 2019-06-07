try {
  const lib = require("./lib/index");
  lib.installDefaultPath().catch(error => {
      console.error(`Failed to install clarity-cli native binary: ${error}`);
      process.exit(1);
  }).then(installSuccessful => {
    if (!installSuccessful) {
      process.exit(1);
    } else {
      process.exit();
    }
  });
} catch (e) {
  if (e.code === 'MODULE_NOT_FOUND') {
    console.log("Typescript lib has not been compiled. Skipping post-installation of the native clarity-cli binary.")
  } else {
    throw e;
  }
}
