---
description: 投资组合再平衡 — 偏离度分析/再平衡交易建议/税务感知/交易成本优化
argument-hint: "[portfolio_csv_or_description] [new_cash: amount]"
allowed-tools: Bash(python3:*), Bash(pip:*), WebSearch, WebFetch
---

# Portfolio Rebalance

分析投资组合偏离度并生成再平衡建议。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- （无）portfolio 子插件无已批准的 MCP server

### Layer 2: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 实时股价/ETF价格/持仓市值
- 券商页面

### Layer 3: Web Search
- 资产类别基准、ETF 信息

Always annotate: "Source: [source name]" on each data point.

## Workflow

### Step 1: Input Portfolio
- 获取当前持仓（ticker + 数量/市值）
- 支持 CSV/Excel 输入或口述

### Step 2: Define Target Allocation
- 用户已有目标 → 直接使用
- 无目标 → 根据风险偏好建议配置

### Step 3: Fetch Prices & Calculate Drift
- 获取实时价格，计算当前权重
- 计算偏离度（正常 <2% / 轻微 2-5% / 需再平衡 ≥5%）

### Step 4: Generate Rebalance Trades
- 调整交易列表（买入/卖出/金额/股数）
- 优先用新增资金调整
- 标注预估交易成本

### Step 5: Tax Impact Preview
- 如有成本基础：预估资本利得/损失
- 建议 TLH 机会

## Output

- **Primary**: `YYYYMMDD-rebalance.md`
- **Optional**: Excel 输出（持仓多时）

## Quality Checklist

- [ ] 价格来自实时数据源（Chrome CDP / Web Search）
- [ ] 权重之和等于 100%
- [ ] 调整金额净为 0（或等于新增资金）
- [ ] 调整股数取整
- [ ] 偏离阈值明确
- [ ] 税务影响已提醒

## Skill Reference

This command invokes the **portfolio-rebalance** skill. See `skills/portfolio-rebalance/SKILL.md` for the complete rebalancing methodology, drift thresholds, and tax-aware optimization.
