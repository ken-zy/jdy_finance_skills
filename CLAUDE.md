# indie-finance-plugin

独立投资者金融分析插件 — 覆盖传统金融（美股/港股）和加密市场（代币/DeFi/空投），全部基于免费数据源。

## 插件架构

本项目是一个 Claude Code 插件市场，包含四个子插件：

| 子插件 | 命令 | 数据源 |
|--------|------|--------|
| `tradfi` | `/comps` `/dcf` `/earnings` `/screen` `/thesis` `/model-update` `/debug-model` | Yahoo Finance, Alpha Vantage |
| `crypto` | `/token` `/defi` `/airdrop` `/onchain` | CoinGecko, DefiLlama, Dune |
| `macro` | `/dashboard` `/morning` `/catalyst` | FRED, DefiLlama, CoinGecko |
| `portfolio` | `/rebalance` `/tlh` | Yahoo Finance |

另有自动触发 skill（无独立命令）：`news-digest`（新闻补充）、`competitive-analysis`（竞争分析）、`audit-xls`（电子表格审计）、`idea-generation`（投资想法筛选）。

## 三层 Fallback 策略

每个 skill 的数据获取逻辑统一遵循：

```
Layer 1: MCP 数据源（首选）
  → 查询对应的 MCP server
  → 成功则使用，标注 "Source: [MCP名称]"

Layer 2: Web Search（MCP 不可用或数据不足时）
  → 使用 WebSearch 工具搜索
  → 优先搜索权威来源（SEC EDGAR, Yahoo Finance, CoinGecko 网页等）
  → 标注 "Source: Web Search - [URL]"

Layer 3: Chrome CDP 直接访问（Web Search 也不可用时）
  → 通过浏览器直接访问目标 URL
  → 适用：需要登录的页面、被 bot 检测拦截的站点、动态渲染页面
  → 标注 "Source: Direct Fetch - [URL]"
```

## 数据源-场景映射

| 场景 | Layer 1 (MCP) | Layer 2 (Web Search) | Layer 3 (Chrome) |
|------|--------------|---------------------|------------------|
| 股票行情/财报 | yahoo-finance | finance.yahoo.com | 同左 |
| 技术指标 | alpha-vantage | tradingview.com | TradingView 页面 |
| SEC Filing | — | sec.gov/edgar | EDGAR 全文 |
| 电话会议 | alpha-vantage | seekingalpha.com/transcripts | Seeking Alpha |
| 分析师预期 | — | tipranks.com, wsj.com | TipRanks 页面 |
| 加密行情 | coingecko | coingecko.com | 同左 |
| DeFi 数据 | defillama | defillama.com | 同左 |
| 链上数据 | dune | dune.com/queries | Dune 查询页面 |
| 宏观经济 | fred | fred.stlouisfed.org | 同左 |
| 新闻 | yahoo-finance / alpha-vantage | google news search | 具体新闻站点 |

## 输出格式规则

### 估值模型（/comps, /dcf）
- 输出 `.xlsx` 文件（带公式，蓝色=输入，黑色=公式）+ Markdown 摘要
- 存放于当前工作目录

### 分析报告（/earnings, /screen, /token, /defi, /macro）
- 输出 Markdown 文件
- 如在 Obsidian vault 中使用，自动添加 `[[双链]]`
- 文件命名：`YYYYMMDD-{类型}-{标的}.md`

### 项目评估（/airdrop）
- 输出 Markdown 文件
- 格式对齐 `P-xxx` 项目评估模板
- 包含六维度评分表 + 档位判定

### 链上查询（/onchain）
- 对话内表格输出
- 用户可追加"保存"输出为文件

### 通用标注（所有输出底部）
- 数据来源（哪个 MCP / 哪个 URL）
- 数据时间（截至 YYYY-MM-DD HH:MM）
- 免责声明：本分析仅供参考，不构成投资建议。数据来源为第三方，可能存在延迟或误差。

## API 限流注意

| 数据源 | 限制 | 注意事项 |
|--------|------|---------|
| Yahoo Finance | 无官方限制 | TradFi 首选数据源 |
| CoinGecko (Demo) | 30次/分, 10000次/月 | Crypto 首选数据源 |
| DefiLlama | 无限制 | DeFi 首选数据源 |
| Alpha Vantage | 25次/天, 5次/分 | 仅用于电话会议和技术指标 |
| FMP | 250次/天 | 暂无 MCP server，通过 Web Search fallback |
| FRED | 120次/分 | 宏观数据充裕 |
| Dune | 15+40次/分 | 链上查询 |
