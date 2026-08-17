import { describe, expect, it } from "vitest";
import { themeNames, tokens } from "./index";

describe("design tokens public contract", () => {
  it("exports the local light theme and semantic CSS variable references", () => {
    expect(themeNames).toEqual(["light"]);
    expect(tokens.color.actionPrimary).toBe("var(--ds-color-action-primary)");
    expect(tokens.space.md).toBe("var(--ds-space-md)");
    expect(tokens.motion.normal).toBe("var(--ds-motion-normal)");
  });
});
