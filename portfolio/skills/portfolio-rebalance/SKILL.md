---
name: portfolio-rebalance
description: |
  投资组合再平衡分析 — 比较当前持仓与目标配置，计算偏离度，生成再平衡交易建议，
  支持税务感知和交易成本优化。Triggers on "rebalance", "再平衡", "portfolio drift",
  "持仓偏离", "资产配置", "asset allocation", "portfolio review", or "组合调整".
---

# Portfolio Rebalance

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

分析投资组合偏离度并生成再平衡交易建议。

## Data Source Priority

### Layer 1: MCP
- （无）portfolio 子插件无已批准的 MCP server

### Layer 2: OpenCLI
- When MCP is unavailable, use OpenCLI before lower-level fallbacks.
- Launch browser instance `0` first when browser/session access is needed: `/Users/jdy/document/web3/ChromeScript/chrome_multi_instance.sh --instance 0`.
- Prefer relevant adapters (`opencli yahoo-finance`, `opencli xueqiu`, `opencli eastmoney`, `opencli web read`, `opencli browser ...`) when available.

### Layer 3: Chrome CDP
- `finance.yahoo.com/quote/{ticker}` — 实时股价/ETF价格/持仓市值计算
- 券商账户页面（如需）

### Layer 4: Web Search
- 资产类别基准数据、ETF 详细信息

每个数据点标注 "Source: [source name]"。

## Workflow

### Step 1: Input Portfolio
获取用户当前持仓信息：
- 持仓列表（ticker + 数量 或 ticker + 市值）
- 如用户提供 CSV/Excel，解析文件
- 如用户口述，整理为表格确认

### Step 2: Define Target Allocation
确认目标配置：
- 用户已有目标 → 直接使用
- 用户无目标 → 根据风险偏好建议：
  - 激进型: 80% 股票 / 15% 加密 / 5% 现金
  - 平衡型: 60% 股票 / 20% 债券 / 10% 加密 / 10% 现金
  - 保守型: 40% 股票 / 40% 债券 / 10% 加密 / 10% 现金
- 目标可按资产类别或按个股/ETF 设定

### Step 3: Fetch Current Prices
通过 Chrome CDP（`finance.yahoo.com/quote/{ticker}`）获取所有持仓的当前价格，计算：
- 每个持仓的当前市值
- 当前权重（占总市值百分比）
- 总组合市值

### Step 4: Calculate Drift
计算偏离度：

| 持仓 | 目标权重 | 当前权重 | 偏离 | 状态 |
|------|---------|---------|------|------|
| | X% | Y% | +/-Z% | 超配/低配/正常 |

偏离阈值（可用户自定义）：
- 正常: |偏离| < 2%
- 轻微偏离: 2% ≤ |偏离| < 5%
- 需再平衡: |偏离| ≥ 5%

### Step 5: Generate Rebalance Trades
生成调整交易建议：

| 操作 | 持仓 | 当前市值 | 目标市值 | 调整金额 | 调整股数 |
|------|------|---------|---------|---------|---------|
| 买入/卖出 | | | | | |

**优化考虑：**
- 优先通过新增资金调整（减少卖出）
- 如用户指定有新增资金，优先用新资金买入低配持仓
- 小额偏离（<$100 调整）可忽略
- 标注预估交易成本

### Step 6: Tax Impact Preview
如用户持仓有成本基础信息：
- 标注卖出持仓的预估资本利得/损失
- 区分短期 vs 长期资本利得
- 建议 TLH 机会（引导使用 tax-loss-harvesting skill）

## Output Structure

### 1. 组合概览
| 指标 | 值 |
|------|---|
| 总市值 | |
| 持仓数 | |
| 最大偏离 | |
| 需再平衡? | 是/否 |

### 2. 偏离分析表
（见 Step 4）

### 3. 再平衡交易建议
（见 Step 5）

### 4. 税务影响预览
（如有成本基础数据）

### 5. 执行建议
- 建议执行顺序（先卖后买 vs 先买后卖）
- 分批执行建议（大额调整）
- 注意事项（除息日、财报前后等）

## Output Format

- **Primary**: `Portfolio_Rebalance_{YYYYMMDD}.md` 或对话中直接显示
- **Optional**: Excel 输出含公式（如持仓数较多）

## Quality Checklist

- [ ] 所有持仓价格来自实时数据源（Chrome CDP / Web Search，非训练数据）
- [ ] 权重之和等于 100%
- [ ] 调整金额之和净为 0（或等于新增资金）
- [ ] 调整股数取整（非小数股）
- [ ] 偏离阈值明确标注
- [ ] 税务影响已提醒（如适用）
