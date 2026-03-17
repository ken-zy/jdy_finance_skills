import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getCached, putCache, cleanOldCaches } from "../src/cache";

const TEST_CACHE_DIR = path.join(os.tmpdir(), "chrome-cdp-test-cache");

const originalEnv = process.env.INDIE_FINANCE_CACHE_DIR;

beforeEach(() => {
  process.env.INDIE_FINANCE_CACHE_DIR = TEST_CACHE_DIR;
  fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
});

afterEach(() => {
  fs.rmSync(TEST_CACHE_DIR, { recursive: true, force: true });
  if (originalEnv) {
    process.env.INDIE_FINANCE_CACHE_DIR = originalEnv;
  } else {
    delete process.env.INDIE_FINANCE_CACHE_DIR;
  }
});

describe("cache", () => {
  test("getCached returns null for uncached URL", () => {
    const result = getCached("https://example.com/page");
    expect(result).toBeNull();
  });

  test("putCache stores and getCached retrieves", () => {
    const url = "https://finance.yahoo.com/quote/AAPL/financials";
    const markdown = "# AAPL Financials\n\nRevenue: $100B";
    putCache(url, markdown);
    const result = getCached(url);
    expect(result).toBe(markdown);
  });

  test("cache key uses SHA-256 hash of URL", () => {
    const url = "https://example.com/page?query=1&foo=bar";
    putCache(url, "content");
    const today = new Date().toISOString().slice(0, 10);
    const dateDir = path.join(TEST_CACHE_DIR, today);
    const files = fs.readdirSync(dateDir);
    expect(files.some((f) => f.endsWith(".md"))).toBe(true);
    expect(files.some((f) => f.endsWith(".meta"))).toBe(true);
  });

  test("meta file contains original URL", () => {
    const url = "https://finance.yahoo.com/quote/AAPL";
    putCache(url, "content");
    const today = new Date().toISOString().slice(0, 10);
    const dateDir = path.join(TEST_CACHE_DIR, today);
    const metaFile = fs.readdirSync(dateDir).find((f) => f.endsWith(".meta"))!;
    const meta = fs.readFileSync(path.join(dateDir, metaFile), "utf-8");
    expect(meta).toContain(url);
  });

  test("cleanOldCaches removes directories older than 7 days", () => {
    const oldDate = "2020-01-01";
    const recentDate = new Date().toISOString().slice(0, 10);
    fs.mkdirSync(path.join(TEST_CACHE_DIR, oldDate), { recursive: true });
    fs.writeFileSync(path.join(TEST_CACHE_DIR, oldDate, "test.md"), "old");
    fs.mkdirSync(path.join(TEST_CACHE_DIR, recentDate), { recursive: true });
    fs.writeFileSync(path.join(TEST_CACHE_DIR, recentDate, "test.md"), "recent");
    cleanOldCaches();
    expect(fs.existsSync(path.join(TEST_CACHE_DIR, oldDate))).toBe(false);
    expect(fs.existsSync(path.join(TEST_CACHE_DIR, recentDate))).toBe(true);
  });
});
