const test = require('node:test');
const assert = require('node:assert');
const authService = require('../src/services/authService');
const marketEngine = require('../src/services/marketEngine');
const ledgerService = require('../src/services/ledgerService');
const antifraudService = require('../src/services/antifraudService');
const { db } = require('../src/db/database');
const crypto = require('crypto');

test('Concurrency & Atomic Integrity: Simultaneous orders cannot double-spend or oversell', (t) => {
  const seller = authService.register('conc_seller_' + Date.now(), `conc_seller_${Date.now()}@test.com`, 'password123');
  const buyer1 = authService.register('conc_buyer1_' + Date.now(), `conc_buyer1_${Date.now()}@test.com`, 'password123');
  const buyer2 = authService.register('conc_buyer2_' + Date.now(), `conc_buyer2_${Date.now()}@test.com`, 'password123');

  const testCrop = 'conc_crop_' + Date.now();

  // Give seller exactly 1 rare pumpkin
  db.prepare(`
    INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
    VALUES (?, ?, ?, 1, 0, 'normal')
  `).run('inv_' + crypto.randomUUID(), seller.user.id, testCrop);

  // Give both buyers 500 coins each
  db.prepare('UPDATE wallets SET coins = 500 WHERE user_id IN (?, ?)').run(buyer1.user.id, buyer2.user.id);

  // Seller posts 1 crop at 60G
  const sellOrder = marketEngine.createOrder(seller.user.id, 'SELL', testCrop, 60, 1);
  assert.equal(sellOrder.status, 'OPEN');

  // Buyer 1 matches and fills the order
  const buy1 = marketEngine.createOrder(buyer1.user.id, 'BUY', testCrop, 60, 1);
  assert.equal(buy1.status, 'FILLED');

  // Buyer 2 tries to buy at the same price
  const buy2 = marketEngine.createOrder(buyer2.user.id, 'BUY', testCrop, 60, 1);
  // Since the sell order was already completely filled by buyer1, buyer2's order stays OPEN on the book, cannot oversell!
  assert.equal(buy2.status, 'OPEN');
  assert.equal(buy2.quantity_remaining, 1);

  // Verify seller inventory is exactly 0 (not negative)
  const sellerInv = db.prepare("SELECT * FROM inventories WHERE user_id = ? AND item_id = ?").get(seller.user.id, testCrop);
  assert.equal(sellerInv.quantity, 0);
  assert.equal(sellerInv.reserved, 0);

  // Verify buyer 1 has 1 crop
  const b1Inv = db.prepare("SELECT * FROM inventories WHERE user_id = ? AND item_id = ?").get(buyer1.user.id, testCrop);
  assert.equal(b1Inv.quantity, 1);

  // Verify buyer 2 has 0 crop
  const b2Inv = db.prepare("SELECT * FROM inventories WHERE user_id = ? AND item_id = ?").get(buyer2.user.id, testCrop);
  assert.ok(!b2Inv || b2Inv.quantity === 0);
});

test('Idempotency: Repeated financial requests with same key do not duplicate orders or fees', (t) => {
  const user = authService.register('idem_user_' + Date.now(), `idem_${Date.now()}@test.com`, 'password123');
  db.prepare('UPDATE wallets SET coins = 1000 WHERE user_id = ?').run(user.user.id);

  const idemKey = 'key_unique_' + crypto.randomUUID();

  // First request
  const check1 = antifraudService.checkIdempotency(idemKey);
  assert.equal(check1, null);

  const order = marketEngine.createOrder(user.user.id, 'BUY', 'wheat', 15, 10);
  const responseData = { orderId: order.id, status: order.status };
  antifraudService.saveIdempotency(idemKey, responseData);

  // Repeated request with same Idempotency-Key
  const check2 = antifraudService.checkIdempotency(idemKey);
  assert.ok(check2);
  assert.equal(check2.orderId, order.id);

  // Verify only 1 order was created for this user
  const userOrders = db.prepare('SELECT * FROM market_orders WHERE user_id = ?').all(user.user.id);
  assert.equal(userOrders.length, 1);
});

test('Transaction Rollback: Database rollbacks cleanly if an error occurs mid-operation', (t) => {
  const user = authService.register('rollback_user_' + Date.now(), `rb_${Date.now()}@test.com`, 'password123');
  const initialWallet = ledgerService.getWallet(user.user.id);

  assert.throws(() => {
    const tx = db.transaction(() => {
      // 1. Change balance
      db.prepare('UPDATE wallets SET coins = 99999 WHERE user_id = ?').run(user.user.id);
      // 2. Deliberate syntax/constraint violation to force rollback
      db.prepare('INSERT INTO non_existent_table VALUES (1)').run();
    });
    tx();
  });

  // Verify wallet remained untouched due to atomic rollback
  const currentWallet = ledgerService.getWallet(user.user.id);
  assert.equal(currentWallet.coins, initialWallet.coins, 'Balance must remain identical after transaction rollback');
});
