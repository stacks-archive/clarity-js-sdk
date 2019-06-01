import "mocha";
import { detectLibc } from "../src/detectLibc";

describe("detect libc", () => {
  it("detect libc does not throw", () => {
    detectLibc();
  });
});
