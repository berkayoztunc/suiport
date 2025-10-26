/**
 * GraphQL Schema Definitions
 * Contains all type definitions for the SUI Portfolio API
 */

export const typeDefs = /* GraphQL */ `
  # Token metadata information
  type TokenMetadata {
    decimals: Int!
    name: String!
    symbol: String!
    description: String!
    iconUrl: String
  }

  # Token information with price
  type Token {
    coinType: String!
    priceUSD: Float!
    lastUpdate: String!
    metadata: TokenMetadata
  }

  # Token data in wallet
  type WalletToken {
    coinType: String!
    balance: String!
    valueUSD: Float!
    price: Float!
    metadata: TokenMetadata
  }

  # Wallet information
  type Wallet {
    address: String!
    totalValueUSD: Float!
    percentageChange: Float
    tokens: [WalletToken!]!
    lastUpdate: String!
  }

  # Wallet history entry
  type WalletHistory {
    id: Int!
    walletAddress: String!
    totalValueUSD: Float!
    percentageChange: Float
    tokensJson: String!
    createdAt: String!
  }

  # SUI price history entry
  type SuiPriceHistory {
    id: Int!
    priceUSD: Float!
    createdAt: String!
  }

  # MMT Finance position
  type MMTPosition {
    positionId: String!
    poolAddress: String!
    liquidity: String!
    tickLower: Int!
    tickUpper: Int!
    tokenA: String!
    tokenB: String!
    amountA: String!
    amountB: String!
  }

  # Cetus Finance position
  type CetusPosition {
    positionId: String!
    poolAddress: String!
    liquidity: String!
    tickLower: Int!
    tickUpper: Int!
    tokenA: String!
    tokenB: String!
    amountA: String!
    amountB: String!
  }

  # DeepBook balance
  type DeepBookBalance {
    coin: String!
    balance: String!
    valueUSD: Float!
  }

  # Wallet positions response
  type WalletPositions {
    address: String!
    mmtPositions: [MMTPosition!]!
    cetusPositions: [CetusPosition!]!
    deepbookBalances: [DeepBookBalance!]!
  }

  # Price update result
  type PriceUpdateResult {
    success: Boolean!
    message: String!
    price: Float
    timestamp: String
  }

  # Query root type
  type Query {
    # Get token price by coin type
    tokenPrice(coinType: String!): Token

    # Get wallet information with all tokens
    wallet(address: String!): Wallet

    # Get wallet history
    walletHistory(address: String!, minutes: Int): [WalletHistory!]!

    # Get SUI price history
    suiPriceHistory(minutes: Int): [SuiPriceHistory!]!

    # Get all tokens in database
    allTokens(limit: Int, offset: Int): [Token!]!

    # Get MMT Finance positions for a wallet
    mmtPositions(address: String!): [MMTPosition!]!

    # Get Cetus Finance positions for a wallet
    cetusPositions(address: String!): [CetusPosition!]!

    # Get DeepBook balances for a wallet
    deepbookBalances(address: String!): [DeepBookBalance!]!

    # Get all positions for a wallet
    walletPositions(address: String!): WalletPositions!
  }

  # Mutation root type
  type Mutation {
    # Update SUI price
    updateSuiPrice: PriceUpdateResult!

    # Update token price
    updateTokenPrice(coinType: String!): PriceUpdateResult!

    # Update zero price tokens (cron job)
    updateZeroPriceTokens: PriceUpdateResult!
  }
`;
