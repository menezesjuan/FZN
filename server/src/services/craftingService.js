const crypto = require('crypto');
const { db } = require('../db/database');
const { economyConfig } = require('../config/economyConfig');
const ledgerService = require('./ledgerService');

class CraftingService {
  buyMachine(userId, machineType) {
    const farm = db.prepare('SELECT id FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const machineDef = economyConfig.machines[machineType];
    if (!machineDef) throw new Error(`Máquina "${machineType}" não encontrada.`);

    const existing = db.prepare('SELECT id FROM machines WHERE farm_id = ? AND machine_type = ?').get(farm.id, machineType);
    if (existing) throw new Error(`Você já possui uma ${machineDef.name}.`);

    const tx = db.transaction(() => {
      ledgerService.recordTransaction(userId, 'MACHINE_PURCHASE', -machineDef.cost, `Compra de ${machineDef.name}`);

      const machineId = 'mach_' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO machines (id, farm_id, machine_type, durability, max_durability, current_job, job_finishes_at)
        VALUES (?, ?, ?, ?, ?, NULL, 0)
      `).run(machineId, farm.id, machineType, machineDef.maxDurability, machineDef.maxDurability);
    });

    tx();
    return db.prepare('SELECT * FROM machines WHERE farm_id = ?').all(farm.id);
  }

  startJob(userId, machineId, recipeId) {
    const farm = db.prepare('SELECT id FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const machine = db.prepare('SELECT * FROM machines WHERE id = ? AND farm_id = ?').get(machineId, farm.id);
    if (!machine) throw new Error('Máquina não encontrada.');

    if (machine.durability <= 0) {
      throw new Error('Máquina avariada (0% durabilidade). Necessita de manutenção!');
    }

    if (machine.job_finishes_at && machine.job_finishes_at > Date.now()) {
      throw new Error('Esta máquina já está processando um lote no momento.');
    }

    const machineDef = economyConfig.machines[machine.machine_type];
    const recipe = machineDef.recipes.find(r => r.id === recipeId);
    if (!recipe) throw new Error('Receita inválida para esta máquina.');

    const tx = db.transaction(() => {
      // Check and consume inputs from inventory
      Object.entries(recipe.inputs).forEach(([itemId, qty]) => {
        const inv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, itemId);
        if (!inv || (inv.quantity - inv.reserved) < qty) {
          throw new Error(`Ingrediente insuficiente: requer ${qty}x ${itemId}.`);
        }
        db.prepare('UPDATE inventories SET quantity = quantity - ? WHERE id = ?').run(qty, inv.id);
      });

      const now = Date.now();
      const finishTime = now + (recipe.durationSec * 1000);
      const newDurability = Math.max(0, machine.durability - (recipe.wear || 1));

      db.prepare(`
        UPDATE machines
        SET durability = ?,
            current_job = ?,
            job_finishes_at = ?
        WHERE id = ?
      `).run(newDurability, JSON.stringify(recipe), finishTime, machineId);
    });

    tx();
    return {
      message: `Produção de ${recipe.name} iniciada!`,
      machine: db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId)
    };
  }

  claimJob(userId, machineId) {
    const farm = db.prepare('SELECT id FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const machine = db.prepare('SELECT * FROM machines WHERE id = ? AND farm_id = ?').get(machineId, farm.id);
    if (!machine) throw new Error('Máquina não encontrada.');

    if (!machine.current_job || !machine.job_finishes_at) {
      throw new Error('Nenhum trabalho em andamento nesta máquina.');
    }

    const now = Date.now();
    if (now < machine.job_finishes_at) {
      const waitSec = Math.ceil((machine.job_finishes_at - now) / 1000);
      throw new Error(`Processamento ainda em andamento. Aguarde ${waitSec} segundos.`);
    }

    const recipe = JSON.parse(machine.current_job);

    const tx = db.transaction(() => {
      // Deliver outputs to inventory
      Object.entries(recipe.outputs).forEach(([itemId, qty]) => {
        const inv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, itemId);
        if (inv) {
          db.prepare('UPDATE inventories SET quantity = quantity + ? WHERE id = ?').run(qty, inv.id);
        } else {
          db.prepare(`
            INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
            VALUES (?, ?, ?, ?, 0, 'normal')
          `).run('inv_' + crypto.randomUUID(), userId, itemId, qty);
        }
      });

      db.prepare(`
        UPDATE machines
        SET current_job = NULL,
            job_finishes_at = 0
        WHERE id = ?
      `).run(machineId);
    });

    tx();
    return {
      message: `Processamento concluído com sucesso!`,
      outputs: recipe.outputs,
      machine: db.prepare('SELECT * FROM machines WHERE id = ?').get(machineId)
    };
  }

  upgradeStorage(userId) {
    const farm = db.prepare('SELECT * FROM farms WHERE user_id = ?').get(userId);
    if (!farm) throw new Error('Fazenda não encontrada.');

    const currentCapacity = farm.storage_capacity;
    const nextTier = economyConfig.storageUpgrades.find(t => t.capacity > currentCapacity);
    if (!nextTier) {
      throw new Error('Seu celeiro já está no nível máximo de capacidade!');
    }

    const tx = db.transaction(() => {
      ledgerService.recordTransaction(userId, 'STORAGE_UPGRADE', -nextTier.cost, `Expansão de Celeiro para ${nextTier.capacity} slots`);
      db.prepare('UPDATE farms SET storage_capacity = ? WHERE id = ?').run(nextTier.capacity, farm.id);
    });

    tx();
    return {
      message: `Celeiro expandido para ${nextTier.capacity} slots!`,
      capacity: nextTier.capacity
    };
  }
}

module.exports = new CraftingService();
