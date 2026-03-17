import { describe, test, expect } from "bun:test";
import { findChrome, findChromeExecutable } from "../src/chrome";

describe("findChrome", () => {
  test("finds Chrome executable on this system", () => {
    const chromePath = findChrome();
    if (process.platform === "darwin") {
      expect(chromePath).not.toBeNull();
      expect(chromePath).toContain("Chrome");
    }
  });

  test("returns undefined when no Chrome found at given paths", () => {
    const result = findChromeExecutable({
      candidates: { default: ["/nonexistent/chrome"] },
    });
    expect(result).toBeUndefined();
  });
});
