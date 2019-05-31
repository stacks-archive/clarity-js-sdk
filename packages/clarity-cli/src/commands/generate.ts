import { Command, flags } from "@oclif/command";
import { CargoBuildProvider } from "../../../clarity/lib/providers";
import fs from "fs-extra";
import { Contract } from "../../../clarity/src/core";

export default class Generate extends Command {
  static description = "generate helpers";

  static examples = [`$ clarity generate`];

  static flags = {
    help: flags.help({ char: "h" }),
    in: flags.string({
      description: "specify contracts path",
      char: "i",
      required: true
    }),
    out: flags.string({
      description: "specify dir for generated files",
      char: "o",
      default: "./contracts/",
      required: false
    }),
    // recursive: flags.boolean({
    //   description: "traverse input folder and generate files recursively",
    //   char: "r",
    //   default: false,
    //   required: false
    // }),
    force: flags.boolean({
      description: "override existing generated files",
      char: "f",
      default: false,
      required: false
    })
  };

  static args = [{ name: "abi" }];

  async run() {
    const { args, flags } = this.parse(Generate);
    console.log("");

    const provider = await CargoBuildProvider.createEphemeral();

    const contract = new Contract("", { filePath: flags.in, provider: provider });
    const res = await contract.check();

    console.log(res.SCI.public_function_types["transfer"]["Fixed"]);

    console.log(res);
  }
}
