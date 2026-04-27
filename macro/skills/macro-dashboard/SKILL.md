---
name: macro-dashboard
description: |
  宏观经济看板 — 覆盖利率环境、通胀数据、就业市场、市场情绪和加密宏观指标。
  横跨传统金融和加密市场的宏观全景。Triggers on "宏观", "macro dashboard",
  "macro overview", "经济数据", "利率", "通胀", "CPI", "非农", "FOMC",
  "宏观看板", or "market overview".
---

# Macro Dashboard

## jdy Data Source Fallback Policy

When a skill needs external market/on-chain/macro data, use this order unless the user explicitly says otherwise:

1. **MCP first** — use configured MCP tools when available and healthy.
2. **OpenCLI second** — if MCP is unavailable, missing keys, rate-limited, or insufficient, use `opencli` before lower-level fallbacks.
   - If browser access is needed, first launch jdy's fixed browser profile:
     ```bash
     /Users/jdy/document/web3/ChromeScript/chrome_multi_instance.sh --instance 0
     ```
   - Prefer site adapters when available, e.g. `opencli yahoo-finance`, `opencli xueqiu`, `opencli eastmoney`, `opencli web read`, or `opencli browser ...`.
   - For public JSON endpoints, `opencli browser open <api-url>` + `opencli browser eval 'document.body.innerText'` is acceptable when it improves consistency with browser/session-based workflows.
3. **Direct API / Chrome CDP / package fallback third** — use direct HTTP APIs, the bundled `packages/chrome-cdp`, or manual browser extraction only when OpenCLI has no adapter, cannot reach the page, or returns incomplete data.
4. **Web Search last** — use search only as the final fallback or for qualitative context/news that requires multiple public sources.

Always cite which layer produced each important datapoint. If layers disagree, say so and prefer the more primary/structured source.

生成宏观经济全景看板，覆盖传统金融和加密市场的关键宏观指标。

## Data Source Priority

### Layer 1: MCP
- **coingecko MCP** — BTC/ETH 价格/全球加密市值/市场情绪

### Layer 1.5: WebFetch 直调公开 API（MCP 失败时的首选降级）
- `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_market_cap=true` — BTC/ETH 实时价格/24h 变化/市值
- `https://api.coingecko.com/api/v3/global` — 加密总市值/BTC 占比
- 无需认证，返回实时数据，优于 Web Search（Web Search 返回新闻报道，通常滞后 1-2 天）

### Layer 2: OpenCLI
- When MCP is unavailable, use OpenCLI before lower-level fallbacks.
- Launch browser instance `0` first when browser/session access is needed: `/Users/jdy/document/web3/ChromeScript/chrome_multi_instance.sh --instance 0`.
- Prefer relevant adapters (`opencli yahoo-finance`, `opencli xueqiu`, `opencli eastmoney`, `opencli web read`, `opencli browser ...`) when available.

### Layer 3: Chrome CDP
- `fred.stlouisfed.org/series/{series_id}` — 利率/国债收益率/CPI/PCE/就业数据/GDP/美元指数
- `defillama.com` — 稳定币总市值/全球加密 TVL/DeFi 总量/DEX 交易量

### Layer 4: Web Search
- 经济数据发布日历、FOMC 声明、市场评论
- VIX 数据、恐惧贪婪指数
- ⚠️ **禁止用 Web Search 获取加密价格** — 搜索结果是新闻报道，非实时数据

每个数据点标注 "Source: [source name]"。

## Workflow

### Step 1: Determine Scope
如用户未指定，默认生成完整看板。可选聚焦：
- `rates` — 仅利率环境
- `inflation` — 仅通胀数据
- `jobs` — 仅就业市场
- `sentiment` — 仅市场情绪
- `crypto-macro` — 仅加密宏观
- `calendar` — 仅未来 2 周数据发布日历

### Step 2: Fetch Traditional Macro Data
通过 Chrome CDP（`fred.stlouisfed.org/series/{series_id}`）获取：

**利率环境:**
- 联邦基金利率 (FEDFUNDS)
- 10 年期国债收益率 (DGS10)
- 2 年期国债收益率 (DGS2)
- 2-10Y 利差（计算）
- 降息/加息预期（Web Search: CME FedWatch）

**通胀:**
- CPI YoY (CPIAUCSL)
- CPI MoM
- Core CPI (CPILFESL)
- PCE (PCEPI)
- 12 个月 CPI 趋势

**就业:**
- 非农就业人数变化 (PAYEMS)
- 失业率 (UNRATE)
- 初请失业金人数 (ICSA)
- 劳动参与率 (CIVPART)

### Step 3: Fetch Market Sentiment
通过 Chrome CDP 获取（URL 已知直接导航，失败则 Web Search 兜底）：
- VIX 指数（finance.yahoo.com/quote/%5EVIX）
- CNN 恐惧贪婪指数（edition.cnn.com/markets/fear-and-greed）
- 美元指数 DXY（finance.yahoo.com/quote/DX-Y.NYB）
- 主要股指表现（finance.yahoo.com/quote/%5EGSPC 等）

### Step 4: Fetch Crypto Macro
**加密价格获取优先级**（按顺序尝试，成功即停）：
1. CoinGecko MCP（`mcp__plugin_crypto_coingecko__execute`）
2. WebFetch 调 CoinGecko 公开 API（无需认证，实时数据）
3. Chrome CDP 访问价格页面
4. ❌ **不要用 Web Search 查价格**（返回新闻报道，滞后 1-2 天）

获取内容：
- BTC 价格 + 24h/7d 变化 + 市值
- ETH 价格 + 24h/7d 变化 + 市值
- 全球加密总市值
- 稳定币总市值（DefiLlama Chrome CDP）
- DeFi 总 TVL（DefiLlama Chrome CDP）
- BTC ETF 净流入（DefiLlama / Web Search）

### Step 5: Compile Dashboard

## Output Structure

### 1. 利率环境
| 指标 | 当前值 | 前值 | 变化 |
|------|--------|------|------|
| 联邦基金利率 | | | |
| 10Y 国债 | | | |
| 2Y 国债 | | | |
| 2-10Y 利差 | | | |
| 降息预期 | | | — |

### 2. 通胀
| 指标 | 最新值 | 前值 | 趋势 |
|------|--------|------|------|
| CPI YoY | | | |
| CPI MoM | | | |
| Core CPI | | | |
| PCE | | | |

### 3. 就业
| 指标 | 最新值 | 前值 | 预期 |
|------|--------|------|------|
| 非农就业 | | | |
| 失业率 | | | |
| 初请失业金 | | | |

### 4. 市场情绪
| 指标 | 当前值 | 信号 |
|------|--------|------|
| VIX | | 低波动/正常/高波动 |
| 恐惧贪婪指数 | | 极度恐惧~极度贪婪 |
| DXY | | |
| S&P 500 (周变化) | | |

### 5. 加密宏观
| 指标 | 当前值 | 7d 变化 | 30d 变化 |
|------|--------|---------|----------|
| BTC | | | |
| ETH | | | |
| 加密总市值 | | | |
| 稳定币总市值 | | | |
| DeFi TVL | | | |

### 6. 关键日历（未来 2 周）
| 日期 | 事件 | 类型 | 影响程度 |
|------|------|------|----------|
| | | 利率/通胀/就业/其他 | 高/中/低 |

## Output Format

- **Primary**: `Macro_Dashboard_{YYYYMMDD}.md`
- Footer: 数据来源、数据时间戳、免责声明
- FRED 数据系列 ID 标注在括号内供追溯

## Quality Checklist

- [ ] 所有 FRED 数据系列正确引用（ID 对应正确指标）
- [ ] 当前值和前值都已获取（可计算变化）
- [ ] 加密数据来自 CoinGecko/DefiLlama（非训练数据）
- [ ] 日历部分至少覆盖未来 2 周重要事件
- [ ] 降息预期来自实时数据（CME FedWatch），非猜测
- [ ] 数据时效性标注
