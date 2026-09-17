const test = require('node:test');
const assert = require('node:assert');
const { db } = require('../src/db/database');

test('SQLite Database Schema Initialization', (t) => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  console.log('Detected SQLite Tables:', tables);
  assert.ok(tables.includes('users'), 'Table users must exist');
  assert.ok(tables.includes('wallets'), 'Table wallets must exist');
  assert.ok(tables.includes('farms'), 'Table farms must exist');
  assert.ok(tables.includes('farm_tiles'), 'Table farm_tiles must exist');
  assert.ok(tables.includes('inventories'), 'Table inventories must exist');
  assert.ok(tables.includes('tools'), 'Table tools must exist');
  assert.ok(tables.includes('animals'), 'Table animals must exist');
  assert.ok(tables.includes('machines'), 'Table machines must exist');
  assert.ok(tables.includes('market_orders'), 'Table market_orders must exist');
  assert.ok(tables.includes('market_trades'), 'Table market_trades must exist');
  assert.ok(tables.includes('ledger'), 'Table ledger must exist');
});
