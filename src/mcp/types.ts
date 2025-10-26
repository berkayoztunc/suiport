/**
 * MCP Server types for SuiPort
 */

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface WalletBalanceParams {
  address: string;
}

export interface TokenPriceParams {
  tokenType: string;
}

export interface MCPContext {
  database: D1Database;
  suiClient: any;
}
