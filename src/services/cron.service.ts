import { getTokenPrice, getSuiPrice } from "@7kprotocol/sdk-ts";
import { DatabaseService } from './database.service';

export class CronService {
    private static dbService: DatabaseService;

    static initialize(database: D1Database) {
        this.dbService = new DatabaseService(database);
    }

    static async updateSuiPrice(): Promise<void> {
        try {
            console.log('[CronService] Starting SUI price update job');
            const suiPrice = await getSuiPrice();
            
            if (suiPrice !== null && !isNaN(suiPrice) && isFinite(suiPrice) && suiPrice > 0) {
                console.log(`[CronService] Got SUI price: ${suiPrice}`);
                await this.dbService.saveSuiPrice(suiPrice);
                console.log('[CronService] Successfully saved SUI price');
            } else {
                console.log('[CronService] Invalid SUI price received:', suiPrice);
            }
        } catch (error) {
            console.error('[CronService] Error updating SUI price:', error);
            throw error;
        }
    }

    static async updateZeroPriceTokens(): Promise<void> {
        try {
            console.log('[CronService] Starting zero price token update job');
            
            // Get tokens with zero price
            const tokens = await this.dbService.query<{ coin_type: string }>(
                'SELECT coin_type FROM tokens WHERE price_usd = 0'
            );
            
            console.log(`[CronService] Found ${tokens.length} tokens with zero price`);
            
            for (const token of tokens) {
                console.log(`[CronService] Processing token: ${token.coin_type}`);
                try {
                    const price = await getTokenPrice(token.coin_type);
                    
                    if (price !== null && !isNaN(price) && isFinite(price) && price > 0) {
                        console.log(`[CronService] Updated price for ${token.coin_type}: ${price}`);
                        await this.dbService.query(
                            'UPDATE tokens SET price_usd = ?, last_update = ? WHERE coin_type = ?',
                            [price, Date.now(), token.coin_type]
                        );
                    } else {
                        console.log(`[CronService] Could not get valid price for ${token.coin_type}, removing token...`);
                    }
                } catch (error) {
                    console.error(`[CronService] Error updating price for ${token.coin_type}:`, error);
                }
            }
            
            console.log('[CronService] Completed zero price token update job');
        } catch (error) {
            console.error('[CronService] Error in updateZeroPriceTokens:', error);
        }
    }
}