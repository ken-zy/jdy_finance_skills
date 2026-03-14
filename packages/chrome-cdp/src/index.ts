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

  try {
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
  } catch (error) {
    // Kill Chrome if post-launch setup fails to avoid orphaned processes
    killChrome(chrome);
    throw error;
  }
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
