# indie-finance-plugin

独立投资者金融分析插件 — 基于 Anthropic [financial-services-plugins](https://github.com/anthropics/financial-services-plugins) 架构，替换为免费数据源，新增 Crypto 模块。

为独立投资者提供机构级金融分析能力，覆盖传统金融（美股/港股）和加密市场（代币/DeFi/空投）。

## 快速开始

### 1. 安装插件

在终端中添加插件市场：

```bash
claude plugin marketplace add ken-zy/indie_finance_plugin
```

然后在 Claude Code 会话内安装子插件：

1. 输入 `/plugin` → 进入 **Discover** 标签页
2. 用 **Space** 键逐个选中需要的子插件，**Enter** 确认安装
3. 安装完成后输入 `/reload-plugins` 激活

| 子插件 | 用途 |
|--------|------|
| tradfi | 传统金融分析 |
| crypto | 加密市场分析 |
| macro | 宏观经济 |
| portfolio | 投资组合管理 |

### 2. 配置 API Key

首次安装后启动新会话，插件会自动检测缺失的 API key 并引导你配置。

你也可以随时手动配置：

```bash
/tradfi:setup     # 配置 Alpha Vantage key
/crypto:setup     # 配置 CoinGecko + Dune key
/macro:setup      # 配置 CoinGecko key
```

所需 API key（全部免费）：

| 服务 | 注册地址 | 用途 | 子插件 |
|------|---------|------|--------|
| CoinGecko | [coingecko.com/en/api/pricing](https://www.coingecko.com/en/api/pricing) | 加密行情（官方 MCP） | crypto, macro |
| Alpha Vantage | [alphavantage.co/support](https://www.alphavantage.co/support/#api-key) | 技术指标、电话会议（官方 MCP） | tradfi |
| Dune Analytics | [dune.com/settings/api](https://dune.com/settings/api) | 链上查询（官方 MCP） | crypto |

> Yahoo Finance、DefiLlama、FRED 通过 Web Search 访问，无需 key。

### Key 管理机制

- API key 保存在 `~/.indie-finance/keys.json`（与插件目录分离，权限 600）
- 插件更新后 key 自动从备份恢复，无需重新配置
- CoinGecko key 在 crypto 和 macro 之间自动同步

## 子插件

### tradfi — 传统金融分析

Fork 自 Anthropic 官方 `financial-analysis` 和 `equity-research` 插件，保留分析框架，替换数据源为免费 MCP。

| 命令 | 用途 | 输出 |
|------|------|------|
| `/tradfi:comps [ticker]` | 可比公司分析 | Excel + Markdown |
| `/tradfi:dcf [ticker]` | DCF 估值模型 | Excel + Markdown |
| `/tradfi:earnings [ticker] [Q]` | 财报分析 | Markdown |
| `/tradfi:screen [条件]` | 股票筛选 | Markdown |
| `/tradfi:thesis [ticker]` | 投资论文追踪 | Markdown |
| `/tradfi:model-update [ticker]` | 模型更新（财报后） | Markdown + Excel |
| `/tradfi:debug-model` | 电子表格审计 | Markdown |

自动触发 skill（无需命令）：competitive-analysis、idea-generation、audit-xls、clean-data-xls

数据源：Alpha Vantage (MCP) → Yahoo Finance (Chrome CDP) → Web Search

### crypto — 加密市场分析

全新模块，覆盖代币基本面、DeFi 协议、空投评估、链上查询。

| 命令 | 用途 | 输出 |
|------|------|------|
| `/crypto:token [symbol]` | 代币全面分析 | Markdown |
| `/crypto:defi [protocol]` | DeFi 协议分析 | Markdown |
| `/crypto:airdrop [project]` | 空投项目评估（v3 门槛+加权） | Markdown |
| `/crypto:onchain [query]` | 链上数据查询 | 对话内表格 |

数据源：CoinGecko (MCP) → Dune (MCP) → DefiLlama (Chrome CDP) → Web Search

### macro — 宏观经济

横跨传统和加密市场的宏观经济看板。

| 命令 | 用途 | 输出 |
|------|------|------|
| `/macro:dashboard` | 宏观经济看板 | Markdown |
| `/macro:morning` | 晨间市场笔记 | Markdown |
| `/macro:catalyst` | 催化剂日历 | Markdown |

自动触发 skill（无需命令）：news-digest

数据源：CoinGecko (MCP) → FRED (Chrome CDP) → DefiLlama (Chrome CDP) → Web Search

### portfolio — 投资组合管理

管理多账户投资组合，税务优化。

| 命令 | 用途 | 输出 |
|------|------|------|
| `/portfolio:rebalance` | 税务感知再平衡 | Excel + Markdown |
| `/portfolio:tlh` | 税收损失收获 | Excel + Markdown |

数据源：Yahoo Finance (Chrome CDP) → Web Search

## 数据架构

### 三层 Fallback

所有命令遵循统一的数据获取策略：

1. **MCP 数据源** — 首选，通过 MCP 协议直接查询
2. **Chrome CDP** — MCP 不可用时，直接导航访问目标页面
3. **Web Search** — Chrome CDP 失败时，搜索权威来源兜底

### MCP 数据源总览

仅启用通过安全审计的官方 MCP server（详见 [安全审计报告](docs/mcp-security-audit.md)）。

| MCP Server | 类型 | 官方 | 限制 | 子插件 |
|-----------|------|------|------|--------|
| CoinGecko | 官方 MCP | 是 | 30次/分, 10000次/月 | crypto, macro |
| Alpha Vantage | 官方 MCP | 是 | 25次/天 | tradfi |
| Dune Analytics | 官方 MCP | 是 | 55次/分 | crypto |

以下数据源通过 Chrome CDP / Web Search fallback 访问（无官方 MCP）：

| 数据源 | 限制 | 覆盖场景 |
|--------|------|---------|
| Yahoo Finance | 无限制 | 股票行情、财报、组合管理 |
| DefiLlama | 无限制 | DeFi TVL、协议数据 |
| FRED | 120次/分 | 宏观经济指标 |
| FMP | 250次/天 | SEC filing、分析师数据 |

## 目录结构

```
indie-finance-plugin/
├── .claude-plugin/marketplace.json    # 插件市场入口
├── .gitignore
├── CLAUDE.md                          # Claude 使用指引
├── README.md
├── tradfi/                            # 传统金融子插件
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json
│   ├── commands/                      # setup, comps, dcf, earnings...
│   ├── skills/
│   └── hooks/
│       ├── hooks.json                 # SessionStart hook 配置
│       └── check-keys.sh             # API key 检测与恢复
├── crypto/                            # 加密市场子插件
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json
│   ├── commands/                      # setup, token, defi, airdrop...
│   ├── skills/
│   └── hooks/
│       ├── hooks.json
│       └── check-keys.sh
├── macro/                             # 宏观经济子插件
│   ├── .claude-plugin/plugin.json
│   ├── .mcp.json
│   ├── commands/                      # setup, dashboard, morning...
│   ├── skills/
│   └── hooks/
│       ├── hooks.json
│       └── check-keys.sh
├── portfolio/                         # 投资组合管理子插件（MCP 配置为空）
│   ├── .claude-plugin/plugin.json
│   ├── commands/
│   ├── skills/
│   └── hooks/hooks.json
├── packages/                          # 共享工具包
│   └── chrome-cdp/                    # Chrome CDP 抓取器（Layer 3 内部实现）
│       ├── src/                       # cache.ts, cdp.ts, chrome.ts, index.ts, markdown.ts
│       └── tests/
├── docs/                              # 文档与规格（安全审计报告、设计文档）
├── scripts/                           # 辅助脚本（validate_plugin.py）
└── _reference/                        # 官方机构 skill（不激活，供参考）
```

## 致谢

- 分析框架 Fork 自 [anthropics/financial-services-plugins](https://github.com/anthropics/financial-services-plugins)
- 免费数据源：Yahoo Finance, CoinGecko, DefiLlama, FRED, Alpha Vantage, FMP, Dune Analytics
