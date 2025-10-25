-- Migration: Create wallet and token tables
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS tokens;

-- Create tokens table
CREATE TABLE tokens (
    coin_type TEXT PRIMARY KEY,
    price_usd REAL NOT NULL DEFAULT 0,
    last_update INTEGER NOT NULL,
    metadata TEXT -- JSON string for additional metadata
);

-- Create wallets table
CREATE TABLE wallets (
    address TEXT PRIMARY KEY,
    total_value_usd REAL NOT NULL DEFAULT 0,
    last_update INTEGER NOT NULL
);

-- Create wallet_tokens table for many-to-many relationship
CREATE TABLE wallet_tokens (
    wallet_address TEXT NOT NULL,
    coin_type TEXT NOT NULL,
    balance TEXT NOT NULL,
    value_usd REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (wallet_address) REFERENCES wallets(address),
    FOREIGN KEY (coin_type) REFERENCES tokens(coin_type),
    PRIMARY KEY (wallet_address, coin_type)
);