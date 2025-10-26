# 🚀 SUIPort - Next Generation SUI Portfolio Tracking API

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white" />
  <img src="https://img.shields.io/badge/SUI-5A67D8?style=for-the-badge&logo=sui&logoColor=white" />
  <img src="https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white" />
</div>

<div align="center">
  <strong>Enterprise-Grade DeFi Portfolio Tracking & Analytics for the SUI Blockchain</strong>
</div>

## 🌟 Overview

SUIPort is a comprehensive, production-ready DeFi portfolio tracking service built specifically for the SUI blockchain ecosystem. Leveraging Cloudflare's edge infrastructure, it provides real-time portfolio tracking, DeFi position monitoring, and AI-powered analytics with millisecond latency across the globe.

### ✨ Key Features

- 🚄 Real-time wallet tracking with sub-second updates
- 📊 Advanced price aggregation from multiple DEXes (Cetus, DeepBook, 7K Protocol)
- 📈 Historical performance analytics & trend tracking
- 🔄 Automated price synchronization via cron jobs
- 🎯 Token metadata caching for instant lookups
- 🌐 Global edge deployment via Cloudflare Workers
- 🔮 **GraphQL API** for flexible data querying
- 🤖 **Model Context Protocol (MCP)** support for AI assistants
- 💧 **DeFi Position Tracking**: MMT Finance, Cetus, DeepBook
- 📊 Multi-source price aggregation with fallback mechanisms
- 🔐 RESTful & GraphQL interfaces

## 🛠 Tech Architecture

- **Runtime**: Cloudflare Workers (Edge Computing)
- **Framework**: Hono.js for API routing
- **Database**: Cloudflare D1 (SQLite on the edge)
- **Blockchain**: SUI SDK (@mysten/sui)
- **DeFi Protocols**: 
  - MMT Finance SDK (@mmt-finance/clmm-sdk)
  - Cetus Protocol SDK (@cetusprotocol/common-sdk)
  - 7K Protocol SDK (@7kprotocol/sdk-ts)
- **GraphQL**: Apollo Server with custom resolvers
- **AI Integration**: Model Context Protocol (MCP) Server
- **Language**: TypeScript

## 📚 API Documentation

### 🎨 API Types

SUIPort provides three different API interfaces:

1. **REST API** - Traditional HTTP endpoints for simple queries
2. **GraphQL API** - Flexible, efficient data querying with a single endpoint
3. **MCP Server** - AI assistant integration via Model Context Protocol

---

## 🔌 REST API Endpoints

### 🔍 Wallet Analytics API

#### Get Wallet Portfolio
Provides comprehensive wallet analysis including:
- Total portfolio value in USD
- 24h change percentage
- Token breakdowns with current prices
- Historical performance metrics

```http
GET /wallet/:address

Example:
GET /wallet/0x1234567890abcdef1234567890abcdef12345678

Response:
{
  "success": true,
  "data": {
    "address": "0x1234567890abcdef1234567890abcdef12345678",
    "totalValueUSD": 1234.56,
    "percentageChange": 2.5,
    "tokens": [
      {
        "coinType": "0x2::sui::SUI",
        "balance": "1000000000",
        "valueUSD": 1000.00,
        "price": 1.00,
        "metadata": {
          "decimals": 9,
          "name": "Sui",
          "symbol": "SUI",
          "description": "SUI native token",
          "iconUrl": "..."
        }
      }
    ]
  }
}
```

### Get Token Price
Retrieve the current price of a specific token.

```http
GET /price/:tokenType

Example:
GET /price/0x2::sui::SUI

Response:
{
  "success": true,
  "data": {
    "tokenType": "0x2::sui::SUI",
    "priceUSD": 1.23,
    "fromCache": false
  }
}
```

### Get SUI Price History
Retrieve historical price data for SUI token.

```http
GET /sui-price-history?minutes=60

Response:
{
  "success": true,
  "data": {
    "history": [
      {
        "price": 1.23,
        "timestamp": "2023-10-26T12:00:00Z"
      },
      {
        "price": 1.24,
        "timestamp": "2023-10-26T12:05:00Z"
      }
    ]
  }
}
```

### Get Wallet Tokens
Retrieve raw token data for a wallet.

```http
GET /wallet-tokens/:walletAddress

Example:
GET /wallet-tokens/0x1234567890abcdef1234567890abcdef12345678

Response:
{
  "message": "API is working!",
  "coins": [
    {
      "coinType": "0x2::sui::SUI",
      "balance": "1000000000"
    }
  ]
}
```

### 💧 DeFi Position Endpoints

#### Get MMT Finance Positions
```http
GET /mmt-positions/:address

Response:
{
  "success": true,
  "data": {
    "positions": [
      {
        "positionId": "0xabc...",
        "poolAddress": "0xdef...",
        "liquidity": "1000000",
        "tickLower": -100,
        "tickUpper": 100,
        "tokenA": "0x2::sui::SUI",
        "tokenB": "0x...::usdc::USDC",
        "amountA": "500000000",
        "amountB": "500000000"
      }
    ]
  }
}
```

#### Get Cetus Positions
```http
GET /cetus-positions/:address

Response:
{
  "success": true,
  "data": {
    "positions": [
      {
        "positionId": "0x123...",
        "poolAddress": "0x456...",
        "liquidity": "2000000",
        "tickLower": -200,
        "tickUpper": 200
      }
    ]
  }
}
```

#### Get DeepBook Balances
```http
GET /deepbook-balances/:address

Response:
{
  "success": true,
  "data": {
    "balances": [
      {
        "coin": "0x2::sui::SUI",
        "balance": "1000000000",
        "valueUSD": 1850.00
      }
    ]
  }
}
```

---

## 🎯 GraphQL API

GraphQL endpoint provides a flexible, efficient way to query exactly the data you need.

**Endpoint**: `/graphql`

### Sample Queries

#### Get Wallet Information
```graphql
query GetWallet($address: String!) {
  wallet(address: $address) {
    address
    totalValueUSD
    percentageChange
    tokens {
      coinType
      balance
      valueUSD
      price
      metadata {
        symbol
        name
        decimals
      }
    }
  }
}
```

#### Get Token Price
```graphql
query GetTokenPrice($coinType: String!) {
  tokenPrice(coinType: $coinType) {
    coinType
    priceUSD
    lastUpdate
    metadata {
      symbol
      name
    }
  }
}
```

#### Get All DeFi Positions
```graphql
query GetWalletPositions($address: String!) {
  walletPositions(address: $address) {
    address
    mmtPositions {
      positionId
      poolAddress
      liquidity
      tokenA
      tokenB
      amountA
      amountB
    }
    cetusPositions {
      positionId
      poolAddress
      liquidity
    }
    deepbookBalances {
      coin
      balance
      valueUSD
    }
  }
}
```

#### Get Price History
```graphql
query GetSuiPriceHistory($minutes: Int) {
  suiPriceHistory(minutes: $minutes) {
    priceUSD
    createdAt
  }
}
```

### Mutations

#### Update Token Price
```graphql
mutation UpdatePrice($coinType: String!) {
  updateTokenPrice(coinType: $coinType) {
    success
    message
    price
    timestamp
  }
}
```

#### Update Zero Price Tokens (Cron)
```graphql
mutation UpdateZeroPrices {
  updateZeroPriceTokens {
    success
    message
  }
}
```

---

## 🤖 MCP (Model Context Protocol) Server

SUIPort includes an MCP server that allows AI assistants to query blockchain data directly.

**Endpoint**: `/mcp`

### Available Tools

#### 1. get_wallet_balance
Get complete wallet portfolio information.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_wallet_balance",
    "arguments": {
      "address": "0x..."
    }
  }
}
```

#### 2. get_token_price
Get current USD price for any token.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_token_price",
    "arguments": {
      "tokenType": "0x2::sui::SUI"
    }
  }
}
```

For detailed MCP documentation, see [MCP-README.md](./MCP-README.md)

---

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- Yarn or npm
- Cloudflare Workers account
- Wrangler CLI (`npm install -g wrangler`)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/suiport.git
cd suiport

# Install dependencies
yarn install

# Configure environment
cp wrangler.example.toml wrangler.toml
# Edit wrangler.toml with your Cloudflare account details

# Setup database
wrangler d1 create suiport-db
# Copy the database ID to wrangler.toml

# Run migrations
wrangler d1 execute suiport-db --file ./migrations/0000_initial.sql
wrangler d1 execute suiport-db --file ./migrations/0001_wallet_history.sql
wrangler d1 execute suiport-db --file ./migrations/0002_sui_price_history.sql

# Start development server
yarn dev

# Deploy to production
yarn deploy
```

### Environment Configuration

Create `wrangler.toml`:
```toml
name = "suiport"
main = "src/index.ts"
compatibility_date = "2024-10-01"

[[d1_databases]]
binding = "DB"
database_name = "suiport-db"
database_id = "your-database-id"

[triggers]
crons = ["*/5 * * * *", "*/30 * * * *"]
```

---

## 🔒 Security

- 🛡️ Enterprise-grade security measures
- 🔐 Rate limiting and DDoS protection via Cloudflare
- 📝 Comprehensive request logging
- 🔑 CORS configuration for secure cross-origin requests
- 🚨 Input validation and sanitization
- 🛡️ SQL injection protection via D1's prepared statements

---

## 📈 Performance

- ⚡ Global edge presence in 200+ locations via Cloudflare Workers
- 🚀 Average response time: <50ms
- 📊 99.99% uptime guarantee
- 🔄 Automatic failover and load balancing
- 💾 Intelligent caching strategies
- 🎯 Multi-source price aggregation for accuracy

---

## ⚡ Automated Services & Cron Jobs

SUIPort employs sophisticated automated services to maintain data accuracy and freshness:

### Cron Job Schedule

#### 1. **SUI Price Update Service**
- **Frequency**: Every 5 minutes (`*/5 * * * *`)
- **Function**: 
  - Fetches latest SUI price from multiple DEX sources
  - Aggregates price data from Cetus, DeepBook, and 7K Protocol
  - Validates and stores price in database
  - Maintains historical price records
  - Triggers alerts for significant price movements
- **Reliability**: Multi-source fallback mechanism ensures 99.99% uptime
- **Data Sources**:
  - 7K Protocol SDK
  - Cetus DEX pools
  - DeepBook orderbooks

#### 2. **Zero Price Tokens Update Service**
- **Frequency**: Every 30 minutes (`*/30 * * * *`)
- **Function**:
  - Identifies tokens with missing or zero price data
  - Fetches prices from alternative DEX sources
  - Updates token metadata (name, symbol, decimals)
  - Maintains comprehensive token registry
  - Backfills historical price gaps
- **Coverage**: Supports all SUI ecosystem tokens including:
  - Native SUI
  - Major stablecoins (USDC, USDT)
  - DeFi tokens from Cetus, MMT Finance, DeepBook
  - New token listings

#### 3. **Analytics Generation Service**
- **Frequency**: Triggered on wallet queries
- **Function**:
  - Calculates real-time portfolio performance metrics
  - Computes 24h change percentages
  - Aggregates DeFi positions across protocols
  - Generates wallet value history snapshots
  - Maintains statistical accuracy for trends

### Price Aggregation Strategy

SUIPort uses a multi-tier price fetching strategy:

1. **Primary**: Database cache (instant, <1ms)
2. **Secondary**: 7K Protocol SDK (fast, reliable)
3. **Tertiary**: Direct DEX queries (Cetus, DeepBook)
4. **Fallback**: Alternative token pairs and pools

This ensures maximum uptime and price accuracy even during network congestion.

---

## 🏗️ Project Structure

```
suiport/
├── src/
│   ├── index.ts                 # Main application entry
│   ├── graphql/
│   │   ├── schema.ts           # GraphQL type definitions
│   │   ├── resolvers.ts        # GraphQL resolvers
│   │   ├── server.ts           # Apollo Server setup
│   │   └── context.ts          # GraphQL context types
│   ├── mcp/
│   │   ├── server.ts           # MCP server implementation
│   │   ├── tools.ts            # MCP tool handlers
│   │   └── types.ts            # MCP type definitions
│   └── services/
│       ├── price.service.ts    # Price fetching & caching
│       ├── cron.service.ts     # Automated job handlers
│       ├── database.service.ts # Database operations
│       ├── cetus.service.ts    # Cetus DEX integration
│       ├── mmt.service.ts      # MMT Finance integration
│       ├── mmt2.service.ts     # MMT Finance v2
│       └── deepbook.service.ts # DeepBook integration
├── migrations/
│   ├── 0000_initial.sql        # Initial schema
│   ├── 0001_wallet_history.sql # Wallet tracking
│   └── 0002_sui_price_history.sql # Price history
├── public/
│   └── index.html              # API landing page
├── package.json
├── tsconfig.json
├── wrangler.toml               # Cloudflare configuration
├── README.md
└── MCP-README.md               # MCP documentation
```

---

## 🧪 Development

### Local Development

```bash
# Start dev server with hot reload
yarn dev

# Access local endpoints
# REST API: http://localhost:8787
# GraphQL: http://localhost:8787/graphql
# MCP: http://localhost:8787/mcp
```

### Testing Endpoints

```bash
# Test REST API
curl http://localhost:8787/wallet/0x...

# Test GraphQL
curl -X POST http://localhost:8787/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ wallet(address: \"0x...\") { totalValueUSD } }"}'
```

### Database Management

```bash
# List all D1 databases
wrangler d1 list

# Execute SQL query
wrangler d1 execute suiport-db --command "SELECT * FROM token_prices LIMIT 10"

# Backup database
wrangler d1 export suiport-db --output backup.sql
```

---

## 📊 Supported DeFi Protocols

### 💧 Liquidity Protocols

1. **MMT Finance** (@mmt-finance/clmm-sdk)
   - Concentrated liquidity positions
   - Real-time position tracking
   - Impermanent loss calculations

2. **Cetus Protocol** (@cetusprotocol/common-sdk)
   - CLMM (Concentrated Liquidity Market Maker) positions
   - Pool analytics
   - Liquidity range monitoring

3. **DeepBook**
   - Order book positions
   - Market maker balances
   - Trading analytics

### 💱 Price Sources

- **7K Protocol** - Primary price oracle
- **Cetus DEX** - AMM pool prices
- **DeepBook** - Order book mid-prices

---

---

## 🎯 Use Cases

### For Traders
- Track portfolio value in real-time
- Monitor DeFi positions across multiple protocols
- Analyze historical performance
- Set up price alerts (via webhooks)

### For DApps
- Integrate wallet tracking features
- Display user portfolio on dashboard
- Show DeFi position analytics
- Real-time price feeds

### For AI Assistants
- Query blockchain data via MCP protocol
- Answer user questions about portfolios
- Provide investment insights
- Monitor wallet activities

### For Analytics Platforms
- Historical price data
- Portfolio trend analysis
- Market insights
- User behavior tracking

---

## 🔗 Integration Examples

### REST API (cURL)
```bash
# Get wallet portfolio
curl https://your-worker.workers.dev/wallet/0x...

# Get token price
curl https://your-worker.workers.dev/price/0x2::sui::SUI

# Get DeFi positions
curl https://your-worker.workers.dev/mmt-positions/0x...
```

### GraphQL (JavaScript/TypeScript)
```typescript
import { GraphQLClient, gql } from 'graphql-request';

const client = new GraphQLClient('https://your-worker.workers.dev/graphql');

const query = gql`
  query GetWallet($address: String!) {
    wallet(address: $address) {
      totalValueUSD
      tokens {
        coinType
        valueUSD
      }
    }
  }
`;

const data = await client.request(query, { 
  address: '0x...' 
});
```

### MCP (AI Assistant)
```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

const client = new MCPClient('https://your-worker.workers.dev/mcp');

const result = await client.callTool('get_wallet_balance', {
  address: '0x...'
});
```

---

## 📊 Database Schema

### Tables

#### `token_prices`
Stores token price information and metadata.
```sql
CREATE TABLE token_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coin_type TEXT UNIQUE NOT NULL,
  price_usd REAL NOT NULL,
  decimals INTEGER,
  name TEXT,
  symbol TEXT,
  description TEXT,
  icon_url TEXT,
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `wallet_history`
Tracks wallet portfolio snapshots over time.
```sql
CREATE TABLE wallet_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet_address TEXT NOT NULL,
  total_value_usd REAL NOT NULL,
  percentage_change REAL,
  tokens_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `sui_price_history`
Maintains historical SUI price data.
```sql
CREATE TABLE sui_price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  price_usd REAL NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛠️ API Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🚦 Rate Limits

- **Free Tier**: 100 requests/minute per IP
- **Cloudflare Protection**: Automatic DDoS mitigation
- **Burst Handling**: Up to 1000 requests/second during spikes

---

## 🔍 Monitoring & Logging

### Available Metrics
- Request count per endpoint
- Average response time
- Error rates
- Database query performance
- Cron job execution status

### Cloudflare Analytics
Access detailed analytics via Cloudflare dashboard:
- Geographic distribution
- Request patterns
- Error tracking
- Performance metrics

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Process
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Comprehensive comments
- Type safety

### Testing
```bash
# Run tests (when available)
yarn test

# Lint code
yarn lint

# Format code
yarn format
```

---

## 📝 Roadmap

### v1.1 (Current)
- ✅ GraphQL API
- ✅ MCP Server
- ✅ DeFi position tracking (MMT, Cetus, DeepBook)
- ✅ Multi-source price aggregation
- ✅ Automated cron jobs

### v1.2 (Planned)
- � WebSocket support for real-time updates
- 🔄 Advanced analytics dashboard
- 🔄 NFT portfolio tracking
- 🔄 Custom alerts & notifications
- 🔄 Multi-wallet aggregation

### v2.0 (Future)
- 🔮 Machine learning price predictions
- 🔮 Portfolio optimization suggestions
- 🔮 Cross-chain support
- 🔮 Advanced DeFi analytics
- 🔮 Mobile SDK

---

## �📄 License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2024 SUIPort

---

## 🙏 Acknowledgments

- **SUI Foundation** - For the amazing blockchain
- **Cloudflare** - For edge computing infrastructure
- **MMT Finance** - For CLMM SDK
- **Cetus Protocol** - For DEX integration
- **7K Protocol** - For price oracle

---

## 📞 Support & Community

- **GitHub Issues**: [Report bugs](https://github.com/yourusername/suiport/issues)
- **Discussions**: [Ask questions](https://github.com/yourusername/suiport/discussions)
- **Twitter**: [@suiport](https://twitter.com/suiport)
- **Discord**: [Join our community](https://discord.gg/suiport)

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐!

---

<div align="center">
  <sub>Built with ❤️ for the SUI community</sub>
  <br />
  <sub>Powered by Cloudflare Workers | TypeScript | GraphQL | MCP</sub>
</div>