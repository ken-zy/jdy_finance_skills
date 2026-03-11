---
description: Comprehensive token analysis — price, tokenomics, market structure, technicals, risk assessment
argument-hint: <symbol_or_name> [chain]
allowed-tools: mcp__coingecko__*, WebSearch, WebFetch
---

# Token Analysis

对加密货币代币进行综合分析。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 价格/市值/FDV/供给量/交易对/DEX 数据(GeckoTerminal)

### Layer 2: Web Search
- 解锁时间表、审计报告、项目文档、新闻

### Layer 3: Chrome CDP
- 需登录的页面

Always annotate: "Source: [source name]" on each data point.

## Workflow

### Step 1: Identify Token
- 解析 symbol/名称/合约地址
- 通过 coingecko 搜索确认身份
- 同名代币（不同链）请求用户确认

### Step 2: Fetch Core Data
- 价格、24h 涨跌、市值、FDV、流通量/总供给、排名、24h 交易量

### Step 3: Fetch Market Structure
- 主要 CEX 交易所和交易对
- DEX 流动性池和交易量
- DEX vs CEX 交易量占比

### Step 4: Fetch Supplementary Data
通过 Web Search：
- 解锁时间表、审计状态、团队背景、重要新闻

### Step 5: Compile Report
按以下结构输出：
1. **基础数据**: 价格/24h涨跌/市值/FDV/流通量占比/排名/交易量
2. **代币经济学**: 总供给/流通供给/通胀通缩机制/分配/解锁时间表
3. **市场结构**: 主要交易所和交易对/DEX vs CEX/持仓集中度
4. **技术面**: 7d/30d/90d 走势/支撑阻力位/BTC ETH 相关性
5. **风险标注**: 合约地址验证/审计状态/监管风险

## Output

- **Primary**: `{Symbol}_Token_Analysis_{YYYYMMDD}.md`
- Footer: 数据来源、数据时间戳、免责声明

## Quality Checklist

- [ ] 代币身份确认（未与同名不同链代币混淆）
- [ ] 市值和 FDV 都已报告
- [ ] 供给数据区分流通量/总供给/最大供给
- [ ] 非原生代币包含合约地址
- [ ] 数据时效性标注
- [ ] 风险部分存在

## Skill Reference

This command invokes the **token-analysis** skill. See `skills/token-analysis/SKILL.md` for the complete analysis methodology and output format.
