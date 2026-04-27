---
name: tax-loss-harvesting
description: |
  税务亏损收割 (TLH) 分析 — 识别持仓中的未实现亏损，推荐替代标的以维持市场敞口，
  同时收割税务亏损。注意 Wash Sale 规则。Triggers on "tax loss harvesting", "TLH",
  "税务亏损", "亏损收割", "wash sale", "税务优化", "capital loss",
  "harvest losses", or "税损".
---

# Tax-Loss Harvesting

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

识别投资组合中的 TLH 机会，推荐替代标的，避免 Wash Sale。

## Data Source Priority

### Layer 1: MCP
- （无）portfolio 子插件无已批准的 MCP server

### Layer 2: OpenCLI
- When MCP is unavailable, use OpenCLI before lower-level fallbacks.
- Launch browser instance `0` first when browser/session access is needed: `/Users/jdy/document/web3/ChromeScript/chrome_multi_instance.sh --instance 0`.
- Prefer relevant adapters (`opencli yahoo-finance`, `opencli xueqiu`, `opencli eastmoney`, `opencli web read`, `opencli browser ...`) when available.

### Layer 3: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 实时价格/历史价格/ETF 信息/相关标的搜索
- 券商税务报告页面（如需）

### Layer 4: Web Search
- Wash Sale 规则最新解读、ETF 替代品对照表

## Workflow

### Step 1: Input Holdings with Cost Basis
获取用户持仓及成本信息：
- 持仓列表（ticker + 数量 + 买入价格/成本基础）
- 买入日期（区分短期/长期）
- 如用户提供 CSV/券商导出文件，解析文件

### Step 2: Fetch Current Prices
通过 Chrome CDP（`finance.yahoo.com/quote/{ticker}`）获取所有持仓当前价格。

### Step 3: Identify TLH Candidates
计算每个持仓的未实现盈亏：

| 持仓 | 数量 | 成本基础 | 当前价格 | 未实现盈亏 | 盈亏% | 持有期 | TLH 候选? |
|------|------|---------|---------|-----------|------|--------|----------|
| | | | | | | 短/长期 | 是/否 |

TLH 候选条件：
- 未实现亏损 > $100（小额亏损不值得操作）
- 非近期买入的 Wash Sale 风险标的
- 有合适的替代标的可用

### Step 4: Find Replacement Securities
对每个 TLH 候选，推荐替代标的：

| 卖出 | 替代买入 | 相关性 | 说明 |
|------|---------|--------|------|
| SPY | VOO/IVV | 极高 | 同类 S&P 500 ETF |
| QQQ | QQQM/VGT | 高 | 纳斯达克/科技替代 |
| 个股 | 同行业 ETF | 中等 | 维持行业敞口 |

**替代标的选择原则：**
- 维持相似的市场敞口（beta、行业、地域）
- 避免"实质相同"标的（Wash Sale 风险）
- 优先选择费率更低的替代品
- ETF 之间替代通常安全；个股之间需谨慎

### Step 5: Wash Sale Rule Check
**30 天规则提醒：**
- 卖出前 30 天和卖出后 30 天内不得买入"实质相同"证券
- 检查用户是否有自动再投资（DRIP）可能触发 Wash Sale
- 提醒检查其他账户（IRA 等）中的相同持仓

**安全操作流程：**
1. 卖出亏损持仓
2. 立即买入替代标的（非实质相同）
3. 等待 31 天后可选择换回原标的

### Step 6: Calculate Tax Savings
估算税务收益：

| 项目 | 金额 |
|------|------|
| 收割的短期亏损 | |
| 收割的长期亏损 | |
| 估计节税（短期，按普通所得税率） | |
| 估计节税（长期，按资本利得税率） | |
| **总估计节税** | |

注意：
- 短期亏损先抵消短期利得（税率更高，价值更大）
- 长期亏损先抵消长期利得
- 超额亏损每年最多抵扣 $3,000 普通收入
- 剩余亏损可无限期结转

## Output Structure

### 1. TLH 机会总览
| 指标 | 值 |
|------|---|
| 总未实现亏损 | |
| 可收割亏损 | |
| TLH 候选数 | |
| 估计节税 | |

### 2. TLH 候选详情
（见 Step 3）

### 3. 替代标的推荐
（见 Step 4）

### 4. 执行计划
每个 TLH 操作的具体步骤：
1. 卖出 [ticker] [数量] 股 @ ~$[price]
2. 买入 [替代ticker] [数量] 股 @ ~$[price]
3. 在日历标记 [日期+31天] 可换回原标的

### 5. Wash Sale 注意事项
（见 Step 5）

### 6. 税务影响估算
（见 Step 6）

## Output Format

- **Primary**: `TLH_Analysis_{YYYYMMDD}.md`
- **Optional**: Excel 含持仓盈亏明细

## Quality Checklist

- [ ] 所有价格来自实时数据源（Chrome CDP / Web Search）
- [ ] 持有期正确计算（短期 <1年 vs 长期 ≥1年）
- [ ] 替代标的非"实质相同"证券
- [ ] Wash Sale 30 天规则明确提醒
- [ ] 税率假设已说明（用户实际税率可能不同）
- [ ] 提醒用户咨询税务顾问（非税务建议）
- [ ] $3,000 年度抵扣上限已提及

## Important Notes

- **免责声明**: 本工具提供信息性分析，不构成税务建议。请咨询专业税务顾问。
- Wash Sale 规则适用于美国税法，其他司法管辖区规则不同
- "实质相同"的定义存在灰色地带 — 保守起见，选择差异较大的替代品
- 考虑交易成本 — 如果节税金额小于交易成本，则不值得操作
- TLH 是推迟而非消除税务 — 替代标的的成本基础会更低
