# Layer 2/3 Swap Sync — Design Spec

## Background

PR #6 (`docs/swap-layer2-layer3`) updated `CLAUDE.md` to swap Layer 2 and Layer 3 in the three-layer fallback strategy:

- **New Layer 2:** Chrome CDP 直接访问
- **New Layer 3:** Web Search 摘要兜底

However, PR #6 did not update the 32 per-skill files (SKILL.md × 17, commands/*.md × 15) or the newly added spec doc, all of which still describe the old ordering (Layer 2 = Web Search, Layer 3 = Chrome CDP).

## Goal

Sync all affected files to match the new layer ordering established in CLAUDE.md.

## Scope

### Group 1 — tradfi (Agent 1)
- `tradfi/skills/comps-analysis/SKILL.md`
- `tradfi/skills/dcf-model/SKILL.md`
- `tradfi/skills/earnings-analysis/SKILL.md`
- `tradfi/skills/model-update/SKILL.md`
- `tradfi/skills/competitive-analysis/SKILL.md`
- `tradfi/skills/idea-generation/SKILL.md`
- `tradfi/skills/thesis-tracker/SKILL.md` (also fix plain-text "MCP → Web Search → Chrome CDP")
- `tradfi/commands/comps.md`
- `tradfi/commands/dcf.md`
- `tradfi/commands/earnings.md`
- `tradfi/commands/screen.md`
- `tradfi/commands/thesis.md`
- `tradfi/commands/model-update.md`

### Group 2 — crypto (Agent 2)
- `crypto/skills/token-analysis/SKILL.md`
- `crypto/skills/defi-protocol/SKILL.md`
- `crypto/skills/airdrop-eval/SKILL.md`
- `crypto/skills/onchain-query/SKILL.md`
- `crypto/commands/token.md`
- `crypto/commands/defi.md`
- `crypto/commands/airdrop.md`
- `crypto/commands/onchain.md`

### Group 3 — macro (Agent 3)
- `macro/skills/macro-dashboard/SKILL.md`
- `macro/skills/morning-note/SKILL.md`
- `macro/skills/catalyst-calendar/SKILL.md`
- `macro/skills/news-digest/SKILL.md`
- `macro/commands/dashboard.md`
- `macro/commands/morning.md`
- `macro/commands/catalyst.md`

### Group 4 — portfolio (Agent 4)
- `portfolio/skills/portfolio-rebalance/SKILL.md`
- `portfolio/skills/tax-loss-harvesting/SKILL.md`
- `portfolio/commands/rebalance.md`
- `portfolio/commands/tlh.md`

### Group 5 — spec doc (Agent 5)
- `docs/superpowers/specs/2026-03-17-chrome-cdp-oversize-fallback-design.md`

## Operation Rules

### For SKILL.md and commands/*.md files (Groups 1–4)

Each file has a `### Layer 2:` block and a `### Layer 3:` block. Both the heading and all content lines under each heading must be swapped as a unit:

**Before:**
```
### Layer 2: Web Search
- <web search content>

### Layer 3: Chrome CDP
- <chrome cdp content>
```

**After:**
```
### Layer 2: Chrome CDP
- <chrome cdp content>

### Layer 3: Web Search
- <web search content>
```

Additionally, `tradfi/skills/thesis-tracker/SKILL.md` line 8 contains:
> "Follow the three-layer fallback: MCP → Web Search → Chrome CDP."

Fix to:
> "Follow the three-layer fallback: MCP → Chrome CDP → Web Search."

### For spec doc (Group 5)

Six targeted fixes in `docs/superpowers/specs/2026-03-17-chrome-cdp-oversize-fallback-design.md`:

| Line | Old | New |
|------|-----|-----|
| 5 | "Layer 3 定义未覆盖...跳回 Layer 2 Web Search" | "Layer 2 定义未覆盖...跳回 Layer 3 Web Search" |
| 9 | "Layer 3 定义中补充" | "Layer 2 定义中补充" |
| 20 | "Layer 3 段落末尾追加" | "Layer 2 段落末尾追加" |
| 35 | "fallback 回 Layer 2 Web Search" | "fallback 回 Layer 3 Web Search" |
| 52 | "Layer 3: Chrome CDP 直接访问（Web Search 也不可用时）" | "Layer 2: Chrome CDP 直接访问（MCP 不可用或数据不足时）" |
| 67 | "fallback 回 Layer 2 Web Search" | "fallback 回 Layer 3 Web Search" |

## Commit

Single commit after all agents complete:

```
docs: sync layer2/layer3 swap across all SKILL.md and commands files
```

## Out of Scope

- Historical design docs in `docs/superpowers/plans/` (2026-03-11 phase2/phase3) — these are archived planning documents, not active instructions
- `docs/mcp-security-audit.md` — separate document, not active instructions
- `README.md` — user-facing high-level overview, intentionally abstracted
