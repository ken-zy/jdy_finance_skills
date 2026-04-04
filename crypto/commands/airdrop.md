---
description: "空投项目评估 — v3 门槛+加权模型/档位判定(Sprint/中等/低保)/P-xxx 格式输出"
argument-hint: "<project_name>"
allowed-tools: mcp__coingecko__*, mcp__dune__*, WebSearch, WebFetch
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
