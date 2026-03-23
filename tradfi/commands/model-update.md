---
description: Update a financial model with new data — plug earnings, revise estimates, recalculate valuation after quarterly results or guidance changes
argument-hint: "<ticker_or_company> [trigger: earnings|guidance|macro|event]"
allowed-tools: Bash(python3:*), Bash(pip:*), mcp__alpha-vantage__*, WebSearch, WebFetch
---

# Model Update

Update an existing financial model with new data and recalculate valuation.

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **alpha-vantage** — 电话会议转录、技术指标（25次/天限额）

### Layer 2: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 最新财报数据、分析师预期
- `seekingalpha.com/symbol/{ticker}/earnings/transcripts` — 电话会议记录

### Layer 3: Web Search
- Company IR pages for press releases
- SEC EDGAR for filings

## Workflow

### Step 1: Identify What Changed

Determine the update trigger:
- **Earnings release**: New quarterly actuals to plug in
- **Guidance change**: Company updated forward outlook
- **Estimate revision**: Changing assumptions based on new data
- **Macro update**: Interest rates, FX, commodity prices changed
- **Event-driven**: M&A, restructuring, new product, management change

### Step 2: Plug New Data

Fetch latest data from MCP tools and present the delta:

| Line Item | Prior Estimate | Actual | Delta | Notes |
|-----------|---------------|--------|-------|-------|
| Revenue | | | | |
| Gross Margin | | | | |
| Operating Expenses | | | | |
| EBITDA | | | | |
| EPS | | | | |
| [Key metric 1] | | | | |
| [Key metric 2] | | | | |

**Segment Detail** (if applicable):
- Update each segment's revenue and margin
- Note any segment mix shifts

**Balance Sheet / Cash Flow Updates:**
- Cash and debt balances
- Share count (buybacks, dilution)
- CapEx actual vs estimate
- Working capital changes

### Step 3: Revise Forward Estimates

| | Old FY Est | New FY Est | Change | Old Next FY | New Next FY | Change |
|---|-----------|-----------|--------|------------|------------|--------|
| Revenue | | | | | | |
| EBITDA | | | | | | |
| EPS | | | | | | |

Document every assumption change with rationale:
- Revenue growth rate: old → new (reason)
- Margin assumption: old → new (reason)
- Any new items (restructuring charges, one-time gains, etc.)

### Step 4: Valuation Impact

Recalculate with updated estimates:

| Valuation Method | Prior | Updated | Change |
|-----------------|-------|---------|--------|
| DCF fair value | | | |
| P/E (NTM EPS x target multiple) | | | |
| EV/EBITDA (NTM EBITDA x target multiple) | | | |
| **Price Target** | | | |

### Step 5: Summary & Action

- One paragraph: what changed, why, and what it means for the stock
- Is this a thesis-changing event or noise?
- Maintain or change rating? New price target?
- Upside/downside to current price

### Step 6: Update Excel Model (if provided)

If user provides an existing .xlsx model:
- Update input cells with new actuals
- Adjust assumption drivers
- Verify all formulas recalculate correctly
- Save as new version: `YYYYMMDD-model-{Ticker}-v{N}.xlsx`

## Output

- **Primary**: Updated Excel model (if user provides existing model)
- **Secondary**: `YYYYMMDD-model-update-{Ticker}.md` — estimate change summary with valuation impact
- Updated price target derivation
- **Footer**: 数据来源、数据时间（截至 YYYY-MM-DD HH:MM）、免责声明

## Quality Checklist

- [ ] Reconciled estimates to company's reported figures before projecting forward
- [ ] Non-recurring items noted; GAAP vs adjusted clearly labeled
- [ ] Share count updated (dilution from stock comp, converts, buybacks)
- [ ] Consensus comparison: how do revised estimates compare to Street?
- [ ] Prior estimate revision history tracked
- [ ] All data from live MCP sources, not training data
- [ ] If updating .xlsx, all formulas still work (no broken references)

## Skill Reference

This command invokes the **model-update** skill. See `skills/model-update/SKILL.md` for the complete update framework and methodology.
