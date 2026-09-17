const { db } = require('../db/database');

const userActionTimestamps = new Map();
const idempotencyCache = new Map();

class AntifraudService {
  /**
   * Rate limiting and rapid bot click detector
   */
  checkActionRate(userId, maxPerSecond = 10) {
    const now = Date.now();
    const timestamps = userActionTimestamps.get(userId) || [];
    const oneSecondAgo = now - 1000;

    const recent = timestamps.filter(t => t > oneSecondAgo);
    recent.push(now);
    userActionTimestamps.set(userId, recent);

    if (recent.length > maxPerSecond) {
      this.flagSuspiciousActivity(userId, 'VELOCIDADE_IMPOSSIVEL', `Tentativa de ${recent.length} ações em 1 segundo`);
      throw new Error('Ações rápidas demais detectadas pelo sistema de segurança. Aguarde um instante.');
    }
  }

  /**
   * Price abnormality detector for market orders
   */
  validateOrderPrice(userId, itemId, unitPrice, basePrice) {
    if (basePrice && (unitPrice > basePrice * 10 || unitPrice < basePrice * 0.1)) {
      this.flagSuspiciousActivity(
        userId,
        'PRECO_ANORMAL_MERCADO',
        `Ordem de ${itemId} com preço ${unitPrice}G (Preço de referência: ${basePrice}G)`
      );
    }
  }

  /**
   * Flags suspicious activity into audit_logs
   */
  flagSuspiciousActivity(userId, flagType, details) {
    const now = Date.now();
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details, timestamp)
      VALUES (?, ?, ?, ?)
    `).run(userId, `FLAG_${flagType}`, details, now);
    console.warn(`[ANTIFRAUDE FLAG] User: ${userId} | Tipo: ${flagType} | Detalhes: ${details}`);
  }

  /**
   * Validates idempotency key to prevent double-spending or duplicate requests
   */
  checkIdempotency(idempotencyKey) {
    if (!idempotencyKey) return null;
    return idempotencyCache.get(idempotencyKey) || null;
  }

  saveIdempotency(idempotencyKey, response) {
    if (!idempotencyKey) return;
    idempotencyCache.set(idempotencyKey, response);
    // Keep cache memory bounded
    if (idempotencyCache.size > 2000) {
      const firstKey = idempotencyCache.keys().next().value;
      idempotencyCache.delete(firstKey);
    }
  }
}

module.exports = new AntifraudService();
