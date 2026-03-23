---
description: 催化剂日历 — 财报/经济数据/FOMC/代币解锁/空投快照/协议升级
argument-hint: "[tickers_or_tokens...] [horizon: 2w|month|quarter]"
allowed-tools: mcp__coingecko__*, WebSearch, WebFetch
---

# Catalyst Calendar

构建催化剂日历。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 代币事件、项目动态

### Layer 2: Chrome CDP
- `fred.stlouisfed.org/series/{series_id}` — 经济数据发布日期（CPI、非农、GDP）
- `defillama.com/protocol/{protocol}` — 协议 TVL 变动、DeFi 事件

### Layer 3: Web Search
- 财报日历、FOMC 日期、代币解锁日历、空投日期、加密会议

## Workflow

### Step 1: Define Scope
确认：关注标的、包含宏观事件？包含加密事件？时间范围（默认 2 周）

### Step 2: Gather Events
- **财报事件**: 季度财报日期、投资者日
- **企业事件**: 产品发布、监管决定、M&A
- **宏观事件**: FOMC、非农、CPI/PPI、GDP
- **加密事件**: 代币解锁、空投快照、TGE、协议升级、治理投票、加密会议

### Step 3: Build Calendar Table
按日期排序，标注类型和影响程度。

### Step 4: Weekly Preview
本周关键事件 + 下周预告 + 持仓影响。

## Output

- **Primary**: `YYYYMMDD-catalyst-calendar.md`
- 日历表格 + Weekly Preview

## Quality Checklist

- [ ] 传统和加密事件都覆盖
- [ ] 财报日期经 IR 页面验证
- [ ] 代币解锁标注占流通量百分比
- [ ] FOMC 和重大经济数据不遗漏
- [ ] 影响程度合理评估
- [ ] 时区标注

## Skill Reference

This command invokes the **catalyst-calendar** skill. See `skills/catalyst-calendar/SKILL.md` for the complete calendar format and event categories.
