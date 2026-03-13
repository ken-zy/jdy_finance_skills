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

### Fallback Strategy Change

Before (3 layers):
```
Layer 1: MCP (alpha-vantage, coingecko, dune)
Layer 2: WebSearch (search engine results)
Layer 3: Chrome CDP (undefined, never implemented)
```

After (2 layers):
```
Layer 1: MCP (alpha-vantage, coingecko, dune) — unchanged
Layer 2: chrome-cdp (direct page access, rendered Markdown)
```

Layer 2 and Layer 3 merge because chrome-cdp already provides direct page access with full rendering.

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

Internal flow:
1. Check cache -> hit: return cached Markdown
2. Find local Chrome binary (macOS/Linux/Windows paths)
3. Launch Chrome with `--headless --remote-debugging-port`
4. Connect via WebSocket CDP
5. Navigate to URL, wait for page load (networkIdle)
6. Extract `document.body` innerHTML
7. Convert HTML to Markdown via Defuddle
8. Write to cache
9. Close Chrome, return Markdown

### cache.ts (~80 lines)

```
~/.indie-finance/cache/
  └── 2026-03-14/
      └── finance.yahoo.com_quote_AAPL_financials.md
```

- Cache key: URL path converted to filename (`/` -> `_`)
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
| Chrome | System binary | Page rendering | User's own installed browser |

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

| Sub-plugin | Skills affected | URLs replaced |
|------------|----------------|---------------|
| tradfi | comps, dcf, earnings, thesis | finance.yahoo.com, macrotrends.net |
| portfolio | rebalance, tlh | finance.yahoo.com |
| macro | dashboard, morning | fred.stlouisfed.org |
| crypto | defi-protocol, airdrop-eval, token-analysis | defillama.com, project official sites |

Note: crypto/onchain-query is unaffected (Dune MCP covers it fully).

Note: crypto/defi-protocol SKILL.md references "defillama MCP" as Layer 1, but DefiLlama has no official MCP. This data currently falls back to WebSearch. chrome-cdp will properly serve this use case by directly accessing defillama.com.

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
