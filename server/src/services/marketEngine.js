const crypto = require('crypto');
const { db } = require('../db/database');
const { economyConfig } = require('../config/economyConfig');
const ledgerService = require('./ledgerService');

class MarketEngine {
  /**
   * Places an order on the order book (BUY or SELL)
   */
  createOrder(userId, type, itemId, unitPrice, quantity) {
    if (!['BUY', 'SELL'].includes(type)) throw new Error('Tipo de ordem inválido. Deve ser BUY ou SELL.');
    if (!itemId) throw new Error('Item é obrigatório.');
    if (unitPrice <= 0) throw new Error('Preço unitário deve ser maior que zero.');
    if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Quantidade deve ser um número inteiro positivo.');

    const totalOrderValue = Math.round(unitPrice * quantity * 100) / 100;
    const listingFee = Math.max(1, Math.round(totalOrderValue * economyConfig.market.listingFeeRatio * 100) / 100);

    const tx = db.transaction(() => {
      // 1. Validate and reserve resources
      if (type === 'BUY') {
        const requiredCoins = totalOrderValue + listingFee;
        const wallet = db.prepare('SELECT coins FROM wallets WHERE user_id = ?').get(userId);
        if (!wallet || wallet.coins < requiredCoins) {
          throw new Error(`Saldo insuficiente: requer ${requiredCoins} moedas (incluindo taxa de listagem de ${listingFee} moedas).`);
        }
        // Deduct listing fee (money sink)
        ledgerService.recordTransaction(userId, 'MARKET_LISTING_FEE', -listingFee, `Taxa de listagem para ordem de compra de ${quantity}x ${itemId}`);
        // Reserve order value by deducting from wallet into order escrow
        ledgerService.recordTransaction(userId, 'MARKET_BUY_ESCROW', -totalOrderValue, `Reserva de saldo para ordem de compra de ${quantity}x ${itemId}`);
      } else {
        // SELL order
        const wallet = db.prepare('SELECT coins FROM wallets WHERE user_id = ?').get(userId);
        if (!wallet || wallet.coins < listingFee) {
          throw new Error(`Saldo insuficiente para pagar a taxa de listagem de ${listingFee} moedas.`);
        }
        // Deduct listing fee
        ledgerService.recordTransaction(userId, 'MARKET_LISTING_FEE', -listingFee, `Taxa de listagem para ordem de venda de ${quantity}x ${itemId}`);

        // Reserve inventory
        const inv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, itemId);
        if (!inv || (inv.quantity - inv.reserved) < quantity) {
          throw new Error(`Estoque insuficiente no inventário: disponível ${inv ? inv.quantity - inv.reserved : 0}, requerido: ${quantity}.`);
        }
        db.prepare('UPDATE inventories SET reserved = reserved + ? WHERE id = ?').run(quantity, inv.id);
      }

      // 2. Insert order into book
      const orderId = 'ord_' + crypto.randomUUID();
      const now = Date.now();
      db.prepare(`
        INSERT INTO market_orders (id, user_id, type, item_id, unit_price, quantity_total, quantity_remaining, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
      `).run(orderId, userId, type, itemId, unitPrice, quantity, quantity, now);

      // 3. Trigger immediate matching engine
      this._matchOrders(itemId);

      return orderId;
    });

    const orderId = tx();
    return db.prepare('SELECT * FROM market_orders WHERE id = ?').get(orderId);
  }

  /**
   * Core server-side matching engine for an item
   */
  _matchOrders(itemId) {
    while (true) {
      // Find highest buy order and lowest sell order
      const buy = db.prepare(`
        SELECT * FROM market_orders
        WHERE item_id = ? AND type = 'BUY' AND status = 'OPEN' AND quantity_remaining > 0
        ORDER BY unit_price DESC, created_at ASC
        LIMIT 1
      `).get(itemId);

      const sell = db.prepare(`
        SELECT * FROM market_orders
        WHERE item_id = ? AND type = 'SELL' AND status = 'OPEN' AND quantity_remaining > 0
        ORDER BY unit_price ASC, created_at ASC
        LIMIT 1
      `).get(itemId);

      if (!buy || !sell) break;
      if (buy.unit_price < sell.unit_price) break; // No price overlap
      if (buy.user_id === sell.user_id) break; // Prevent self-trading

      // Execute trade at the maker's price (the order created earlier)
      const executionPrice = buy.created_at < sell.created_at ? buy.unit_price : sell.unit_price;
      const tradeQty = Math.min(buy.quantity_remaining, sell.quantity_remaining);
      const grossTotal = Math.round(tradeQty * executionPrice * 100) / 100;
      const marketFee = Math.round(grossTotal * economyConfig.market.marketFeeRatio * 100) / 100;
      const sellerNet = Math.round((grossTotal - marketFee) * 100) / 100;

      const tradeId = 'trd_' + crypto.randomUUID();
      const now = Date.now();

      // Execute atomic trade
      const tradeTx = db.transaction(() => {
        // Record trade
        db.prepare(`
          INSERT INTO market_trades (id, buy_order_id, sell_order_id, buyer_id, seller_id, item_id, quantity, unit_price, fee_amount, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(tradeId, buy.id, sell.id, buy.user_id, sell.user_id, itemId, tradeQty, executionPrice, marketFee, now);

        // Update seller: release reserved inventory and deduct
        db.prepare(`
          UPDATE inventories
          SET quantity = quantity - ?,
              reserved = reserved - ?
          WHERE user_id = ? AND item_id = ?
        `).run(tradeQty, tradeQty, sell.user_id, itemId);

        // Credit seller net coins (gross - fee)
        ledgerService.recordTransaction(sell.user_id, 'MARKET_SELL_PAYOUT', sellerNet, `Venda de ${tradeQty}x ${itemId} no mercado (Taxa: ${marketFee})`);

        // Record market fee destruction (money sink) in ledger
        db.prepare(`
          INSERT INTO ledger (transaction_id, user_id, type, asset, amount, balance_before, balance_after, reference, timestamp, status)
          VALUES (?, ?, 'MARKET_FEE_BURN', 'coins', ?, 0, 0, ?, ?, 'COMPLETED')
        `).run('fee_' + crypto.randomUUID(), sell.user_id, marketFee, `Taxa de mercado retida (8%) na negociação ${tradeId}`, now);

        // Deliver item to buyer inventory
        const buyerInv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(buy.user_id, itemId);
        if (buyerInv) {
          db.prepare('UPDATE inventories SET quantity = quantity + ? WHERE id = ?').run(tradeQty, buyerInv.id);
        } else {
          db.prepare(`
            INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
            VALUES (?, ?, ?, ?, 0, 'normal')
          `).run('inv_' + crypto.randomUUID(), buy.user_id, itemId, tradeQty);
        }

        // Refund buyer if execution price was lower than buy limit price
        const buyerPriceDiff = (buy.unit_price - executionPrice) * tradeQty;
        if (buyerPriceDiff > 0) {
          const refundAmount = Math.round(buyerPriceDiff * 100) / 100;
          ledgerService.recordTransaction(buy.user_id, 'MARKET_BUY_REFUND', refundAmount, `Reembolso por compra a preço mais vantajoso (${executionPrice} < ${buy.unit_price})`);
        }

        // Update orders
        const newBuyRem = buy.quantity_remaining - tradeQty;
        const newSellRem = sell.quantity_remaining - tradeQty;

        db.prepare(`
          UPDATE market_orders
          SET quantity_remaining = ?,
              status = CASE WHEN ? = 0 THEN 'FILLED' ELSE 'OPEN' END
          WHERE id = ?
        `).run(newBuyRem, newBuyRem, buy.id);

        db.prepare(`
          UPDATE market_orders
          SET quantity_remaining = ?,
              status = CASE WHEN ? = 0 THEN 'FILLED' ELSE 'OPEN' END
          WHERE id = ?
        `).run(newSellRem, newSellRem, sell.id);
      });

      tradeTx();
    }
  }

  cancelOrder(userId, orderId) {
    const order = db.prepare('SELECT * FROM market_orders WHERE id = ? AND user_id = ?').get(orderId, userId);
    if (!order) throw new Error('Ordem não encontrada.');
    if (order.status !== 'OPEN') throw new Error('Esta ordem não pode ser cancelada.');

    const tx = db.transaction(() => {
      if (order.type === 'BUY') {
        // Refund remaining escrow coins
        const refundCoins = Math.round(order.unit_price * order.quantity_remaining * 100) / 100;
        ledgerService.recordTransaction(userId, 'MARKET_ORDER_CANCELLED', refundCoins, `Cancelamento de ordem de compra ${orderId}`);
      } else {
        // Unreserve inventory
        db.prepare(`
          UPDATE inventories
          SET reserved = reserved - ?
          WHERE user_id = ? AND item_id = ?
        `).run(order.quantity_remaining, userId, order.item_id);
      }

      db.prepare("UPDATE market_orders SET status = 'CANCELLED' WHERE id = ?").run(orderId);
    });

    tx();
    return { message: 'Ordem cancelada com sucesso.' };
  }

  getOrderBook(itemId) {
    const buyOrders = db.prepare(`
      SELECT unit_price, SUM(quantity_remaining) as total_quantity, COUNT(*) as order_count
      FROM market_orders
      WHERE item_id = ? AND type = 'BUY' AND status = 'OPEN' AND quantity_remaining > 0
      GROUP BY unit_price
      ORDER BY unit_price DESC
      LIMIT 10
    `).all(itemId);

    const sellOrders = db.prepare(`
      SELECT unit_price, SUM(quantity_remaining) as total_quantity, COUNT(*) as order_count
      FROM market_orders
      WHERE item_id = ? AND type = 'SELL' AND status = 'OPEN' AND quantity_remaining > 0
      GROUP BY unit_price
      ORDER BY unit_price ASC
      LIMIT 10
    `).all(itemId);

    // Trade history stats
    const stats = this.getItemPriceStats(itemId);

    return {
      itemId,
      buyOrders,
      sellOrders,
      stats
    };
  }

  getItemPriceStats(itemId) {
    const now = Date.now();
    const oneHourAgo = now - 3600 * 1000;
    const oneDayAgo = now - 24 * 3600 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;

    const latest = db.prepare('SELECT unit_price FROM market_trades WHERE item_id = ? ORDER BY created_at DESC LIMIT 1').get(itemId);
    const avg1h = db.prepare('SELECT AVG(unit_price) as avg_price, SUM(quantity) as volume FROM market_trades WHERE item_id = ? AND created_at >= ?').get(itemId, oneHourAgo);
    const avg24h = db.prepare('SELECT AVG(unit_price) as avg_price, SUM(quantity) as volume FROM market_trades WHERE item_id = ? AND created_at >= ?').get(itemId, oneDayAgo);
    const avg7d = db.prepare('SELECT AVG(unit_price) as avg_price, SUM(quantity) as volume FROM market_trades WHERE item_id = ? AND created_at >= ?').get(itemId, sevenDaysAgo);

    return {
      lastPrice: latest ? latest.unit_price : null,
      avg1h: avg1h && avg1h.avg_price ? Math.round(avg1h.avg_price * 100) / 100 : null,
      avg24h: avg24h && avg24h.avg_price ? Math.round(avg24h.avg_price * 100) / 100 : null,
      avg7d: avg7d && avg7d.avg_price ? Math.round(avg7d.avg_price * 100) / 100 : null,
      volume24h: (avg24h && avg24h.volume) || 0
    };
  }

  getUserOrders(userId) {
    return db.prepare('SELECT * FROM market_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 25').all(userId);
  }
}

module.exports = new MarketEngine();
