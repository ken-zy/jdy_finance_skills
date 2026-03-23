---
description: Create a professional earnings update report analyzing quarterly results — beat/miss, updated estimates, thesis impact
argument-hint: "<ticker_or_company> [quarter, e.g. Q3 2024]"
allowed-tools: Bash(python3:*), Bash(pip:*), mcp__alpha-vantage__*, WebSearch, WebFetch
---

# Earnings Update

Create an institutional-quality earnings update report (8-12 pages) for the target company.

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **alpha-vantage** — 电话会议转录、财报日历（25次/天限额）

### Layer 2: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 财报数据、分析师预期
- `seekingalpha.com/symbol/{ticker}/earnings/transcripts` — 电话会议记录全文

### Layer 3: Web Search
- seekingalpha.com for earnings transcripts
- finance.yahoo.com/earnings
- sec.gov/cgi-bin/browse-edgar for filings

## Critical: Use Latest Data

**BEFORE STARTING — COMPLETE THESE 4 STEPS:**
1. **CHECK TODAY'S DATE** — write down the current date
2. **SEARCH FOR LATEST** — use MCP tools or web search: "[Company] latest earnings results"
3. **VERIFY THE DATE** — confirm earnings release is within last 3 months
4. **CHECK TRANSCRIPT DATE** — verify transcript date matches release date

Do NOT rely on training data for earnings figures. Always fetch live data.

## Workflow

### Phase 1: Data Collection (30-60 min)
1. Query alpha-vantage MCP for earnings call transcript and calendar (Layer 1)
2. Use Chrome CDP (`finance.yahoo.com/quote/{ticker}`) for earnings results and financial statements (Layer 2)
3. Use Chrome CDP (`seekingalpha.com/symbol/{ticker}/earnings/transcripts`) for full transcripts (Layer 2)
4. Fall back to web search (Seeking Alpha, Yahoo Finance, SEC EDGAR) if Chrome CDP also fails (Layer 3)

### Phase 2: Beat/Miss Analysis
For each key metric, calculate:

| Metric | Consensus | Actual | Beat/Miss | Delta | Delta % |
|--------|-----------|--------|-----------|-------|---------|
| Revenue | | | | | |
| EPS | | | | | |
| Gross Margin | | | | | |
| EBITDA | | | | | |
| [Key metric 1] | | | | | |

- Lead with whether company beat or missed
- Quantify variances ("Revenue beat by $120M or 3%")
- Explain WHY results differed from expectations

### Phase 3: Analysis
- Segment/geographic/product breakdown
- Margin trends (QoQ and YoY)
- Management guidance: maintained, raised, or lowered?
- Key quotes from earnings call
- Updated forward estimates (old vs new, with rationale)

### Phase 4: Chart Generation
Create 8-12 charts using Python (matplotlib/seaborn):
- Quarterly revenue progression
- Quarterly EPS progression
- Margin trends over time
- Revenue by segment/geography
- Beat/miss history
- Estimate revisions
- Valuation context (P/E, EV/EBITDA over time)

### Phase 5: Report Assembly
Structure (8-12 pages):
- **Page 1**: Summary — rating, price target, key takeaways (3-5 bullet points)
- **Pages 2-3**: Detailed results analysis with beat/miss tables
- **Pages 4-5**: Key metrics, guidance analysis, management commentary
- **Pages 6-7**: Updated investment thesis assessment
- **Pages 8-10**: Valuation and revised estimates
- **Pages 11-12**: Appendix (optional)

### Phase 6: Quality Check
- Verify all numbers against primary sources
- Ensure citations with specific documents and dates
- Check that charts match data in tables

## Output

- **Primary**: `YYYYMMDD-earnings-{Ticker}.md` — full report with embedded charts
- **Secondary**: Updated estimate table (can be separate .xlsx if requested)
- **Footer**: 数据来源、数据时间（截至 YYYY-MM-DD HH:MM）、免责声明

## Citation Requirements

Every figure and table MUST cite source with specific document and date:
```
Source: Q3 2024 10-Q filed November 8, 2024; Company earnings release
```

Include a "SOURCES & REFERENCES" section at end listing all materials with URLs.

## Quality Checklist

- [ ] Earnings data is from the LATEST quarter (verified via search, not training data)
- [ ] Beat/miss analysis quantifies variances with both $ and %
- [ ] Old vs new estimates shown clearly with change rationale
- [ ] Management guidance changes cited with current and prior sources
- [ ] 8-12 charts included
- [ ] All figures have source citations
- [ ] Sources section lists all materials with URLs
- [ ] Report is 3,000-5,000 words, 8-12 pages

## Skill Reference

This command invokes the **earnings-analysis** skill. See `skills/earnings-analysis/SKILL.md` for the complete report structure, chart specifications, and quality standards.
