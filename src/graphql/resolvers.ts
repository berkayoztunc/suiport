/**
 * GraphQL Resolvers
 * Contains all query and mutation resolvers for the API
 */

import { GraphQLContext } from './context';
import { getSuiPrice, getTokenPrice } from '@7kprotocol/sdk-ts';
import { mmtService2 } from '../services/mmt2.service';
import { cetusService } from '../services/cetus.service';
import { deepbookMarketMaker } from '../services/deepbook.service';

export const resolvers = {
  Query: {
    /**
     * Get token price by coin type
     */
    tokenPrice: async (_parent: any, args: { coinType: string }, context: GraphQLContext) => {
      try {
        const { coinType } = args;
        console.log(`[GraphQL] Token price query for: ${coinType}`);

        // Check DB first
        const token = await context.db.getToken(coinType);

        if (token) {
          const isStale = await context.db.isTokenStale(coinType);

          if (!isStale) {
            console.log(`[GraphQL] Returning cached price for ${coinType}`);
            return {
              coinType: token.coin_type,
              priceUSD: token.price_usd,
              lastUpdate: new Date(token.last_update).toISOString(),
              metadata: token.metadata ? JSON.parse(token.metadata) : null,
            };
          }
        }

        // Get fresh price
        const price = await context.priceService.getTokenPrice(coinType);

        if (price === null) {
          throw new Error('Price not available for this token');
        }

        // Save to DB
        await context.db.saveToken({
          coin_type: coinType,
          price_usd: price,
          last_update: Date.now(),
          metadata: JSON.stringify({}),
        });

        return {
          coinType,
          priceUSD: price,
          lastUpdate: new Date().toISOString(),
          metadata: null,
        };
      } catch (error: any) {
        console.error('[GraphQL] Error in tokenPrice query:', error);
        throw new Error(error.message || 'Failed to fetch token price');
      }
    },

    /**
     * Get wallet information with all tokens
     */
    wallet: async (_parent: any, args: { address: string }, context: GraphQLContext) => {
      try {
        const { address } = args;
        console.log(`[GraphQL] Wallet query for: ${address}`);

        // Fetch all pages of coins
        let allCoins = [];
        let hasNextPage = true;
        let nextCursor = null;

        while (hasNextPage) {
          const coinsResponse = await context.suiClient.getAllCoins({
            owner: address,
            cursor: nextCursor,
          });

          allCoins.push(...coinsResponse.data);
          hasNextPage = coinsResponse.hasNextPage;
          nextCursor = coinsResponse.nextCursor;
        }

        // Group coins by coinType and aggregate balances
        const coinsByType = new Map();
        for (const coin of allCoins) {
          const existingCoin = coinsByType.get(coin.coinType);
          if (!existingCoin) {
            coinsByType.set(coin.coinType, {
              ...coin,
              balance: BigInt(coin.balance).toString(),
            });
          } else {
            const totalBalance = (BigInt(existingCoin.balance) + BigInt(coin.balance)).toString();
            coinsByType.set(coin.coinType, {
              ...coin,
              balance: totalBalance,
            });
          }
        }

        const coins = { data: Array.from(coinsByType.values()) };

        // Get token data with prices
        const tokenData = await Promise.all(
          coins.data.map(async (coin) => {
            try {
              // Fetch metadata
              let metadata = null;
              for (let i = 0; i < 3; i++) {
                try {
                  metadata = await context.suiClient.getCoinMetadata({ coinType: coin.coinType });
                  if (metadata) break;
                } catch (error) {
                  if (i < 2) await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
                }
              }

              // Fetch price
              const price = await context.priceService.getTokenPrice(coin.coinType);

              // Calculate USD value
              let valueUSD = 0;
              try {
                const balance = BigInt(coin.balance);
                const decimals = metadata?.decimals ?? 9;

                if (price !== null && !isNaN(price) && price > 0) {
                  valueUSD = (Number(balance) * price) / Math.pow(10, decimals);
                }
              } catch (error) {
                console.log(`[GraphQL] Balance calculation error for ${coin.coinType}:`, error);
              }

              // Save token price to DB
              await context.db.saveToken({
                coin_type: coin.coinType,
                price_usd: price || 0,
                last_update: Date.now(),
                metadata: metadata
                  ? JSON.stringify({
                      decimals: metadata.decimals,
                      name: metadata.name,
                      symbol: metadata.symbol,
                      description: metadata.description,
                      iconUrl: metadata.iconUrl,
                    })
                  : undefined,
              });

              return {
                coinType: coin.coinType,
                balance: coin.balance,
                valueUSD,
                price: price || 0,
                metadata: metadata
                  ? {
                      decimals: metadata.decimals,
                      name: metadata.name,
                      symbol: metadata.symbol,
                      description: metadata.description,
                      iconUrl: metadata.iconUrl,
                    }
                  : null,
              };
            } catch (error) {
              console.log(`[GraphQL] Error processing coin ${coin.coinType}:`, error);
              return {
                coinType: coin.coinType,
                balance: coin.balance,
                valueUSD: 0,
                price: 0,
                metadata: null,
              };
            }
          })
        );

        // Calculate total value
        const totalValueUSD = tokenData.reduce((sum, token) => sum + token.valueUSD, 0);

        // Save to DB and get percentage change
        await context.db.saveWallet({
          address,
          totalValueUSD,
          tokens: tokenData.map((t) => ({
            coinType: t.coinType,
            balance: t.balance,
            valueUSD: t.valueUSD,
            price: t.price,
            metadata: t.metadata || undefined,
          })),
        });

        const tokensJson = JSON.stringify(tokenData);
        const { percentageChange } = await context.db.saveWalletHistory(address, totalValueUSD, tokensJson);

        return {
          address,
          totalValueUSD,
          percentageChange,
          tokens: tokenData,
          lastUpdate: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('[GraphQL] Error in wallet query:', error);
        throw new Error(error.message || 'Failed to fetch wallet data');
      }
    },

    /**
     * Get wallet history
     */
    walletHistory: async (_parent: any, args: { address: string; minutes?: number }, context: GraphQLContext) => {
      try {
        const { address, minutes = 60 } = args;
        console.log(`[GraphQL] Wallet history query for: ${address}, minutes: ${minutes}`);

        const since = Date.now() - minutes * 60 * 1000;
        const history = await context.db.getWalletHistoryRange(address, since);

        return history.map((entry: any) => ({
          id: entry.id,
          walletAddress: entry.wallet_address,
          totalValueUSD: entry.total_value_usd,
          percentageChange: entry.percentage_change,
          tokensJson: entry.tokens_json,
          createdAt: new Date(entry.created_at).toISOString(),
        }));
      } catch (error: any) {
        console.error('[GraphQL] Error in walletHistory query:', error);
        throw new Error(error.message || 'Failed to fetch wallet history');
      }
    },

    /**
     * Get SUI price history
     */
    suiPriceHistory: async (_parent: any, args: { minutes?: number }, context: GraphQLContext) => {
      try {
        const { minutes = 60 } = args;
        console.log(`[GraphQL] SUI price history query for last ${minutes} minutes`);

        const history = await context.db.getSuiPriceHistory(minutes);

        return history.map((entry) => ({
          id: entry.id,
          priceUSD: entry.price_usd,
          createdAt: new Date(entry.created_at).toISOString(),
        }));
      } catch (error: any) {
        console.error('[GraphQL] Error in suiPriceHistory query:', error);
        throw new Error(error.message || 'Failed to fetch SUI price history');
      }
    },

    /**
     * Get all tokens in database
     */
    allTokens: async (_parent: any, args: { limit?: number; offset?: number }, context: GraphQLContext) => {
      try {
        const { limit = 100, offset = 0 } = args;
        console.log(`[GraphQL] All tokens query with limit: ${limit}, offset: ${offset}`);

        const tokens = await context.db.getAllTokens(limit, offset);

        return tokens.map((token: any) => ({
          coinType: token.coin_type,
          priceUSD: token.price_usd,
          lastUpdate: new Date(token.last_update).toISOString(),
          metadata: token.metadata ? JSON.parse(token.metadata) : null,
        }));
      } catch (error: any) {
        console.error('[GraphQL] Error in allTokens query:', error);
        throw new Error(error.message || 'Failed to fetch all tokens');
      }
    },

    /**
     * Get MMT Finance positions
     */
    mmtPositions: async (_parent: any, args: { address: string }, context: GraphQLContext) => {
      try {
        const { address } = args;
        console.log(`[GraphQL] MMT positions query for: ${address}`);

        const positions = await mmtService2.getUserPositions(address);
        return positions;
      } catch (error: any) {
        console.error('[GraphQL] Error in mmtPositions query:', error);
        throw new Error(error.message || 'Failed to fetch MMT positions');
      }
    },

    /**
     * Get Cetus Finance positions
     */
    cetusPositions: async (_parent: any, args: { address: string }, context: GraphQLContext) => {
      try {
        const { address } = args;
        console.log(`[GraphQL] Cetus positions query for: ${address}`);

        const positions = await cetusService.getUserPositions(address);
        return positions;
      } catch (error: any) {
        console.error('[GraphQL] Error in cetusPositions query:', error);
        throw new Error(error.message || 'Failed to fetch Cetus positions');
      }
    },

    /**
     * Get DeepBook balances
     */
    deepbookBalances: async (_parent: any, args: { address: string }, context: GraphQLContext) => {
      try {
        const { address } = args;
        console.log(`[GraphQL] DeepBook balances query for: ${address}`);

        const balances = await deepbookMarketMaker.getDeepbookBalances(address);
        return balances;
      } catch (error: any) {
        console.error('[GraphQL] Error in deepbookBalances query:', error);
        throw new Error(error.message || 'Failed to fetch DeepBook balances');
      }
    },

    /**
     * Get all positions for a wallet
     */
    walletPositions: async (_parent: any, args: { address: string }, context: GraphQLContext) => {
      try {
        const { address } = args;
        console.log(`[GraphQL] Wallet positions query for: ${address}`);

        const [mmtPositions, cetusPositions, deepbookBalances] = await Promise.all([
          mmtService2.getUserPositions(address),
          cetusService.getUserPositions(address),
          deepbookMarketMaker.getDeepbookBalances(address),
        ]);

        return {
          address,
          mmtPositions,
          cetusPositions,
          deepbookBalances,
        };
      } catch (error: any) {
        console.error('[GraphQL] Error in walletPositions query:', error);
        throw new Error(error.message || 'Failed to fetch wallet positions');
      }
    },
  },

  Mutation: {
    /**
     * Update SUI price
     */
    updateSuiPrice: async (_parent: any, _args: any, context: GraphQLContext) => {
      try {
        console.log('[GraphQL] Update SUI price mutation');

        const suiPrice = await getSuiPrice();

        if (!suiPrice || suiPrice === 0) {
          return {
            success: false,
            message: 'Could not fetch SUI price',
            price: null,
            timestamp: null,
          };
        }

        await context.db.updateTokenPrice('0x2::sui::SUI', suiPrice);
        await context.db.saveSuiPriceHistory(suiPrice);

        return {
          success: true,
          message: 'SUI price updated successfully',
          price: suiPrice,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('[GraphQL] Error in updateSuiPrice mutation:', error);
        return {
          success: false,
          message: error.message || 'Failed to update SUI price',
          price: null,
          timestamp: null,
        };
      }
    },

    /**
     * Update token price
     */
    updateTokenPrice: async (_parent: any, args: { coinType: string }, context: GraphQLContext) => {
      try {
        const { coinType } = args;
        console.log(`[GraphQL] Update token price mutation for: ${coinType}`);

        const price = await getTokenPrice(
          coinType,
          '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC'
        );

        await context.db.updateTokenPrice(coinType, price);

        return {
          success: true,
          message: `Token price updated successfully for ${coinType}`,
          price,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('[GraphQL] Error in updateTokenPrice mutation:', error);
        return {
          success: false,
          message: error.message || 'Failed to update token price',
          price: null,
          timestamp: null,
        };
      }
    },

    /**
     * Update zero price tokens (cron job)
     */
    updateZeroPriceTokens: async (_parent: any, _args: any, context: GraphQLContext) => {
      try {
        console.log('[GraphQL] Update zero price tokens mutation');

        await context.cronService.updateZeroPriceTokens();

        return {
          success: true,
          message: 'Zero price tokens updated successfully',
          price: null,
          timestamp: new Date().toISOString(),
        };
      } catch (error: any) {
        console.error('[GraphQL] Error in updateZeroPriceTokens mutation:', error);
        return {
          success: false,
          message: error.message || 'Failed to update zero price tokens',
          price: null,
          timestamp: null,
        };
      }
    },
  },
};
