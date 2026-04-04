# Airdrop Eval Skill v3 Migration Design

> Date: 2026-04-04
> Status: Approved
> Scope: Rewrite `crypto/skills/airdrop-eval/SKILL.md` and `references/scoring-framework.md` in-place

## Background

The airdrop evaluation skill currently uses a v2-style six-dimension equal-weight model (30-point total). The user's scoring framework has evolved to v3 (gate + weighted model), documented in the Obsidian vault at `40_Reference/Research/空投评分框架.md`.

Key motivations for v3 (from framework evolution notes):
- Equal-weight addition masks structural risk (e.g., high token-intent + high risk score hiding low chip-share)
- predict.fun scored 23/30 under v1 (medium maintenance), but personal share was only 0.075%, making actual expected return limited
- Token intent and risk should act as gates, not be diluted by weighting

## Migration Strategy

In-place rewrite of existing files. No new directories. Git history provides version traceability.

**Files to modify:**
1. `crypto/skills/airdrop-eval/SKILL.md` — workflow, output template, quality checklist
2. `crypto/skills/airdrop-eval/references/scoring-framework.md` — dimensions, anchors, tier rules
3. `crypto/commands/airdrop.md` — update description, allowed-tools (+Dune MCP, Chrome CDP tools), workflow summary to match v3

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| "暴击几率" dimension removal | Split: witch risk → risk gate; crowding → chip acquisition | Avoids losing these factors while aligning with v3 structure |
| On-chain health data sources | CoinGecko MCP + Dune MCP + DefiLlama CDP | Dune covers tx metrics, user growth, fees, supply-demand; maintains data-driven principle |
| Catalyst tracking | Written into report, no auto-tracking | Re-evaluation is manual via `/airdrop`; avoids over-engineering |
| Gate failure behavior | Stop immediately, output short "abandon" report | Saves time; no value in scoring if gate fails |
| User-provided docs | Accepted in Step 1; confidence varies by doc type | Official docs → ◆, cross-validated analysis → ◇, single-source → ○ |

## Evaluation Workflow

```
Step 1: Project Identification + Document Collection
  → Parse project name, find official site/docs/social
  → Confirm status (token launched? points system exists?)
  → Ask user for project documents (whitepaper, tokenomics, points rules, etc.)
    · User provides → prioritize as scoring basis, tag confidence by doc type
      - Official announcements/whitepaper/contract docs → ◆
      - Multi-source cross-validated analysis → ◇
      - Single-source unverified → ○
    · User has none → proceed to auto-fetch

Step 2: Auto-Fetch Data
  → Layer 1: CoinGecko MCP (token info)
  → Layer 1: Dune MCP (on-chain data)
    - Daily trading metrics (tx count, volume USD, fees USD, unique takers/makers)
    - User growth (new users, 7d MA, cumulative users)
    - Protocol revenue/fee trends
    - Supply-demand divergence analysis (supply-side vs demand-side trend comparison)
    - Summary KPIs (total volume, total txns, total fees, total users, peak days, WoW change)
  → Layer 2: DefiLlama Chrome CDP (TVL trends)
  → Layer 3: Web Search (funding, team, points mechanism, competitor info)

Step 3: Gate Check
  → Pre-fill "token intent" and "risk level" scores + evidence + confidence
  → User confirms
  → Either < 3 → output "abandon" conclusion + reason, workflow terminates
  → Both ≥ 3 → record coefficients (×0.8/1.0/1.2), proceed to Step 4

Step 4: Weighted Scoring Pre-Fill + User Confirmation
  → Pre-fill four dimensions (chip acquisition / on-chain health / competitive position / unit cost)
  → Each with confidence annotation (◆◇○)
  → User confirms or adjusts each

Step 5: Calculate Final Score + Tier + Catalysts + Generate Report
  → Weighted score = chips×0.30 + on-chain×0.25 + competition×0.25 + cost×0.20
  → Percentage = weighted / 5 × 100
  → Final score = percentage × token-intent coefficient × risk coefficient
  → Tier classification (≥80 / 60-79 / 40-59 / <40 + chip condition)
  → Catalyst table (if any, with verification metrics and deadlines)
  → Output P-xxx report
```

## Scoring Dimensions

### Gate Layer (Pass/Fail + Coefficient)

#### Token Intent (≥3 to pass)

| Score | Criteria | Coefficient |
|-------|----------|-------------|
| 5 | Published tokenomics + clear TGE date | ×1.2 |
| 4 | Points system running + strong institutional backing implies launch | ×1.0 |
| 3 | Has points but no clear token signal | ×0.8 |
| 2 | No points, only interaction-based airdrop speculation | Fail |
| 1 | Team explicitly states no near-term token | Fail |

#### Risk Level (≥3 to pass) — includes witch risk factors

| Score | Criteria | Coefficient |
|-------|----------|-------------|
| 5 | Top-tier institutional backing + clear compliance + transparent rules + clear & reasonable anti-witch rules | ×1.2 |
| 4 | Institutional backing + basic compliance + anti-witch measures exist | ×1.0 |
| 3 | Team verifiable but weak backing, witch rules unclear | ×0.8 |
| 2 | Anonymous team or controversial track record, no anti-witch measures | Fail |
| 1 | Obvious high risk (no audit / rug history / rampant witching with no control) | Fail |

### Weighted Layer (Four Dimensions)

#### Chip Acquisition — 30% (includes crowding/competition factors)

| Score | Criteria |
|-------|----------|
| 5 | Even distribution, personal share >0.5%, mechanism matches personal strengths, few participants with large strategy space |
| 4 | Slight concentration, personal share 0.2-0.5%, catchup room, moderate crowding but differentiable |
| 3 | Moderate concentration, personal share 0.05-0.2%, mechanism roughly fits, crowded but opportunities remain |
| 2 | Heavy concentration (top 100 hold >50%), personal share <0.05%, very crowded |
| 1 | Extreme concentration or complete mechanism mismatch, past optimal window |

#### On-Chain Health — 25% (strictly data-driven, no narrative)

| Score | Criteria |
|-------|----------|
| 5 | All core metrics trending up (volume/users/fees 7d MA rising) |
| 4 | Most metrics rising or plateauing, isolated pullbacks |
| 3 | Metrics diverging, some rising some declining |
| 2 | Most metrics declining, recession phase |
| 1 | Total collapse, core metrics down >90% |

> Iron rule: Only look at historical on-chain data. Expected impact from catalysts is handled separately in the catalyst table.
>
> **No-data fallback:** For testnet projects, off-chain points systems, or early protocols not yet indexed by Dune/DefiLlama — score based on whatever on-chain data IS available (even if partial), mark confidence as ○ (weak assumption), and note which sub-metrics are missing. If absolutely no on-chain data exists, score 3 (neutral) with ○ and explicitly state "no on-chain data available, score is placeholder pending mainnet launch."

#### Competitive Position — 25%

| Score | Criteria |
|-------|----------|
| 5 | Track leader, strong differentiation, multiple moats |
| 4 | Top 3 in track, clear differentiation and channel moats |
| 3 | Mid-track, some advantages but shallow moats |
| 2 | Track follower, no clear differentiation |
| 1 | Track fringe, replaceable at any time |

#### Unit Cost — 20%

| Score | Criteria |
|-------|----------|
| 5 | Zero or minimal cost, no capital risk |
| 4 | Low threshold, low fees, controllable risk |
| 3 | Moderate capital needed, some trading/directional risk |
| 2 | Significant capital or high-frequency ops required, notable risk |
| 1 | High capital + high risk + high lockup |

## Calculation Formula

```
Weighted score = chips×0.30 + on-chain×0.25 + competition×0.25 + cost×0.20
Percentage = weighted score / 5 × 100
Final score = percentage × token-intent coefficient × risk coefficient
```

## Tier Classification

| Tier | Final Score | Extra Condition | Action |
|------|------------|-----------------|--------|
| Sprint (专项冲刺) | ≥ 80 | Chips ≥ 4 | Concentrate resources, maximize points |
| Medium Maintenance (中等维护) | 60-79 | Chips ≥ 3 | Moderate investment, stay active |
| Low Maintenance (低保维护) | 40-59 | Chips ≥ 2 | Minimal activity, wait for signals |
| Abandon (放弃) | < 40 or gate fail | — | Do not participate |

> **Downgrade rule:** If final score meets a tier's score range but fails the chip condition, downgrade to the next tier whose chip condition IS met. E.g., final score 88 with chips=3 → fails Sprint (chips≥4), downgrades to Medium Maintenance (chips≥3 met). If no tier's chip condition is met, classify as Abandon.
>
> **Scores above 100:** The ×1.2 gate coefficients can push final scores above 100. This is by design (rewarding high-certainty projects). Tier classification still applies normally — any score ≥80 with chips≥4 is Sprint.

## Confidence Annotations

| Mark | Meaning | Data Source |
|------|---------|-------------|
| ◆ | Hard data | On-chain queries, official announcements, contract verification |
| ◇ | Strong inference | Multiple independent signals pointing to same conclusion |
| ○ | Weak assumption | Single source or unverified expectation |

## Catalyst Table

Written into report footer, no auto-tracking. Checked manually on re-evaluation.

| Catalyst | Affected Dimension | Expected Impact | Verification Metric | Verification Deadline |
|----------|-------------------|-----------------|--------------------|-----------------------|
| [event] | [dimension] | [+X points] | [what data to watch] | [when] |

Rules:
- Catalysts do not change base scores; listed as "pending verification bonuses"
- If major catalyst exists and base score is ≤5 points from next tier, mark "conditional upgrade"

## Output Templates

### Gate Failure — Short Output

```markdown
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

### Gate Pass — Full Report

```markdown
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

> 筹码不达标时降档处理（详见 Tier Classification 规则）

**档位：[result]** — [action recommendation]

## 五、催化剂追踪

| 催化剂 | 影响维度 | 预期影响 | 验证指标 | 验证期限 |
|--------|---------|---------|---------|---------|
| [event] | [dimension] | [+X pts] | [data] | [deadline] |

> 催化剂不改变基础分，重新评估时检查验证状态。

---
**数据来源：**[MCP/URL list]
**数据时间：**截至 YYYY-MM-DD HH:MM
**免责声明：**本分析仅供参考，不构成投资建议。数据来源为第三方，可能存在延迟或误差。
```

## Data Source Mapping

| Data Need | Layer 1 (MCP) | Layer 2 (Chrome CDP) | Layer 3 (Web Search) |
|-----------|--------------|---------------------|---------------------|
| Token info | CoinGecko | — | coingecko.com |
| On-chain metrics (tx, users, fees, supply-demand) | Dune | — | dune.com |
| TVL trends | — | defillama.com/protocol/{protocol} | defillama.com |
| Funding/team | — | — | crunchbase, rootdata, web search |
| Points mechanism | — | Official docs/Discord | web search |
| Competitor analysis | — | — | web search |

## Quality Checklist

- [ ] Gate dimensions both scored (no blanks)
- [ ] Gate failure → short output, workflow stops
- [ ] Gate pass → all four weighted dimensions scored
- [ ] Each score has at least one key evidence item
- [ ] Each score has at least one deduction/uncertainty item
- [ ] Confidence annotation (◆◇○) on every score
- [ ] Tier classification correctly applies score + chip condition
- [ ] Catalyst table included (or explicitly stated "none identified")
- [ ] Pre-filled scores marked as suggestions until user confirms
- [ ] Footer: data sources, timestamp, disclaimer
