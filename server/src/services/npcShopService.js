const crypto = require('crypto');
const { db } = require('../db/database');
const { economyConfig } = require('../config/economyConfig');
const ledgerService = require('./ledgerService');

class NpcShopService {
  getCatalog() {
    const seeds = Object.values(economyConfig.crops).map(c => ({
      id: c.seedId,
      name: c.seedName,
      price: c.seedPrice,
      type: 'seed',
      cropId: c.id,
      growthTimeSec: c.growthTimeSec,
      expectedSellPrice: c.sellPrice,
      yield: c.yield
    }));

    const animals = Object.values(economyConfig.animals).map(a => ({
      id: a.type,
      name: a.name,
      price: a.price,
      type: 'animal',
      feedCost: a.feedCost,
      product: a.productName,
      lifespanDays: a.lifespanDays,
      maxCycles: a.maxProductionCycles
    }));

    const machines = Object.values(economyConfig.machines).map(m => ({
      id: m.type,
      name: m.name,
      price: m.cost,
      type: 'machine'
    }));

    return { seeds, animals, machines };
  }

  buySeed(userId, seedId, quantity = 1) {
    if (quantity <= 0) throw new Error('Quantidade inválida.');

    const crop = Object.values(economyConfig.crops).find(c => c.seedId === seedId);
    if (!crop) throw new Error(`Semente "${seedId}" não encontrada no catálogo.`);

    const totalCost = crop.seedPrice * quantity;

    const tx = db.transaction(() => {
      ledgerService.recordTransaction(userId, 'NPC_PURCHASE', -totalCost, `Compra de ${quantity}x ${crop.seedName}`);

      const inv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, seedId);
      if (inv) {
        db.prepare('UPDATE inventories SET quantity = quantity + ? WHERE id = ?').run(quantity, inv.id);
      } else {
        db.prepare(`
          INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
          VALUES (?, ?, ?, ?, 0, 'normal')
        `).run('inv_' + crypto.randomUUID(), userId, seedId, quantity);
      }
    });

    tx();
    return {
      message: `Comprado ${quantity}x ${crop.seedName} por ${totalCost} moedas!`,
      cost: totalCost,
      seedId,
      quantity
    };
  }

  sellItem(userId, itemId, quantity = 1) {
    if (quantity <= 0) throw new Error('Quantidade inválida.');

    const inv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, itemId);
    if (!inv || (inv.quantity - inv.reserved) < quantity) {
      throw new Error(`Estoque insuficiente no inventário para venda: disponível ${inv ? inv.quantity - inv.reserved : 0}.`);
    }

    // Determine unit price: crop, animal produce, or processed good
    let unitPrice = 0;
    const crop = economyConfig.crops[itemId];
    if (crop) {
      unitPrice = crop.sellPrice;
    } else {
      const animal = Object.values(economyConfig.animals).find(a => a.productId === itemId);
      if (animal) {
        unitPrice = animal.productSellPrice;
      } else if (itemId === 'flour') {
        unitPrice = 20;
      } else if (itemId === 'cheese') {
        unitPrice = 60;
      } else if (itemId === 'bread') {
        unitPrice = 35;
      } else {
        unitPrice = 5;
      }
    }

    const totalRevenue = unitPrice * quantity;

    const tx = db.transaction(() => {
      db.prepare('UPDATE inventories SET quantity = quantity - ? WHERE id = ?').run(quantity, inv.id);
      ledgerService.recordTransaction(userId, 'NPC_SALE', totalRevenue, `Venda de ${quantity}x ${itemId} para NPC`);
    });

    tx();
    return {
      message: `Vendido ${quantity}x ${itemId} por ${totalRevenue} moedas!`,
      revenue: totalRevenue,
      itemId,
      quantity
    };
  }
}

module.exports = new NpcShopService();
