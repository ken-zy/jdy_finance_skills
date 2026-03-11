# Phase 2: TradFi Module Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork 5 official skills and 4 commands from Anthropic financial-services-plugins into the tradfi sub-plugin, adapting all data source references from paid MCP to free alternatives.

**Architecture:** Pure markdown plugin — no compiled code. Skills are markdown files that Claude loads automatically. Commands are markdown files users invoke via `/tradfi:command`. The only Python code is `validate_dcf.py` for DCF model validation. All data source references in skills must be rewritten from paid sources (Daloopa, Morningstar, S&P Kensho, FactSet, Moody's, etc.) to free sources (yahoo-finance, alpha-vantage, fmp) with three-layer fallback.

**Tech Stack:** Markdown, JSON, Python (openpyxl, yfinance, requests)

---

## Prerequisites

- [ ] **Create feature branch**

```bash
git fetch origin && git checkout -b feat/phase2-tradfi origin/main
```

## File Structure

```
tradfi/
├── .claude-plugin/plugin.json     # EXISTS
├── .mcp.json                      # EXISTS
├── hooks/hooks.json               # EXISTS
├── commands/
│   ├── comps.md                   # CREATE - fork from financial-analysis/commands/comps.md
│   ├── dcf.md                     # CREATE - fork from financial-analysis/commands/dcf.md
│   ├── earnings.md                # CREATE - fork from equity-research/commands/earnings.md
│   └── screen.md                  # CREATE - fork from equity-research/commands/screen.md
└── skills/
    ├── comps-analysis/
    │   └── SKILL.md               # CREATE - fork from financial-analysis/skills/comps-analysis/SKILL.md
    ├── dcf-model/
    │   ├── SKILL.md               # CREATE - fork from financial-analysis/skills/dcf-model/SKILL.md
    │   ├── TROUBLESHOOTING.md     # CREATE - copy from official
    │   ├── requirements.txt       # CREATE - copy from official
    │   └── scripts/
    │       └── validate_dcf.py    # CREATE - copy from official
    ├── earnings-analysis/
    │   ├── SKILL.md               # CREATE - fork from equity-research/skills/earnings-analysis/SKILL.md
    │   └── references/
    │       ├── best-practices.md  # CREATE - copy from official
    │       ├── report-structure.md # CREATE - copy from official
    │       └── workflow.md        # CREATE - fork (adapt data sources)
    ├── competitive-analysis/
    │   ├── SKILL.md               # CREATE - fork from official
    │   └── references/
    │       ├── frameworks.md      # CREATE - copy from official
    │       └── schemas.md         # CREATE - copy from official
    └── clean-data-xls/
        └── SKILL.md               # CREATE - copy from official (no data source refs)
```

## Data Source Replacement Map

All skills reference paid MCP servers that must be replaced:

| Official (Paid) | Replacement (Free) | Notes |
|-----------------|-------------------|-------|
| `daloopa` (MCP) | `yahoo-finance` (MCP) → `financial-modeling-prep` (MCP) → Web Search → Chrome | Primary financial data |
| `morningstar` (MCP) | `yahoo-finance` (MCP) → Web Search | Fundamentals |
| `sp-global` / `factset` (MCP) | `financial-modeling-prep` (MCP) → Web Search | Estimates, filings |
| `mtnewswire` / `aiera` (MCP) | `alpha-vantage` (MCP) → Web Search | News, transcripts |
| `pitchbook` / `chronograph` (MCP) | Web Search → Chrome | Deal data (no free MCP) |
| `lseg` (MCP) | `alpha-vantage` (MCP) → Web Search | Market data |
| `moodys` (MCP) | N/A | Not used in selected skills |
| `egnyte` (MCP) | N/A | File storage, not applicable |

## Design Decisions

- **No `/competitive-analysis` command**: The design doc lists 4 TradFi commands (comps, dcf, earnings, screen). competitive-analysis is a skill that triggers automatically when Claude detects competitive analysis needs — no explicit command needed.
- **`_reference/` directory**: Already created in Phase 1 at project root. Actual content (17 inactive skills) will be populated in a separate task — not blocking Phase 2.

## Adaptation Rules

When forking each skill, apply these changes:

1. **Data Source Priority sections**: Replace all references to paid MCP servers with the free alternatives in the replacement map above
2. **Three-layer fallback**: Every data fetch instruction must follow: MCP → Web Search → Chrome CDP
3. **Source attribution**: Change source labels to match our MCP names
4. **Remove inapplicable references**: Remove mentions of Office JS/Excel Add-in environments (we only use Python/openpyxl for Excel)
5. **Keep intact**: Analysis frameworks, formulas, quality checklists, output formats — these are the value of the fork

---

## Chunk 1: Core Skills — comps-analysis & dcf-model

### Task 1: Fork comps-analysis skill

**Files:**
- Create: `tradfi/skills/comps-analysis/SKILL.md`

- [ ] **Step 1: Fetch official comps-analysis SKILL.md**

Fetch from: `https://raw.githubusercontent.com/anthropics/financial-services-plugins/main/financial-analysis/skills/comps-analysis/SKILL.md`

- [ ] **Step 2: Create adapted SKILL.md**

Copy to `tradfi/skills/comps-analysis/SKILL.md` with these changes:

1. Replace the "Data Source Priority" section. Change from:
   ```
   S&P Capital IQ Kensho → FactSet → Daloopa → morningstar
   ```
   To:
   ```
   ## Data Source Priority

   Follow the three-layer fallback strategy:

   ### Layer 1: MCP Data Sources (preferred)
   1. **yahoo-finance** — Primary: stock quotes, key statistics, financial statements, company info
   2. **financial-modeling-prep** — Secondary: detailed financials, ratios, enterprise value, peer comparison
   3. **alpha-vantage** — Tertiary: technical indicators, additional fundamentals

   ### Layer 2: Web Search
   - finance.yahoo.com, macrotrends.net, wisesheets.io
   - SEC EDGAR for filings

   ### Layer 3: Chrome CDP
   - For pages requiring login or dynamic rendering

   Always annotate: "Source: [source name]" on each data point.
   ```

2. Remove any references to Office JS environment — keep only Python/openpyxl path
3. Keep ALL of: analysis framework, formulas, quality checklists, statistical analysis, output format, metric decision framework

- [ ] **Step 3: Verify file**

Confirm the file:
- Has correct frontmatter (name, description)
- References only yahoo-finance, alpha-vantage, financial-modeling-prep as MCP sources
- Retains full analysis framework and quality checks

- [ ] **Step 4: Commit**

```bash
git add tradfi/skills/comps-analysis/SKILL.md
git commit -m "feat(tradfi): fork comps-analysis skill with free data sources"
```

### Task 2: Fork dcf-model skill

**Files:**
- Create: `tradfi/skills/dcf-model/SKILL.md`
- Create: `tradfi/skills/dcf-model/TROUBLESHOOTING.md`
- Create: `tradfi/skills/dcf-model/requirements.txt`
- Create: `tradfi/skills/dcf-model/scripts/validate_dcf.py`

- [ ] **Step 1: Fetch all official dcf-model files**

Fetch 4 files from official repo.

- [ ] **Step 2: Copy unchanged files**

Copy these as-is (no data source references to change):
- `TROUBLESHOOTING.md` → `tradfi/skills/dcf-model/TROUBLESHOOTING.md`
- `requirements.txt` → `tradfi/skills/dcf-model/requirements.txt`
- `scripts/validate_dcf.py` → `tradfi/skills/dcf-model/scripts/validate_dcf.py`

- [ ] **Step 3: Create adapted SKILL.md**

Copy to `tradfi/skills/dcf-model/SKILL.md` with these changes:

1. Replace data source references throughout. The official file references Daloopa, FactSet, S&P Kensho for fetching financial data. Replace with:
   ```
   ## Data Source Priority

   ### Layer 1: MCP
   1. **yahoo-finance** — Historical financials, current price, shares outstanding, balance sheet
   2. **financial-modeling-prep** — DCF inputs, WACC components, analyst estimates, growth rates

   ### Layer 2: Web Search
   - finance.yahoo.com, macrotrends.net for historical data
   - SEC EDGAR for 10-K/10-Q filings

   ### Layer 3: Chrome CDP
   - For detailed filings or pages with bot detection
   ```

2. In "Input Requirements" section, change data fetch instructions to use yahoo-finance and fmp tools
3. Remove Office JS references — keep only Python/openpyxl path
4. Keep ALL of: DCF process workflow (Steps 1-10), correct patterns, common mistakes, quality rubric, Excel model structure, sensitivity analysis, case selector, deliverables, best practices

- [ ] **Step 4: Verify and commit**

```bash
git add tradfi/skills/dcf-model/
git commit -m "feat(tradfi): fork dcf-model skill with free data sources"
```

---

## Chunk 2: Earnings & Competitive Analysis Skills

### Task 3: Fork earnings-analysis skill

**Files:**
- Create: `tradfi/skills/earnings-analysis/SKILL.md`
- Create: `tradfi/skills/earnings-analysis/references/best-practices.md`
- Create: `tradfi/skills/earnings-analysis/references/report-structure.md`
- Create: `tradfi/skills/earnings-analysis/references/workflow.md`

- [ ] **Step 1: Fetch all official earnings-analysis files**

Fetch 4 files from official repo.

- [ ] **Step 2: Copy unchanged reference files**

Copy as-is (analysis frameworks, no data source refs):
- `references/best-practices.md`
- `references/report-structure.md`

- [ ] **Step 3: Adapt SKILL.md**

Copy to `tradfi/skills/earnings-analysis/SKILL.md` with changes:

1. Replace data source references:
   ```
   ## Data Source Priority

   ### Layer 1: MCP
   1. **alpha-vantage** — Earnings call transcripts, earnings calendar
   2. **yahoo-finance** — Earnings results, financial statements, analyst estimates
   3. **financial-modeling-prep** — Detailed estimates, historical earnings, analyst ratings

   ### Layer 2: Web Search
   - seekingalpha.com/earnings/transcripts
   - finance.yahoo.com/earnings
   - sec.gov/cgi-bin/browse-edgar

   ### Layer 3: Chrome CDP
   - Seeking Alpha (may require login for full transcripts)
   - Earnings call replay pages
   ```

2. Keep ALL of: critical requirements (speed, beat/miss, citations), five-phase workflow, output specification

- [ ] **Step 4: Adapt references/workflow.md**

This file contains specific data fetch instructions. Adapt references to use our MCP tools instead of paid sources.

- [ ] **Step 5: Verify and commit**

```bash
git add tradfi/skills/earnings-analysis/
git commit -m "feat(tradfi): fork earnings-analysis skill with free data sources"
```

### Task 4: Fork competitive-analysis skill

**Files:**
- Create: `tradfi/skills/competitive-analysis/SKILL.md`
- Create: `tradfi/skills/competitive-analysis/references/frameworks.md`
- Create: `tradfi/skills/competitive-analysis/references/schemas.md`

- [ ] **Step 1: Fetch official files**

Fetch 3 files from official repo.

- [ ] **Step 2: Copy unchanged reference files**

Copy as-is:
- `references/frameworks.md` (2x2 matrix axis pairs — no data source refs)
- `references/schemas.md` (table schemas — no data source refs)

- [ ] **Step 3: Adapt SKILL.md**

Copy to `tradfi/skills/competitive-analysis/SKILL.md` with changes:

1. Replace data source references with:
   ```
   ## Data Source Priority

   ### Layer 1: MCP
   1. **yahoo-finance** — Company financials, market data, competitor info
   2. **financial-modeling-prep** — Industry data, peer comparison, market share estimates

   ### Layer 2: Web Search
   - Company investor relations pages
   - Industry reports, analyst coverage
   - News for recent competitive developments

   ### Layer 3: Chrome CDP
   - Pages with dynamic content or login requirements
   ```

2. Remove Office JS references
3. Keep ALL of: analysis workflow (Steps 0-9), standards, moat assessment framework, quality checklist

- [ ] **Step 4: Verify and commit**

```bash
git add tradfi/skills/competitive-analysis/
git commit -m "feat(tradfi): fork competitive-analysis skill with free data sources"
```

---

## Chunk 3: Clean Data Skill + Commands

### Task 5: Copy clean-data-xls skill

**Files:**
- Create: `tradfi/skills/clean-data-xls/SKILL.md`

- [ ] **Step 1: Copy SKILL.md**

This skill has no data source references — it's purely about cleaning Excel data. Copy as-is from official, only removing Office JS environment section (keep Python/openpyxl path only).

- [ ] **Step 2: Verify and commit**

```bash
git add tradfi/skills/clean-data-xls/SKILL.md
git commit -m "feat(tradfi): add clean-data-xls skill"
```

### Task 6: Create all 4 commands

**Files:**
- Create: `tradfi/commands/comps.md`
- Create: `tradfi/commands/dcf.md`
- Create: `tradfi/commands/earnings.md`
- Create: `tradfi/commands/screen.md`

- [ ] **Step 1: Fetch official command files**

Fetch from official repo:
- `financial-analysis/commands/comps.md`
- `financial-analysis/commands/dcf.md`
- `equity-research/commands/earnings.md`
- `equity-research/commands/screen.md`

- [ ] **Step 2: Create adapted comps.md**

Copy to `tradfi/commands/comps.md` with these changes:
- In Step 3 "Gather data" section, replace "prioritize MCP sources if available" with: "Data source priority: yahoo-finance MCP → financial-modeling-prep MCP → Web Search → Chrome CDP"
- Keep all other content (workflow, output format, industry metrics, quality checklist) identical

- [ ] **Step 3: Create adapted dcf.md**

Copy to `tradfi/commands/dcf.md` with these changes:
- Replace data source references with: "yahoo-finance MCP → financial-modeling-prep MCP → Web Search → Chrome CDP"
- Keep the comps-to-DCF mapping table, cross-check valuation, example output summary

- [ ] **Step 4: Create adapted earnings.md**

Copy to `tradfi/commands/earnings.md` with these changes:
- Replace data source references: "alpha-vantage MCP (transcripts) → financial-modeling-prep MCP (estimates) → yahoo-finance MCP (price/financials) → Web Search → Chrome CDP"
- Keep report structure reference (Pages 1-10+), quality checklist

- [ ] **Step 5: Create screen.md**

The official screen.md is minimal (references `idea-generation` skill which we don't have). Create an adapted version with:
- Workflow: Clarify Criteria → Screen (yahoo-finance → fmp → Web Search → Chrome CDP) → Analyze Results → Deliver
- Output: Markdown report with criteria, results table, top picks
- Quality checklist

- [ ] **Step 6: Commit all commands**

```bash
git add tradfi/commands/
git commit -m "feat(tradfi): add comps, dcf, earnings, screen commands"
```

---

## Chunk 4: Final Verification

### Task 7: Final verification and integration commit

- [ ] **Step 1: Verify directory structure**

Run `find tradfi/ -type f | sort` and confirm all expected files exist:
- 4 commands
- 5 skills with all reference files
- plugin.json, .mcp.json, hooks.json

- [ ] **Step 2: Verify no paid MCP references remain**

Search all tradfi/ files for paid MCP names that should have been replaced:
```bash
grep -r "daloopa\|morningstar\|sp-global\|factset\|moodys\|mtnewswire\|aiera\|pitchbook\|chronograph\|egnyte\|lseg" tradfi/
```
Expected: no results

- [ ] **Step 3: Verify free MCP references present**

```bash
grep -r "yahoo-finance\|alpha-vantage\|financial-modeling-prep" tradfi/skills/ | head -20
```
Expected: multiple hits across skill files

- [ ] **Step 4: Update design doc**

Update `docs/plans/2026-03-11-indie-finance-plugin-design.md` to reflect the multi-plugin marketplace architecture change (tradfi/ instead of flat structure). Mark Phase 2 as complete.

- [ ] **Step 5: Final commit**

```bash
git add docs/
git commit -m "docs: update design doc for multi-plugin architecture, mark Phase 2 complete"
```
