const crypto = require('crypto');
const { db } = require('../db/database');
const { economyConfig } = require('../config/economyConfig');
const ledgerService = require('./ledgerService');
const durabilityService = require('./durabilityService');

class AnimalService {
  buyAnimal(userId, animalType, customName) {
    const farm = db.prepare('SELECT id FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const animalDef = economyConfig.animals[animalType];
    if (!animalDef) {
      throw new Error(`Tipo de animal "${animalType}" inválido.`);
    }

    const name = customName ? customName.trim() : `${animalDef.name} #${Math.floor(Math.random() * 900 + 100)}`;
    const now = Date.now();

    const tx = db.transaction(() => {
      // Deduct purchase price via ledger
      ledgerService.recordTransaction(userId, 'ANIMAL_PURCHASE', -animalDef.price, `Compra de animal: ${name}`);

      const animalId = 'anim_' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO animals (id, farm_id, animal_type, name, birth_date, age_days, lifespan_days, production_cycles, max_production_cycles, health, fed_today, last_collected_at, status)
        VALUES (?, ?, ?, ?, ?, 0, ?, 0, ?, 100, 1, 0, 'ACTIVE')
      `).run(animalId, farm.id, animalType, name, now, animalDef.lifespanDays, animalDef.maxProductionCycles);

      return animalId;
    });

    const animalId = tx();
    return db.prepare('SELECT * FROM animals WHERE id = ?').get(animalId);
  }

  feedAnimal(userId, animalId) {
    const farm = db.prepare('SELECT id FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const animal = db.prepare('SELECT * FROM animals WHERE id = ? AND farm_id = ?').get(animalId, farm.id);
    if (!animal) throw new Error('Animal não encontrado.');

    if (animal.status === 'END_OF_LIFE') {
      throw new Error('Este animal chegou ao fim do seu ciclo de vida produtivo.');
    }

    if (animal.fed_today === 1) {
      return { message: `${animal.name} já foi alimentado hoje!`, animal };
    }

    const animalDef = economyConfig.animals[animal.animal_type];
    const tx = db.transaction(() => {
      // Check if user has wheat in inventory, otherwise charge feed coins
      const wheatInv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, 'wheat');
      if (wheatInv && (wheatInv.quantity - wheatInv.reserved) >= 1) {
        db.prepare('UPDATE inventories SET quantity = quantity - 1 WHERE id = ?').run(wheatInv.id);
      } else {
        // Deduct feed cost in coins via ledger
        ledgerService.recordTransaction(userId, 'ANIMAL_FEED', -animalDef.feedCost, `Ração para ${animal.name}`);
      }

      db.prepare(`
        UPDATE animals
        SET fed_today = 1, health = MIN(100, health + 10)
        WHERE id = ?
      `).run(animalId);
    });

    tx();
    return {
      message: `${animal.name} foi alimentado com sucesso!`,
      animal: db.prepare('SELECT * FROM animals WHERE id = ?').get(animalId)
    };
  }

  collectProduce(userId, animalId) {
    const farm = db.prepare('SELECT id FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const animal = db.prepare('SELECT * FROM animals WHERE id = ? AND farm_id = ?').get(animalId, farm.id);
    if (!animal) throw new Error('Animal não encontrado.');

    if (animal.status === 'END_OF_LIFE') {
      throw new Error(`${animal.name} encerrou seu ciclo produtivo e está aposentado.`);
    }

    const animalDef = economyConfig.animals[animal.animal_type];
    const now = Date.now();
    const minCooldown = (animalDef.cycleDurationSec || 20) * 1000;

    if (now - (animal.last_collected_at || 0) < minCooldown) {
      const waitSec = Math.ceil((minCooldown - (now - animal.last_collected_at)) / 1000);
      throw new Error(`${animal.name} ainda está descansando. Aguarde ${waitSec} segundos.`);
    }

    const tx = db.transaction(() => {
      // 1. Consume tool durability
      durabilityService.consumeDurability(userId, animalDef.requiredTool, 1);

      // 2. Increment production cycles
      const nextCycles = animal.production_cycles + 1;
      let nextStatus = animal.status;

      if (nextCycles >= animal.max_production_cycles) {
        nextStatus = 'END_OF_LIFE';
      }

      db.prepare(`
        UPDATE animals
        SET production_cycles = ?,
            status = ?,
            last_collected_at = ?
        WHERE id = ?
      `).run(nextCycles, nextStatus, now, animalId);

      // 3. Add product to inventory
      const existingInv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, animalDef.productId);
      if (existingInv) {
        db.prepare('UPDATE inventories SET quantity = quantity + 1 WHERE id = ?').run(existingInv.id);
      } else {
        db.prepare(`
          INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
          VALUES (?, ?, ?, 1, 0, 'normal')
        `).run('inv_' + crypto.randomUUID(), userId, animalDef.productId);
      }
    });

    tx();

    const updatedAnimal = db.prepare('SELECT * FROM animals WHERE id = ?').get(animalId);
    return {
      message: `Coleta realizada: 1x ${animalDef.productName}!`,
      product: animalDef.productId,
      animal: updatedAnimal,
      isEndOfLife: updatedAnimal.status === 'END_OF_LIFE'
    };
  }
}

module.exports = new AnimalService();
