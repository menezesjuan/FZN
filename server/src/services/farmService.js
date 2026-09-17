const crypto = require('crypto');
const { db } = require('../db/database');
const { economyConfig, getToolEfficiency } = require('../config/economyConfig');
const durabilityService = require('./durabilityService');

class FarmService {
  getFarmState(userId) {
    const farm = db.prepare('SELECT * FROM farms WHERE user_id = ?').get(userId);
    if (!farm) {
      throw new Error('Fazenda não encontrada para este usuário.');
    }

    // Run tick updates on farm tiles and animals
    this.updateGrowth(farm.id);

    let tiles = db.prepare('SELECT * FROM farm_tiles WHERE farm_id = ? ORDER BY tile_y, tile_x').all(farm.id);
    if (tiles.length < 32) {
      const existingCoords = new Set(tiles.map(t => `${t.tile_x},${t.tile_y}`));
      const insertTile = db.prepare(`
        INSERT INTO farm_tiles (id, farm_id, tile_x, tile_y, type, state, watered, growth_stage, crop_id, planted_at, harvest_ready_at)
        VALUES (?, ?, ?, ?, 'soil', ?, ?, ?, ?, ?, ?)
      `);
      const now = Date.now();
      for (let dy = 0; dy < 4; dy++) {
        for (let dx = 0; dx < 8; dx++) {
          const tx = 2 + dx;
          const ty = 12 + dy;
          if (!existingCoords.has(`${tx},${ty}`)) {
            let state = 'EMPTY';
            let cropId = null;
            let stage = 0;
            let plantedAt = null;
            let readyAt = null;
            if (dx === 0 && dy === 0) {
              state = 'READY'; cropId = 'berry'; stage = 5; plantedAt = now - 60000; readyAt = now - 1000;
            } else if (dx === 1 && dy === 0) {
              state = 'READY'; cropId = 'tomato'; stage = 7; plantedAt = now - 60000; readyAt = now - 1000;
            } else if (dx === 2 && dy === 0) {
              state = 'READY'; cropId = 'wheat'; stage = 6; plantedAt = now - 60000; readyAt = now - 1000;
            } else if (dx === 3 && dy === 0) {
              state = 'READY'; cropId = 'carrot'; stage = 5; plantedAt = now - 60000; readyAt = now - 1000;
            }
            insertTile.run('tile_' + crypto.randomUUID(), farm.id, tx, ty, state, 1, stage, cropId, plantedAt, readyAt);
          }
        }
      }
      tiles = db.prepare('SELECT * FROM farm_tiles WHERE farm_id = ? ORDER BY tile_y, tile_x').all(farm.id);
    }

    const farmTilesMap = {};
    for (let y = 0; y < 18; y++) {
      for (let x = 0; x < 24; x++) {
        farmTilesMap[`${x},${y}`] = {
          x,
          y,
          state: 'grass',
          isWatered: false,
          crop: null
        };
      }
    }
    tiles.forEach(t => {
      farmTilesMap[`${t.tile_x},${t.tile_y}`] = {
        id: t.id,
        x: t.tile_x,
        y: t.tile_y,
        state: 'tilled',
        isWatered: t.watered === 1,
        crop: t.crop_id ? {
          id: t.crop_id,
          stage: t.growth_stage,
          ready: t.state === 'READY'
        } : null
      };
    });

    const enrichedFarm = {
      ...farm,
      width: 24,
      height: 18,
      tiles: farmTilesMap
    };

    const inventory = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND quantity > 0').all(userId);
    const tools = db.prepare('SELECT * FROM tools WHERE user_id = ?').all(userId);
    const animals = db.prepare('SELECT * FROM animals WHERE farm_id = ?').all(farm.id);
    const machines = db.prepare('SELECT * FROM machines WHERE farm_id = ?').all(farm.id);
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

    // Format tools with current efficiency
    const formattedTools = tools.map(t => {
      const eff = getToolEfficiency(t.durability, t.max_durability);
      return {
        ...t,
        efficiencyMultiplier: eff.multiplier,
        efficiencyStatus: eff.status
      };
    });

    return {
      farm: enrichedFarm,
      wallet,
      tiles,
      inventory,
      tools: formattedTools,
      animals,
      machines
    };
  }

  plantCrop(userId, tileId, seedId) {
    const farm = db.prepare('SELECT id FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const tile = db.prepare('SELECT * FROM farm_tiles WHERE id = ? AND farm_id = ?').get(tileId, farm.id);
    if (!tile) throw new Error('Canteiro não encontrado nesta fazenda.');

    if (tile.state !== 'EMPTY') {
      throw new Error(`Este canteiro já está ocupado (estado: ${tile.state}).`);
    }

    // Find crop by seedId
    const crop = Object.values(economyConfig.crops).find(c => c.seedId === seedId || c.id === seedId);
    if (!crop) {
      throw new Error(`Semente desconhecida: "${seedId}".`);
    }

    const tx = db.transaction(() => {
      // Check and consume seed from inventory
      const inv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, crop.seedId);
      if (!inv || (inv.quantity - inv.reserved) < 1) {
        throw new Error(`Você não possui ${crop.seedName} suficiente no inventário.`);
      }

      db.prepare('UPDATE inventories SET quantity = quantity - 1 WHERE id = ?').run(inv.id);

      const now = Date.now();
      const harvestTime = now + (crop.growthTimeSec * 1000);

      db.prepare(`
        UPDATE farm_tiles
        SET state = 'GROWING',
            crop_id = ?,
            planted_at = ?,
            growth_stage = 0,
            harvest_ready_at = ?
        WHERE id = ?
      `).run(crop.id, now, harvestTime, tileId);
    });

    tx();
    return this.getFarmState(userId);
  }

  waterPlot(userId, tileId) {
    const farm = db.prepare('SELECT id FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const tile = db.prepare('SELECT * FROM farm_tiles WHERE id = ? AND farm_id = ?').get(tileId, farm.id);
    if (!tile) throw new Error('Canteiro não encontrado.');

    // Wear down watering can
    const toolResult = durabilityService.consumeDurability(userId, 'watering_can', 1);

    db.prepare('UPDATE farm_tiles SET watered = 1 WHERE id = ?').run(tileId);

    return {
      message: 'Canteiro irrigado com sucesso!',
      tool: toolResult,
      tileId
    };
  }

  updateGrowth(farmId) {
    const tiles = db.prepare(`
      SELECT * FROM farm_tiles
      WHERE farm_id = ? AND state = 'GROWING'
    `).all(farmId);

    const now = Date.now();
    const updateTile = db.prepare(`
      UPDATE farm_tiles
      SET state = ?, growth_stage = ?
      WHERE id = ?
    `);

    tiles.forEach(tile => {
      const crop = economyConfig.crops[tile.crop_id];
      if (!crop) return;

      const totalDuration = crop.growthTimeSec * 1000;
      const elapsed = now - tile.planted_at;

      if (elapsed >= totalDuration) {
        updateTile.run('READY', crop.totalStages - 1, tile.id);
      } else {
        const progress = elapsed / totalDuration;
        const stage = Math.min(crop.totalStages - 1, Math.floor(progress * crop.totalStages));
        updateTile.run('GROWING', stage, tile.id);
      }
    });
  }

  harvestCrop(userId, tileId) {
    const farm = db.prepare('SELECT * FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const tile = db.prepare('SELECT * FROM farm_tiles WHERE id = ? AND farm_id = ?').get(tileId, farm.id);
    if (!tile) throw new Error('Canteiro não encontrado.');

    if (tile.state !== 'READY') {
      throw new Error('A plantação ainda não está pronta para colheita.');
    }

    const crop = economyConfig.crops[tile.crop_id];
    if (!crop) throw new Error('Cultura não encontrada.');

    const tx = db.transaction(() => {
      // Add harvested product to inventory
      const existingInv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, crop.id);
      if (existingInv) {
        db.prepare('UPDATE inventories SET quantity = quantity + ? WHERE id = ?').run(crop.yield, existingInv.id);
      } else {
        db.prepare(`
          INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
          VALUES (?, ?, ?, ?, 0, 'normal')
        `).run('inv_' + crypto.randomUUID(), userId, crop.id, crop.yield);
      }

      // Add farm XP (15 XP per harvest)
      const newXp = farm.xp + 15;
      const xpNeeded = farm.level * 100;
      let newLevel = farm.level;
      if (newXp >= xpNeeded) {
        newLevel += 1;
      }
      db.prepare('UPDATE farms SET xp = ?, level = ? WHERE id = ?').run(newXp, newLevel, farm.id);

      // Reset tile to EMPTY
      db.prepare(`
        UPDATE farm_tiles
        SET state = 'EMPTY',
            crop_id = NULL,
            planted_at = NULL,
            growth_stage = 0,
            harvest_ready_at = NULL,
            watered = 0
        WHERE id = ?
      `).run(tileId);
    });

    tx();
    return {
      message: `Colhido ${crop.yield}x ${crop.name}!`,
      harvestedItem: crop.id,
      yield: crop.yield,
      farmState: this.getFarmState(userId)
    };
  }
}

module.exports = new FarmService();
