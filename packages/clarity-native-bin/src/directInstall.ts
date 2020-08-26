import { installDefaultPath } from '.';

// Warning: Importing this module will trigger an immediate installation attempt that will
// exit the process if failed. This script is only intended to be invoked from the
// postInstall script.

export default (async () => {
  try {
    const installSuccessful = await installDefaultPath();
    if (!installSuccessful) {
      process.exit(1);
    } else {
      process.exit();
    }
  } catch (error) {
    console.error(`Failed to install clarity-cli native binary: ${error}`);
    process.exit(1);
  }
})();
