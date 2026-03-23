---
description: 税务亏损收割 (TLH) — 识别未实现亏损/推荐替代标的/Wash Sale 检查/节税估算
argument-hint: "[portfolio_csv_with_cost_basis]"
allowed-tools: Bash(python3:*), Bash(pip:*), WebSearch, WebFetch
---

# Tax-Loss Harvesting

识别投资组合中的 TLH 机会。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- （无）portfolio 子插件无已批准的 MCP server

### Layer 2: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 实时价格/历史价格/ETF 信息
- 券商税务报告

### Layer 3: Web Search
- Wash Sale 规则、ETF 替代品对照

## Workflow

### Step 1: Input Holdings with Cost Basis
- 持仓 + 数量 + 成本基础 + 买入日期
- 支持 CSV/券商导出文件

### Step 2: Identify TLH Candidates
- 获取当前价格，计算未实现盈亏
- 筛选亏损 >$100 的持仓
- 区分短期/长期

### Step 3: Find Replacement Securities
- 推荐非"实质相同"替代标的
- 维持相似市场敞口（beta/行业/地域）
- ETF 替代通常安全，个股需谨慎

### Step 4: Wash Sale Check
- 30 天规则提醒（前后各 30 天）
- 检查 DRIP 自动再投资风险
- 提醒其他账户（IRA）中的相同持仓

### Step 5: Calculate Tax Savings
- 短期/长期亏损分别计算
- 估算节税金额
- $3,000 年度抵扣上限提示
- 超额亏损结转说明

### Step 6: Generate Execution Plan
每个 TLH 操作：
1. 卖出 [ticker] [数量]
2. 买入 [替代] [数量]
3. 标记 31 天后可换回日期

## Output

- **Primary**: `YYYYMMDD-tlh.md`
- **Optional**: Excel 含盈亏明细
- 免责声明：不构成税务建议

## Quality Checklist

- [ ] 价格来自实时数据源（Chrome CDP / Web Search）
- [ ] 持有期正确（短期 <1年 / 长期 ≥1年）
- [ ] 替代标的非"实质相同"
- [ ] Wash Sale 30 天规则已提醒
- [ ] 税率假设已说明
- [ ] 提醒咨询税务顾问
- [ ] $3,000 年度上限已提及

## Skill Reference

This command invokes the **tax-loss-harvesting** skill. See `skills/tax-loss-harvesting/SKILL.md` for the complete TLH methodology, replacement security selection, and Wash Sale rule guidance.
