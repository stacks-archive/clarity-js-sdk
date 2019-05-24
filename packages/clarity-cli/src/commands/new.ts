import { Command, flags } from "@oclif/command";

export default class New extends Command {
  static description = "Generate new project";

  static examples = [`$ clarity new <PROJECT_NAME>`];

  static flags = {
    help: flags.help({ char: "h" })
  };

  static args = [{ name: "project" }];

  async run() {
    const { args, flags } = this.parse(New);
  }
}
