# Chrome CDP Data Fetcher Design

## Overview

Build a shared Chrome CDP package (`packages/chrome-cdp/`) that replaces WebSearch-based data fetching across all sub-plugins with direct browser rendering, returning clean Markdown for Claude to consume.

## Problem

Current data fetching relies on WebSearch as Layer 2 fallback, which:
- Returns search result summaries, not actual page content
- Cannot render JavaScript-heavy financial pages
- Lacks structured table extraction
- Layer 3 (Chrome CDP) is defined in SKILL.md but never implemented

Community Yahoo Finance MCP servers all depend on `yfinance`, which:
- Is legally gray (violates Yahoo ToS)
- Suffers severe rate limiting (429 errors since Nov 2024)
- Is an unofficial, unmaintained dependency risk

## Solution

A self-owned Chrome CDP package that:
- Opens any URL in a real headless Chrome browser
- Extracts rendered HTML and converts to Markdown via Defuddle
- Caches results by URL + date (daily granularity)
- Is called from SKILL.md instructions, not wrapped as MCP

## Architecture

```
indie_finance_plugin/
├── packages/
│   └── chrome-cdp/
│       ├── package.json        # bun project, deps: defuddle only
│       ├── index.ts            # ~250 lines: Chrome lifecycle + CDP + Markdown extraction
│       └── cache.ts            # ~80 lines: file-based daily cache
│
├── tradfi/skills/*/SKILL.md    # Modified: Layer 2 uses chrome-cdp
├── crypto/skills/*/SKILL.md    # Modified: Layer 2 uses chrome-cdp
├── macro/skills/*/SKILL.md     # Modified: Layer 2 uses chrome-cdp
└── portfolio/skills/*/SKILL.md # Modified: Layer 2 uses chrome-cdp
```

### Why Skill, Not MCP

Chrome CDP fetches data locally using the user's own browser. There is no external service process to bridge. MCP adds unnecessary protocol overhead for a local operation. This matches the pattern proven by baoyu-skills (`baoyu-url-to-markdown`).

### Phantom MCP Problem

Many SKILL.md files reference MCP servers that do not exist in their `.mcp.json` configurations:

| Phantom MCP | Referenced by | Actual .mcp.json |
|-------------|--------------|------------------|
| yahoo-finance | tradfi: comps, earnings | tradfi: alpha-vantage only |
| financial-modeling-prep | tradfi: comps, earnings | tradfi: alpha-vantage only |
| defillama | crypto: defi-protocol, airdrop-eval; macro: dashboard, morning, catalyst | crypto: coingecko + dune only; macro: coingecko only |
| fred | macro: dashboard, morning, catalyst | macro: coingecko only |

Portfolio sub-plugin has `"mcpServers": {}` — zero functional MCP at all, despite SKILL.md referencing yahoo-finance.

This means chrome-cdp is not merely a Layer 2 replacement — for skills with phantom MCP references, it becomes the **de facto primary data source**.

### Fallback Strategy Change

Two distinct scenarios after chrome-cdp:

**Scenario A: Skills with working MCP** (e.g., token-analysis with CoinGecko, onchain-query with Dune):
```
Layer 1: MCP (working) — unchanged
Layer 2: chrome-cdp (fallback for supplementary data)
```

**Scenario B: Skills with phantom MCP** (e.g., comps with yahoo-finance, defi-protocol with defillama):
```
Layer 1: chrome-cdp (effective primary data source)
```

Layer 2 (WebSearch) and Layer 3 (Chrome CDP) merge because chrome-cdp already provides direct page access with full rendering.

> **Note:** This change deviates from the current CLAUDE.md three-layer fallback strategy
> (MCP → Web Search → Chrome CDP). Before implementing Phase 2 SKILL.md modifications,
> the root CLAUDE.md must be updated to reflect the revised fallback architecture for
> phantom-MCP scenarios.

## Package Design: `packages/chrome-cdp/`

### index.ts (~250 lines)

Forked and trimmed from baoyu-skills' `baoyu-chrome-cdp` (408 lines). Keeps only:

| Feature | Keep | Cut |
|---------|------|-----|
| Chrome process start/stop | Yes | |
| WebSocket CDP connection | Yes | |
| Page navigation + wait | Yes | |
| DOM to Markdown (Defuddle) | Yes | |
| Cookie/session management | | Cut (no login needed) |
| Multi-account profile isolation | | Cut (not needed) |
| Media file download | | Cut (text data only) |

Public API:

```typescript
async function fetchAsMarkdown(url: string): Promise<string>
```

Session-based lifecycle (launch once, fetch N URLs, then close):

```typescript
async function createSession(): Promise<Session>
async function fetchAsMarkdown(session: Session, url: string): Promise<string>
async function closeSession(session: Session): Promise<void>
```

Internal flow for `fetchAsMarkdown`:
1. Check cache -> hit: return cached Markdown
2. Navigate to URL, wait for page load (networkIdle)
3. Extract `document.body` innerHTML
4. Convert HTML to Markdown via Defuddle
5. Write to cache, return Markdown

Session lifecycle (`createSession` / `closeSession`):
1. Find local Chrome binary (macOS/Linux/Windows paths)
2. Launch Chrome with `--headless --remote-debugging-port={random}`
3. Connect via WebSocket CDP
4. (... N fetches ...)
5. Close Chrome, cleanup WebSocket

This avoids launching/closing Chrome per URL. A morning note fetching 5-10 URLs reuses one Chrome instance.

CLI usage (single URL convenience):
```bash
bun packages/chrome-cdp/index.ts 'https://finance.yahoo.com/quote/AAPL/financials'
# internally: createSession -> fetchAsMarkdown -> closeSession
```

### cache.ts (~80 lines)

```
~/.indie-finance/cache/
  └── 2026-03-14/
      └── finance.yahoo.com_quote_AAPL_financials.md
```

- Cache key: SHA-256 hash of full URL (avoids filename length limits and query param collisions)
- Metadata: each cache entry has a `.meta` file with original URL for debugging
- Expiry: by date directory, valid for current day only
- Cleanup: keep last 7 days, auto-delete older directories
- Location: reuses existing `~/.indie-finance/` directory (alongside `keys.json`)

### HTML to Markdown: Defuddle

Defuddle is chosen over lightweight regex because:
- Financial pages have complex structure (tables, sidebars, ads)
- Defuddle is open-source, actively maintained, Readability successor
- It intelligently extracts main content, filters navigation/ads
- It is a legitimate dependency, unlike yfinance (unofficial Yahoo scraper)

## Dependencies

| Dependency | Type | Purpose | Security |
|------------|------|---------|----------|
| Bun | Runtime | Execute TypeScript | Official, project already uses it |
| Defuddle | npm package | HTML to Markdown | Open-source, active maintenance |
| jsdom | npm package | Server-side DOM for Defuddle | Mozilla/OpenJS Foundation, industry standard |
| Chrome | System binary | Page rendering | User's own installed browser |

Defuddle's `defuddle/node` entry point requires the caller to provide a JSDOM instance. jsdom is not bundled as a Defuddle dependency — it is provided externally so Defuddle stays lightweight.

Zero unofficial scraper dependencies. No yfinance, no Yahoo unofficial libraries.

## SKILL.md Modifications

### Invocation Pattern

Each SKILL.md's Layer 2 changes from:
```
Layer 2: WebSearch "finance.yahoo.com AAPL financials"
```
To:
```
Layer 2: Bash("bun packages/chrome-cdp/index.ts 'https://finance.yahoo.com/quote/AAPL/financials'")
```

The chrome-cdp package is URL-agnostic. Each SKILL.md decides which URL to fetch. URL construction logic lives in SKILL.md instructions, not in the package.

### Impact Scope

| Sub-plugin | Skills affected | Scenario | URLs |
|------------|----------------|----------|------|
| tradfi | comps, dcf, earnings, thesis, model-update | B (phantom MCP) | finance.yahoo.com, macrotrends.net |
| portfolio | rebalance, tlh | B (phantom MCP, empty .mcp.json) | finance.yahoo.com |
| macro | dashboard, morning, catalyst | B (phantom MCP for defillama/fred) | fred.stlouisfed.org, defillama.com |
| crypto | defi-protocol, airdrop-eval | B (phantom defillama MCP) | defillama.com, project official sites |
| crypto | token-analysis | A (CoinGecko works, supplementary only) | unlock schedule sites, audit reports |

Unaffected: crypto/onchain-query (Dune MCP covers it fully).

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Chrome not installed | Error message with install path guidance |
| Page load timeout (15s) | Return error, SKILL.md can retry or report |
| CDP connection failure | Retry once, then error |
| URL returns 403/429 | Return error, log for debugging |
| Defuddle extraction fails | Return raw text fallback |

## Output Format

- Returns rendered Markdown (main content extracted by Defuddle)
- Claude interprets the Markdown and extracts structured data per SKILL.md instructions
- HTML snapshot is NOT returned to context (saves tokens)

## Design Decisions

### Why not MCP?
MCP is a bridge to external services. Chrome CDP is a local operation. Adding MCP protocol overhead for a local tool is unnecessary complexity. baoyu-skills validates this approach.

### Why not a CLI tool (npx)?
Over-engineering for this use case. The package is only consumed within this project's SKILL.md instructions via `bun packages/chrome-cdp/index.ts`.

### Why daily cache granularity?
Financial data updates at most daily for the analyses this project performs (fundamentals, TVL, macro indicators). Intraday precision is not needed and would increase cache misses.

### Why fork baoyu-chrome-cdp instead of depending on it?
The user requires full control with no external dependency. Forking ~200 lines (after trimming) is trivially maintainable and eliminates version coupling.

### Legal note on programmatic page access
Unlike yfinance (a scraper library that bulk-fetches Yahoo endpoints), chrome-cdp opens pages in a real browser the same way a human user would — single pages, read-only, user-initiated. Combined with daily caching (max 1 request/URL/day), this is materially different from automated scraping. The distinction should be documented but is not a blocker.

## Setup Notes

- `packages/` directory does not exist yet — must be created
- Defuddle and jsdom should be pinned to specific versions in package.json
- Bun runtime is already used by the project (baoyu-skills pattern)

## Implementation Phases

### Phase 1 (this PR): `packages/chrome-cdp/` core package
- `index.ts` — Chrome lifecycle + CDP + Markdown extraction
- `cache.ts` — file-based daily cache
- `package.json` — dependencies (defuddle, jsdom)
- CLI entry point for testing: `bun packages/chrome-cdp/index.ts <url>`

### Phase 2 (follow-up PR): SKILL.md modifications
- Update Layer 2/3 in affected SKILL.md files (tradfi, crypto, macro, portfolio)
- `_reference/` directory SKILL.md files are excluded from modification
