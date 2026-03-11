---
name: news-digest
description: |
  自动新闻补充 — 当用户提及公司或代币时，自动判断是否需要补充最新新闻。
  不设独立命令，作为辅助 skill 自动触发。Triggers on any company ticker,
  token symbol, or when user asks "最新消息", "latest news", "新闻",
  "what's happening with", "[ticker/token] news", or "有什么新消息".
---

# News Digest

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

### Layer 1: Web Search
- 财经新闻网站（Reuters, Bloomberg, CNBC, CoinDesk, The Block）
- 公司 IR 页面（press releases）
- 项目官方公告（Twitter/X, Medium, Discord）

### Layer 2: MCP
- **coingecko** — 代币相关新闻和社区讨论
- **defillama** — 协议重大变动（TVL 异常波动作为新闻线索）

### Layer 3: Chrome CDP
- 需登录的新闻源

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
