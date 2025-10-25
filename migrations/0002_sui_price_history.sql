-- Migration for SUI price history tracking
CREATE TABLE IF NOT EXISTS sui_price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    price_usd REAL NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- Index for faster queries on date
CREATE INDEX IF NOT EXISTS idx_sui_price_date ON sui_price_history(created_at);