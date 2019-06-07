import * as clarityNativeBin from "@blockstack/clarity-native-bin";
import { Command, flags } from "@oclif/command";

export default class Setup extends Command {
  static description = "Install blockstack-core and its dependencies";

  static examples = [`$ clarity setup`];

  static flags = {
    from_source: flags.boolean({
      description: "Compile binary from Rust source instead of downloading distributable.",
      default: false
    }),
    overwrite: flags.boolean({
      description: "Overwrites an existing installed clarity-cli bin file.",
      default: false
    })
  };

  static args: any[] = [];

  async run() {
    const { args, flags } = this.parse(Setup);

    const installPath = clarityNativeBin.getDefaultBinaryFilePath({ checkExists: false });
    const versionTag = clarityNativeBin.CORE_SDK_TAG;
    const success = await clarityNativeBin.install({
      fromSource: flags.from_source,
      logger: this,
      overwriteExisting: flags.overwrite,
      outputFilePath: installPath,
      versionTag: versionTag
    });

    if (!success) {
      this.exit(1);
    } else {
      this.log("Installed native clarity-cli binary successful.");
    }
  }
}
