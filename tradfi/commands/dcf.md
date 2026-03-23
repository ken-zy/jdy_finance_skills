---
description: Build a discounted cash flow model with WACC, projections, sensitivity analysis — outputs a professional .xlsx file
argument-hint: "<ticker_or_company> [projection_years]"
allowed-tools: Bash(python3:*), Bash(pip:*), mcp__alpha-vantage__*, WebSearch, WebFetch
---

# DCF Model

Build an institutional-quality DCF valuation model for the target company.

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **alpha-vantage** — 技术指标（25次/天限额）

### Layer 2: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 历史财务数据、现价、股本、资产负债表
- `sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}` — 10-K/10-Q filing

### Layer 3: Web Search
- SEC EDGAR for 10-K/10-Q filings
- finance.yahoo.com for consensus estimates
- macrotrends.net for historical data

Always annotate: "Source: [source name]" on each data point.

## Workflow

### Step 1: Gather Historical Data
Retrieve 3-5 years of historical financials:
- Revenue, COGS, Gross Profit
- Operating Expenses, EBITDA, EBIT
- D&A, CapEx, Changes in Working Capital
- Tax rate, Net Debt, Shares Outstanding, Current Share Price

Query alpha-vantage MCP first (Layer 1). Use Chrome CDP (`finance.yahoo.com/quote/{ticker}`, `sec.gov/edgar`) for financial data (Layer 2). Fall back to web search if Chrome CDP also fails (Layer 3).

### Step 2: Show Inputs — Get Confirmation
Present the raw data block (revenue, margins, shares, net debt) to the user. Do NOT proceed to projections until user confirms.

### Step 3: Build Revenue Projections
- Project revenue 5-10 years forward (default 5, user can override)
- Use historical growth rates as baseline; incorporate analyst consensus if available
- Show projected top line and growth rates to user for confirmation

### Step 4: Build FCF Schedule
- Project margins (gross, operating) based on historical trends + assumptions
- Calculate: EBIT → NOPAT → add D&A → subtract CapEx → subtract delta WC = Unlevered FCF
- Show full FCF schedule to user for confirmation

### Step 5: Calculate WACC
- Cost of Equity: Risk-Free Rate + Beta x Equity Risk Premium
- Cost of Debt: Interest Expense / Total Debt x (1 - Tax Rate)
- Weights: Market Cap / (Market Cap + Net Debt)
- Show WACC calculation and inputs for confirmation

### Step 6: Terminal Value + Equity Bridge
- Terminal Value via Gordon Growth Model: FCF_last x (1 + g) / (WACC - g)
- Discount all FCFs and TV back to present
- Enterprise Value = Sum of PV(FCFs) + PV(TV)
- Equity Value = EV - Net Debt + Cash
- Implied Share Price = Equity Value / Diluted Shares
- Show equity bridge for confirmation

### Step 7: Sensitivity Analysis
Build 3 sensitivity tables (all at the bottom of the DCF sheet):
1. **WACC vs Terminal Growth Rate** → Implied Share Price
2. **Revenue Growth vs EBITDA Margin** → Implied Share Price
3. **EV/EBITDA Exit Multiple vs WACC** → Implied Share Price

Rules:
- Use ODD grid dimensions (5x5 or 7x7) so center cell = base case
- Center cell must equal the model's actual implied share price
- Highlight center cell with medium-blue fill + bold
- ALL cells must contain full DCF recalculation formulas

### Step 8: Build Excel File
Use Python/openpyxl to output standalone `.xlsx`:

**Formula Rules (NON-NEGOTIABLE):**
- Every projection, margin, discount factor, PV, and sensitivity cell MUST be a live Excel formula
- `ws["D20"] = "=D19*(1+$B$8)"` is correct; `ws["D20"] = calculated_revenue` is WRONG
- Only hardcoded: raw historical inputs, assumption drivers, current market data
- Every hardcoded cell gets a comment: "Source: [system], [date], [reference]"

**Layout:**
- Assumptions block at top (blue text for inputs)
- Historical data | Projection columns
- FCF schedule
- WACC calculation
- Equity bridge
- Sensitivity tables at bottom

### Step 9: Executive Summary
Write a brief Markdown summary:
- Implied share price vs current price (upside/downside %)
- Key assumptions driving the valuation
- Sensitivity range (bull / base / bear)

## Output

- **Primary**: `YYYYMMDD-dcf-{Ticker}.xlsx` — full model with live formulas
- **Secondary**: Markdown executive summary
- **Footer**: 数据来源、数据时间（截至 YYYY-MM-DD HH:MM）、免责声明

## Quality Checklist

- [ ] All formulas are live Excel formulas, not Python-computed values
- [ ] Every hardcoded input has a cell comment with source
- [ ] WACC components sourced and documented
- [ ] Terminal value < 75% of total EV (flag if exceeded)
- [ ] Sensitivity center cell = base case implied price
- [ ] No circular references
- [ ] No #DIV/0!, #REF!, #N/A errors
- [ ] FCF does NOT include interest expense (unlevered)
- [ ] Discount period convention documented (mid-year vs end-of-year)

## Skill Reference

This command invokes the **dcf-model** skill. See `skills/dcf-model/SKILL.md` for the complete methodology, section-by-section layout specifications, and formatting standards.
