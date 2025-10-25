import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getTokenPrice, getTokenPrices, getSuiPrice } from "@7kprotocol/sdk-ts";
import { DatabaseService, TokenDB } from './database.service';

// Cetus DEX pool addresses
const CETUS_POOLS = {
    SUI_USDC: '0x2e041f3fd93646dcc877f783c1f2b7fa62d30271bdef1f71de2574eddf1ebc44',
};

// Initialize SUI client
const client = new SuiClient({ 
    url: getFullnodeUrl('mainnet')
});

// DexScreener API types
interface DexScreenerResponse {
    pairs: DexScreenerPair[];
}

interface DexScreenerPair {
    dexId: string;
    baseToken: {
        symbol: string;
    };
    quoteToken: {
        symbol: string;
    };
    priceUsd: string;
    liquidity: {
        usd: number;
    };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Retry logic for API calls
async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T | null> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) return null;
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
    return null;
}

export class PriceService {
    private static dbService: DatabaseService;

    static initialize(database: D1Database) {
        this.dbService = new DatabaseService(database);
    }

    private static async getCachedPrice(tokenType: string): Promise<number | null> {
        try {
            const tokenData = await this.dbService.getToken(tokenType);
            if (!tokenData) return null;

            const now = Date.now();
            if (now - tokenData.last_update > CACHE_DURATION) {
                return null;
            }
            if (tokenData.price_usd == 0) {
                return null;
            }

            return tokenData.price_usd;
        } catch (error) {
            console.error('[PriceService] Database error in getCachedPrice:', error);
            return null;
        }
    }

    private static async setCachedPrice(tokenType: string, price: number): Promise<void> {
        try {
            await this.dbService.saveToken({
                coin_type: tokenType,
                price_usd: price,
                last_update: Date.now(),
                metadata: JSON.stringify({})
            });
        } catch (error) {
            console.error('[PriceService] Database error in setCachedPrice:', error);
        }
    }

    private static async getCoinGeckoPrice(coinId: string): Promise<number | null> {
        console.log(`[PriceService] Fetching CoinGecko price for ${coinId}`);
        return retryOperation(async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            try {
                console.log(`[PriceService] Making CoinGecko API request for ${coinId}`);
                const response = await fetch(
                    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
                    { signal: controller.signal }
                );
                
                if (!response.ok) {
                    console.log(`[PriceService] CoinGecko API response not OK for ${coinId}. Status: ${response.status}`);
                    return null;
                }
                
                const data = await response.json() as { [key: string]: { usd: number } };
                const price = data[coinId]?.usd || null;
                console.log(`[PriceService] CoinGecko price for ${coinId}: ${price}`);
                return price;
            } finally {
                clearTimeout(timeout);
            }
        });
    }

    private static async getCetusDexPrice(tokenType: string): Promise<number | null> {
        console.log(`[PriceService] Fetching Cetus DEX price for ${tokenType}`);
        return retryOperation(async () => {
            try {
                console.log(`[PriceService] Getting pool object from Cetus DEX for ${CETUS_POOLS.SUI_USDC}`);
                const poolObject = await client.getObject({
                    id: CETUS_POOLS.SUI_USDC,
                    options: { showContent: true }
                });

                if (!poolObject.data?.content) {
                    console.log('[PriceService] No pool content found in response');
                    return null;
                }
                let price: number | null = null;

                const data = poolObject.data.content;
                if (typeof data !== 'object' || !('fields' in data)) {
                    console.log('[PriceService] Invalid pool data structure:', data);
                    return null;
                }

                const fields = (data as any).fields;
                if (!fields.coin_a_reserve || !fields.coin_b_reserve) {
                    console.log('[PriceService] Missing reserve data in fields:', fields);
                    return null;
                }

                console.log(`[PriceService] Pool reserves - A: ${fields.coin_a_reserve}, B: ${fields.coin_b_reserve}`);
                const coinAReserve = BigInt(fields.coin_a_reserve);
                const coinBReserve = BigInt(fields.coin_b_reserve);

                if (coinAReserve === 0n) {
                    console.log('[PriceService] Zero reserve amount detected');
                    return null;
                }

                // Calculate price based on reserves
                // Assuming USDC has 6 decimals and most tokens have 9
                const calculatedPrice = Number(coinBReserve * BigInt(1000)) / Number(coinAReserve);
                console.log(`[PriceService] Calculated DEX price for ${tokenType}: ${calculatedPrice}`);
                
                return price;
            } catch (error) {
                console.log('[PriceService] DEX price fetch error:', error);
                return null;
            }
        });
    }

    private static async getDexScreenerPrice(tokenAddress: string): Promise<number | null> {
        console.log(`[PriceService] Fetching DexScreener price for ${tokenAddress}`);
        return retryOperation(async () => {
            try {
                const url = `https://api.dexscreener.com/latest/dex/search?q=${tokenAddress}`;
                const response = await fetch(url);
                
                if (!response.ok) {
                    console.log(`[PriceService] DexScreener API response not OK for ${tokenAddress}. Status: ${response.status}`);
                    return null;
                }

                const data = await response.json() as DexScreenerResponse;

                if (!data.pairs || data.pairs.length === 0) {
                    console.log(`[PriceService] Token not found on any DEX for ${tokenAddress}`);
                    return null;
                }

                // Get the pool with highest liquidity
                const bestPool = data.pairs.sort((a: DexScreenerPair, b: DexScreenerPair) => 
                    b.liquidity.usd - a.liquidity.usd
                )[0];
                console.log(`[PriceService] Found price on ${bestPool.dexId}: ${bestPool.baseToken.symbol}/${bestPool.quoteToken.symbol} = $${bestPool.priceUsd}`);
                
                return Number(bestPool.priceUsd);
            } catch (error) {
                console.log('[PriceService] DexScreener price fetch error:', error);
                return null;
            }
        });
    }

    private static getTokenIdentifier(tokenType: string): string {
        const tokenMap: { [key: string]: string } = {
            "0x2::sui::SUI": "sui",
            // Add more token mappings as needed
        };

        return tokenMap[tokenType] || tokenType;
    }

    static async getTokenPrice(tokenType: string): Promise<number | null> {
        try {
            console.log(`[PriceService] Getting price for token ${tokenType}`);
            
            // Check cache first
            const cachedPrice = await this.getCachedPrice(tokenType);
            if (cachedPrice !== null) {
                console.log(`[PriceService] Found cached price for ${tokenType}: ${cachedPrice}`);
                return cachedPrice;
            }
            console.log(`[PriceService] No valid cache found for ${tokenType}`);

            let price: number | null = null;

            try {
                console.log(`[PriceService] Trying 7kprotocol SDK for ${tokenType}`);
                const sdkPrice = await getTokenPrice(tokenType);
                if (sdkPrice !== null && !isNaN(sdkPrice) && isFinite(sdkPrice)) {
                    console.log(`[PriceService] 7kprotocol SDK price result for ${tokenType}: ${sdkPrice}`);
                    price = sdkPrice;
                } else {
                    console.log(`[PriceService] 7kprotocol SDK returned invalid price for ${tokenType}`);
                }
            } catch (error) {
                console.log(`[PriceService] 7kprotocol SDK error for ${tokenType}:`, error);
            }

            if (tokenType === "0x2::sui::SUI" || price === null || price === 0) {
                price = await this.getCoinGeckoPrice("sui");
                return price;
            }


            // If CoinGecko fails, try Cetus DEX
            if (price === null) {
                console.log(`[PriceService] CoinGecko failed, trying Cetus DEX price for ${tokenType}`);
                price = await this.getCetusDexPrice(tokenType);
            }

            // If all above fail, try DexScreener
            if (price === null) {
                console.log(`[PriceService] All previous methods failed, trying DexScreener for ${tokenType}`);
                price = await this.getDexScreenerPrice(tokenType);
            }

            // Update cache if we got a valid price
            if (price !== null && !isNaN(price) && isFinite(price)) {
                console.log(`[PriceService] Updating cache for ${tokenType} with price: ${price}`);
                await this.setCachedPrice(tokenType, price);
                return price;
            }

            console.log(`[PriceService] No valid price found for ${tokenType}`);
            return null;
        } catch (error) {
            console.log('[PriceService] Price service error:', error);
            return null;
        }
    }
}