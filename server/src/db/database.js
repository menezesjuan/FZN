const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'fzn_game.sqlite');
const db = new Database(DB_PATH);

// High-performance SQLite configuration for ACID transactions
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'farmer',
      created_at INTEGER NOT NULL,
      last_login INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallets (
      user_id TEXT PRIMARY KEY,
      coins REAL NOT NULL DEFAULT 150.0,
      premium_currency REAL NOT NULL DEFAULT 0.0,
      pending_rmt REAL NOT NULL DEFAULT 0.0,
      available_rmt REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS farms (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      storage_capacity INTEGER NOT NULL DEFAULT 100,
      offline_limit_hours INTEGER NOT NULL DEFAULT 8,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS farm_tiles (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      tile_x INTEGER NOT NULL,
      tile_y INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'soil',
      state TEXT NOT NULL DEFAULT 'EMPTY', -- EMPTY, PLANTED, GROWING, READY, HARVESTED
      crop_id TEXT,
      planted_at INTEGER,
      watered INTEGER NOT NULL DEFAULT 0,
      growth_stage INTEGER NOT NULL DEFAULT 0,
      harvest_ready_at INTEGER,
      UNIQUE(farm_id, tile_x, tile_y),
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS inventories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      reserved INTEGER NOT NULL DEFAULT 0,
      quality TEXT NOT NULL DEFAULT 'normal',
      UNIQUE(user_id, item_id, quality),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tool_id TEXT NOT NULL, -- watering_can, axe, pickaxe, milk_collector, egg_basket
      durability INTEGER NOT NULL,
      max_durability INTEGER NOT NULL,
      condition TEXT NOT NULL DEFAULT 'Good',
      UNIQUE(user_id, tool_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS animals (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      animal_type TEXT NOT NULL, -- chicken, cow
      name TEXT NOT NULL,
      birth_date INTEGER NOT NULL,
      age_days INTEGER NOT NULL DEFAULT 0,
      lifespan_days INTEGER NOT NULL DEFAULT 180,
      production_cycles INTEGER NOT NULL DEFAULT 0,
      max_production_cycles INTEGER NOT NULL DEFAULT 120,
      health INTEGER NOT NULL DEFAULT 100,
      fed_today INTEGER NOT NULL DEFAULT 0,
      last_collected_at INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, END_OF_LIFE, SICK
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      farm_id TEXT NOT NULL,
      machine_type TEXT NOT NULL, -- mill, cheese_maker, juice_press
      durability INTEGER NOT NULL DEFAULT 1000,
      max_durability INTEGER NOT NULL DEFAULT 1000,
      current_job TEXT, -- JSON recipe & input details
      job_finishes_at INTEGER DEFAULT 0,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS market_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- BUY, SELL
      item_id TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity_total INTEGER NOT NULL,
      quantity_remaining INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, FILLED, CANCELLED
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS market_trades (
      id TEXT PRIMARY KEY,
      buy_order_id TEXT NOT NULL,
      sell_order_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      fee_amount REAL NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL, -- NPC_PURCHASE, NPC_SALE, MARKET_BUY, MARKET_SELL, MARKET_FEE, REPAIR_FEE, CONTRACT_REWARD
      asset TEXT NOT NULL, -- coins, item_id
      amount REAL NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      reference TEXT,
      timestamp INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'COMPLETED'
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      client_name TEXT NOT NULL,
      item_id TEXT NOT NULL,
      required_quantity INTEGER NOT NULL,
      reward_coins REAL NOT NULL,
      deadline INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'AVAILABLE' -- AVAILABLE, ACCEPTED, COMPLETED, EXPIRED
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      timestamp INTEGER NOT NULL
    );
  `);
}

initSchema();

module.exports = {
  db,
  initSchema
};
