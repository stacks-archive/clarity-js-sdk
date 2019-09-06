import { createAppGen } from "generator-clarity-dev";

const args = process.argv.slice(2);
const result = createAppGen({
  args: args,
  options: { skipInstall: false }
});

result.run().catch(error => {
  console.error(error);
});
