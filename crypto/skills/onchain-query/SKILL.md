---
name: onchain-query
description: |
  On-chain data query using Dune Analytics. Supports natural language queries
  that get translated to SQL, preset query templates for common analyses, and
  direct Dune query ID execution. Uses official Dune MCP (11 tools) for table
  discovery, SQL creation, execution, and visualization. Triggers on "链上查询",
  "on-chain query", "dune query", "链上数据", "blockchain data", "查链上",
  or "run dune query [id]".
---

# On-Chain Query

通过 Dune Analytics 进行链上数据查询，支持自然语言转 SQL、预置查询模板、直接执行 query ID。

## Data Source Priority

### Layer 1: Dune MCP (official, 11 tools)
- **Discovery**: searchDocs, searchTables, listBlockchains, searchTablesByContractAddress
- **Query Lifecycle**: createDuneQuery, getDuneQuery, updateDuneQuery, executeQueryById, getExecutionResults
- **Visualization**: generateVisualization
- **Account**: getUsage

### Layer 2: Web Search
- Dune 公开 dashboard 的预计算数据

### Layer 3: Chrome CDP
- 需登录的 Dune dashboard

## Workflow — Mode A: Natural Language Query

用户用自然语言描述查询需求，Claude 自动转化为 SQL。

### Step 1: Parse Intent
- 解析用户想查什么数据
- 确定目标链、时间范围、粒度

### Step 2: Discover Chain
- `listBlockchains` — 确认目标链在 Dune 中已索引

### Step 3: Discover Tables
- `searchTables` — 按协议/链/类别搜索相关表
- 记录表名、关键字段

### Step 4: Learn Schema
- `searchDocs` — 学习表结构和示例 SQL
- 理解字段含义和数据类型

### Step 5: Write Query
- `createDuneQuery` — 编写并保存 SQL 查询
- 确保时间范围有界（禁止无界查询）
- 向用户展示 SQL 以供确认

### Step 6: Execute Query
- `executeQueryById` — 执行查询

### Step 7: Fetch Results
- `getExecutionResults` — 获取结果
- 如仍在运行，轮询等待完成

### Step 8: Format Output
- 将结果格式化为 Markdown 表格
- 标注行数和执行时间

### Step 9 (optional): Visualize
- `generateVisualization` — 如数据适合图表，生成可视化

## Workflow — Mode B: Preset Query

使用预置模板快速查询常见链上数据。

### Step 1: Match Preset
- 将用户请求匹配到 `references/preset-queries.md` 中的模板

### Step 2: Adapt Template
- 根据用户指定的参数（链/代币/时间范围）调整 SQL 模板
- 用 `searchTables` 确认实际表名

### Step 3: Execute
- 同 Mode A 的 Step 5-9

## Workflow — Mode C: Direct Query ID

用户提供已有的 Dune query ID，直接执行。

### Step 1: Fetch Query
- `getDuneQuery` — 获取查询元数据和 SQL

### Step 2: Execute
- `executeQueryById` — 执行查询

### Step 3: Present Results
- `getExecutionResults` — 获取结果
- 格式化输出

## Output Format

- **Primary**: Markdown 表格（对话中直接显示）
- **Optional**: 保存为 `Onchain_{Description}_{YYYYMMDD}.md`
- 包含使用的 SQL 查询（代码块）
- 通过 `getUsage` 标注 Dune credit 消耗

## Quality Checklist

- [ ] SQL 基于已发现的表结构编写（非猜测）
- [ ] 时间范围明确（禁止无界查询）
- [ ] 结果包含行数和执行时间
- [ ] 大结果集截断并标注
- [ ] Mode A 下 SQL 展示给用户确认后再执行
- [ ] Credit 使用量已标注

## Important Notes

- Dune 查询消耗 credits — 用 `getUsage` 监控用量
- 查询执行可能需要 10-60 秒，用 `getExecutionResults` 轮询
- 表名和 schema 因链而异 — 始终先用 `searchTables`
- 复杂查询先展示 SQL 给用户确认
- 预置查询是模板，非最终 SQL — 需适配具体表结构
