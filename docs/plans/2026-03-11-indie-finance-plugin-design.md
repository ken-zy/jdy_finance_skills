# indie-finance-plugin 设计方案

> 独立投资者金融分析插件 — 基于 Anthropic financial-services-plugins 架构，替换为免费数据源，新增 Crypto 模块
>
> 设计日期：2026-03-11
> 状态：Phase 1-4 已完成，Phase 5 待实施
> 架构变更：已从单插件改为多插件 marketplace（2026-03-11 决定）

---

## 一、项目概述

### 目标

构建一个 Claude Code 插件，为独立投资者提供机构级金融分析能力，覆盖传统金融（美股/港股）和加密市场（代币/DeFi/空投），全部基于免费或低成本数据源。

### 方案选择

**方案 A：轻量 Fork** — Fork Anthropic 的 `financial-services-plugins` 结构，替换数据源为免费 MCP，裁剪机构专用 skill，新增 Crypto 模块。

选择理由：官方的 comps/DCF/earnings skill 文件质量极高（含完整分析框架、公式逻辑、质量检查清单），从零编写难以超越。Crypto 部分本来就需要新建。

### 来源仓库

- Fork 基础：https://github.com/anthropics/financial-services-plugins
- 核心提取：`financial-analysis/` 和 `equity-research/` 中的 skill

---

## 二、插件架构

> **架构决策**：采用多插件 marketplace 架构，每个子模块独立管理 MCP、commands、skills。
> 原因：各模块数据源完全不同，独立管理更清晰；用户可按需安装子插件。

### 目录结构

```
indie-finance-plugin/
├── .claude-plugin/
│   └── marketplace.json          # 多插件入口，注册 4 个子插件
├── CLAUDE.md                     # 全局指令（fallback 策略、输出规则）
├── README.md
├── .gitignore
│
├── tradfi/                       # 子插件 1: 传统金融 [Phase 2 ✅]
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json                 # yahoo-finance, alpha-vantage, fmp
│   ├── hooks/hooks.json
│   ├── commands/
│   │   ├── comps.md              # /tradfi:comps [ticker]
│   │   ├── dcf.md                # /tradfi:dcf [ticker]
│   │   ├── earnings.md           # /tradfi:earnings [ticker] [Q]
│   │   ├── screen.md             # /tradfi:screen [条件]
│   │   ├── thesis.md             # /tradfi:thesis [ticker]
│   │   ├── model-update.md       # /tradfi:model-update [ticker]
│   │   └── debug-model.md        # /tradfi:debug-model [path]
│   ├── skills/
│   │   ├── comps-analysis/SKILL.md
│   │   ├── dcf-model/
│   │   │   ├── SKILL.md
│   │   │   ├── TROUBLESHOOTING.md
│   │   │   ├── requirements.txt
│   │   │   └── scripts/validate_dcf.py
│   │   ├── earnings-analysis/
│   │   │   ├── SKILL.md
│   │   │   └── references/{best-practices,report-structure,workflow}.md
│   │   ├── competitive-analysis/
│   │   │   ├── SKILL.md
│   │   │   └── references/{frameworks,schemas}.md
│   │   ├── clean-data-xls/SKILL.md
│   │   ├── idea-generation/SKILL.md
│   │   ├── thesis-tracker/SKILL.md
│   │   ├── audit-xls/SKILL.md
│   │   └── model-update/SKILL.md
│   └── _reference/               # 保留但不激活的官方 skill（13 个）
│
├── crypto/                       # 子插件 2: 加密市场 [Phase 3 ✅]
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json                 # coingecko, defillama, dune
│   ├── hooks/hooks.json
│   ├── commands/
│   │   ├── token.md              # /crypto:token [symbol]
│   │   ├── defi.md               # /crypto:defi [protocol]
│   │   ├── airdrop.md            # /crypto:airdrop [project]
│   │   └── onchain.md            # /crypto:onchain [query]
│   └── skills/
│       ├── token-analysis/SKILL.md
│       ├── defi-protocol/SKILL.md
│       ├── airdrop-eval/
│       │   ├── SKILL.md
│       │   └── references/scoring-framework.md
│       └── onchain-query/
│           ├── SKILL.md
│           └── references/preset-queries.md
│
├── macro/                        # 子插件 3: 宏观经济 [Phase 4 ✅]
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json                 # fred, defillama, coingecko
│   ├── hooks/hooks.json
│   ├── commands/
│   │   ├── dashboard.md          # /macro:dashboard
│   │   ├── morning.md            # /macro:morning
│   │   └── catalyst.md           # /macro:catalyst
│   └── skills/
│       ├── macro-dashboard/SKILL.md
│       ├── morning-note/SKILL.md     # 适配自官方 equity-research
│       ├── catalyst-calendar/SKILL.md # 适配自官方 equity-research
│       └── news-digest/SKILL.md      # 自动触发，无独立命令
│
├── portfolio/                    # 子插件 4: 组合管理 [Phase 5 待实施]
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json                 # yahoo-finance
│   ├── hooks/hooks.json
│   ├── commands/
│   │   ├── rebalance.md          # /portfolio:rebalance
│   │   └── tlh.md                # /portfolio:tlh
│   └── skills/
│       ├── portfolio-rebalance/SKILL.md
│       └── tax-loss-harvesting/SKILL.md
│
└── docs/
    ├── plans/                    # 设计文档
    └── superpowers/              # brainstorming specs & plans
```

---

## 三、数据源配置

### MCP 服务器清单

#### 免费层（$0，无需 Key 或注册即可）

| MCP Server | 来源 | 传输方式 | 工具数 | 覆盖范围 | 限制 |
|-----------|------|---------|--------|---------|------|
| **Yahoo Finance MCP** | [Alex2Yang97/yahoo-finance-mcp](https://github.com/Alex2Yang97/yahoo-finance-mcp) (235 stars) | stdio | 9 | 股票行情/财报/新闻/期权/持仓 | 无需 Key，无官方限制 |
| **CoinGecko MCP** | 官方 `@coingecko/coingecko-mcp` | HTTP streaming | 76+ | 15k+ 币种行情，GeckoTerminal 链上 DEX 数据 | Demo: 30 次/分, 10,000 次/月 |
| **DefiLlama MCP** | [IQAIcom/mcp-defillama](https://github.com/IQAIcom/mcp-defillama) (活跃) | stdio | 14 | TVL/DEX volumes/费用收入/Yield/代币价格 | 完全免费，无需 Key |
| **FRED MCP** | [stefanoamorelli/fred-mcp-server](https://github.com/stefanoamorelli/fred-mcp-server) (65 stars) | stdio + streamable-http | 3 | 800,000+ 宏观经济数据系列 | 120 次/分，需免费 Key |

#### 增强层（$0，需注册免费 API Key）

| MCP Server | 来源 | 传输方式 | 工具数 | 覆盖范围 | 限制 |
|-----------|------|---------|--------|---------|------|
| **Alpha Vantage MCP** | [官方](https://github.com/alphavantage/alpha_vantage_mcp) (97 stars) | stdio + HTTP | 60+ | 技术指标/电话会议/新闻情绪/期权/外汇 | 25 次/天, 5 次/分钟 |
| **Financial Modeling Prep MCP** | [imbenrabi/FMP-MCP-Server](https://github.com/imbenrabi/Financial-Modeling-Prep-MCP-Server) (123 stars) | HTTP/SSE | 253+ | SEC filing/DCF/内幕交易/机构持仓/分析师 | 250 次/天 |
| **Dune Analytics MCP** | [kukapay/dune-analytics-mcp](https://github.com/kukapay/dune-analytics-mcp) (40 stars) | stdio | 2 | 链上自定义 SQL 查询 | 15+40 次/分钟 |

#### 付费层（可选升级）

| MCP Server | 来源 | 用途 | 月费 |
|-----------|------|------|------|
| **Polygon.io MCP** | [官方](https://github.com/polygon-io/mcp_polygon) (262 stars) | 实时行情/期权 Greeks/Sharpe | $29/月起 |
| **CoinMarketCap MCP** | [shinzo-labs/coinmarketcap-mcp](https://github.com/shinzo-labs/coinmarketcap-mcp) (50 stars) | 加密排名/全球指标/恐惧贪婪 | 免费 Basic 可用 |
| **Twelve Data MCP** | [官方](https://github.com/twelvedata/mcp) (58 stars) | 100+ 技术指标 | $8/月起 |

### `.mcp.json` 配置

```json
{
  "mcpServers": {
    "yahoo-finance": {
      "type": "stdio",
      "command": "uvx",
      "args": ["yahoo-finance-mcp"]
    },
    "coingecko": {
      "type": "http",
      "command": "npx",
      "args": ["@coingecko/coingecko-mcp"]
    },
    "defillama": {
      "type": "stdio",
      "command": "npx",
      "args": ["@iqai/mcp-defillama"]
    },
    "fred": {
      "type": "stdio",
      "command": "npx",
      "args": ["@stefanoamorelli/fred-mcp-server"],
      "env": { "FRED_API_KEY": "${FRED_API_KEY}" }
    },
    "alpha-vantage": {
      "type": "http",
      "url": "https://mcp.alphavantage.co",
      "env": { "ALPHA_VANTAGE_API_KEY": "${ALPHA_VANTAGE_API_KEY}" }
    },
    "financial-modeling-prep": {
      "type": "http",
      "url": "https://your-fmp-mcp-instance",
      "env": { "FMP_API_KEY": "${FMP_API_KEY}" }
    },
    "dune": {
      "type": "stdio",
      "command": "uvx",
      "args": ["dune-analytics-mcp"],
      "env": { "DUNE_API_KEY": "${DUNE_API_KEY}" }
    }
  }
}
```

### 需注册的免费 API Key

| 服务 | 注册地址 | 用途 |
|------|---------|------|
| Alpha Vantage | alphavantage.co/support | 技术指标、电话会议 |
| Financial Modeling Prep | financialmodelingprep.com | SEC filing、DCF |
| FRED | fred.stlouisfed.org/docs/api | 宏观经济数据 |
| Dune Analytics | dune.com/settings/api | 链上查询 |

Yahoo Finance、CoinGecko（Demo 模式）、DefiLlama 无需任何 Key。

---

## 四、三层 Fallback 策略

每个 Skill 的数据获取逻辑统一遵循：

```
Layer 1: MCP 数据源（首选）
  → 查询对应的 MCP server
  → 成功则使用，标注 "Source: [MCP名称]"

Layer 2: Web Search（MCP 不可用或数据不足时）
  → 使用 WebSearch 工具搜索
  → 优先搜索权威来源（SEC EDGAR, Yahoo Finance, CoinGecko 网页等）
  → 标注 "Source: Web Search - [URL]"

Layer 3: Chrome CDP 直接访问（Web Search 也不可用时）
  → 通过 baoyu-url-to-markdown skill 用 Chrome 访问目标 URL
  → 适用：需要登录的页面、被 bot 检测拦截的站点、动态渲染页面
  → 标注 "Source: Direct Fetch - [URL]"
```

### 数据源-场景映射

| 场景 | Layer 1 (MCP) | Layer 2 (Web Search) | Layer 3 (Chrome) |
|------|--------------|---------------------|------------------|
| 股票行情/财报 | yahoo-finance | finance.yahoo.com | 同左 |
| 技术指标 | alpha-vantage | tradingview.com | TradingView 页面 |
| SEC Filing | financial-modeling-prep | sec.gov/edgar | EDGAR 全文 |
| 电话会议 | alpha-vantage | seekingalpha.com/transcripts | Seeking Alpha（需登录） |
| 分析师预期 | financial-modeling-prep | tipranks.com, wsj.com | TipRanks 页面 |
| 加密行情 | coingecko | coingecko.com | 同左 |
| DeFi 数据 | defillama | defillama.com | 同左 |
| 链上数据 | dune | dune.com/queries | Dune 查询页面 |
| 宏观经济 | fred | fred.stlouisfed.org | 同左 |
| 新闻 | yahoo-finance / alpha-vantage | google news search | 具体新闻站点 |

---

## 五、模块详细设计

### 5.1 TradFi 模块（`tradfi/` 子插件）✅ Phase 2 完成

#### Fork 策略

从 `anthropics/financial-services-plugins` 提取 9 个 skill，保留分析框架，替换数据源引用：

| 官方 Skill | 改动点 | 状态 |
|-----------|--------|------|
| `comps-analysis` | 数据优先级改为 "yahoo-finance → fmp → alpha-vantage → web → chrome" | ✅ |
| `dcf-model` | 同上，含 `validate_dcf.py` 脚本直接复用 | ✅ |
| `earnings-analysis` | 含 `references/` 下 3 个文件，替换数据源 | ✅ |
| `competitive-analysis` | 含 `references/` 下 2 个文件，替换数据源 | ✅ |
| `clean-data-xls` | 移除 Office JS，保留 Python/openpyxl | ✅ |
| `idea-generation` | 从 _reference 升级为正式 skill，添加免费数据源 | ✅ |
| `thesis-tracker` | 从 _reference 升级为正式 skill，添加免费数据源 | ✅ |
| `audit-xls` | 从 _reference 升级为正式 skill，通用审计框架 | ✅ |
| `model-update` | 从 _reference 升级为正式 skill，添加免费数据源 | ✅ |

#### 机构专用 Skill（保留为 `_reference/`）

不注册 command，不激活，纯作后续参考优化（13 个，原 17 个中 4 个已升级为正式 skill）：
lbo-model, cim-builder, process-letter, strip-profile, pitch-deck, initiating-coverage, merger-model, buyer-list, deal-tracker, datapack-builder, morning-note, catalyst-calendar, sector-overview, earnings-preview

> 注：原 _reference 中的 thesis-tracker、idea-generation、model-update、audit-xls（实为 financial-analysis 下的 skill）已升级为正式 skill，不再列入 _reference。

#### 命令设计

| Command | 用途 | 输出 |
|---------|------|------|
| `/tradfi:comps [ticker]` | 可比公司分析 | Excel (.xlsx) + Markdown 摘要 |
| `/tradfi:dcf [ticker]` | DCF 估值模型 | Excel (.xlsx) + Markdown 摘要 |
| `/tradfi:earnings [ticker] [Q]` | 财报分析 | Markdown 报告 (8-12 页) |
| `/tradfi:screen [条件]` | 股票筛选 | Markdown |
| `/tradfi:thesis [ticker]` | 投资论点管理 | Markdown |
| `/tradfi:model-update [ticker]` | 模型更新 | Excel + Markdown |
| `/tradfi:debug-model [path]` | 模型审计 | 审计报告 |

### 5.2 Crypto 模块（新建）

#### `/token [symbol]` — 代币分析

数据源：CoinGecko MCP → Web Search → Chrome

输出内容：
- 基础数据：价格/24h涨跌/市值/FDV/流通量占比/市值排名/交易量
- 代币经济学：总供给/流通供给/通胀通缩机制/代币分配/解锁时间表
- 市场结构：主要交易所和交易对/DEX vs CEX 交易量/持仓集中度
- 技术面：7d/30d/90d 价格走势/关键支撑阻力位/与 BTC/ETH 相关性
- 风险标注：合约地址验证/审计状态/监管风险

#### `/defi [protocol]` — DeFi 协议分析

数据源：DefiLlama MCP → CoinGecko GeckoTerminal → Chrome

输出内容：
- 核心指标：TVL/TVL变化(7d/30d)/链分布/日交易量/费用收入
- 多链部署：各链 TVL 和交易量对比
- 收益分析：主要池子 APY 排名/稳定池 vs 波动池/IL 风险提示
- 竞品对比：同赛道协议 TVL/交易量/费用对比，市值/TVL 比
- 代币：关联 /token 分析

#### `/airdrop [project]` — 空投项目评估（升级版）

数据源：CoinGecko + DefiLlama + Dune + Web Search + Chrome

流程：
1. 用户输入项目名称
2. 自动拉取可获取的数据（CoinGecko 代币信息、DefiLlama TVL、Dune 链上活跃度、Web Search 融资/团队/社区信息、Chrome 官网/文档）
3. 基于数据预填六维度评分建议
4. 用户确认/调整评分
5. 输出评估报告

六维度评分框架（沿用现有体系）：

| 维度 | 自动数据辅助 |
|------|------------|
| 发币意愿（总包潜力/分配机制/规则稳定性） | 搜索官方公告、文档中的 tokenomics |
| 筹码获取（与自身优势匹配） | 链上参与门槛、积分机制分析 |
| 增长与可持续性 | TVL 趋势、社区增长、融资背景 |
| 单位成本（资金利用率） | Gas 费估算、参与所需资金量 |
| 暴击几率（竞争拥挤度/女巫影响） | 参与人数/地址数趋势、拥挤度 |
| 风险等级（KYC/监管/作恶/女巫规则） | 审计状态、合约权限、监管敏感度 |

档位判定：
- Sprint: total >= 25 AND chip >= 4 AND risk >= 4
- 中等维护: total 20-24 AND chip >= 3 AND risk >= 4
- 低保维护: total 15-19 AND chip >= 2 AND risk >= 3

输出格式对齐现有 `P-xxx空投.md` 模板，包含 `[[A-Web3投资]]` 双链。

#### `/onchain [query]` — 链上数据查询

数据源：Dune Analytics MCP

用法：自然语言 → Claude 转化为 Dune query ID 或 SQL → 执行 → 格式化结果。预置常用 query ID（TVL、交易量、地址数等），支持用户指定 query ID。

### 5.3 通用模块（新建）

#### `/macro` — 宏观经济看板

数据源：FRED MCP → DefiLlama → CoinGecko → Web Search

输出内容：
- 利率环境：联邦基金利率/10Y国债/2Y国债/2-10Y利差/降息预期
- 通胀：CPI (YoY/MoM)/Core CPI/PCE/12个月趋势
- 就业：非农/失业率/初请失业金
- 市场情绪：VIX/恐惧贪婪指数/美元指数 DXY
- 加密相关宏观：BTC与纳斯达克相关性/稳定币总市值/全球加密市值
- 关键日历：未来2周经济数据发布日期

#### News Digest（自动触发 Skill）

不设独立命令。当用户提到公司/代币时，Claude 自动判断是否需要补充最新新闻。通过 yahoo-finance 和 alpha-vantage 新闻端点获取。

---

## 六、输出格式规则

```
1. 估值模型（/comps, /dcf）
   → .xlsx 文件（带公式，蓝=输入 黑=公式）+ Markdown 摘要
   → 存放：当前工作目录

2. 分析报告（/earnings, /screen, /token, /defi, /macro）
   → Markdown 文件
   → 如在 Obsidian vault 中使用，自动添加 [[双链]]
   → 文件命名：YYYYMMDD-{类型}-{标的}.md

3. 项目评估（/airdrop）
   → Markdown 文件
   → 格式对齐 P-xxx 项目评估模板
   → 包含六维度评分表 + 档位判定

4. 链上查询（/onchain）
   → 对话内表格
   → 用户可追加"保存"输出为文件

所有输出底部标注：
- 数据来源（哪个 MCP / 哪个 URL）
- 数据时间（截至 YYYY-MM-DD HH:MM）
- 免责声明（一行）
```

---

## 七、命令总览

| 命令 | 子插件 | 数据源优先级 | 输出格式 | 状态 |
|------|--------|------------|---------|------|
| `/tradfi:comps [ticker]` | tradfi | yahoo → fmp → alpha-vantage → web → chrome | Excel + Markdown | ✅ |
| `/tradfi:dcf [ticker]` | tradfi | yahoo → fmp → alpha-vantage → web → chrome | Excel + Markdown | ✅ |
| `/tradfi:earnings [ticker] [Q]` | tradfi | alpha-vantage → yahoo → fmp → web → chrome | Markdown | ✅ |
| `/tradfi:screen [条件]` | tradfi | yahoo → fmp → web → chrome | Markdown | ✅ |
| `/tradfi:thesis [ticker]` | tradfi | yahoo → fmp → alpha-vantage → web → chrome | Markdown | ✅ |
| `/tradfi:model-update [ticker]` | tradfi | yahoo → fmp → alpha-vantage → web → chrome | Excel + Markdown | ✅ |
| `/tradfi:debug-model [path]` | tradfi | 本地文件 | 审计报告 | ✅ |
| `/crypto:token [symbol]` | crypto | coingecko → web → chrome | Markdown | ✅ |
| `/crypto:defi [protocol]` | crypto | defillama → coingecko → web → chrome | Markdown | ✅ |
| `/crypto:airdrop [project]` | crypto | coingecko → defillama → dune → web → chrome | Markdown (P-模板) | ✅ |
| `/crypto:onchain [query]` | crypto | dune → web → chrome | 对话内表格 | ✅ |
| `/macro:dashboard [scope]` | macro | fred → defillama → coingecko → web | Markdown | ✅ |
| `/macro:morning [focus]` | macro | fred → coingecko → defillama → web | Markdown | ✅ |
| `/macro:catalyst [tickers]` | macro | fred → coingecko → defillama → web | Markdown | ✅ |
| `/portfolio:rebalance` | portfolio | yahoo-finance | Markdown + Excel | 待实施 |
| `/portfolio:tlh` | portfolio | yahoo-finance | Markdown + Excel | 待实施 |

---

## 八、实现计划

### Phase 划分

```
Phase 1: 基础骨架 + 数据层 ✅ 完成
  ├── 创建多插件 marketplace 目录结构
  ├── 4 个子插件骨架（tradfi/crypto/macro/portfolio）
  ├── 各子插件 .mcp.json 配置
  ├── 编写 CLAUDE.md（fallback 策略、输出规则）
  └── README.md、.gitignore

Phase 2: TradFi 模块 ✅ 完成
  ├── Fork 9 个 skill（原计划 5 个，审计后增加 4 个）
  │   ├── 原计划: comps-analysis, dcf-model, earnings-analysis, competitive-analysis, clean-data-xls
  │   └── 新增: idea-generation, thesis-tracker, audit-xls, model-update
  ├── 编写 7 个 command（原计划 4 个，增加 thesis, model-update, debug-model）
  ├── 所有付费 MCP 引用替换为免费数据源
  ├── 所有 Office JS 引用移除，仅保留 Python/openpyxl
  └── 填充 _reference/ 目录（13 个 inactive skills）

Phase 3: Crypto 模块 ✅
  ├── 升级 Dune MCP 为官方版（11 tools, HTTP remote）
  ├── 新建 token-analysis skill（coingecko 数据）
  ├── 新建 defi-protocol skill（defillama + coingecko 数据）
  ├── 新建 airdrop-eval skill（六维度框架 + scoring-framework.md）
  ├── 新建 onchain-query skill（Dune SQL + preset-queries.md）
  ├── 编写 /crypto:token, /crypto:defi, /crypto:airdrop, /crypto:onchain 命令
  └── airdrop skill 对齐 P-xxx 模板格式（Sprint/中等维护/低保维护档位）

Phase 4: Macro 模块 ✅
  ├── 新建 macro-dashboard skill（FRED 数据 + 加密宏观）
  ├── 适配 morning-note skill（官方 → 加密扩展）
  ├── 适配 catalyst-calendar skill（官方 → 加密事件扩展）
  ├── 新建 news-digest skill（自动触发，无独立命令）
  └── 编写 /macro:dashboard, /macro:morning, /macro:catalyst 命令

Phase 5: Portfolio 模块（待实施）
  ├── Fork portfolio-rebalance skill（from wealth-management）
  ├── Fork tax-loss-harvesting skill（from wealth-management）
  ├── 编写 /rebalance, /tlh 命令
  └── 端到端测试
```

### 依赖关系

Phase 3、4、5 互相独立，可并行。

### 风险点

| 风险 | 影响 | 缓解 |
|------|------|------|
| 免费 API 限流触顶 | comps 拉 5-6 家公司数据可能用完 Alpha Vantage 25 次日额 | 优先用 yahoo-finance（无限制），alpha-vantage 仅用于电话会议和技术指标 |
| MCP Server 社区维护中断 | 依赖的社区 MCP 可能停更 | 核心选官方 MCP（CoinGecko、Alpha Vantage、Polygon）；社区的保持可替换 |
| Dune query 需已有 query ID | 自然语言转 SQL 准确度有限 | 预置常用 query ID，同时支持用户指定 ID |
| 部分电话会议需付费 | Alpha Vantage 免费层可能不含完整 transcript | Layer 3 fallback 到 Seeking Alpha 用 Chrome 获取 |
