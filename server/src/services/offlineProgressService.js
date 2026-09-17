const { db } = require('../db/database');
const farmService = require('./farmService');

class OfflineProgressService {
  calculateOffline(userId) {
    const user = db.prepare('SELECT last_login FROM users WHERE id = ?').get(userId);
    const farm = db.prepare('SELECT * FROM farms WHERE user_id = ?').get(userId);
    if (!user || !farm) return null;

    const now = Date.now();
    const lastLogin = user.last_login || now;
    const elapsedMs = now - lastLogin;

    if (elapsedMs < 60 * 1000) {
      // Less than 1 minute offline, no report needed
      return null;
    }

    const maxMs = (farm.offline_limit_hours || 8) * 3600 * 1000;
    const effectiveMs = Math.min(elapsedMs, maxMs);
    const effectiveMinutes = Math.floor(effectiveMs / (60 * 1000));

    // Fast-forward farm tile growth
    farmService.updateGrowth(farm.id);

    // Count ready crops
    const readyCrops = db.prepare("SELECT COUNT(*) as count FROM farm_tiles WHERE farm_id = ? AND state = 'READY'").get(farm.id);

    return {
      elapsedMinutes: Math.floor(elapsedMs / (60 * 1000)),
      effectiveMinutes,
      capped: elapsedMs > maxMs,
      readyCropsCount: readyCrops ? readyCrops.count : 0
    };
  }
}

module.exports = new OfflineProgressService();
