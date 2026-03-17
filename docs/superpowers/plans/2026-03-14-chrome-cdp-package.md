# Chrome CDP Package Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/chrome-cdp/` — a shared package that fetches any URL via headless Chrome and returns clean Markdown, with daily file-based caching.

**Architecture:** Fork and trim baoyu-chrome-cdp (~408 lines) into 4 focused modules under `src/` (chrome.ts, cdp.ts, markdown.ts, cache.ts) + a thin `index.ts` public API. The spec shows a 2-file flat structure (index.ts + cache.ts); this plan splits into 4 modules for better testability and separation of concerns — Chrome OS management, CDP protocol, content extraction, and caching are each independently understandable. CLI entry point via `bun packages/chrome-cdp/src/index.ts <url>`.

**Tech Stack:** Bun runtime, Chrome CDP (WebSocket), Defuddle + jsdom (HTML→Markdown), Node.js built-ins only for Chrome management.

**Spec:** `docs/superpowers/specs/2026-03-14-chrome-cdp-data-fetcher-design.md`

**Source reference:** `/Users/jdy/Documents/baoyu-skills/packages/baoyu-chrome-cdp/src/index.ts` (Chrome CDP core), `/Users/jdy/Documents/baoyu-skills/skills/baoyu-url-to-markdown/scripts/cdp.ts` (page fetching helpers)

**Scope:** This plan covers Phase 1 only — the `packages/chrome-cdp/` core package. SKILL.md modifications are Phase 2 (follow-up PR).

---

## File Structure

```
packages/chrome-cdp/
├── package.json          # bun project, deps: defuddle, jsdom
├── tsconfig.json         # TypeScript config
├── src/
│   ├── index.ts          # Public API: createSession, fetchAsMarkdown, closeSession + CLI
│   ├── chrome.ts         # Chrome lifecycle: find, launch, kill, CDP connection
│   ├── cdp.ts            # CdpConnection class + page helpers (navigate, wait, evaluate)
│   ├── markdown.ts       # HTML extraction + Defuddle conversion
│   └── cache.ts          # File-based daily cache
└── tests/
    ├── cache.test.ts     # Cache unit tests
    ├── chrome.test.ts    # Chrome binary detection tests
    └── integration.test.ts # End-to-end fetch test (requires Chrome)
```

**Design rationale:** Split the original monolithic `index.ts` into focused modules by responsibility. `chrome.ts` handles OS-level Chrome management, `cdp.ts` handles the WebSocket protocol, `markdown.ts` handles content extraction, `cache.ts` handles persistence. Each can be understood and tested independently.

---

## Chunk 1: Project Setup + Cache Module

### Task 1: Initialize package structure

**Files:**
- Create: `packages/chrome-cdp/package.json`
- Create: `packages/chrome-cdp/tsconfig.json`

- [ ] **Step 1: Create package directory**

```bash
mkdir -p packages/chrome-cdp/src packages/chrome-cdp/tests
```

- [ ] **Step 2: Create package.json**

Create `packages/chrome-cdp/package.json`:

```json
{
  "name": "chrome-cdp",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "bun test",
    "fetch": "bun src/index.ts"
  },
  "dependencies": {
    "defuddle": "^0.10.0",
    "jsdom": "^26.1.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

Note: Pin defuddle and jsdom versions after `bun install` to lock exact versions.

- [ ] **Step 3: Create tsconfig.json**

Create `packages/chrome-cdp/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["tests", "dist"]
}
```

- [ ] **Step 4: Install dependencies**

```bash
cd packages/chrome-cdp && bun install
```

Expected: `node_modules/` created, `bun.lock` generated.

- [ ] **Step 5: Commit**

```bash
git add packages/chrome-cdp/package.json packages/chrome-cdp/tsconfig.json packages/chrome-cdp/bun.lock
git commit -m "feat(chrome-cdp): init package with defuddle and jsdom deps"
```

---

### Task 2: Implement cache module

**Files:**
- Create: `packages/chrome-cdp/src/cache.ts`
- Create: `packages/chrome-cdp/tests/cache.test.ts`

- [ ] **Step 1: Write failing cache tests**

Create `packages/chrome-cdp/tests/cache.test.ts`:

```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getCached, putCache, cleanOldCaches } from "../src/cache";

const TEST_CACHE_DIR = path.join(os.tmpdir(), "chrome-cdp-test-cache");

// Override cache dir for tests
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

    // Check that a .md and .meta file exist in today's date dir
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
    // Create fake old date directories
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/chrome-cdp && bun test tests/cache.test.ts
```

Expected: FAIL — module `../src/cache` not found.

- [ ] **Step 3: Implement cache module**

Create `packages/chrome-cdp/src/cache.ts`:

```typescript
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CACHE_RETENTION_DAYS = 7;

function getCacheBaseDir(): string {
  const override = process.env.INDIE_FINANCE_CACHE_DIR?.trim();
  if (override) return override;
  return path.join(os.homedir(), ".indie-finance", "cache");
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function urlToHash(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function cachePath(url: string): { mdPath: string; metaPath: string; dir: string } {
  const dir = path.join(getCacheBaseDir(), todayString());
  const hash = urlToHash(url);
  return {
    dir,
    mdPath: path.join(dir, `${hash}.md`),
    metaPath: path.join(dir, `${hash}.meta`),
  };
}

export function getCached(url: string): string | null {
  const { mdPath } = cachePath(url);
  try {
    return fs.readFileSync(mdPath, "utf-8");
  } catch {
    return null;
  }
}

export function putCache(url: string, markdown: string): void {
  const { dir, mdPath, metaPath } = cachePath(url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(mdPath, markdown, "utf-8");
  fs.writeFileSync(metaPath, JSON.stringify({ url, fetchedAt: new Date().toISOString() }), "utf-8");
}

export function cleanOldCaches(): void {
  const baseDir = getCacheBaseDir();
  if (!fs.existsSync(baseDir)) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CACHE_RETENTION_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  for (const entry of fs.readdirSync(baseDir)) {
    // Only process date-formatted directories (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry)) continue;
    if (entry < cutoffStr) {
      fs.rmSync(path.join(baseDir, entry), { recursive: true, force: true });
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd packages/chrome-cdp && bun test tests/cache.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/chrome-cdp/src/cache.ts packages/chrome-cdp/tests/cache.test.ts
git commit -m "feat(chrome-cdp): add file-based daily cache with SHA-256 keys"
```

---

## Chunk 2: Chrome Lifecycle + CDP Connection

### Task 3: Implement Chrome binary management

**Files:**
- Create: `packages/chrome-cdp/src/chrome.ts`
- Create: `packages/chrome-cdp/tests/chrome.test.ts`

- [ ] **Step 1: Write failing Chrome detection test**

Create `packages/chrome-cdp/tests/chrome.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { findChrome, findChromeExecutable } from "../src/chrome";

describe("findChrome", () => {
  test("finds Chrome executable on this system", () => {
    const chromePath = findChrome();
    // On macOS dev machines Chrome should be installed
    // This test will be skipped in CI if Chrome is not available
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/chrome-cdp && bun test tests/chrome.test.ts
```

Expected: FAIL — module `../src/chrome` not found.

- [ ] **Step 3: Implement chrome.ts**

Create `packages/chrome-cdp/src/chrome.ts`. Fork from baoyu-chrome-cdp, trimmed:
- Remove: `resolveSharedChromeProfileDir` (replaced with indie-finance paths)
- Remove: WSL support
- Simplify: profile dir is always `~/.indie-finance/chrome-profile`

```typescript
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";

export type PlatformCandidates = {
  darwin?: string[];
  win32?: string[];
  default: string[];
};

const CHROME_CANDIDATES: PlatformCandidates = {
  darwin: [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ],
  win32: [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ],
  default: [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ],
};

export function findChromeExecutable(options: {
  candidates: PlatformCandidates;
  envNames?: string[];
}): string | undefined {
  for (const envName of options.envNames ?? []) {
    const override = process.env[envName]?.trim();
    if (override && fs.existsSync(override)) return override;
  }

  const candidates =
    process.platform === "darwin"
      ? options.candidates.darwin ?? options.candidates.default
      : process.platform === "win32"
        ? options.candidates.win32 ?? options.candidates.default
        : options.candidates.default;

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

export function findChrome(): string | null {
  return (
    findChromeExecutable({
      candidates: CHROME_CANDIDATES,
      envNames: ["CHROME_PATH"],
    }) ?? null
  );
}

export function getProfileDir(): string {
  return path.join(os.homedir(), ".indie-finance", "chrome-profile");
}

export async function getFreePort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("Unable to allocate a free TCP port.")));
        return;
      }
      const port = address.port;
      server.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
  });
}

export async function launchChrome(port: number): Promise<ChildProcess> {
  const chromePath = findChrome();
  if (!chromePath) {
    throw new Error(
      "Chrome not found. Install Google Chrome or set CHROME_PATH environment variable.",
    );
  }

  const profileDir = getProfileDir();
  await fs.promises.mkdir(profileDir, { recursive: true });

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-popup-blocking",
  ];

  return spawn(chromePath, args, { stdio: "ignore" });
}

export function killChrome(chrome: ChildProcess): void {
  try {
    chrome.kill("SIGTERM");
  } catch {}
  setTimeout(() => {
    if (!chrome.killed) {
      try {
        chrome.kill("SIGKILL");
      } catch {}
    }
  }, 2_000).unref?.();
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(url, { redirect: "follow", signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function waitForChromeReady(port: number, timeoutMs = 15_000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetchWithTimeout(`http://127.0.0.1:${port}/json/version`, 3_000);
      if (res.ok) {
        const version = (await res.json()) as { webSocketDebuggerUrl?: string };
        if (version.webSocketDebuggerUrl) return version.webSocketDebuggerUrl;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Chrome debug port ${port} not ready within ${timeoutMs}ms`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd packages/chrome-cdp && bun test tests/chrome.test.ts
```

Expected: PASS (at least findChrome test on macOS).

- [ ] **Step 5: Commit**

```bash
git add packages/chrome-cdp/src/chrome.ts packages/chrome-cdp/tests/chrome.test.ts
git commit -m "feat(chrome-cdp): add Chrome lifecycle management (find, launch, kill)"
```

---

### Task 4: Implement CDP connection and page helpers

**Files:**
- Create: `packages/chrome-cdp/src/cdp.ts`

- [ ] **Step 1: Implement CdpConnection class and page helpers**

Create `packages/chrome-cdp/src/cdp.ts`. Fork CdpConnection from baoyu-chrome-cdp + page helpers from baoyu-url-to-markdown/cdp.ts:

```typescript
type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
};

type CdpSendOptions = {
  sessionId?: string;
  timeoutMs?: number;
};

export class CdpConnection {
  private ws: WebSocket;
  private nextId = 0;
  private pending = new Map<number, PendingRequest>();
  private eventHandlers = new Map<string, Set<(params: unknown) => void>>();
  private defaultTimeoutMs: number;

  private constructor(ws: WebSocket, defaultTimeoutMs = 15_000) {
    this.ws = ws;
    this.defaultTimeoutMs = defaultTimeoutMs;

    this.ws.addEventListener("message", (event) => {
      try {
        const data =
          typeof event.data === "string"
            ? event.data
            : new TextDecoder().decode(event.data as ArrayBuffer);
        const msg = JSON.parse(data) as {
          id?: number;
          method?: string;
          params?: unknown;
          result?: unknown;
          error?: { message?: string };
        };

        if (msg.method) {
          const handlers = this.eventHandlers.get(msg.method);
          if (handlers) handlers.forEach((h) => h(msg.params));
        }

        if (msg.id) {
          const pending = this.pending.get(msg.id);
          if (pending) {
            this.pending.delete(msg.id);
            if (pending.timer) clearTimeout(pending.timer);
            if (msg.error?.message) pending.reject(new Error(msg.error.message));
            else pending.resolve(msg.result);
          }
        }
      } catch {}
    });

    this.ws.addEventListener("close", () => {
      for (const [id, pending] of this.pending.entries()) {
        this.pending.delete(id);
        if (pending.timer) clearTimeout(pending.timer);
        pending.reject(new Error("CDP connection closed."));
      }
    });
  }

  static async connect(url: string, timeoutMs = 15_000): Promise<CdpConnection> {
    const ws = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("CDP connection timeout.")), timeoutMs);
      ws.addEventListener("open", () => {
        clearTimeout(timer);
        resolve();
      });
      ws.addEventListener("error", () => {
        clearTimeout(timer);
        reject(new Error("CDP connection failed."));
      });
    });
    return new CdpConnection(ws);
  }

  on(method: string, handler: (params: unknown) => void): void {
    if (!this.eventHandlers.has(method)) this.eventHandlers.set(method, new Set());
    this.eventHandlers.get(method)!.add(handler);
  }

  off(method: string, handler: (params: unknown) => void): void {
    this.eventHandlers.get(method)?.delete(handler);
  }

  async send<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
    options?: CdpSendOptions,
  ): Promise<T> {
    const id = ++this.nextId;
    const message: Record<string, unknown> = { id, method };
    if (params) message.params = params;
    if (options?.sessionId) message.sessionId = options.sessionId;

    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const result = await new Promise<unknown>((resolve, reject) => {
      const timer =
        timeoutMs > 0
          ? setTimeout(() => {
              this.pending.delete(id);
              reject(new Error(`CDP timeout: ${method}`));
            }, timeoutMs)
          : null;
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify(message));
    });
    return result as T;
  }

  close(): void {
    try {
      this.ws.close();
    } catch {}
  }
}

// --- Page helpers ---

const NETWORK_IDLE_TIMEOUT_MS = 1_500;
const POST_LOAD_DELAY_MS = 800;

export async function createTargetAndAttach(
  cdp: CdpConnection,
  url: string,
): Promise<{ targetId: string; sessionId: string }> {
  const { targetId } = await cdp.send<{ targetId: string }>("Target.createTarget", { url });
  const { sessionId } = await cdp.send<{ sessionId: string }>("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  await cdp.send("Network.enable", {}, { sessionId });
  await cdp.send("Page.enable", {}, { sessionId });
  return { targetId, sessionId };
}

export async function evaluateScript<T>(
  cdp: CdpConnection,
  sessionId: string,
  expression: string,
  timeoutMs = 30_000,
): Promise<T> {
  const result = await cdp.send<{ result: { value?: T } }>(
    "Runtime.evaluate",
    { expression, returnByValue: true, awaitPromise: true },
    { sessionId, timeoutMs },
  );
  return result.result.value as T;
}

export async function waitForPageLoad(
  cdp: CdpConnection,
  sessionId: string,
  timeoutMs = 15_000,
): Promise<void> {
  void sessionId;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cdp.off("Page.loadEventFired", handler);
      resolve();
    }, timeoutMs);
    const handler = () => {
      clearTimeout(timer);
      cdp.off("Page.loadEventFired", handler);
      resolve();
    };
    cdp.on("Page.loadEventFired", handler);
  });
}

export async function waitForNetworkIdle(
  cdp: CdpConnection,
  sessionId: string,
  timeoutMs = NETWORK_IDLE_TIMEOUT_MS,
): Promise<void> {
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let pending = 0;
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      cdp.off("Network.requestWillBeSent", onRequest);
      cdp.off("Network.loadingFinished", onFinish);
      cdp.off("Network.loadingFailed", onFinish);
    };
    const done = () => {
      cleanup();
      resolve();
    };
    const resetTimer = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(done, timeoutMs);
    };
    const onRequest = () => {
      pending++;
      resetTimer();
    };
    const onFinish = () => {
      pending = Math.max(0, pending - 1);
      if (pending <= 2) resetTimer();
    };
    cdp.on("Network.requestWillBeSent", onRequest);
    cdp.on("Network.loadingFinished", onFinish);
    cdp.on("Network.loadingFailed", onFinish);
    resetTimer();
  });
}

/**
 * Navigate to URL and wait for page to be fully loaded (load event + network idle + buffer).
 */
export async function navigateAndWaitForReady(
  cdp: CdpConnection,
  sessionId: string,
  url: string,
): Promise<void> {
  const loadPromise = waitForPageLoad(cdp, sessionId, 15_000);
  await cdp.send("Page.navigate", { url }, { sessionId });
  await Promise.race([loadPromise, new Promise((r) => setTimeout(r, 8_000))]);
  await waitForNetworkIdle(cdp, sessionId);
  await new Promise((r) => setTimeout(r, POST_LOAD_DELAY_MS));
}

export async function closeTarget(
  cdp: CdpConnection,
  targetId: string,
): Promise<void> {
  try {
    await cdp.send("Target.closeTarget", { targetId });
  } catch {}
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/chrome-cdp/src/cdp.ts
git commit -m "feat(chrome-cdp): add CdpConnection class and page navigation helpers"
```

---

## Chunk 3: Markdown Extraction + Public API + CLI

### Task 5: Implement Markdown extraction

**Files:**
- Create: `packages/chrome-cdp/src/markdown.ts`

- [ ] **Step 1: Implement markdown.ts**

Create `packages/chrome-cdp/src/markdown.ts`:

```typescript
import { CdpConnection, evaluateScript } from "./cdp";

/**
 * Extract rendered HTML from the current page via CDP and convert to Markdown using Defuddle.
 */
export async function extractMarkdown(
  cdp: CdpConnection,
  sessionId: string,
  url: string,
): Promise<string> {
  // Extract rendered HTML from page
  const html = await evaluateScript<string>(
    cdp,
    sessionId,
    "document.documentElement.outerHTML",
  );

  if (!html || html.length < 100) {
    throw new Error(`Failed to extract HTML from ${url} (got ${html?.length ?? 0} chars)`);
  }

  // Convert HTML to Markdown via Defuddle + jsdom
  const [{ JSDOM, VirtualConsole }, { Defuddle }] = await Promise.all([
    import("jsdom"),
    import("defuddle/node"),
  ]);

  const virtualConsole = new VirtualConsole();
  // Suppress CSS parsing errors from jsdom
  virtualConsole.on("error", () => {});

  const dom = new JSDOM(html, { url, virtualConsole });
  const result = await Defuddle(dom, url, { markdown: true });
  const markdown = (result.content || "").trim();

  if (!markdown) {
    // Fallback: return raw text content
    const textContent = await evaluateScript<string>(
      cdp,
      sessionId,
      "document.body.innerText",
    );
    return textContent?.trim() || "";
  }

  return markdown;
}
```

Note: Defuddle API is `Defuddle(jsdomInstance, url, options)` — takes the JSDOM instance itself, not `dom.window.document`. Verified from baoyu-url-to-markdown source.

- [ ] **Step 2: Commit**

```bash
git add packages/chrome-cdp/src/markdown.ts
git commit -m "feat(chrome-cdp): add Defuddle-based HTML to Markdown extraction"
```

---

### Task 6: Implement public API (index.ts) with session lifecycle and CLI

**Files:**
- Create: `packages/chrome-cdp/src/index.ts`

- [ ] **Step 1: Implement index.ts with session API + CLI**

Create `packages/chrome-cdp/src/index.ts`:

```typescript
import type { ChildProcess } from "node:child_process";
import { getFreePort, launchChrome, killChrome, waitForChromeReady } from "./chrome";
import { CdpConnection, createTargetAndAttach, navigateAndWaitForReady, closeTarget } from "./cdp";
import { extractMarkdown } from "./markdown";
import { getCached, putCache, cleanOldCaches } from "./cache";

export type Session = {
  cdp: CdpConnection;
  chrome: ChildProcess;
  port: number;
};

/**
 * Launch headless Chrome and establish CDP connection.
 */
export async function createSession(): Promise<Session> {
  const port = await getFreePort();
  const chrome = await launchChrome(port);
  const wsUrl = await waitForChromeReady(port);

  // Retry CDP connection once per spec requirement
  let cdp: CdpConnection;
  try {
    cdp = await CdpConnection.connect(wsUrl);
  } catch {
    await new Promise((r) => setTimeout(r, 500));
    cdp = await CdpConnection.connect(wsUrl);
  }

  return { cdp, chrome, port };
}

/**
 * Fetch a URL and return its content as Markdown.
 * Uses daily cache — same URL on same day returns cached result.
 */
export async function fetchAsMarkdown(session: Session, url: string): Promise<string> {
  // Check cache first
  const cached = getCached(url);
  if (cached !== null) {
    return cached;
  }

  // Navigate and extract
  const { targetId, sessionId } = await createTargetAndAttach(session.cdp, url);
  try {
    await navigateAndWaitForReady(session.cdp, sessionId, url);
    const markdown = await extractMarkdown(session.cdp, sessionId, url);

    // Cache the result
    putCache(url, markdown);

    return markdown;
  } finally {
    await closeTarget(session.cdp, targetId);
  }
}

/**
 * Close Chrome and cleanup.
 */
export async function closeSession(session: Session): Promise<void> {
  session.cdp.close();
  killChrome(session.chrome);
  // Clean up old cache entries
  cleanOldCaches();
}

// --- CLI entry point ---
// Usage: bun packages/chrome-cdp/src/index.ts <url>

const isMainModule = import.meta.main;

if (isMainModule) {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: bun packages/chrome-cdp/src/index.ts <url>");
    process.exit(1);
  }

  try {
    const session = await createSession();
    try {
      const markdown = await fetchAsMarkdown(session, url);
      console.log(markdown);
    } finally {
      await closeSession(session);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Re-export for programmatic use
export { getCached, putCache } from "./cache";
```

- [ ] **Step 2: Commit**

```bash
git add packages/chrome-cdp/src/index.ts
git commit -m "feat(chrome-cdp): add session-based public API and CLI entry point"
```

---

## Chunk 4: Integration Test + Final Verification

### Task 7: Integration test

**Files:**
- Create: `packages/chrome-cdp/tests/integration.test.ts`

- [ ] **Step 1: Write integration test**

Create `packages/chrome-cdp/tests/integration.test.ts`:

```typescript
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
  }, 30_000); // 30s timeout for Chrome startup + page load

  test("returns cached result on second fetch", async () => {
    const session = await createSession();
    try {
      const url = "https://example.com";
      const first = await fetchAsMarkdown(session, url);
      const second = await fetchAsMarkdown(session, url);

      expect(second).toBe(first); // Exact same string from cache
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
```

- [ ] **Step 2: Run integration test**

```bash
cd packages/chrome-cdp && bun test tests/integration.test.ts
```

Expected: All 3 tests PASS (requires Chrome installed).

- [ ] **Step 3: Run all tests**

```bash
cd packages/chrome-cdp && bun test
```

Expected: All tests PASS.

- [ ] **Step 4: Test CLI manually**

```bash
cd /Users/jdy/Documents/indie_finance_plugin && bun packages/chrome-cdp/src/index.ts 'https://example.com'
```

Expected: Markdown output of example.com printed to stdout.

- [ ] **Step 5: Commit**

```bash
git add packages/chrome-cdp/tests/integration.test.ts
git commit -m "test(chrome-cdp): add integration tests for session lifecycle and caching"
```

---

### Task 8: Add .gitignore and final cleanup

**Files:**
- Create: `packages/chrome-cdp/.gitignore`

- [ ] **Step 1: Create .gitignore**

Create `packages/chrome-cdp/.gitignore`:

```
node_modules/
dist/
```

- [ ] **Step 2: Verify the complete file structure**

```bash
find packages/chrome-cdp -type f ! -path '*/node_modules/*' ! -path '*/dist/*' | sort
```

Expected output:
```
packages/chrome-cdp/.gitignore
packages/chrome-cdp/bun.lock
packages/chrome-cdp/package.json
packages/chrome-cdp/src/cache.ts
packages/chrome-cdp/src/cdp.ts
packages/chrome-cdp/src/chrome.ts
packages/chrome-cdp/src/index.ts
packages/chrome-cdp/src/markdown.ts
packages/chrome-cdp/tests/cache.test.ts
packages/chrome-cdp/tests/chrome.test.ts
packages/chrome-cdp/tests/integration.test.ts
packages/chrome-cdp/tsconfig.json
```

- [ ] **Step 3: Run full test suite one more time**

```bash
cd packages/chrome-cdp && bun test
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/chrome-cdp/.gitignore
git commit -m "chore(chrome-cdp): add .gitignore for node_modules and dist"
```

---

## Summary

| Task | What | Files | Tests |
|------|------|-------|-------|
| 1 | Package init | package.json, tsconfig.json | — |
| 2 | Cache module | cache.ts | cache.test.ts (5 tests) |
| 3 | Chrome lifecycle | chrome.ts | chrome.test.ts (2 tests) |
| 4 | CDP connection | cdp.ts | — (tested via integration) |
| 5 | Markdown extraction | markdown.ts | — (tested via integration) |
| 6 | Public API + CLI | index.ts | — (tested via integration) |
| 7 | Integration tests | — | integration.test.ts (3 tests) |
| 8 | Cleanup | .gitignore | Full suite verification |

**After all tasks:** Use `superpowers:finishing-a-development-branch` to create PR.

**Phase 2 reminder:** SKILL.md modifications (tradfi, crypto, macro, portfolio) will be done in a follow-up PR after this package is merged and validated.
