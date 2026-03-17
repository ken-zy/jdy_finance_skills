import { describe, test, expect } from "bun:test";
import { createSession, fetchAsMarkdown, closeSession } from "../src/index";
import { findChrome } from "../src/chrome";

// Skip if Chrome not available
const hasChrome = findChrome() !== null;

describe.skipIf(!hasChrome)("integration", () => {
  test("fetches a page and returns Markdown", async () => {
    const session = await createSession();
    try {
      const markdown = await fetchAsMarkdown(session, "https://example.com");

      expect(markdown).toContain("Example Domain");
      expect(markdown.length).toBeGreaterThan(50);
    } finally {
      await closeSession(session);
    }
  }, 30_000);

  test("returns cached result on second fetch", async () => {
    const session = await createSession();
    try {
      const url = "https://example.com";
      const first = await fetchAsMarkdown(session, url);
      const second = await fetchAsMarkdown(session, url);

      expect(second).toBe(first);
    } finally {
      await closeSession(session);
    }
  }, 30_000);

  test("fetches multiple URLs in one session", async () => {
    const session = await createSession();
    try {
      const md1 = await fetchAsMarkdown(session, "https://example.com");
      const md2 = await fetchAsMarkdown(session, "https://httpbin.org/html");

      expect(md1).toContain("Example Domain");
      expect(md2.length).toBeGreaterThan(50);
    } finally {
      await closeSession(session);
    }
  }, 45_000);
});
