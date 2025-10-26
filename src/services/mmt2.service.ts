import { MmtSDK, TickMath } from '@mmt-finance/clmm-sdk';
import { DatabaseService, TokenDB } from './database.service';
import { getTokenPrice } from '@7kprotocol/sdk-ts';
import Decimal from 'decimal.js';


interface TokenInfo {
    coinType: string;
    name: string;
    ticker: string;
    iconUrl: string;
    decimals: number;
    description: string;
    price: string;
}

interface PoolInfo {
    poolId: string;
    tokenXType: string;
    tokenYType: string;
    currentSqrtPrice: string;
    currentTickIndex: string;
    liquidity: string;
    tokenX: TokenInfo;
    tokenY: TokenInfo;
    lpFeesPercent: string;
    protocolFeesPercent: string;
    apy: string;
    fees24h: string;
    volume24h: string;
    tvl: string;
}

interface Position {
    objectId: string;
    poolId: string;
    lowerTick: number;
    upperTick: number;
    liquidity: string;
    pool: PoolInfo;
    tokenAmounts: {
        coinX: string;
        coinY: string;
        coinXDecimal: string; // Human readable with decimals
        coinYDecimal: string; // Human readable with decimals
    };
    valueUSD: number;
    feesEarned?: {
        tokenX: string;
        tokenY: string;
        valueUSD: number;
    };
}

const Q64 = new Decimal(2).pow(64);

const MathUtil = {
  toX64_Decimal: (num:any) => new Decimal(num).mul(Q64),
  fromX64_Decimal: (num:any) => new Decimal(num).div(Q64),
};

export function getCoinAmountFromLiquidity(
    liquidity: string | number,
    curSqrtPrice: string | number,
    lowerTick: number,
    upperTick: number,
    roundUp: boolean = false
): { coinX: string; coinY: string } {
    // Convert to string first to handle both string and number inputs
    const liquidityStr = typeof liquidity === 'string' ? liquidity : liquidity.toString();
    const curSqrtPriceStr = typeof curSqrtPrice === 'string' ? curSqrtPrice : curSqrtPrice.toString();
    
    const liq = new Decimal(liquidityStr);
    const curSqrtPriceDec = new Decimal(curSqrtPriceStr);
    
    // Calculate sqrt prices from tick indices using TickMath
    const lowerSqrtPriceBN = TickMath.tickIndexToSqrtPriceX64(lowerTick);
    const upperSqrtPriceBN = TickMath.tickIndexToSqrtPriceX64(upperTick);
    
    // Handle both BN and number types
    const lowerSqrtPriceStr = typeof lowerSqrtPriceBN === 'object' && 'toString' in lowerSqrtPriceBN 
        ? lowerSqrtPriceBN.toString() 
        : String(lowerSqrtPriceBN);
    const upperSqrtPriceStr = typeof upperSqrtPriceBN === 'object' && 'toString' in upperSqrtPriceBN
        ? upperSqrtPriceBN.toString()
        : String(upperSqrtPriceBN);
        
    const lowerSqrtPrice = new Decimal(lowerSqrtPriceStr);
    const upperSqrtPrice = new Decimal(upperSqrtPriceStr);

    console.log('[getCoinAmountFromLiquidity] Inputs:', {
        liquidity: liquidityStr,
        curSqrtPrice: curSqrtPriceStr,
        lowerTick,
        upperTick,
        lowerSqrtPriceBN: typeof lowerSqrtPriceBN,
        upperSqrtPriceBN: typeof upperSqrtPriceBN,
        lowerSqrtPrice: lowerSqrtPrice.toString(),
        upperSqrtPrice: upperSqrtPrice.toString()
    });

    let coinX = new Decimal(0);
    let coinY = new Decimal(0);

    // Case 1: current price < lower price (only token X)
    if (curSqrtPriceDec.lt(lowerSqrtPrice)) {
        console.log('[getCoinAmountFromLiquidity] Case 1: current < lower (only token X)');
        coinX = MathUtil.toX64_Decimal(liq)
            .mul(upperSqrtPrice.sub(lowerSqrtPrice))
            .div(lowerSqrtPrice.mul(upperSqrtPrice));
        coinY = new Decimal(0);

    // Case 2: lower <= current < upper (both tokens)
    } else if (curSqrtPriceDec.lt(upperSqrtPrice)) {
        console.log('[getCoinAmountFromLiquidity] Case 2: lower <= current < upper (both tokens)');
        coinX = MathUtil.toX64_Decimal(liq)
            .mul(upperSqrtPrice.sub(curSqrtPriceDec))
            .div(curSqrtPriceDec.mul(upperSqrtPrice));

        coinY = MathUtil.fromX64_Decimal(
            liq.mul(curSqrtPriceDec.sub(lowerSqrtPrice))
        );

    // Case 3: current >= upper (only token Y)
    } else {
        console.log('[getCoinAmountFromLiquidity] Case 3: current >= upper (only token Y)');
        coinX = new Decimal(0);
        coinY = MathUtil.fromX64_Decimal(
            liq.mul(upperSqrtPrice.sub(lowerSqrtPrice))
        );
    }

    console.log('[getCoinAmountFromLiquidity] Results:', {
        coinX: coinX.toString(),
        coinY: coinY.toString()
    });

    // Round up or round down
    if (roundUp) {
        return {
            coinX: coinX.ceil().toString(),
            coinY: coinY.ceil().toString(),
        };
    }

    return {
        coinX: coinX.floor().toString(),
        coinY: coinY.floor().toString(),
    };
}

class MMTService2 {
    private readonly sdk: MmtSDK;

    constructor() {
        this.sdk = MmtSDK.NEW({
            network: 'mainnet',
        });
    }

    /**
     * Convert uint32 to int32 (handle tick index overflow)
     */
    private convertTickIndex(tick: number | string): number {
        const tickNum = typeof tick === 'string' ? parseInt(tick) : tick;
        // If tick is larger than max int32, it's actually negative
        if (tickNum > 2147483647) {
            return tickNum - 4294967296;
        }
        return tickNum;
    }

    /**
     * Calculate tick index from sqrt price
     */
    private tickIndexFromSqrtPrice(sqrtPrice: string): number {
        const price = new Decimal(sqrtPrice).div(new Decimal(2).pow(64));
        return Math.floor(Math.log(price.toNumber()) / Math.log(1.0001));
    }

    /**
     * Calculate sqrt price from tick index
     */
    private sqrtPriceFromTickIndex(tick: number): string {
        const price = Math.pow(1.0001, tick);
        return new Decimal(price).mul(new Decimal(2).pow(64)).floor().toString();
    }

    /**
     * Get pool information by pool ID
     */
    async getPoolInfo(poolId: string): Promise<PoolInfo | null> {
        try {
            console.log(`[MMT2] Fetching pool info: ${poolId}`);
            const poolInfo = await this.sdk.Pool.getPool(poolId);
            
            if (!poolInfo) {
                console.error(`[MMT2] Failed to fetch pool data for ${poolId}`);
                return null;
            }

            console.log(`[MMT2] Pool info fetched successfully:`, {
                tokenX: poolInfo.tokenX.ticker,
                tokenY: poolInfo.tokenY.ticker,
                tvl: poolInfo.tvl,
                apy: poolInfo.apy
            });

            return poolInfo;
        } catch (error) {
            console.error(`[MMT2] Error fetching pool ${poolId}:`, error);
            return null;
        }
    }

    /**
     * Get position information with calculated values
     */
    async getPosition(post:any): Promise<Position | null> {
        try {
            const objectId = post.objectId;
            const poolId = post.poolId;
            const lowerTick = post.lowerTick;
            const upperTick = post.upperTick;
            const positionLiquidity = post.liquidity;
            
            console.log(`[MMT2] Fetching position: ${objectId}`);
            console.log(`[MMT2] Position data:`, {
                objectId,
                poolId,
                lowerTick,
                upperTick,
                liquidity: positionLiquidity
            });

            // Fetch pool info
            const pool = await this.sdk.Pool.getPool(poolId);
            console.log(`[MMT2] Fetched pool for position ${objectId}:`, {
                tokenX: pool?.tokenX.ticker,
                tokenY: pool?.tokenY.ticker,
                currentSqrtPrice: pool?.currentSqrtPrice,
                currentTickIndex: pool?.currentTickIndex,
                poolLiquidity: pool?.liquidity
            });
            
            if (!pool) return null;

            // Get tick indices from position (these should match lowerTick/upperTick from post)
            const lowerTickReq = await this.sdk.Position.getTickLowerIndex(objectId);
            const upperTickReq = await this.sdk.Position.getTickUpperIndex(objectId);
            console.log(`[MMT2] Retrieved tick indices for position ${objectId}:`, {
                lowerTickFromSDK: lowerTickReq,
                upperTickFromSDK: upperTickReq,
                lowerTickFromPost: lowerTick,
                upperTickFromPost: upperTick
            });

            // Calculate token amounts using the helper function with POSITION liquidity
            const tokenAmounts = getCoinAmountFromLiquidity(
                positionLiquidity,
                pool.currentSqrtPrice,
                lowerTick,
                upperTick
            );

            // Calculate human-readable decimal amounts
            const coinXDecimal = new Decimal(tokenAmounts.coinX)
                .div(new Decimal(10).pow(pool.tokenX.decimals))
                .toString();
            
            const coinYDecimal = new Decimal(tokenAmounts.coinY)
                .div(new Decimal(10).pow(pool.tokenY.decimals))
                .toString();

            console.log(`[MMT2] Calculated token amounts (raw):`, {
                coinX: tokenAmounts.coinX,
                coinY: tokenAmounts.coinY,
                coinXDecimal,
                coinYDecimal,
                decimalsX: pool.tokenX.decimals,
                decimalsY: pool.tokenY.decimals,
                priceX: pool.tokenX.price,
                priceY: pool.tokenY.price
            });

            // Calculate USD value
            const tokenXValue = new Decimal(tokenAmounts.coinX)
                .mul(new Decimal(pool.tokenX.price))
                .div(new Decimal(10).pow(pool.tokenX.decimals));
            
            const tokenYValue = new Decimal(tokenAmounts.coinY)
                .mul(new Decimal(pool.tokenY.price))
                .div(new Decimal(10).pow(pool.tokenY.decimals));

            console.log(`[MMT2] Calculated token amounts and USD values for position ${objectId}:`, {
                tokenXAmount: tokenAmounts.coinX,
                tokenYAmount: tokenAmounts.coinY,
                tokenXValueUSD: tokenXValue.toNumber(),
                tokenYValueUSD: tokenYValue.toNumber()
            });    

            // For now we'll skip fees since we don't have access to that API
            let feesEarned;
            try {
                // Mock fees for now
                const fees = {
                    tokenX: "0",
                    tokenY: "0"
                };
                if (fees) {
                    const feesXValue = new Decimal(fees.tokenX)
                        .mul(new Decimal(pool.tokenX.price))
                        .div(new Decimal(10).pow(pool.tokenX.decimals));
                    
                    const feesYValue = new Decimal(fees.tokenY)
                        .mul(new Decimal(pool.tokenY.price))
                        .div(new Decimal(10).pow(pool.tokenY.decimals));

                    feesEarned = {
                        tokenX: fees.tokenX,
                        tokenY: fees.tokenY,
                        valueUSD: feesXValue.plus(feesYValue).toNumber()
                    };
                }
            } catch (error) {
                console.warn(`[MMT2] Error fetching fees for position ${objectId}:`, error);
            }

            const valueUSD = tokenXValue.plus(tokenYValue).toNumber();

            const result: Position = {
                objectId,
                poolId: poolId,
                lowerTick,
                upperTick,
                liquidity: positionLiquidity,
                pool,
                tokenAmounts: {
                    ...tokenAmounts,
                    coinXDecimal,
                    coinYDecimal
                },
                valueUSD,
                ...(feesEarned && { feesEarned })
            };

            console.log(`[MMT2] Position processed successfully:`, {
                objectId,
                poolId: poolId,
                valueUSD,
                feesEarned: feesEarned?.valueUSD
            });

            return result;
        } catch (error) {
            console.error(`[MMT2] Error processing position :`, error);
            return null;
        }
    }

    /**
     * Get all positions for a user
     */
    async getUserPositions(userAddress: string): Promise<Position[]> {
        try {
            console.log(`[MMT2] Fetching positions for user: ${userAddress}`);
            
            // Get all position IDs for user
            const positions = await this.sdk.Position.getAllUserPositions(userAddress);
            console.log(`[MMT2] Found ${positions.length} positions`);

            console.log(`[MMT2] Processing positions...`, positions);
            // Process each position
            const processedPositions = await Promise.all(
                positions.map(pos => this.getPosition(pos))
            );

            // Filter out any null positions and convert to Position array
            const validPositions = processedPositions.filter((pos): pos is Position => pos !== null);

            console.log(`[MMT2] Processed ${validPositions.length} positions successfully`, {
                totalValueUSD: validPositions.reduce((sum, pos) => sum + pos.valueUSD, 0),
                totalFeesUSD: validPositions.reduce((sum, pos) => sum + (pos.feesEarned?.valueUSD || 0), 0)
            });

            return validPositions;
        } catch (error) {
            console.error(`[MMT2] Error fetching user positions:`, error);
            return [];
        }
    }
}

export const mmtService2 = new MMTService2();
