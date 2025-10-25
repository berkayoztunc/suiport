-- Migration for wallet history tracking
CREATE TABLE IF NOT EXISTS wallet_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_address TEXT NOT NULL,
    total_value_usd REAL NOT NULL,
    percentage_change REAL,
    tokens_json TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Index for faster queries on wallet address and date
CREATE INDEX IF NOT EXISTS idx_wallet_history_address ON wallet_history(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_history_date ON wallet_history(created_at);