---
name: news-digest
description: |
  自动新闻补充 — 当用户提及公司或代币时，自动判断是否需要补充最新新闻。
  不设独立命令，作为辅助 skill 自动触发。Triggers on any company ticker,
  token symbol, or when user asks "最新消息", "latest news", "新闻",
  "what's happening with", "[ticker/token] news", or "有什么新消息".
---

# News Digest

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

当用户提及特定公司或代币时，自动补充最新相关新闻。

## Trigger Logic

**自动触发条件**（满足任一即触发）：
- 用户明确询问某标的的最新消息
- 用户在分析过程中提到的标的有重大近期新闻（24h 内）
- 用户使用 token-analysis 或 earnings-analysis 等 skill 时，补充新闻上下文

**不触发条件**：
- 用户只是在讨论历史数据，不需要新闻
- 已经在 morning-note 中覆盖了该标的的新闻
- 标的没有任何近期新闻

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 代币相关新闻和社区讨论

### Layer 2: OpenCLI
- When MCP is unavailable, use OpenCLI before lower-level fallbacks.
- Launch browser instance `0` first when browser/session access is needed: `/Users/jdy/document/web3/ChromeScript/chrome_multi_instance.sh --instance 0`.
- Prefer relevant adapters (`opencli yahoo-finance`, `opencli xueqiu`, `opencli eastmoney`, `opencli web read`, `opencli browser ...`) when available.

### Layer 3: Chrome CDP
- `defillama.com/protocol/{protocol}` — 协议重大变动（TVL 异常波动作为新闻线索）

### Layer 4: Web Search
- 财经新闻网站（Reuters, Bloomberg, CNBC, CoinDesk, The Block）
- 公司 IR 页面（press releases）
- 项目官方公告（Twitter/X, Medium, Discord）

## Workflow

### Step 1: Identify Target
- 解析用户提到的公司/代币
- 确定标的类型（股票 vs 加密）

### Step 2: Fetch Recent News
按标的类型获取：

**股票:**
- 最近 7 天的重大新闻
- 财报/指引更新
- 分析师评级变化
- M&A/监管动态

**加密:**
- 最近 7 天的重大新闻
- 项目公告（升级、合作、代币经济学变化）
- 安全事件（黑客、漏洞）
- 监管动态

### Step 3: Filter and Prioritize
- 按时效性排序（最新优先）
- 按影响程度筛选（仅保留重大新闻）
- 去重（同一事件多个来源只保留最权威的）

### Step 4: Present Digest

格式简洁，嵌入当前对话流中：

```
**[标的] 近期新闻速览:**
- [日期] [标题] — 一句话摘要 (Source: [来源])
- [日期] [标题] — 一句话摘要 (Source: [来源])
- [日期] [标题] — 一句话摘要 (Source: [来源])
```

如无重大新闻，简短说明：
> 近 7 天无重大新闻。

## Output Format

- 嵌入对话流，不单独生成文件
- 每条新闻一行，含日期、标题、一句话摘要、来源
- 最多 5 条，按重要性排序

## Quality Checklist

- [ ] 新闻来源可靠（主流财经/加密媒体）
- [ ] 新闻时效性标注（具体日期）
- [ ] 不重复已在其他 skill 输出中覆盖的新闻
- [ ] 每条新闻标注来源
- [ ] 无重大新闻时明确说明
- [ ] 不混淆同名不同标的的新闻
