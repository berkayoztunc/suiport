# GraphQL API Documentation

## Endpoint

GraphQL endpoint: `https://your-domain.com/graphql`

GraphiQL Playground: `https://your-domain.com/graphql` (GET request in browser)

## Architecture

The GraphQL API is organized into separate files for better maintainability:

- **schema.ts**: Contains all GraphQL type definitions
- **resolvers.ts**: Implements query and mutation resolvers
- **context.ts**: Defines the context passed to all resolvers
- **server.ts**: Configures and creates the GraphQL Yoga server
- **index.ts**: Module entry point for easy imports

## Queries

### Token Queries

#### Get Token Price
```graphql
query GetTokenPrice {
  tokenPrice(coinType: "0x2::sui::SUI") {
    coinType
    priceUSD
    lastUpdate
    metadata {
      decimals
      name
      symbol
      description
      iconUrl
    }
  }
}
```

#### Get All Tokens
```graphql
query GetAllTokens {
  allTokens(limit: 50, offset: 0) {
    coinType
    priceUSD
    lastUpdate
    metadata {
      name
      symbol
      decimals
    }
  }
}
```

### Wallet Queries

#### Get Wallet Information
```graphql
query GetWallet {
  wallet(address: "0x...") {
    address
    totalValueUSD
    percentageChange
    lastUpdate
    tokens {
      coinType
      balance
      valueUSD
      price
      metadata {
        name
        symbol
        decimals
        iconUrl
      }
    }
  }
}
```

#### Get Wallet History
```graphql
query GetWalletHistory {
  walletHistory(address: "0x...", minutes: 60) {
    id
    walletAddress
    totalValueUSD
    percentageChange
    createdAt
  }
}
```

### Price History Queries

#### Get SUI Price History
```graphql
query GetSuiPriceHistory {
  suiPriceHistory(minutes: 120) {
    id
    priceUSD
    createdAt
  }
}
```

### DeFi Position Queries

#### Get MMT Finance Positions
```graphql
query GetMMTPositions {
  mmtPositions(address: "0x...") {
    positionId
    poolAddress
    liquidity
    tickLower
    tickUpper
    tokenA
    tokenB
    amountA
    amountB
  }
}
```

#### Get Cetus Finance Positions
```graphql
query GetCetusPositions {
  cetusPositions(address: "0x...") {
    positionId
    poolAddress
    liquidity
    tickLower
    tickUpper
    tokenA
    tokenB
    amountA
    amountB
  }
}
```

#### Get DeepBook Balances
```graphql
query GetDeepBookBalances {
  deepbookBalances(address: "0x...") {
    coin
    balance
    valueUSD
  }
}
```

#### Get All Wallet Positions
```graphql
query GetAllPositions {
  walletPositions(address: "0x...") {
    address
    mmtPositions {
      positionId
      poolAddress
      liquidity
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

## Mutations

### Update SUI Price
```graphql
mutation UpdateSuiPrice {
  updateSuiPrice {
    success
    message
    price
    timestamp
  }
}
```

### Update Token Price
```graphql
mutation UpdateTokenPrice {
  updateTokenPrice(coinType: "0x2::sui::SUI") {
    success
    message
    price
    timestamp
  }
}
```

### Update Zero Price Tokens (Cron Job)
```graphql
mutation UpdateZeroPriceTokens {
  updateZeroPriceTokens {
    success
    message
    timestamp
  }
}
```

## Example: Complete Wallet Portfolio Query

```graphql
query GetCompletePortfolio($address: String!) {
  # Main wallet data
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
        name
        symbol
        decimals
        iconUrl
      }
    }
  }
  
  # DeFi positions
  walletPositions(address: $address) {
    mmtPositions {
      positionId
      liquidity
    }
    cetusPositions {
      positionId
      liquidity
    }
    deepbookBalances {
      coin
      balance
      valueUSD
    }
  }
  
  # Historical data
  walletHistory(address: $address, minutes: 1440) {
    totalValueUSD
    percentageChange
    createdAt
  }
  
  # SUI price trend
  suiPriceHistory(minutes: 1440) {
    priceUSD
    createdAt
  }
}
```

Variables:
```json
{
  "address": "0x..."
}
```

## Error Handling

All errors are returned in standard GraphQL format:

```json
{
  "errors": [
    {
      "message": "Error description",
      "path": ["fieldName"],
      "extensions": {
        "code": "ERROR_CODE"
      }
    }
  ]
}
```

## Rate Limiting

Consider implementing rate limiting on the endpoint level in your Cloudflare Worker configuration.

## Authentication

Currently, the API is open. To add authentication:

1. Add authentication middleware in `index.ts`
2. Pass authentication context to GraphQL
3. Check auth in resolvers as needed

## Development

### Testing GraphQL Queries

1. Deploy your worker: `yarn deploy`
2. Navigate to `https://your-domain.com/graphql` in your browser
3. Use GraphiQL playground to test queries

### Local Development

```bash
yarn dev
```

Then access GraphiQL at `http://localhost:8787/graphql`
