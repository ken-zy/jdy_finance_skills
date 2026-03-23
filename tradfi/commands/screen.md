---
description: Run systematic stock screens to surface investment ideas — value, growth, quality, short, or thematic
argument-hint: "<screen_type> [sector] [criteria...]"
allowed-tools: Bash(python3:*), mcp__alpha-vantage__*, WebSearch, WebFetch
---

# Stock Screen

Run a systematic stock screen and present investment idea candidates.

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **alpha-vantage** — 技术指标、行业数据（25次/天限额）

### Layer 2: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 关键指标、行业数据、内部人交易
- `tipranks.com/stocks/{ticker}/forecast` — 分析师评级

### Layer 3: Web Search
- finviz.com for visual screening
- finance.yahoo.com/screener
- sec.gov for insider filings

## Workflow

### Step 1: Define Search Criteria

If not specified in arguments, ask the user:
- **Direction**: Long ideas, short ideas, or both?
- **Market cap**: Large / mid / small / micro
- **Sector**: Specific sector or cross-sector?
- **Style**: Value / growth / quality / special situation / event-driven
- **Geography**: US / international / global
- **Theme**: Any thematic angle? (AI, reshoring, aging demographics, etc.)

### Step 2: Run Quantitative Screen

Apply pre-built filters based on style:

**Value Screen:**
- P/E below sector median
- EV/EBITDA below historical average
- FCF yield >5%
- Price/book below 1.5x
- Insider buying in last 90 days

**Growth Screen:**
- Revenue growth >15% YoY
- Earnings growth >20% YoY
- Revenue acceleration (growth rate increasing)
- Expanding margins
- ROIC >15%

**Quality Screen:**
- Consistent revenue growth (5+ years)
- Stable or expanding margins
- ROE >15%, low debt/equity
- High FCF conversion
- Insider ownership >5%

**Short Screen:**
- Declining revenue or decelerating growth
- Margin compression
- Rising receivables/inventory vs sales
- Insider selling
- Valuation premium to peers without justification

**Special Situation Screen:**
- Recent IPOs/SPACs with lockup expirations
- Spin-offs in last 12 months
- Activist involvement
- Management changes at underperforming companies

### Step 3: Thematic Sweep (if applicable)

For thematic ideas:
1. Define the thesis
2. Map the value chain — direct vs indirect beneficiaries
3. Identify pure-play vs diversified exposure
4. Assess which names are "priced in" vs under-appreciated
5. Look for second-order beneficiaries

### Step 4: Present Results

For each idea that passes the screen:

**[Company Name] — [Long/Short] — [One-Line Thesis]**

| Metric | Value | vs. Peers |
|--------|-------|-----------|
| Market cap | | |
| EV/EBITDA (NTM) | | |
| P/E (NTM) | | |
| Revenue growth | | |
| EBITDA margin | | |
| FCF yield | | |

**Thesis (3-5 bullets):**
- Why this is mispriced
- What the market is missing
- Catalyst to realize value

**Key Risks:**
- What would make this wrong

**Suggested Next Steps:**
- Build full model? Deep-dive diligence?

### Step 5: Summary Output

- Shortlist of 5-10 ideas with one-page summaries
- Screening criteria and methodology documented
- Comparison table across all ideas
- Prioritized list: which ideas to research first

## Output

- **Primary**: `YYYYMMDD-screen-{Type}-{Sector}.md` — full screen results with idea summaries
- **Secondary**: Comparison table (can be .xlsx if >10 names)
- **Footer**: 数据来源、数据时间（截至 YYYY-MM-DD HH:MM）、免责声明

## Quality Checklist

- [ ] Screen criteria clearly documented
- [ ] Data sourced from MCP tools (not stale training data)
- [ ] Each idea has quantitative metrics + qualitative thesis
- [ ] Risks identified for every idea
- [ ] Cross-checked: no duplicate names, no delisted companies
- [ ] Crowding check: ownership data, short interest, analyst coverage noted
- [ ] Ideas prioritized by conviction / quality of setup

## Skill Reference

This command invokes the **idea-generation** skill. See `skills/idea-generation/SKILL.md` for the complete screening methodology and presentation format.
