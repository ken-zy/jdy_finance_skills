# indie-finance-plugin

独立投资者金融分析插件 — 覆盖传统金融（美股/港股）和加密市场（代币/DeFi/空投），全部基于免费数据源。

## 插件架构

本项目是一个 Claude Code 插件市场，包含四个子插件：

| 子插件 | 命令 | 数据源 |
|--------|------|--------|
| `tradfi` | `/comps` `/dcf` `/earnings` `/screen` `/thesis` `/model-update` `/debug-model` | Alpha Vantage (MCP) + Yahoo Finance (Chrome CDP) |
| `crypto` | `/token` `/defi` `/airdrop` `/onchain` | CoinGecko, Dune (MCP) + DefiLlama (Chrome CDP) |
| `macro` | `/dashboard` `/morning` `/catalyst` | CoinGecko (MCP) + FRED, DefiLlama (Chrome CDP) |
| `portfolio` | `/rebalance` `/tlh` | Yahoo Finance (Chrome CDP) |

另有自动触发 skill（无独立命令）：`news-digest`（新闻补充）、`competitive-analysis`（竞争分析）、`audit-xls`（电子表格审计）、`idea-generation`（投资想法筛选）。

## 三层 Fallback 策略

每个 skill 的数据获取逻辑统一遵循：

```
Layer 1: MCP 数据源（首选）
  → 查询对应的 MCP server
  → 成功则使用，标注 "Source: [MCP名称]"

Layer 2: Chrome CDP 直接访问（MCP 不可用或数据不足时）
  → URL 已知（见"数据源-场景映射"表）→ 直接导航访问
  → URL 未知 → 先 Web Search 取 URL，再 Chrome CDP 访问
    · Web Search 也无法找到 URL → 直接降到 Layer 3
  → 标注 "Source: Direct Fetch - [URL]"

  【页面过大时的工具降级顺序】
  Step 1: get_page_text（默认）
  Step 2: Step 1 报 "Output exceeds character limit" →
          read_page 获取 DOM 结构，定位数据所在区域的 ref_id，
          再用 read_page(ref_id=...) 精准读取；
          若无法找到目标 ref_id 或返回空内容 → 直接 Step 4
  Step 3: Step 2 成功但目标数据不完整
          （表格行缺失、财务指标关键行缺失等可观测缺口）→
          get_page_text(max_chars=200000) 补全；
          若仍报超限或数据仍不完整 → Step 4
  Step 4: fallback 回 Layer 3 Web Search 兜底

Layer 3: Web Search 摘要兜底（Chrome CDP 失败时）
  → 使用 WebSearch 工具搜索
  → 优先搜索权威来源（SEC EDGAR, Yahoo Finance, CoinGecko 网页等）
  → 标注 "Source: Web Search - [URL]"
```

## 数据源-场景映射

| 场景 | Layer 1 (MCP) | Layer 2 (Chrome CDP URL) | Layer 3 (Web Search 兜底) |
|------|--------------|--------------------------|--------------------------|
| 股票行情/财报（美股） | — | `finance.yahoo.com/quote/{ticker}` | finance.yahoo.com |
| 股票行情（A股） | — | `xueqiu.com/S/{code}` 或 `quote.eastmoney.com/sz{code}.html` | 东方财富/雪球 |
| 股票行情（港股） | — | `xueqiu.com/S/{code}` 或 `finance.yahoo.com/quote/{ticker}` | 雪球/Yahoo Finance |
| 技术指标 | alpha-vantage | `tradingview.com/chart/?symbol={ticker}` | tradingview.com |
| SEC Filing | — | `sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={ticker}` | sec.gov/edgar |
| 电话会议 | alpha-vantage | `seekingalpha.com/symbol/{ticker}/earnings/transcripts` | seekingalpha.com |
| 分析师预期 | — | `tipranks.com/stocks/{ticker}/forecast` | tipranks.com, wsj.com |
| 加密行情 | coingecko | `coingecko.com/en/coins/{id}` | coingecko.com |
| DeFi 数据 | — | `defillama.com/protocol/{protocol}` | defillama.com |
| 链上数据 | dune | `dune.com/queries/{query_id}` | dune.com |
| 宏观经济 | — | `fred.stlouisfed.org/series/{series_id}` | fred.stlouisfed.org |
| 新闻 | alpha-vantage | ⚠️ URL 未知 → Web Search 取文章 URL → Chrome CDP 读全文；Web Search 找不到 URL → 降 Layer 3 | Web Search 搜索摘要（google news search） |

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
- 包含 v3 门槛+加权评分表 + 档位判定

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
| CoinGecko (Demo) | 30次/分, 10000次/月 | 官方 MCP，Crypto 首选 |
| Alpha Vantage | 25次/天, 5次/分 | 官方 MCP，仅用于电话会议和技术指标 |
| Dune | 15+40次/分 | 官方 MCP，链上查询 |
| Yahoo Finance | 无官方限制 | 无官方 MCP，Chrome CDP / Web Search 兜底 |
| DefiLlama | 无限制 | 无官方 MCP，Chrome CDP / Web Search 兜底 |
| FRED | 120次/分 | 无官方 MCP，Chrome CDP / Web Search 兜底 |
| FMP | 250次/天 | 无官方 MCP，Chrome CDP / Web Search 兜底 |
