import { spawn, type ChildProcess } from "node:child_process";
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
