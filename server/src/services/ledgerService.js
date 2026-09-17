const crypto = require('crypto');
const { db } = require('../db/database');

class LedgerService {
  /**
   * Records a financial transaction and updates the user wallet atomically
   */
  recordTransaction(userId, type, amount, reference = '', asset = 'coins') {
    const tx = db.transaction(() => {
      let wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
      if (!wallet) {
        db.prepare('INSERT INTO wallets (user_id, coins) VALUES (?, 0.0)').run(userId);
        wallet = { coins: 0.0, premium_currency: 0.0, pending_rmt: 0.0, available_rmt: 0.0 };
      }

      const balanceBefore = wallet.coins;
      const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;

      if (balanceAfter < 0) {
        throw new Error(`Saldo insuficiente: operação requer ${Math.abs(amount)} moedas, disponível: ${balanceBefore}`);
      }

      // Update wallet
      db.prepare('UPDATE wallets SET coins = ? WHERE user_id = ?').run(balanceAfter, userId);

      // Record in immutable ledger
      const txId = 'tx_' + crypto.randomUUID();
      const now = Date.now();
      db.prepare(`
        INSERT INTO ledger (transaction_id, user_id, type, asset, amount, balance_before, balance_after, reference, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED')
      `).run(txId, userId, type, asset, amount, balanceBefore, balanceAfter, reference, now);

      return {
        transactionId: txId,
        balanceBefore,
        balanceAfter,
        amount,
        timestamp: now
      };
    });

    return tx();
  }

  getWallet(userId) {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      return { coins: 0, premium_currency: 0, pending_rmt: 0, available_rmt: 0 };
    }
    return wallet;
  }

  getLedgerHistory(userId, limit = 50) {
    return db.prepare('SELECT * FROM ledger WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?').all(userId, limit);
  }
}

module.exports = new LedgerService();
