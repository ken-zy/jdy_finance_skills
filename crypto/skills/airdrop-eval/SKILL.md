---
name: airdrop-eval
description: |
  空投项目评估 — 基于 v3 门槛+加权模型（发币意愿/风险 门槛检查 → 筹码/链上/竞争/成本 加权评分）
  百分制 × 系数，输出档位判定（Sprint/中等维护/低保维护）。
  输出格式对齐 P-xxx 空投评估模板。Triggers on "空投评估", "airdrop evaluation",
  "项目评分", "airdrop scoring", "空投分析", "evaluate airdrop", or "P-xxx".
---

# Airdrop Evaluation (v3)

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

基于门槛+加权评分框架对空投项目进行综合评估，输出 P-xxx 格式报告。

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 代币信息（如已发币）
- **dune** — 链上数据（交易指标、用户增长、手续费、供需分析、KPI 汇总）

### Layer 2: OpenCLI
- When MCP is unavailable, use OpenCLI before lower-level fallbacks.
- Launch browser instance `0` first when browser/session access is needed: `/Users/jdy/document/web3/ChromeScript/chrome_multi_instance.sh --instance 0`.
- Prefer relevant adapters (`opencli yahoo-finance`, `opencli xueqiu`, `opencli eastmoney`, `opencli web read`, `opencli browser ...`) when available.

### Layer 3: Chrome CDP
- `defillama.com/protocol/{protocol}` — TVL 趋势、协议数据
- 官网、文档、Discord

### Layer 4: Web Search
- 融资背景、团队信息、社区规模、积分机制、官方公告、竞品信息

## Workflow

### Step 1: Project Identification + Document Collection
- 解析项目名称
- 查找官网、文档、社交媒体链接
- 确认项目状态（是否已发币、是否有积分系统）
- **主动询问用户是否有项目相关文档**（白皮书、tokenomics、积分规则等）
  - 用户提供 → 优先作为评分依据，按文档性质标注置信度
    - 官方公告/白皮书/合约文档 → ◆
    - 多源交叉验证的分析 → ◇
    - 单一来源未验证 → ○
  - 用户没有 → 继续自动拉取

### Step 2: Auto-Fetch Data
自动拉取可获取的数据：
- coingecko: 代币信息（如已发币）
- dune: 链上数据
  - 日度交易指标（交易次数、交易量 USD、手续费 USD、Unique Takers/Makers）
  - 用户增长（新增用户、7日均值、累计用户）
  - 协议收入/手续费趋势
  - 供需背离分析（供给侧 vs 需求侧指标趋势对比）
  - 汇总 KPI（总交易量、总交易数、总手续费、总用户数、峰值日、WoW 变化）
- defillama: TVL 趋势（Chrome CDP）
- Web Search: 融资轮次、估值、团队背景、积分机制细节、社区规模、竞品信息

（URL 未知时先 Web Search 取 URL 再 Chrome CDP 访问，Web Search 无法找到 URL 则直接 Web Search 摘要兜底）

### Step 3: Gate Check (门槛检查)
预填"发币意愿"和"风险等级"评分 + 依据 + 置信度标注：

| 门槛维度 | 建议分数 | 系数 | 依据 | 置信度 |
|---------|---------|------|------|-------|
| 发币意愿 | X | ×Y | [data] | ◆/◇/○ |
| 风险等级 | X | ×Y | [data] | ◆/◇/○ |

**明确标注为建议评分，等待用户确认或调整。**

- 用户确认后：
  - 任一维度 < 3 → 输出"放弃"精简报告，**流程终止**
  - 两项都 ≥ 3 → 记录系数，进入 Step 4

### Step 4: Weighted Scoring (加权评分预填 + 用户确认)
预填四个加权维度评分建议：

| 维度 | 权重 | 建议分数 | 依据 | 不确定性 | 置信度 |
|------|------|---------|------|---------|-------|
| 筹码获取 | 30% | X | [data] | [unknowns] | ◆/◇/○ |
| 链上健康度 | 25% | X | [data] | [unknowns] | ◆/◇/○ |
| 竞争定位 | 25% | X | [data] | [unknowns] | ◆/◇/○ |
| 单位成本 | 20% | X | [data] | [unknowns] | ◆/◇/○ |

**明确标注为建议评分，等待用户确认或调整。**
用户可以补充自己的判断依据。

### Step 5: Calculate + Report (计算 + 生成报告)
- 计算最终分
- 档位判定（含降档规则）
- 催化剂表格（如有）
- 按模板输出报告

## Output Template — Gate Failure (门槛不通过)

```
# P-{ProjectName} 空投评估

> 评估日期：YYYY-MM-DD
> 结论：**放弃** — 门槛检查未通过

## 门槛检查

| 门槛维度 | 分数 | 最低要求 | 结果 | 依据 | 置信度 |
|---------|------|---------|------|------|-------|
| 发币意愿 | **X** | ≥ 3 | 通过/不通过 | [evidence] | ◆/◇/○ |
| 风险等级 | **X** | ≥ 3 | 通过/不通过 | [evidence] | ◆/◇/○ |

**放弃原因：**[explanation]

---
**数据来源：**[MCP/URL list]
**数据时间：**截至 YYYY-MM-DD HH:MM
**免责声明：**本分析仅供参考，不构成投资建议。数据来源为第三方，可能存在延迟或误差。
```

## Output Template — Gate Pass (门槛通过，完整报告)

```
# P-{ProjectName} 空投评估

> 评分口径：v3 门槛+加权模型（百分制 × 系数）
> 说明：本表仅基于公开信息；其中"审计/规则细节/法域限制"等仍存在未验证项。

## 一、门槛检查

| 门槛维度 | 分数 | 最低要求 | 系数 | 依据 | 置信度 |
|---------|------|---------|------|------|-------|
| 发币意愿 | **X** | ≥ 3 | ×Y | [evidence] | ◆/◇/○ |
| 风险等级 | **X** | ≥ 3 | ×Y | [evidence] | ◆/◇/○ |

## 二、加权评分（四维度 0-5）

| 维度 | 权重 | 分数 | 关键依据 | 主要扣分点/不确定性 | 置信度 |
|------|------|------|---------|-----------------|-------|
| 筹码获取 | 30% | **X** | [evidence] | [concerns] | ◆/◇/○ |
| 链上健康度 | 25% | **X** | [evidence] | [concerns] | ◆/◇/○ |
| 竞争定位 | 25% | **X** | [evidence] | [concerns] | ◆/◇/○ |
| 单位成本 | 20% | **X** | [evidence] | [concerns] | ◆/◇/○ |

## 三、最终得分

| 项目 | 值 |
|------|-----|
| 加权分 | X.XX |
| 百分制 | XX |
| 发币系数 | ×Y |
| 风险系数 | ×Y |
| **最终分** | **XX.X** |

## 四、档位判定

| 档位 | 分数要求 | 筹码要求 | 是否满足 | 结论 |
|------|---------|---------|---------|-----|
| 专项冲刺 | ≥ 80 | 筹码 ≥ 4 | 是/否 | |
| 中等维护 | 60-79 | 筹码 ≥ 3 | 是/否 | |
| 低保维护 | 40-59 | 筹码 ≥ 2 | 是/否 | |
| 放弃 | < 40 或降档失败 | — | 是/否 | |

> 筹码不达标时降档处理（详见评分框架 Tier Classification 规则）

**档位：[result]** — [action recommendation]

## 五、催化剂追踪

| 催化剂 | 影响维度 | 预期影响 | 验证指标 | 验证期限 |
|--------|---------|---------|---------|---------|
| [event] | [dimension] | [+X pts] | [data] | [deadline] |

> 催化剂不改变基础分，重新评估时检查验证状态。
> 如有重大催化剂且基础分距上一档 ≤ 5 分，标注"条件性升级"。

---
**数据来源：**[MCP/URL list]
**数据时间：**截至 YYYY-MM-DD HH:MM
**免责声明：**本分析仅供参考，不构成投资建议。数据来源为第三方，可能存在延迟或误差。
```

## Scoring Framework

详细评分标准见 `references/scoring-framework.md`，包含：
- 门槛层：发币意愿 + 风险等级（含女巫风险）的 1-5 分锚点 + 系数
- 加权层：四维度的完整 1-5 分评分指南
- 计算公式：加权分 → 百分制 → 最终分
- 置信度标注（◆◇○）
- 催化剂追踪规则
- 档位判定规则（含降档规则）

## Output Format

- **Primary**: `P-{ProjectName}空投.md`
- Footer: 数据来源、数据时间戳、免责声明
- 评分以粗体 `**X**` 显示

## Quality Checklist

- [ ] 门槛两维度全部评分（无空白）
- [ ] 门槛不通过 → 精简输出，流程终止
- [ ] 门槛通过 → 四个加权维度全部评分
- [ ] 每项评分至少有一条关键依据
- [ ] 每项评分至少有一条扣分点/不确定性（即使很小）
- [ ] 每项评分带置信度标注（◆◇○）
- [ ] 档位判定正确应用分数区间 + 筹码条件（含降档规则）
- [ ] 催化剂表格已包含（或明确注明"未识别到催化剂"）
- [ ] 预填评分明确标注为建议，直到用户确认
- [ ] 每条依据标注数据来源
- [ ] Footer: 数据来源、时间戳、免责声明
