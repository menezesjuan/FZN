const { db } = require('../db/database');
const { economyConfig, getToolEfficiency } = require('../config/economyConfig');
const ledgerService = require('./ledgerService');

class DurabilityService {
  consumeDurability(userId, toolId, amount = 1) {
    const tool = db.prepare('SELECT * FROM tools WHERE user_id = ? AND tool_id = ?').get(userId, toolId);
    if (!tool) {
      throw new Error(`Ferramenta "${toolId}" não encontrada.`);
    }

    if (tool.durability <= 0) {
      throw new Error(`Ferramenta "${toolId}" está quebrada! Repare-a na ferraria antes de usar.`);
    }

    const newDurability = Math.max(0, tool.durability - amount);
    const eff = getToolEfficiency(newDurability, tool.max_durability);

    db.prepare(`
      UPDATE tools
      SET durability = ?, condition = ?
      WHERE id = ?
    `).run(newDurability, eff.status, tool.id);

    return {
      toolId,
      durability: newDurability,
      maxDurability: tool.max_durability,
      efficiencyMultiplier: eff.multiplier,
      efficiencyStatus: eff.status
    };
  }

  repairTool(userId, toolId) {
    const tool = db.prepare('SELECT * FROM tools WHERE user_id = ? AND tool_id = ?').get(userId, toolId);
    if (!tool) {
      throw new Error(`Ferramenta "${toolId}" não encontrada.`);
    }

    if (tool.durability >= tool.max_durability) {
      throw new Error('Esta ferramenta já está com 100% de durabilidade.');
    }

    const toolDef = economyConfig.tools[toolId];
    if (!toolDef) throw new Error('Definição da ferramenta não encontrada no catálogo.');

    const pointsToRepair = tool.max_durability - tool.durability;
    const repairCost = Math.ceil(pointsToRepair * toolDef.repairCostRatio);

    // Atomic transaction: deduct coins through ledger and restore durability
    const tx = db.transaction(() => {
      ledgerService.recordTransaction(userId, 'REPAIR_FEE', -repairCost, `Conserto de ${toolDef.name}`);
      db.prepare(`
        UPDATE tools
        SET durability = max_durability, condition = 'Good'
        WHERE id = ?
      `).run(tool.id);
    });

    tx();

    return {
      message: `${toolDef.name} reparado com sucesso!`,
      cost: repairCost,
      toolId,
      durability: tool.max_durability,
      maxDurability: tool.max_durability
    };
  }

  repairAllTools(userId) {
    const tools = db.prepare('SELECT * FROM tools WHERE user_id = ?').all(userId);
    let totalCost = 0;
    const toRepair = [];

    tools.forEach(tool => {
      if (tool.durability < tool.max_durability) {
        const toolDef = economyConfig.tools[tool.tool_id];
        if (toolDef) {
          const cost = Math.ceil((tool.max_durability - tool.durability) * toolDef.repairCostRatio);
          totalCost += cost;
          toRepair.push({ tool, toolDef, cost });
        }
      }
    });

    if (toRepair.length === 0) {
      return { message: 'Todas as ferramentas já estão em perfeitas condições.', totalCost: 0 };
    }

    const tx = db.transaction(() => {
      ledgerService.recordTransaction(userId, 'REPAIR_FEE', -totalCost, `Conserto geral de ${toRepair.length} ferramentas`);
      db.prepare(`
        UPDATE tools
        SET durability = max_durability, condition = 'Good'
        WHERE user_id = ?
      `).run(userId);
    });

    tx();

    return {
      message: `${toRepair.length} ferramentas reparadas com sucesso!`,
      totalCost
    };
  }
}

module.exports = new DurabilityService();
