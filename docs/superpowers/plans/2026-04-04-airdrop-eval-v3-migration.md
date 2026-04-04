# Airdrop Eval v3 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the airdrop evaluation skill from v2 six-dimension equal-weight model to v3 gate+weighted model with confidence annotations and catalyst tracking.

**Architecture:** Three Markdown files rewritten in-place. No new files or directories. The scoring-framework reference is rewritten first (it's the source of truth), then SKILL.md (workflow + templates), then airdrop.md command wrapper (entry point sync).

**Tech Stack:** Markdown only. No code files.

**Spec:** `docs/superpowers/specs/2026-04-04-airdrop-eval-v3-migration-design.md`

---

### Task 1: Rewrite scoring-framework.md

**Files:**
- Modify: `crypto/skills/airdrop-eval/references/scoring-framework.md` (full rewrite)

This is the source of truth for all scoring logic. Must be rewritten before SKILL.md references it.

- [ ] **Step 1: Rewrite the file with v3 content**

Replace the entire file with:

```markdown
# 空投评估评分框架 v3

> 评分口径：门槛+加权模型（百分制 × 系数）
> 迭代历史：v1 等权六维度 → v2 增加置信度+催化剂层 → v3 门槛+加权模型
> 核心公式：预期收益 = P(发币) × FDV × 空投比例 × 个人占比 - 投入成本

## 第一层：门槛检查（Pass / Fail）

两个维度作为入场门槛，不通过则直接放弃：

| 门槛维度 | 评分范围 | 最低要求 | 不通过则 |
|---------|---------|---------|---------|
| 发币意愿 | 1-5 | ≥ 3 | 放弃（不发币一切白做） |
| 风险等级 | 1-5（5=风险最低） | ≥ 3 | 放弃（跑路/监管/女巫风险太高） |

### 发币意愿评分锚点

| 分数 | 标准 | 通过门槛后的系数 |
|------|------|--------------|
| 5 | 已公布 tokenomics + 明确 TGE 日期 | ×1.2 |
| 4 | 积分系统运行中 + 强机构背书暗示必发 | ×1.0 |
| 3 | 有积分但无明确发币信号 | ×0.8 |
| 2 | 无积分，仅靠交互博空投 | 不通过 |
| 1 | 项目方明确表示短期不发币 | 不通过 |

自动数据辅助：搜索官方公告、文档中的 tokenomics、创始人社交媒体发言

### 风险等级评分锚点（含女巫风险）

| 分数 | 标准 | 通过门槛后的系数 |
|------|------|--------------|
| 5 | 顶级机构背书 + 合规清晰 + 规则透明 + 女巫规则明确合理 | ×1.2 |
| 4 | 有机构背书 + 基本合规 + 有反女巫措施 | ×1.0 |
| 3 | 团队可查但背书一般，女巫规则不明确 | ×0.8 |
| 2 | 团队匿名或有争议记录，无反女巫措施 | 不通过 |
| 1 | 明显高风险（审计缺失/跑路前科/女巫横行无管控） | 不通过 |

自动数据辅助：审计状态、合约权限分析、团队背景、监管敏感度、女巫规则公告

---

## 第二层：加权评分

四个核心维度，按对个人收益的影响程度加权：

| 维度 | 权重 | 映射到收益公式 | 理由 |
|------|------|-------------|------|
| **筹码获取** | **30%** | 个人占比 | 直接决定你分到多少，是个人 ROI 最大变量 |
| **链上健康度** | **25%** | FDV 的下限 | 决定项目当前真实状态，用数据说话 |
| **竞争定位** | **25%** | FDV 的上限 | 决定估值天花板和长期生存能力 |
| **单位成本** | **20%** | 投入成本 | 影响净收益，但不如前三者关键 |

### 筹码获取（权重 30%）— 含拥挤度/参与者竞争

评估要素：
- 获取机制是否匹配自身优势？（资金型/技术型/时间型）
- 积分/筹码分配集中度如何？
- 个人当前持仓占总池比例
- 是否存在追赶/重置机会？
- 参与者拥挤程度、差异化策略空间

| 分数 | 标准 |
|------|------|
| 5 | 分配均匀，个人占比 > 0.5%，机制匹配自身优势，参与者少策略空间大 |
| 4 | 轻度集中，个人占比 0.2-0.5%，有追赶空间，中等拥挤但可差异化 |
| 3 | 中度集中，个人占比 0.05-0.2%，机制基本匹配，较拥挤仍有机会 |
| 2 | 重度集中（Top 100 占 > 50%），个人占比 < 0.05%，非常拥挤 |
| 1 | 极度集中或机制与自身完全不匹配，已过最佳窗口期 |

自动数据辅助：链上参与门槛、积分机制分析、最低资金要求、排行榜集中度、链上地址数趋势、社区讨论热度

### 链上健康度（权重 25%）

评估要素（**必须用链上数据支撑，不接受纯叙事**）：
- 日度交易指标（交易次数、交易量 USD、手续费 USD、Unique Takers/Makers）
- 用户增长（新增用户、7日均值、累计用户）
- 协议收入/手续费趋势
- 供需背离分析（供给侧指标 vs 需求侧指标趋势对比）
- 汇总 KPI（总交易量、总交易数、总手续费、总用户数、峰值日、WoW 变化）
- TVL 趋势（7d MA 方向）

| 分数 | 标准 |
|------|------|
| 5 | 所有核心指标上升趋势（交易量/用户/手续费 7d MA 向上） |
| 4 | 多数指标上升或平台期，个别回调 |
| 3 | 指标分化，部分上升部分下降 |
| 2 | 多数指标下降趋势，衰退期 |
| 1 | 全线崩溃，核心指标跌幅 > 90% |

> **铁律**：本维度只看已发生的链上数据。催化剂的预期影响通过催化剂追踪层单独处理，不在此维度打分。
>
> **无数据兜底**：对于 testnet 项目、off-chain 积分系统、或尚未被 Dune/DefiLlama 索引的早期协议 — 基于可获取的部分数据打分，置信度标注为 ○（弱假设），注明缺失的子指标。如果完全无链上数据，打 3 分（中性）+ ○，并注明"无链上数据，评分为占位，待主网上线后更新"。

自动数据辅助：Dune MCP（交易指标/用户增长/手续费/供需分析/KPI 汇总）、DefiLlama Chrome CDP（TVL 趋势）

### 竞争定位（权重 25%）

评估要素：
- 在赛道中的市场地位（领先/追赶/边缘）
- 相对竞品的差异化优势（费率/功能/渠道/壁垒）
- 关键渠道/资源独占性
- 赛道整体热度与增长空间

| 分数 | 标准 |
|------|------|
| 5 | 赛道领先者，强差异化，多重壁垒 |
| 4 | 赛道前三，有明确差异化和渠道壁垒 |
| 3 | 赛道中游，有一定优势但壁垒不深 |
| 2 | 赛道追赶者，无明显差异化 |
| 1 | 赛道边缘，随时可能被替代 |

自动数据辅助：Web Search 竞品对比、DefiLlama 同赛道协议 TVL 排名

### 单位成本（权重 20%）

评估要素：
- 最低参与门槛
- 交易费率 / gas 成本
- 资金锁定/方向性风险
- 被动收益（如有）

| 分数 | 标准 |
|------|------|
| 5 | 零成本或极低成本，无资金风险 |
| 4 | 低门槛，低费率，风险可控 |
| 3 | 需适度资金，有一定交易/方向风险 |
| 2 | 需大量资金或高频操作，风险显著 |
| 1 | 高资金 + 高风险 + 高锁定 |

自动数据辅助：Gas 费估算、参与所需最低资金量、交互频率要求

---

## 第三层：计算最终分

```
加权分 = 筹码×0.30 + 链上×0.25 + 竞争×0.25 + 成本×0.20
百分制 = 加权分 / 5 × 100
最终分 = 百分制 × 发币系数 × 风险系数
```

---

## 第四层：置信度标注

每个维度评分后附加标记：

| 标记 | 含义 | 数据来源 |
|------|------|---------|
| ◆ | 硬数据 | 链上查询、官方公告、合约验证 |
| ◇ | 强推理 | 多个独立信号指向同一结论 |
| ○ | 弱假设 | 单一信息源或未验证预期 |

---

## 第五层：催化剂追踪

独立于基础评分，记录尚未反映在数据中的事件：

| 催化剂 | 影响维度 | 预期影响 | 验证指标 | 验证期限 |
|--------|---------|---------|---------|---------|
| [事件] | [维度] | [+X分] | [看什么数据] | [多久] |

规则：
- 催化剂**不直接改变基础分**，作为"待验证加成"单独列出
- 验证期限到达后：数据通过 → 并入基础分；未通过 → 移除
- 如有重大催化剂且基础分距上一档 ≤ 5 分，可标注"条件性升级"
- 催化剂写入报告，不自动追踪，重新评估时手动检查

---

## 档位判定

| 档位 | 最终分 | 额外条件 | 操作 |
|------|--------|---------|------|
| 专项冲刺 | ≥ 80 | 筹码 ≥ 4 | 集中资源，最大化积分 |
| 中等维护 | 60-79 | 筹码 ≥ 3 | 适度投入，保持活跃 |
| 低保维护 | 40-59 | 筹码 ≥ 2 | 最低活跃，等信号 |
| 放弃 | < 40 或门槛不过 | — | 不参与 |

> **降档规则**：如果最终分达到某档位的分数区间，但不满足该档位的筹码条件，则降至下一个筹码条件满足的档位。例如最终分 88 但筹码=3 → 不满足专项冲刺（筹码≥4），降至中等维护（筹码≥3 满足）。如果所有档位的筹码条件都不满足，归入放弃。
>
> **超过 100 分**：×1.2 门槛系数可使最终分超过 100，这是设计意图（奖励高确定性项目）。档位判定正常适用 — 任何 ≥80 且筹码≥4 的分数均为专项冲刺。
```

- [ ] **Step 2: Verify the file is well-formed**

Read back the file and visually confirm:
- All 6 scoring anchors have complete tables
- Gate layer has coefficient column
- Weighted layer has correct percentages (30/25/25/20)
- No-data fallback is present under on-chain health
- Downgrade rule is present under tier classification
- Catalyst rules are complete

- [ ] **Step 3: Commit**

```bash
git add crypto/skills/airdrop-eval/references/scoring-framework.md
git commit -m "refactor(airdrop): rewrite scoring framework to v3 gate+weighted model"
```

---

### Task 2: Rewrite SKILL.md

**Files:**
- Modify: `crypto/skills/airdrop-eval/SKILL.md` (full rewrite)

Depends on Task 1 (scoring-framework.md must be in place first as SKILL.md references it).

- [ ] **Step 1: Rewrite the file with v3 content**

Replace the entire file with:

```markdown
---
name: airdrop-eval
description: |
  空投项目评估 — 基于 v3 门槛+加权模型（发币意愿/风险 门槛检查 → 筹码/链上/竞争/成本 加权评分）
  百分制 × 系数，输出档位判定（Sprint/中等维护/低保维护）。
  输出格式对齐 P-xxx 空投评估模板。Triggers on "空投评估", "airdrop evaluation",
  "项目评分", "airdrop scoring", "空投分析", "evaluate airdrop", or "P-xxx".
---

# Airdrop Evaluation (v3)

基于门槛+加权评分框架对空投项目进行综合评估，输出 P-xxx 格式报告。

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 代币信息（如已发币）
- **dune** — 链上数据（交易指标、用户增长、手续费、供需分析、KPI 汇总）

### Layer 2: Chrome CDP
- `defillama.com/protocol/{protocol}` — TVL 趋势、协议数据
- 官网、文档、Discord

### Layer 3: Web Search
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
```

- [ ] **Step 2: Verify the file is well-formed**

Read back and confirm:
- Frontmatter name/description updated
- Data Source Priority includes dune
- Workflow has 5 steps with gate-check early termination
- Both output templates present (gate fail + gate pass)
- Quality checklist matches spec
- References scoring-framework.md correctly

- [ ] **Step 3: Commit**

```bash
git add crypto/skills/airdrop-eval/SKILL.md
git commit -m "refactor(airdrop): rewrite SKILL.md to v3 gate+weighted workflow"
```

---

### Task 3: Update airdrop.md command wrapper

**Files:**
- Modify: `crypto/commands/airdrop.md` (update description, allowed-tools, workflow summary)

Depends on Task 2 (SKILL.md must be final so command wrapper stays in sync).

- [ ] **Step 1: Rewrite the file with v3 content**

Replace the entire file with:

```markdown
---
description: "空投项目评估 — v3 门槛+加权模型/档位判定(Sprint/中等/低保)/P-xxx 格式输出"
argument-hint: "<project_name>"
allowed-tools: mcp__coingecko__*, mcp__dune__*, mcp__claude-in-chrome__*, WebSearch, WebFetch
---

# Airdrop Evaluation

对空投项目进行 v3 门槛+加权评分和档位判定。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 代币信息（如已发币）
- **dune** — 链上数据（交易指标、用户增长、手续费、供需分析）

### Layer 2: Chrome CDP
- `defillama.com/protocol/{protocol}` — TVL 趋势、协议数据
- 官网、文档、Discord

### Layer 3: Web Search
- 融资背景、团队、社区、积分机制、竞品、官方公告

## Workflow

### Step 1: Project Identification + Document Collection
- 查找官网、文档、社交链接
- 确认项目状态（是否已发币、积分系统）
- 主动询问用户是否有项目文档（白皮书、tokenomics、积分规则）

### Step 2: Auto-Fetch Data
- coingecko: 代币信息（如已发币）
- dune: 链上交易指标、用户增长、手续费、供需分析
- defillama: TVL 趋势（Chrome CDP）
- Web Search: 融资/团队/积分机制/社区/竞品

### Step 3: Gate Check (门槛检查)
预填发币意愿 + 风险等级评分（含置信度），用户确认：
- 任一 < 3 → 输出"放弃"精简报告，流程终止
- 两项都 ≥ 3 → 记录系数，进入加权评分

### Step 4: Weighted Scoring (加权评分)
预填四维度（筹码获取/链上健康度/竞争定位/单位成本）+ 置信度，用户确认

### Step 5: Calculate + Report
- 加权分 → 百分制 → 最终分（× 发币系数 × 风险系数）
- 档位判定（含降档规则）
- 催化剂表格
- 输出 P-xxx 报告

## Output

- **Primary**: `P-{ProjectName}空投.md`
- Footer: 数据来源、数据时间戳、免责声明

## Quality Checklist

- [ ] 门槛两维度全部评分
- [ ] 门槛不通过 → 精简输出，流程终止
- [ ] 门槛通过 → 四维度全部评分
- [ ] 每项评分有依据 + 扣分点 + 置信度标注
- [ ] 档位判定应用分数 + 筹码条件 + 降档规则
- [ ] 数据来源标注
- [ ] 预填评分标注为建议

## Skill Reference

This command invokes the **airdrop-eval** skill. See `skills/airdrop-eval/SKILL.md` for the complete v3 evaluation methodology and `skills/airdrop-eval/references/scoring-framework.md` for the gate+weighted scoring rubric.
```

- [ ] **Step 2: Verify allowed-tools are correct**

Confirm the allowed-tools line includes:
- `mcp__coingecko__*` — token info
- `mcp__dune__*` — on-chain data
- `mcp__claude-in-chrome__*` — Chrome CDP for DefiLlama and other sites
- `WebSearch` — fallback search
- `WebFetch` — URL fetching

- [ ] **Step 3: Commit**

```bash
git add crypto/commands/airdrop.md
git commit -m "refactor(airdrop): update command wrapper for v3 gate+weighted model"
```

---

### Task 4: Update v3 source framework in Obsidian vault

**Files:**
- Modify: `/Users/jdy/Documents/Main/40_Reference/Research/空投评分框架.md`

Per design decision: split "暴击几率" elements into risk gate (witch risk) and chip acquisition (crowding). This updates the authoritative source document.

- [ ] **Step 1: Update 风险等级 anchors to include witch risk**

In the 风险等级评分锚点 table, update each row to incorporate witch risk factors:

| 分数 | 标准 | 通过门槛后的系数 |
|------|------|--------------|
| 5 | 顶级机构背书 + 合规清晰 + 规则透明 + 女巫规则明确合理 | ×1.2 |
| 4 | 有机构背书 + 基本合规 + 有反女巫措施 | ×1.0 |
| 3 | 团队可查但背书一般，女巫规则不明确 | ×0.8 |
| 2 | 团队匿名或有争议记录，无反女巫措施 | 不通过 |
| 1 | 明显高风险（审计缺失/跑路前科/女巫横行无管控） | 不通过 |

- [ ] **Step 2: Update 筹码获取 anchors to include crowding**

In the 筹码获取 scoring section, update each row to incorporate crowding/competition factors:

| 分数 | 标准 |
|------|------|
| 5 | 分配均匀，个人占比 > 0.5%，机制匹配自身优势，参与者少策略空间大 |
| 4 | 轻度集中，个人占比 0.2-0.5%，有追赶空间，中等拥挤但可差异化 |
| 3 | 中度集中，个人占比 0.05-0.2%，机制基本匹配，较拥挤仍有机会 |
| 2 | 重度集中（Top 100 占 > 50%），个人占比 < 0.05%，非常拥挤 |
| 1 | 极度集中或机制与自身完全不匹配，已过最佳窗口期 |

Add to 筹码获取 评估要素 list:
- 参与者拥挤程度、差异化策略空间

- [ ] **Step 3: Add no-data fallback to 链上健康度**

After the 铁律 note under 链上健康度, add:

```markdown
> **无数据兜底**：对于 testnet 项目、off-chain 积分系统、或尚未被索引的早期协议 — 基于可获取的部分数据打分，置信度标注为 ○（弱假设），注明缺失的子指标。如果完全无链上数据，打 3 分（中性）+ ○，并注明"无链上数据，评分为占位，待主网上线后更新"。
```

- [ ] **Step 4: Add downgrade rule to 档位判定**

After the tier table, add:

```markdown
> **降档规则**：如果最终分达到某档位的分数区间，但不满足该档位的筹码条件，则降至下一个筹码条件满足的档位。例如最终分 88 但筹码=3 → 不满足专项冲刺（筹码≥4），降至中等维护（筹码≥3 满足）。如果所有档位的筹码条件都不满足，归入放弃。
>
> **超过 100 分**：×1.2 门槛系数可使最终分超过 100，这是设计意图（奖励高确定性项目）。档位判定正常适用。
```

- [ ] **Step 5: Verify changes**

Read back the file and confirm all four changes are applied correctly.

Note: This file is outside the git repo (Obsidian vault), so no git commit needed.

---

### Task 5: Update project docs (CLAUDE.md + README.md)

**Files:**
- Modify: `CLAUDE.md:82` — update airdrop output format description
- Modify: `README.md:86` — update airdrop command description

- [ ] **Step 1: Update CLAUDE.md**

Change line 82 from:
```
- 包含六维度评分表 + 档位判定
```
to:
```
- 包含 v3 门槛+加权评分表 + 档位判定
```

- [ ] **Step 2: Update README.md**

Change line 86 from:
```
| `/crypto:airdrop [project]` | 空投项目评估（六维度） | Markdown |
```
to:
```
| `/crypto:airdrop [project]` | 空投项目评估（v3 门槛+加权） | Markdown |
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: update airdrop references from v2 six-dimension to v3 gate+weighted"
```

---

### Task 6: Final verification

**Files:**
- Read: all modified files in the plugin repo

- [ ] **Step 1: Cross-reference consistency**

Verify across all five modified files:
- `scoring-framework.md` dimension names match `SKILL.md` workflow and template
- `SKILL.md` allowed-tools intent matches `airdrop.md` allowed-tools list
- `CLAUDE.md` and `README.md` no longer reference "六维度"
- Tier classification rules are identical in all files
- Confidence annotations (◆◇○) defined consistently
- Catalyst table format matches across framework and templates

- [ ] **Step 2: Verify against spec quality checklist**

Walk through every item in the spec's Quality Checklist section and confirm coverage:
- Gate dimensions both scored (no blanks)
- Gate failure → short output, workflow stops
- Gate pass → all four weighted dimensions scored
- Each score has at least one key evidence item
- Each score has at least one deduction/uncertainty item
- Confidence annotation (◆◇○) on every score
- Tier classification correctly applies score + chip condition
- Catalyst table included (or explicitly stated "none identified")
- Pre-filled scores marked as suggestions until user confirms
- Footer: data sources, timestamp, disclaimer

- [ ] **Step 3: Commit all if any stragglers**

```bash
git status
# If any unstaged changes remain:
git add -A crypto/skills/airdrop-eval/ crypto/commands/airdrop.md
git commit -m "fix(airdrop): final consistency fixes for v3 migration"
```
