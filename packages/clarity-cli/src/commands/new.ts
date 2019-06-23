import { Command, flags } from "@oclif/command";
import * as AppGenerator from "generator-clarity-dev";
export default class New extends Command {
  static description = "Generate new project";

  static examples = [`$ clarity new <PROJECT_NAME>`];

  static flags = {
    help: flags.help({ char: "h" }),
    skip_install: flags.boolean({
      default: false,
      description: "Skip running `npm install` after project generation."
    })
  };

  static args = [{ name: "project", required: true }];

  async run() {
    const { args, flags } = this.parse(New);

    const createAppGenOpts = {
      "skip-install": flags.skip_install
    };

    const projName = args.project;
    const appGen = AppGenerator.createAppGen({ args: [projName], options: createAppGenOpts });
    await appGen.run();
  }
}
