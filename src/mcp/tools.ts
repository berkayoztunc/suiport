/**
 * MCP Tools implementation for SuiPort
 * Provides tools for querying wallet balances and token prices
 */

import { SuiClient } from '@mysten/sui/client';
import { PriceService } from '../services/price.service';
import { DatabaseService } from '../services/database.service';
import { MCPToolResult, WalletBalanceParams, TokenPriceParams } from './types';

/**
 * Get wallet balance and token holdings
 */
export async function getWalletBalance(
  params: WalletBalanceParams,
  database: D1Database,
  suiClient: SuiClient
): Promise<MCPToolResult> {
  try {
    const { address } = params;

    if (!address) {
      return {
        success: false,
        error: 'Wallet address is required'
      };
    }

    console.log(`[MCP] Fetching wallet balance for: ${address}`);

    // Fetch all coins for the wallet
    let allCoins = [];
    let hasNextPage = true;
    let nextCursor = null;
    
    while (hasNextPage) {
      const coinsResponse = await suiClient.getAllCoins({
        owner: address,
        cursor: nextCursor
      });
      
      allCoins.push(...coinsResponse.data);
      hasNextPage = coinsResponse.hasNextPage;
      nextCursor = coinsResponse.nextCursor;
    }

    console.log(`[MCP] Fetched ${allCoins.length} coins for wallet: ${address}`);

    // Group coins by type and aggregate balances
    const coinsByType = new Map();
    for (const coin of allCoins) {
      const existingCoin = coinsByType.get(coin.coinType);
      if (!existingCoin) {
        coinsByType.set(coin.coinType, {
          ...coin,
          balance: BigInt(coin.balance).toString()
        });
      } else {
        const totalBalance = (BigInt(existingCoin.balance) + BigInt(coin.balance)).toString();
        coinsByType.set(coin.coinType, {
          ...coin,
          balance: totalBalance
        });
      }
    }

    const coins = Array.from(coinsByType.values());
    const db = new DatabaseService(database);

    // Get token data with prices
    const tokenData = await Promise.all(coins.map(async (coin) => {
      try {
        // Fetch metadata
        let metadata = null;
        try {
          metadata = await suiClient.getCoinMetadata({ coinType: coin.coinType });
        } catch (error) {
          console.log(`[MCP] Could not fetch metadata for ${coin.coinType}`);
        }

        // Fetch price
        const price = await PriceService.getTokenPrice(coin.coinType);
        
        // Calculate USD value
        let valueUSD = 0;
        const balance = BigInt(coin.balance);
        const decimals = metadata?.decimals ?? 9;
        
        if (price !== null && !isNaN(price) && price > 0) {
          valueUSD = Number(balance) * price / Math.pow(10, decimals);
        }

        return {
          coinType: coin.coinType,
          balance: coin.balance,
          valueUSD,
          price: price || 0,
          metadata: metadata ? {
            decimals: metadata.decimals,
            name: metadata.name,
            symbol: metadata.symbol,
            description: metadata.description,
            iconUrl: metadata.iconUrl
          } : undefined
        };
      } catch (error) {
        console.log(`[MCP] Error processing coin ${coin.coinType}:`, error);
        return {
          coinType: coin.coinType,
          balance: coin.balance,
          valueUSD: 0
        };
      }
    }));

    // Calculate total value
    const totalValueUSD = tokenData.reduce((sum, token) => sum + token.valueUSD, 0);

    console.log(`[MCP] Successfully fetched wallet data for ${address}. Total value: $${totalValueUSD.toFixed(2)}`);

    return {
      success: true,
      data: {
        address,
        totalValueUSD,
        tokenCount: tokenData.length,
        tokens: tokenData
      }
    };

  } catch (error: any) {
    console.error('[MCP] Error fetching wallet balance:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch wallet balance'
    };
  }
}

/**
 * Get token price in USD
 */
export async function getTokenPrice(
  params: TokenPriceParams,
  database: D1Database
): Promise<MCPToolResult> {
  try {
    const { tokenType } = params;

    if (!tokenType) {
      return {
        success: false,
        error: 'Token type is required'
      };
    }

    console.log(`[MCP] Fetching price for token: ${tokenType}`);

    const db = new DatabaseService(database);
    
    // Check database first
    const token = await db.getToken(tokenType);
    
    if (token) {
      const isStale = await db.isTokenStale(tokenType);
      
      if (!isStale) {
        console.log(`[MCP] Returning cached price for ${tokenType}: $${token.price_usd}`);
        return {
          success: true,
          data: {
            tokenType,
            priceUSD: token.price_usd,
            metadata: token.metadata ? JSON.parse(token.metadata) : undefined,
            fromCache: true
          }
        };
      }
    }
    
    // Get fresh price
    const price = await PriceService.getTokenPrice(tokenType);
    
    if (price === null) {
      return {
        success: false,
        error: 'Price not available for this token'
      };
    }
    
    // Save to database
    await db.saveToken({
      coin_type: tokenType,
      price_usd: price,
      last_update: Date.now(),
      metadata: JSON.stringify({})
    });

    console.log(`[MCP] Successfully fetched fresh price for ${tokenType}: $${price}`);
    
    return {
      success: true,
      data: {
        tokenType,
        priceUSD: price,
        fromCache: false
      }
    };
    
  } catch (error: any) {
    console.error('[MCP] Error fetching token price:', error);
    return {
      success: false,
      error: error?.message || 'Failed to fetch token price'
    };
  }
}
