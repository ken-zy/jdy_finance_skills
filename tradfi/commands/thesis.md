---
description: Create, update, or review an investment thesis — track pillars, catalysts, conviction, and data points over time
argument-hint: "<ticker_or_company> [update_context]"
allowed-tools: Bash(python3:*), mcp__alpha-vantage__*, WebSearch, WebFetch
---

# Investment Thesis

Create, update, or review an investment thesis for the target company.

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **alpha-vantage** — 电话会议转录、技术指标（25次/天限额）

### Layer 2: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 财务数据、关键指标
- `tipranks.com/stocks/{ticker}/forecast` — 分析师评级

### Layer 3: Web Search
- Company IR pages for press releases
- SEC EDGAR for filings
- Industry news sources

## Workflow

### Mode Detection

Determine what the user wants:
- **"New thesis"** / no existing thesis → Create from scratch (Step 1)
- **"Update thesis"** / new data point → Update existing (Step 2)
- **"Review thesis"** / "is my thesis intact?" → Evaluate current state (Step 3)
- **"Review all positions"** → Portfolio-wide thesis review

### Step 1: Create New Thesis

Gather and structure:
- **Company**: Name and ticker
- **Position**: Long or Short
- **Thesis statement**: 1-2 sentence core thesis
- **Key pillars**: 3-5 supporting arguments with measurable milestones
- **Key risks**: 3-5 risks that would invalidate the thesis
- **Catalysts**: Upcoming events (earnings, product launches, regulatory decisions) with dates
- **Target price / valuation**: What it is worth if the thesis plays out (with methodology)
- **Stop-loss trigger**: What would make you exit

Use MCP tools to populate current financial data, consensus estimates, and recent developments.

### Step 2: Update with New Data

For each new data point or development:
- **Date**: When this happened
- **Data point**: What changed (earnings beat, management departure, competitor move, etc.)
- **Pillar impact**: Which pillar(s) does this affect? Strengthen / weaken / neutral?
- **Action**: No change / Increase position / Trim / Exit
- **Updated conviction**: High / Medium / Low

### Step 3: Thesis Scorecard

Maintain a running scorecard:

| Pillar | Original Expectation | Current Status | Trend |
|--------|---------------------|----------------|-------|
| Revenue growth >20% | On track | Q3 was 22% | Stable |
| Margin expansion | Behind | Margins flat YoY | Concerning |
| New product launch | Pending | Delayed to Q2 | Watch |

### Step 4: Catalyst Calendar

Track upcoming catalysts:

| Date | Event | Expected Impact | Notes |
|------|-------|-----------------|-------|
| | | | |

### Step 5: Thesis Assessment

Provide a clear verdict:
- **Thesis intact**: All pillars on track, conviction maintained
- **Thesis weakened**: One or more pillars compromised, lower conviction
- **Thesis broken**: Core assumption invalidated, recommend exit
- **Thesis strengthened**: New evidence reinforces the case

## Output

- **Primary**: `YYYYMMDD-thesis-{Ticker}.md` — complete thesis document
- Suitable for: morning meeting, portfolio review, risk committee presentation
- Format: Concise Markdown with scorecard, recent updates, conviction level
- **Footer**: 数据来源、数据时间（截至 YYYY-MM-DD HH:MM）、免责声明

## Quality Checklist

- [ ] Thesis is falsifiable — if nothing could disprove it, it is not a thesis
- [ ] Disconfirming evidence tracked as rigorously as confirming evidence
- [ ] Each pillar has a measurable milestone (not vague assertions)
- [ ] Catalyst calendar has specific dates, not "sometime next year"
- [ ] Stop-loss trigger is concrete and actionable
- [ ] Financial data pulled from live MCP sources, not training data
- [ ] Conviction level explicitly stated

## Skill Reference

This command invokes the **thesis-tracker** skill. See `skills/thesis-tracker/SKILL.md` for the full thesis management framework.
