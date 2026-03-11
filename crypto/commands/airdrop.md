---
description: 空投项目评估 — 六维度评分(0-5)/档位判定(Sprint/中等/低保)/P-xxx 格式输出
argument-hint: <project_name>
allowed-tools: mcp__coingecko__*, mcp__defillama__*, WebSearch, WebFetch
---

# Airdrop Evaluation

对空投项目进行六维度评分和档位判定。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: MCP
- **coingecko** — 代币信息（如已发币）
- **defillama** — TVL 趋势、协议数据

### Layer 2: Web Search
- 融资背景、团队、社区、积分机制、官方公告

### Layer 3: Chrome CDP
- 官网、文档、Discord

## Workflow

### Step 1: Identify Project
- 查找官网、文档、社交链接
- 确认项目状态（是否已发币、积分系统）

### Step 2: Auto-Fetch Data
- coingecko: 代币信息（如已发币）
- defillama: TVL、链分布
- Web Search: 融资/团队/积分机制/社区规模

### Step 3: Pre-Fill Scoring
基于数据为六维度预填评分建议（标注为建议，非最终）：
- 发币意愿（总包潜力/分配机制/规则稳定性）
- 筹码获取（与自身优势匹配）
- 增长与可持续性
- 单位成本（资金利用率）
- 暴击几率（竞争拥挤度/女巫影响）
- 风险等级（KYC/监管/作恶/女巫规则）

### Step 4: User Confirms/Adjusts
- 呈现预填结果，请用户确认或调整
- 用户可补充自己的判断依据

### Step 5: Generate Report
按 P-xxx 模板输出：

```
> 评分口径：0–5 分（5=最好/最优），总分 30

## 一、六维度评分（0–5）

| 维度 | 分数 | 关键依据 | 主要扣分点/不确定性 |
|------|------|---------|-----------------|
| ... | **X** | ... | ... |

**总分：X / 30**

## 二、档位判定

| 档位 | 规则门槛 | 是否满足 | 结论 |
|------|---------|---------|-----|
| 专项冲刺 | 总分≥25 且 筹码≥4 且 风险≥4 | | |
| 中等维护 | 总分20-24 且 筹码≥3 且 风险≥4 | | |
| 低保维护 | 总分15-19 且 筹码≥2 且 风险≥3 | | |
```

## Output

- **Primary**: `P-{ProjectName}空投.md`
- Footer: 数据来源、数据时间戳、免责声明

## Quality Checklist

- [ ] 六维度全部评分（无空白）
- [ ] 每项评分有关键依据
- [ ] 每项有扣分点/不确定性
- [ ] 档位判定正确应用 AND 逻辑
- [ ] 数据来源标注
- [ ] 预填评分标注为建议

## Skill Reference

This command invokes the **airdrop-eval** skill. See `skills/airdrop-eval/SKILL.md` for the complete evaluation methodology and `skills/airdrop-eval/references/scoring-framework.md` for the six-dimension scoring rubric.
