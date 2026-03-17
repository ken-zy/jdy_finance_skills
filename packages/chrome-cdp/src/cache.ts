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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry)) continue;
    if (entry < cutoffStr) {
      fs.rmSync(path.join(baseDir, entry), { recursive: true, force: true });
    }
  }
}
