import { MmtSDK } from '@mmt-finance/clmm-sdk';
import { DatabaseService, TokenDB } from './database.service';
import { getTokenPrice } from '@7kprotocol/sdk-ts';
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// Define interfaces for better type safety
/** Information about a token and its current price */
interface TokenInfo {
    /** Token name/symbol */
    name: string;
    /** Current token price in USD */
    price: number;
}

/** Processed position data with calculated values and prices */
interface ProcessedPosition {
    /** Unique identifier of the position */
    objectId: string;
    /** Amount of coin X owed */
    owedCoinX: number;
    /** Amount of coin Y owed */
    owedCoinY: number;
    /** Name/symbol of coin X */
    ownedCoinX: string;
    /** Name/symbol of coin Y */
    ownedCoinY: string;
    /** Current price of coin X in USD */
    ownedCoinXPrice: number;
    /** Current price of coin Y in USD */
    ownedCoinYPrice: number;
    /** Total value owed in USD */
    totalOwedUSD: number;
}

/** Core position data extracted from SUI object */
interface PositionContent {
    /** Type/name of coin X */
    typeX: string;
    /** Type/name of coin Y */
    typeY: string;
    /** Position object identifier */
    objectId: string;
}

const client = new SuiClient({
    url: getFullnodeUrl('mainnet'),
});

/**
 * Service class for interacting with MMT Finance protocol
 * Handles position management and token price fetching
 */
class MMTService {
    /** SDK instance for MMT Finance operations */
    private readonly sdk: MmtSDK;
    /** Database service instance for persistence */
    private static dbService: DatabaseService;
    /** Delay between API requests to avoid rate limiting */
    private static readonly FETCH_DELAY = 1000;
    /** Maximum number of retries for failed requests */
    private static readonly MAX_RETRIES = 3;

    initialize(database: D1Database): void {
        MMTService.dbService = new DatabaseService(database);
    }

    constructor() {
        this.sdk = MmtSDK.NEW({
            network: 'mainnet',
        });
    }

    /**
     * Maximum age of cached price data in milliseconds (5 minutes)
     */
    private static readonly PRICE_CACHE_TTL = 5 * 60 * 1000;

    /**
     * Fetches token price with retry mechanism and detailed logging
     * @param tokenName Name of the token
     * @returns Token price or null if unavailable
     */
    private async fetchTokenPrice(tokenName: string): Promise<number | null> {
        const startTime = Date.now();
        console.log(`[MMT] Fetching price for token: ${tokenName}`);
        
        try {
            // Check cache first
            console.log(`[MMT] Checking cache for token: ${tokenName}`);
            const cachedPrice = await MMTService.dbService.getTokenPrice(tokenName);
            
            if (cachedPrice) {
                const priceAge = Date.now() - cachedPrice.timestamp;
                console.log(`[MMT] Found cached price for ${tokenName}:`, {
                    price: cachedPrice.price,
                    age: `${Math.round(priceAge / 1000)}s`,
                    timestamp: new Date(cachedPrice.timestamp).toISOString()
                });

                if (priceAge < MMTService.PRICE_CACHE_TTL) {
                    console.log(`[MMT] Using cached price for ${tokenName} (age: ${Math.round(priceAge / 1000)}s)`);
                    return cachedPrice.price;
                }
                console.log(`[MMT] Cached price for ${tokenName} is too old, fetching new price`);
            } else {
                console.log(`[MMT] No cached price found for ${tokenName}`);
            }

            // If not in cache or expired, fetch from API
            let retries = 0;
            while (retries < MMTService.MAX_RETRIES) {
                try {
                    console.log(`[MMT] Fetching price from API for ${tokenName} (attempt ${retries + 1}/${MMTService.MAX_RETRIES})`);
                    const price = await getTokenPrice(tokenName, "dba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC");
                    const numericPrice = price ? Number(price) : null;

                    // Log API response
                    console.log(`[MMT] API response for ${tokenName}:`, { rawPrice: price, numericPrice });

                    // Update cache if we got a valid price
                    if (numericPrice !== null) {
                        console.log(`[MMT] Saving new price for ${tokenName}: ${numericPrice}`);
                        await MMTService.dbService.saveTokenPrice({
                            name: tokenName,
                            price: numericPrice,
                            timestamp: Date.now()
                        });
                        
                        const duration = Date.now() - startTime;
                        console.log(`[MMT] Successfully fetched and cached price for ${tokenName} in ${duration}ms`);
                        return numericPrice;
                    } else {
                        console.warn(`[MMT] Received invalid price for ${tokenName} from API`);
                    }

                    return numericPrice;
                } catch (error) {
                    retries++;
                    console.warn(`[MMT] Failed to fetch price for ${tokenName} (attempt ${retries}/${MMTService.MAX_RETRIES}):`, error);
                    
                    if (retries === MMTService.MAX_RETRIES) {
                        console.error(`[MMT] All attempts failed for ${tokenName}, using fallback`);
                        if (cachedPrice) {
                            console.log(`[MMT] Using expired cached price as fallback for ${tokenName}: ${cachedPrice.price}`);
                            return cachedPrice.price;
                        }
                        return null;
                    }
                    
                    const delayMs = MMTService.FETCH_DELAY;
                    console.log(`[MMT] Waiting ${delayMs}ms before retry ${retries + 1}`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        } catch (dbError) {
            console.error(`[MMT] Database error while fetching price for ${tokenName}:`, dbError);
        }

        const duration = Date.now() - startTime;
        console.error(`[MMT] Failed to fetch price for ${tokenName} after ${duration}ms`);
        return null;
    }    /**
     * Extract position content from SUI object
     */
    private async getPositionContent(objectId: string): Promise<PositionContent | null> {
        const resp = await client.getObject({
            id: objectId,
            options: {
                showContent: true,
                showType: true,
                showOwner: true
            },
        });

        const content = resp?.data?.content;
        if (!content || content.dataType !== 'moveObject') {
            console.warn(`Invalid content for position ${objectId}`);
            return null;
        }

        const fields = content.fields as Record<string, any>;
        console.log('Position Fields:', fields);
        const typeX = fields?.type_x?.fields?.name;
        const typeY = fields?.type_y?.fields?.name;

        if (!typeX || !typeY) {
            console.warn(`Missing token types for position ${objectId}`);
            return null;
        }

        return { typeX, typeY, objectId };
    }

    /**
     * Process a single position
     */
    private async processPosition(positionContent: PositionContent): Promise<ProcessedPosition | null> {
        try {
            // Fetch owed coins
            const [owedCoinX, owedCoinY] = await Promise.all([
                await this.sdk.Position.getOwedCoinX(positionContent.objectId),
                await this.sdk.Position.getOwedCoinY(positionContent.objectId)
            ]);
            console.log('Owed Coins:', { owedCoinX, owedCoinY });

            // Fetch token prices
            const [ownedCoinXPrice, ownedCoinYPrice] = await Promise.all([
                 await this.fetchTokenPrice(positionContent.typeX),
                await this.fetchTokenPrice(positionContent.typeY)
            ]);
            console.log('Token Prices:', { ownedCoinXPrice, ownedCoinYPrice });

            const owedCoinXNum = Number(owedCoinX);
            const owedCoinYNum = Number(owedCoinY);
            const xPrice = ownedCoinXPrice || 0;
            const yPrice = ownedCoinYPrice || 0;

            return {
                objectId: positionContent.objectId,
                owedCoinX: owedCoinXNum,
                owedCoinY: owedCoinYNum,
                ownedCoinX: positionContent.typeX,
                ownedCoinY: positionContent.typeY,
                ownedCoinXPrice: xPrice,
                ownedCoinYPrice: yPrice,
                totalOwedUSD: (owedCoinXNum * xPrice) + (owedCoinYNum * yPrice)
            };
        } catch (error) {
            console.error(`Error processing position ${positionContent.objectId}:`, error);
            return null;
        }
    }

    /**
     * Fetches and processes user positions with token prices
     * @param userAddress The SUI wallet address of the user
     * @returns Array of processed positions with price information
     */
    async getUserPositions(userAddress: string): Promise<ProcessedPosition[]> {
        try {
            const positions = await this.sdk.Position.getAllUserPositions(userAddress);
            const processedPositions: ProcessedPosition[] = [];

            // Process first 3 positions
            for (let i = 0; i < Math.min(3, positions.length); i++) {
                const pos = positions[i];
                if (!pos?.objectId) {
                    console.warn(`Invalid position at index ${i}`);
                    continue;
                }

                // Get position content
                const positionContent = await this.getPositionContent(pos.objectId);
                console.log('Position Content:', positionContent);
                if (!positionContent) continue;

                // Process position
                const processedPosition = await this.processPosition(positionContent);
                console.log('Processed Position:', processedPosition);
                if (processedPosition) {
                    processedPositions.push(processedPosition);
                }
            }

            return processedPositions;
        } catch (error: unknown) {
            console.error('Error fetching user positions:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            throw new Error(`Failed to fetch user positions: ${errorMessage}`);
        }
    }
}


export const mmtService = new MMTService();
