---
description: On-chain data query — natural language to Dune SQL, preset queries, or direct query ID execution
argument-hint: <natural_language_query> | query:<dune_query_id>
allowed-tools: mcp__dune__*, WebSearch, WebFetch
---

# On-Chain Query

通过 Dune Analytics 进行链上数据查询。

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Data Source Priority

### Layer 1: Dune MCP (official, 11 tools)
- **Discovery**: searchDocs, searchTables, listBlockchains, searchTablesByContractAddress
- **Query**: createDuneQuery, getDuneQuery, updateDuneQuery, executeQueryById, getExecutionResults
- **Visualization**: generateVisualization
- **Account**: getUsage

### Layer 2: Web Search
- Dune 公开 dashboard 数据

### Layer 3: Chrome CDP
- 需登录的 Dune dashboard

## Workflow

判断查询模式：

### Mode A: Natural Language Query
如用户用自然语言描述需求（如"以太坊过去7天日活地址数"）：

1. 解析意图 — 数据/链/时间范围
2. `listBlockchains` — 确认链已索引
3. `searchTables` — 发现相关表
4. `searchDocs` — 学习表结构和示例 SQL
5. `createDuneQuery` — 编写 SQL（展示给用户确认）
6. `executeQueryById` — 执行
7. `getExecutionResults` — 获取结果
8. 格式化为 Markdown 表格
9. (Optional) `generateVisualization` — 生成图表

### Mode B: Preset Query
如用户请求匹配预置模板（如"DEX 交易量排名"）：

1. 匹配 `skills/onchain-query/references/preset-queries.md` 模板
2. 用 `searchTables` 确认实际表名
3. 适配 SQL 并执行（同 Mode A Step 5-9）

### Mode C: Direct Query ID
如用户提供 Dune query ID（如"query:12345"）：

1. `getDuneQuery` — 获取查询信息
2. `executeQueryById` — 执行
3. `getExecutionResults` — 获取结果并格式化

## Output

- **Primary**: Markdown 表格（对话中显示）
- **Optional**: `Onchain_{Description}_{YYYYMMDD}.md`
- 包含 SQL 代码块
- 标注 Dune credit 消耗

## Quality Checklist

- [ ] SQL 基于 searchTables 发现的表结构（非猜测）
- [ ] 时间范围明确（禁止无界查询）
- [ ] 结果包含行数和执行时间
- [ ] 大结果集截断并标注
- [ ] Mode A 下 SQL 先展示确认再执行
- [ ] Credit 使用标注

## Skill Reference

This command invokes the **onchain-query** skill. See `skills/onchain-query/SKILL.md` for the complete query workflow and `skills/onchain-query/references/preset-queries.md` for common query templates.
