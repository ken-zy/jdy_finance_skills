---
description: DeFi protocol analysis — TVL, multi-chain deployment, yield analysis, competitive comparison
argument-hint: <protocol_name> [chain]
allowed-tools: mcp__defillama__*, mcp__coingecko__*, WebSearch, WebFetch
---

# DeFi Protocol Analysis

对 DeFi 协议进行综合分析。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1 Primary: MCP
- **defillama** — TVL/交易量/费用收入/收益率/链分布

### Layer 1 Secondary: MCP
- **coingecko** — 协议代币数据/DEX 补充数据

### Layer 2: Web Search
- 协议文档、审计报告、治理提案

### Layer 3: Chrome CDP
- 需登录的页面

Always annotate: "Source: [source name]" on each data point.

## Workflow

### Step 1: Identify Protocol
- 解析协议名称，通过 defillama 确认
- 确定类别：DEX/借贷/桥/收益聚合/流动性质押/其他

### Step 2: Fetch Core Metrics
- TVL（USD）、TVL 变化(7d/30d)、链分布、日交易量、费用/收入

### Step 3: Fetch Yield Data
- 主要池子 APY 排名、稳定池 vs 波动池、IL 风险

### Step 4: Fetch Competitors
- 同赛道 TVL 排名、交易量/费用对比、市值/TVL 比

### Step 5: Compile Report
按以下结构输出：
1. **核心指标**: TVL/TVL变化/链分布/交易量/费用收入
2. **多链部署**: 各链 TVL 和交易量对比
3. **收益分析**: 主要池 APY 排名/稳定 vs 波动/IL 风险
4. **竞品对比**: 同赛道协议对比，市值/TVL 比
5. **代币关联**: 如有代币，建议使用 token-analysis

## Output

- **Primary**: `{Protocol}_DeFi_Analysis_{YYYYMMDD}.md`
- Footer: 数据来源、数据时间戳、免责声明

## Quality Checklist

- [ ] 协议正确识别（匹配 defillama slug）
- [ ] TVL 以 USD 计价
- [ ] 链分布之和等于总 TVL
- [ ] 竞品选择同赛道
- [ ] 收益区分 APY/APR，标注代币激励
- [ ] AMM 池标注 IL 风险

## Skill Reference

This command invokes the **defi-protocol** skill. See `skills/defi-protocol/SKILL.md` for the complete analysis methodology and output format.
