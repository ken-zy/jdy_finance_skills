---
description: Build a comparable company analysis with operating metrics, valuation multiples, and statistical benchmarking — outputs a professional .xlsx file
argument-hint: "<ticker_or_company> [peers...]"
allowed-tools: Bash(python3:*), Bash(pip:*), mcp__alpha-vantage__*, WebSearch, WebFetch
---

# Comparable Company Analysis

Build an institutional-grade comps table for the target company and its peers.

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

Fetch data using the three-layer fallback:

### Layer 1: MCP
- **alpha-vantage** — 技术指标、财报日历（25次/天限额）

### Layer 2: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 股票行情、财报、关键指标
- `sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}` — SEC Filing
- `tipranks.com/stocks/{ticker}/forecast` — 分析师预期

### Layer 3: Web Search
- finance.yahoo.com, macrotrends.net for financial data
- SEC EDGAR for filings

Always annotate: "Source: [source name]" on each data point.

## Workflow

### Step 1: Identify Peer Group
- Confirm the target company ticker
- If peers not specified, identify 4-8 comparable companies based on: sector, business model, market cap range, geographic footprint
- Ask user to confirm the peer list before proceeding

### Step 2: Gather Financial Data
For each company, retrieve:
- **Revenue** (LTM or latest FY), revenue growth YoY
- **Gross Profit** and Gross Margin
- **EBITDA** and EBITDA Margin
- **Net Income** and EPS
- **Market Cap**, **Enterprise Value**
- **Free Cash Flow** (if available)

Query alpha-vantage MCP first (Layer 1). Use Chrome CDP (`finance.yahoo.com/quote/{ticker}`, `sec.gov/edgar`, `tipranks.com`) for financial data (Layer 2). Fall back to web search if Chrome CDP also fails (Layer 3).

### Step 3: Show Inputs for Confirmation
Present the raw data block to the user. Confirm all figures and their sources before building formulas. Do NOT build the entire sheet end-to-end without checkpoints.

### Step 4: Build the Excel Model
Use Python/openpyxl to create a standalone `.xlsx` file:

**Operating Metrics Section:**
- Company, Revenue, Revenue Growth, Gross Margin, EBITDA, EBITDA Margin
- Add industry-specific metrics if relevant (Rule of 40 for SaaS, ROE for financials, etc.)

**Valuation Multiples Section:**
- Market Cap, Enterprise Value, EV/Revenue, EV/EBITDA, P/E
- Add FCF Yield, PEG, or other multiples as appropriate

**Statistics Block (for each section):**
- Maximum, 75th Percentile, Median, 25th Percentile, Minimum
- Apply to comparable metrics (ratios, margins, multiples) — not to absolute size metrics

**Formula Rules (NON-NEGOTIABLE):**
- Every derived value MUST be an Excel formula referencing input cells: `cell.value = "=E7/C7"`
- NEVER write pre-computed Python values: `cell.value = 0.687` is WRONG
- Only hardcoded values = raw input data; every hardcode gets a cell comment with its source

### Step 5: Format and Polish
- Blue text for hardcoded inputs, black for formulas
- Section headers: dark blue background, white bold text
- Column headers: light blue background, black bold text
- Statistics rows: light grey background
- Percentages to 1 decimal, multiples to 1 decimal with "x" suffix, dollar amounts with thousands separator
- Uniform column widths, consistent row heights, center-aligned metrics

### Step 6: Notes & Methodology
Add a Notes section (separate sheet or below data) documenting:
- Data sources for each company
- Time period covered
- EBITDA calculation method
- Any adjustments or exclusions

## Output

- **Primary**: `YYYYMMDD-comps-{Target}.xlsx` — full comps table with formulas
- **Secondary**: Brief Markdown summary with key findings (median multiples, where target sits vs peers)
- **Footer**: 数据来源、数据时间（截至 YYYY-MM-DD HH:MM）、免责声明

## Quality Checklist

Before delivering, verify:
- [ ] All companies are truly comparable
- [ ] Data from consistent time periods
- [ ] Units clearly labeled (millions/billions)
- [ ] ALL formulas reference cells, not hardcoded values
- [ ] Every hardcoded input has a cell comment citing source
- [ ] Statistics cover Max, 75th, Median, 25th, Min
- [ ] Margin sanity: Gross > EBITDA > Net
- [ ] Multiple reasonableness: EV/Rev 0.5-20x, EV/EBITDA 8-25x, P/E 10-50x
- [ ] No #DIV/0!, #REF!, #N/A errors
- [ ] Date stamp is current

## Skill Reference

This command invokes the **comps-analysis** skill. See `skills/comps-analysis/SKILL.md` for the full methodology, formatting conventions, industry-specific metric selection, and example templates.
