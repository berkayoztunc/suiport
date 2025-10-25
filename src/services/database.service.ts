// Types for our database models
export interface TokenDB {
    coin_type: string;
    price_usd: number;
    last_update: number;
    metadata?: string;
}

export interface WalletDB {
    address: string;
    total_value_usd: number;
    last_update: number;
}

export interface WalletTokenDB {
    wallet_address: string;
    coin_type: string;
    balance: string;
    price_usd: number | null;
    value_usd: number;
}

// Response types for our API
export interface TokenData {
    coinType: string;
    priceUSD: number;
    metadata?: {
        decimals: number;
        name: string;
        symbol: string;
        description: string;
        iconUrl?: string | null;
    };
}

export interface WalletHistoryEntry {
    id: number;
    wallet_address: string;
    total_value_usd: number;
    percentage_change: number | null;
    tokens_json: string;
    created_at: number;
}

export interface SuiPriceEntry {
    id: number;
    price_usd: number;
    created_at: number;
}

export interface WalletTokenData {
    coinType: string;
    balance: string;
    valueUSD: number;
    metadata?: {
        decimals: number;
        name: string;
        symbol: string;
        description: string;
        iconUrl?: string | null;
    };
}

export interface WalletData {
    address: string;
    totalValueUSD: number;
    tokens: WalletTokenData[];
}

// Constants
export const HOUR_IN_MS = 60 * 60 * 1000; // 1 hour in milliseconds

// Database service
export class DatabaseService {
    private db: D1Database;

    constructor(database: D1Database) {
        this.db = database;
    }

    // Wallet history methods
    async saveWalletHistory(
        walletAddress: string,
        totalValueUsd: number,
        tokensJson: string
    ): Promise<{ percentageChange: number | null }> {
        try {
            // Get the last history entry from today
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            
            const lastEntry = await this.getLastWalletHistory(walletAddress, startOfDay.getTime());
            
            // Calculate percentage change if we have a previous entry
            let percentageChange: number | null = null;
            if (lastEntry) {
                percentageChange = ((totalValueUsd - lastEntry.total_value_usd) / lastEntry.total_value_usd) * 100;
            }
            
            // Save new entry
            const stmt = await this.db.prepare(`
                INSERT INTO wallet_history (
                    wallet_address,
                    total_value_usd,
                    percentage_change,
                    tokens_json,
                    created_at
                ) VALUES (?, ?, ?, ?, ?)
            `);
            
            await stmt.bind(
                walletAddress,
                totalValueUsd,
                percentageChange,
                tokensJson,
                Date.now()
            ).run();
            
            return { percentageChange };
            
        } catch (error) {
            console.error('Error saving wallet history:', error);
            throw error;
        }
    }
    
    async getLastWalletHistory(
        walletAddress: string,
        since: number
    ): Promise<WalletHistoryEntry | null> {
        try {
            const stmt = await this.db.prepare(`
                SELECT *
                FROM wallet_history
                WHERE wallet_address = ?
                AND created_at >= ?
                ORDER BY created_at DESC
                LIMIT 1
            `);
            
            return await stmt.bind(walletAddress, since).first<WalletHistoryEntry>();
            
        } catch (error) {
            console.error('Error getting last wallet history:', error);
            throw error;
        }
    }
    
    async getWalletHistoryForPeriod(
        walletAddress: string,
        startTime: number,
        endTime: number
    ): Promise<WalletHistoryEntry[]> {
        try {
            const stmt = await this.db.prepare(`
                SELECT *
                FROM wallet_history
                WHERE wallet_address = ?
                AND created_at BETWEEN ? AND ?
                ORDER BY created_at ASC
            `);
            
            const result = await stmt.bind(walletAddress, startTime, endTime).all();
            return (result.results as unknown) as WalletHistoryEntry[];
            
        } catch (error) {
            console.error('Error getting wallet history:', error);
            throw error;
        }
    }

    // SUI Price methods
    async saveSuiPrice(priceUsd: number): Promise<void> {
        try {
            const stmt = await this.db.prepare(`
                INSERT INTO sui_price_history (price_usd, created_at)
                VALUES (?, ?)
            `);
            
            await stmt.bind(priceUsd, Date.now()).run();
        } catch (error) {
            console.error('Error saving SUI price:', error);
            throw error;
        }
    }

    async getSuiPriceHistory(minutes: number): Promise<SuiPriceEntry[]> {
        try {
            const startTime = Date.now() - (minutes * 60 * 1000);
            const stmt = await this.db.prepare(`
                SELECT *
                FROM sui_price_history
                WHERE created_at >= ?
                ORDER BY created_at ASC
            `);
            
            const result = await stmt.bind(startTime).all();
            return (result.results as unknown) as SuiPriceEntry[];
        } catch (error) {
            console.error('Error getting SUI price history:', error);
            throw error;
        }
    }

    async query<T>(sql: string, params: any[] = []): Promise<T[]> {
        const result = await this.db.prepare(sql).bind(...params).all();
        return result.results as T[];
    }

    async updateTokenPrice(coinType: string, priceUsd: number): Promise<void> {
        console.log(`[DB] Updating price for token: ${coinType} to ${priceUsd}`);
        const stmt = await this.db.prepare(`
            UPDATE tokens
            SET price_usd = ?, last_update = ?
            WHERE coin_type = ?
        `);
        await stmt.bind(priceUsd, Date.now(), coinType).run();
        console.log(`[DB] Successfully updated price for token: ${coinType}`);
    }

    // Token methods
    async getToken(coinType: string): Promise<TokenDB | null> {
        console.log(`[DB] Getting token from database: ${coinType}`);
        const stmt = await this.db.prepare('SELECT * FROM tokens WHERE coin_type = ?');
        const result = await stmt.bind(coinType).first<TokenDB>();
        console.log(`[DB] Token result for ${coinType}:`, result);
        return result || null;
    }

    async isTokenStale(coinType: string): Promise<boolean> {
        console.log(`[DB] Checking if token is stale: ${coinType}`);
        const token = await this.getToken(coinType);
        if (!token) {
            console.log(`[DB] No token found for ${coinType}, considering stale`);
            return true;
        }
        const isStale = (Date.now() - token.last_update) > HOUR_IN_MS;
        console.log(`[DB] Token ${coinType} is${isStale ? '' : ' not'} stale`);
        return isStale;
    }

    async saveToken(token: TokenDB): Promise<void> {
        console.log(`[DB] Saving token to database: ${token.coin_type}`);
        const stmt = await this.db.prepare(`
            INSERT INTO tokens (coin_type, price_usd, last_update, metadata)
            VALUES (?, ?, ?, ?)
            ON CONFLICT (coin_type) DO UPDATE
            SET price_usd = excluded.price_usd,
                last_update = excluded.last_update,
                metadata = excluded.metadata
        `);
        await stmt.bind(
            token.coin_type,
            token.price_usd,
            token.last_update,
            token.metadata
        ).run();
        console.log(`[DB] Successfully saved token: ${token.coin_type}`);
    }

    // Wallet methods
    async getWallet(address: string): Promise<WalletData | null> {
        console.log(`[DB] Getting wallet from database: ${address}`);
        const walletStmt = await this.db.prepare('SELECT * FROM wallets WHERE address = ?');
        const wallet = await walletStmt.bind(address).first<WalletDB>();

        if (!wallet) {
            console.log(`[DB] No wallet found for address: ${address}`);
            return null;
        }
        console.log(`[DB] Found wallet for address: ${address}`);

        console.log(`[DB] Fetching tokens for wallet: ${address}`);
        const tokensStmt = await this.db.prepare(`
            SELECT wt.*, t.metadata
            FROM wallet_tokens wt
            LEFT JOIN tokens t ON t.coin_type = wt.coin_type
            WHERE wt.wallet_address = ?
        `);
        const tokens = await tokensStmt.bind(address).all<WalletTokenDB & { metadata?: string }>();
        console.log(`[DB] Found ${tokens.results.length} tokens for wallet: ${address}`);

        const result = {
            address: wallet.address,
            totalValueUSD: wallet.total_value_usd,
            tokens: tokens.results.map(t => ({
                coinType: t.coin_type,
                balance: t.balance,
                valueUSD: t.value_usd,
                price: t.price_usd || 0,
                metadata: t.metadata ? JSON.parse(t.metadata) : undefined
            }))
        };
        console.log(`[DB] Prepared wallet data for ${address} with ${result.tokens.length} tokens`);
        return result;
    }

    async isWalletStale(address: string): Promise<boolean> {
        const stmt = await this.db.prepare('SELECT last_update FROM wallets WHERE address = ?');
        const wallet = await stmt.bind(address).first<{ last_update: number }>();
        
        if (!wallet) return true;
        return (Date.now() - wallet.last_update) > HOUR_IN_MS;
    }

    async saveWallet(wallet: WalletData): Promise<void> {
        console.log(`[DB] Starting to save wallet: ${wallet.address}`);
        
        try {
            // Update wallet
            console.log(`[DB] Updating wallet record for: ${wallet.address}`);
            const walletStmt = await this.db.prepare(`
                INSERT INTO wallets (address, total_value_usd, last_update)
                VALUES (?, ?, ?)
                ON CONFLICT (address) DO UPDATE
                SET total_value_usd = excluded.total_value_usd,
                    last_update = excluded.last_update
            `);
            await walletStmt.bind(
                wallet.address,
                wallet.totalValueUSD,
                Date.now()
            ).run();
            console.log(`[DB] Wallet record updated: ${wallet.address}`);

            // Delete old wallet tokens - Using batch operation
            console.log(`[DB] Deleting old wallet tokens for: ${wallet.address}`);
            await this.db.prepare('DELETE FROM wallet_tokens WHERE wallet_address = ?')
                .bind(wallet.address)
                .run();
            console.log(`[DB] Old wallet tokens deleted for: ${wallet.address}`);

            // Insert new wallet tokens - Using batch operation
            if (wallet.tokens.length > 0) {
                console.log(`[DB] Inserting ${wallet.tokens.length} new tokens for wallet: ${wallet.address}`);
                const insertStmt = await this.db.prepare(`
                    INSERT INTO wallet_tokens
                    (wallet_address, coin_type, balance, value_usd)
                    VALUES (?, ?, ?, ?)
                `);

                for (const token of wallet.tokens) {
                    console.log(`[DB] Inserting token ${token.coinType} for wallet: ${wallet.address}`);
                    try {
                        await insertStmt.bind(
                            wallet.address,
                            token.coinType,
                            token.balance,
                            token.valueUSD
                        ).run();
                    } catch (tokenError) {
                        console.log(`[DB] Error inserting token ${token.coinType}:`, tokenError);
                        // Continue with next token
                    }
                }
            }

            console.log(`[DB] Successfully saved wallet data for: ${wallet.address}`);
        } catch (error) {
            console.log(`[DB] Error saving wallet ${wallet.address}:`, error);
            throw error;
        }
    }
}