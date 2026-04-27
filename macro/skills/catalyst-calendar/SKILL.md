---
name: catalyst-calendar
description: |
  催化剂日历 — 跟踪传统金融和加密市场的关键事件，包括财报日期、经济数据发布、
  FOMC 会议、代币解锁、空投快照、协议升级等。Triggers on "catalyst calendar",
  "催化剂日历", "upcoming events", "接下来有什么", "earnings calendar",
  "event calendar", "催化剂", "日历", or "what's coming up".
---

# Catalyst Calendar

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

构建和维护催化剂日历，覆盖传统金融和加密市场的关键事件。

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 代币事件、项目动态

### Layer 2: OpenCLI
- When MCP is unavailable, use OpenCLI before lower-level fallbacks.
- Launch browser instance `0` first when browser/session access is needed: `/Users/jdy/document/web3/ChromeScript/chrome_multi_instance.sh --instance 0`.
- Prefer relevant adapters (`opencli yahoo-finance`, `opencli xueqiu`, `opencli eastmoney`, `opencli web read`, `opencli browser ...`) when available.

### Layer 3: Chrome CDP
- `fred.stlouisfed.org/series/{series_id}` — 经济数据发布日期（CPI、非农、GDP）
- `defillama.com/protocol/{protocol}` — 协议 TVL 变动、DeFi 事件

### Layer 4: Web Search
- 财报日历（公司 IR 页面）
- FOMC 会议日期
- 代币解锁日历（TokenUnlocks）
- 空投快照/TGE 日期
- 协议升级/硬分叉时间表
- 加密会议日程

## Workflow

### Step 1: Define Scope

确认用户关注范围：
- **关注标的**: 股票代码/代币名称列表
- **行业/板块**: 聚焦的行业
- **包含宏观事件?** 默认包含
- **包含加密事件?** 默认包含
- **时间范围**: 默认未来 2 周，可选月/季度

### Step 2: Gather Traditional Finance Events

**财报与财务事件:**
- 季度财报日期和时间（盘前/盘后）
- 投资者日/分析师日
- 年度股东大会

**企业事件:**
- 产品发布或公告
- 监管决定
- M&A 里程碑（交割日、监管审批）
- 管理层变动

**宏观事件:**
- FOMC 会议日期
- 非农就业报告
- CPI/PPI 发布
- GDP 发布
- 央行决议（ECB、BOJ 等）

**行业事件:**
- 重要行业会议
- 监管评论期截止
- 行业月度数据发布

### Step 3: Gather Crypto Events

**代币事件:**
- 代币解锁日期和金额（TokenUnlocks 数据）
- 空投快照日期
- TGE（代币生成事件）日期
- 质押/解质押窗口

**协议事件:**
- 主网/测试网发布
- 协议升级/硬分叉
- 治理投票截止
- 审计报告发布

**生态事件:**
- 加密会议（ETHDenver、Token2049 等）
- 黑客马拉松截止
- 监管听证/政策实施日期

### Step 4: Build Calendar

| 日期 | 事件 | 标的/板块 | 类型 | 影响(H/M/L) | 备注 |
|------|------|----------|------|-------------|------|
| | | | 财报/企业/宏观/加密 | | |

类型分类：
- **财报** — 季度/年度财报
- **企业** — 产品、M&A、管理层
- **宏观** — FOMC、CPI、非农
- **加密** — 解锁、空投、升级、TGE

### Step 5: Weekly Preview

```
**本周关键事件:**
1. [周X]: [事件] — 预期 vs 我们的判断
2. [周X]: [事件] — 对 [标的] 的影响
3. [周X]: [事件] — 注意事项

**下周预告:**
- 提前关注的重要事件

**持仓影响:**
- 可能影响特定持仓的事件
- 二元事件前的风险管理建议
```

## Output Format

- **Primary**: Markdown 日历表格（对话中显示或保存为 `Catalyst_Calendar_{YYYYMMDD}.md`）
- **Optional**: Weekly preview 单独输出
- 影响程度颜色标注建议：高=红色标注, 中=黄色标注, 低=常规

## Quality Checklist

- [ ] 传统金融和加密事件都已覆盖
- [ ] 财报日期经公司 IR 页面验证
- [ ] 代币解锁金额标注（占流通量百分比）
- [ ] FOMC 和重大经济数据发布不遗漏
- [ ] 影响程度合理评估
- [ ] 过期事件归档，标注实际结果
- [ ] 时区标注（默认 EST/UTC）

## Important Notes

- 财报日期可能变动 — 临近时验证公司 IR 页面
- 代币解锁是高影响事件 — 解锁量 >5% 流通量标为高影响
- 有些催化剂是定期的（月度行业数据）— 建模板自动填充
- 记录过去催化剂的实际结果 — 积累模式识别经验
- 空投快照日期经常临时公布 — 关注官方 Twitter/Discord
