import { type CdpConnection, evaluateScript } from "./cdp";

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
  // Suppress CSS parsing errors from jsdom (jsdom emits them via "jsdomError", not "error")
  virtualConsole.on("jsdomError", () => {});

  const dom = new JSDOM(html, { url, virtualConsole });
  const result = await Defuddle(dom, url, { markdown: true });
  const body = (result.content || "").trim();
  // Prepend title as h1 if Defuddle extracted it separately
  const markdown = result.title && body ? `# ${result.title}\n\n${body}` : body;

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
