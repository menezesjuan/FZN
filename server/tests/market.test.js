const test = require('node:test');
const assert = require('node:assert');
const authService = require('../src/services/authService');
const marketEngine = require('../src/services/marketEngine');
const { db } = require('../src/db/database');
const crypto = require('crypto');

test('Market Engine: Order Placement, Inventory Reservation, Order Book Matching & Fees', (t) => {
  const seller = authService.register('seller_' + Date.now(), `seller_${Date.now()}@test.com`, 'password123');
  const buyer = authService.register('buyer_' + Date.now(), `buyer_${Date.now()}@test.com`, 'password123');

  // Give seller 20 tomatoes
  db.prepare(`
    INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
    VALUES (?, ?, 'tomato', 20, 0, 'normal')
  `).run('inv_' + crypto.randomUUID(), seller.user.id);

  // Give buyer 1000 coins for trading
  db.prepare('UPDATE wallets SET coins = 1000 WHERE user_id = ?').run(buyer.user.id);

  // 1. Seller posts SELL order: 10 tomatoes at 25 coins each (Total: 250 coins)
  // Listing fee: 1% of 250 = 2.5 coins
  const sellOrder = marketEngine.createOrder(seller.user.id, 'SELL', 'tomato', 25, 10);
  assert.equal(sellOrder.status, 'OPEN');
  assert.equal(sellOrder.quantity_remaining, 10);

  // Check seller inventory reservation
  const sellerInv = db.prepare("SELECT * FROM inventories WHERE user_id = ? AND item_id = 'tomato'").get(seller.user.id);
  assert.equal(sellerInv.quantity, 20);
  assert.equal(sellerInv.reserved, 10, '10 tomatoes must be reserved');

  // 2. Inspect order book
  const orderBook = marketEngine.getOrderBook('tomato');
  assert.equal(orderBook.sellOrders.length, 1);
  assert.equal(orderBook.sellOrders[0].unit_price, 25);
  assert.equal(orderBook.sellOrders[0].total_quantity, 10);

  // 3. Buyer posts BUY order: 10 tomatoes at 25 coins each
  const buyOrder = marketEngine.createOrder(buyer.user.id, 'BUY', 'tomato', 25, 10);

  // 4. Verify orders matched and filled
  const updatedSellOrder = db.prepare('SELECT * FROM market_orders WHERE id = ?').get(sellOrder.id);
  const updatedBuyOrder = db.prepare('SELECT * FROM market_orders WHERE id = ?').get(buyOrder.id);

  assert.equal(updatedSellOrder.status, 'FILLED', 'Sell order must be filled');
  assert.equal(updatedBuyOrder.status, 'FILLED', 'Buy order must be filled');
  assert.equal(updatedSellOrder.quantity_remaining, 0);
  assert.equal(updatedBuyOrder.quantity_remaining, 0);

  // 5. Verify buyer received items
  const buyerInv = db.prepare("SELECT * FROM inventories WHERE user_id = ? AND item_id = 'tomato'").get(buyer.user.id);
  assert.ok(buyerInv, 'Buyer must have tomatoes in inventory');
  assert.equal(buyerInv.quantity, 10, 'Buyer must have received 10 tomatoes');

  // 6. Verify seller received net coins (Gross: 250, Fee 8%: 20, Net: 230)
  // Seller started with 150 coins - 2.5 listing fee + 230 net payout = 377.5 coins
  const sellerWallet = db.prepare('SELECT coins FROM wallets WHERE user_id = ?').get(seller.user.id);
  assert.equal(sellerWallet.coins, 377.5, 'Seller balance must reflect trade net payout minus listing fee');

  // 7. Verify market trades table has trade record
  const trade = db.prepare("SELECT * FROM market_trades WHERE item_id = 'tomato' ORDER BY created_at DESC LIMIT 1").get();
  assert.ok(trade);
  assert.equal(trade.quantity, 10);
  assert.equal(trade.unit_price, 25);
  assert.equal(trade.fee_amount, 20);
});
