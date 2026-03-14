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
      } catch (err) {
        // Log unexpected parse/processing errors to aid debugging.
        // Pending requests will fall back to timeout, but logging preserves the original error.
        console.error("[cdp] message handling error:", err);
      }
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

// Note: events are not filtered by sessionId — safe for serial fetch only.
// If parallel fetch is needed in the future, add sessionId-based event filtering.
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
