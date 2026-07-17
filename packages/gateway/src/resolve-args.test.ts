import { describe, expect, it } from "vitest";
import { shouldResolveDownstreamArg } from "./resolve-args.js";

describe("shouldResolveDownstreamArg", () => {
  it("does not rewrite npm scoped packages or flags", () => {
    expect(shouldResolveDownstreamArg("@modelcontextprotocol/server-filesystem")).toBe(
      false,
    );
    expect(shouldResolveDownstreamArg("-y")).toBe(false);
    expect(shouldResolveDownstreamArg("--yes")).toBe(false);
  });

  it("does not rewrite absolute workspace roots", () => {
    expect(shouldResolveDownstreamArg("/tmp/workspace")).toBe(false);
  });

  it("rewrites relative demo server paths", () => {
    expect(shouldResolveDownstreamArg("./packages/demo-servers/dist/fs.js")).toBe(
      true,
    );
    expect(shouldResolveDownstreamArg("packages/demo-servers/dist/fs.js")).toBe(
      true,
    );
  });
});
