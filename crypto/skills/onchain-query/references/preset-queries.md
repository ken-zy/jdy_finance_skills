# Preset On-Chain Queries

常用链上查询模板。Claude 使用 Dune MCP 的 `searchTables` 和 `searchDocs` 工具
来发现具体的表名和字段，然后基于以下模板构建 SQL。

## 1. Daily Active Addresses (any chain)

**用途**: 查看某链的日活跃地址趋势
**示例请求**: "以太坊过去30天的日活跃地址"
**SQL 模板**:
```sql
SELECT
  date_trunc('day', block_time) AS day,
  COUNT(DISTINCT "from") AS active_addresses
FROM {chain}.transactions
WHERE block_time >= NOW() - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 1
```
**注意**: 表名因链而异，用 searchTables 确认

## 2. Top DEX by Volume (7d)

**用途**: 各 DEX 协议过去 7 天交易量排名
**示例请求**: "过去7天 DEX 交易量排名"
**SQL 模板**:
```sql
SELECT
  project,
  SUM(amount_usd) AS volume_usd
FROM dex.trades
WHERE block_time >= NOW() - INTERVAL '7' DAY
GROUP BY 1
ORDER BY 2 DESC
LIMIT 20
```

## 3. Stablecoin Supply by Chain

**用途**: 各链稳定币总供给量对比
**示例请求**: "各链稳定币供给量"
**关键表**: 搜索 "stablecoin" 或 "transfers" 相关表

## 4. L2 TVL / Activity Comparison

**用途**: L2 网络活跃度和 TVL 对比
**示例请求**: "L2 网络活跃度对比"
**关键表**: 搜索各 L2 链的 transactions 表

## 5. Gas Price Trends

**用途**: Gas 价格历史趋势
**示例请求**: "以太坊 Gas 价格趋势"
**SQL 模板**:
```sql
SELECT
  date_trunc('day', block_time) AS day,
  AVG(gas_price / 1e9) AS avg_gas_gwei,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY gas_price / 1e9) AS median_gas_gwei
FROM ethereum.transactions
WHERE block_time >= NOW() - INTERVAL '30' DAY
GROUP BY 1
ORDER BY 1
```

## 6. Top Token Holders

**用途**: 某代币持仓地址排名
**示例请求**: "USDC 前 50 大持仓地址"
**关键表**: 搜索 "erc20" 或 "balances" 相关表
**注意**: 需要合约地址来精确查询

## 7. NFT Marketplace Volume

**用途**: NFT 市场交易量对比
**示例请求**: "NFT 市场交易量排名"
**关键表**: 搜索 "nft" 或 "trades" 相关表

## 8. Bridge Volume by Chain

**用途**: 跨链桥交易量
**示例请求**: "跨链桥交易量对比"
**关键表**: 搜索 "bridge" 相关表
