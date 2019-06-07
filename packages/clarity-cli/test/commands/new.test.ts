import { expect, test } from "@oclif/test";

describe("new project", () => {
  test
    .stdout()
    .command(["new"])
    .it("runs new", ctx => {
      expect(ctx.stdout).to.contain("todo");
    });

  test
    .stdout()
    .command(["new", "example_proj"])
    .it("runs new example_proj", ctx => {
      expect(ctx.stdout).to.contain("todo example_proj");
    });
});
