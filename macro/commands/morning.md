---
description: 每日晨会笔记 — 隔夜市场动态/关键事件/交易想法，覆盖传统金融和加密市场
argument-hint: "[focus: stocks|crypto|macro|all]"
allowed-tools: mcp__coingecko__*, WebSearch, WebFetch
---

# Morning Note

生成每日晨会笔记。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 加密市场隔夜表现、重大价格变动

### Layer 2: Chrome CDP
- `fred.stlouisfed.org/series/{series_id}` — 经济数据发布（利率变动、就业数据等）
- `defillama.com/protocol/{protocol}` — DeFi TVL 变动、协议重大事件

### Layer 3: Web Search
- 财经新闻、期货/盘前数据、加密新闻

## Workflow

### Step 1: Scan Overnight Developments
- **传统市场**: 盈利发布/指引变更/M&A/分析师评级/宏观数据
- **加密市场**: BTC/ETH 价格变动/项目公告/DeFi 事件/监管动态
- **宏观环境**: 期货/盘前/美元/商品/国债收益率

### Step 2: Compile Morning Note
格式：2 分钟内可读完
- 头条（最重要的一件事）
- 隔夜动态（传统市场）
- 加密市场
- 今日关注（含时间）
- 交易想法（如有）

### Step 3: Quick Takes on Earnings
如有关注标的发布财报，提供快速反应表格和观点。

## Output

- **Primary**: `YYYYMMDD-morning-note.md` 或对话中直接显示
- 保持 1 页以内
- 有观点 — 只转述不给观点的晨报没有价值

## Quality Checklist

- [ ] 最重要事件在头条
- [ ] 传统和加密市场都覆盖
- [ ] 事件有观点（不只转述）
- [ ] 今日关注含具体时间
- [ ] 交易想法含风险提示
- [ ] 数据来自实时源

## Skill Reference

This command invokes the **morning-note** skill. See `skills/morning-note/SKILL.md` for the complete morning note format and workflow.
