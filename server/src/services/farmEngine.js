const cropsConfig = require('../config/crops.json');
const itemsConfig = require('../config/items.json');
const storage = require('./storage');

class FarmEngine {
  constructor() {
    this.state = storage.loadState();
    // Update crops immediately on start
    this.updateGrowth();
  }

  getState() {
    this.updateGrowth();
    return this.state;
  }

  save() {
    storage.saveState(this.state);
  }

  updateGrowth() {
    const now = Date.now();
    let changed = false;

    for (const key in this.state.farm.tiles) {
      const tile = this.state.farm.tiles[key];
      if (!tile.crop) continue;

      const cropDef = cropsConfig[tile.crop.id];
      if (!cropDef) continue;

      const maxStage = cropDef.stages - 1;
      if (tile.crop.stage >= maxStage) {
        tile.crop.ready = true;
        continue;
      }

      // Crop grows if watered (or grows at half speed if unwatered, but let's require water for fast growth)
      const stageDurationMs = (cropDef.secondsPerStage || 10) * 1000;
      
      // Calculate growth progress
      if (tile.isWatered) {
        const timeInStage = now - (tile.crop.currentStageStartedAt || tile.crop.plantedAt);
        if (timeInStage >= stageDurationMs) {
          const stagesToAdvance = Math.floor(timeInStage / stageDurationMs);
          tile.crop.stage = Math.min(maxStage, tile.crop.stage + stagesToAdvance);
          tile.crop.currentStageStartedAt = now;
          if (tile.crop.stage >= maxStage) {
            tile.crop.ready = true;
          }
          changed = true;
        }
      }
    }

    if (changed) {
      this.save();
    }
  }

  tillTile(x, y) {
    const key = `${x},${y}`;
    const tile = this.state.farm.tiles[key];
    if (!tile) {
      throw new Error("Lote de terra fora dos limites da fazenda.");
    }
    if (tile.state === 'tilled') {
      throw new Error("O solo já está arado.");
    }
    if (this.state.player.energy < 2) {
      throw new Error("Energia insuficiente para arar a terra.");
    }

    this.state.player.energy = Math.max(0, this.state.player.energy - 2);
    tile.state = 'tilled';
    tile.isWatered = false;
    this.state.stats.tilesTilled = (this.state.stats.tilesTilled || 0) + 1;

    this.save();
    return { success: true, tile, player: this.state.player };
  }

  waterTile(x, y) {
    const key = `${x},${y}`;
    const tile = this.state.farm.tiles[key];
    if (!tile) {
      throw new Error("Lote de terra fora dos limites da fazenda.");
    }
    if (tile.state !== 'tilled') {
      throw new Error("Você só pode regar terra que já foi arada.");
    }
    if (tile.isWatered) {
      throw new Error("A terra já está úmida e regada.");
    }
    if (this.state.player.energy < 1) {
      throw new Error("Energia insuficiente para regar.");
    }

    this.state.player.energy = Math.max(0, this.state.player.energy - 1);
    tile.isWatered = true;
    tile.wateredAt = Date.now();
    
    if (tile.crop && !tile.crop.currentStageStartedAt) {
      tile.crop.currentStageStartedAt = Date.now();
    }

    this.save();
    return { success: true, tile, player: this.state.player };
  }

  plantCrop(x, y, seedItemId) {
    const key = `${x},${y}`;
    const tile = this.state.farm.tiles[key];
    if (!tile) {
      throw new Error("Lote de terra fora dos limites.");
    }
    if (tile.state !== 'tilled') {
      throw new Error("O solo precisa ser arado antes de plantar.");
    }
    if (tile.crop) {
      throw new Error("Já existe uma cultura plantada neste lote.");
    }

    // Find seed in inventory
    const invIndex = this.state.inventory.findIndex(item => item.id === seedItemId && item.quantity > 0);
    if (invIndex === -1) {
      throw new Error("Você não possui essas sementes no inventário.");
    }

    const itemDef = itemsConfig.items[seedItemId];
    if (!itemDef || itemDef.category !== 'seed' || !cropsConfig[itemDef.cropId]) {
      throw new Error("Item selecionado não é uma semente válida.");
    }

    const cropDef = cropsConfig[itemDef.cropId];

    // Deduct seed from inventory
    this.state.inventory[invIndex].quantity -= 1;
    if (this.state.inventory[invIndex].quantity <= 0) {
      this.state.inventory.splice(invIndex, 1);
    }

    const now = Date.now();
    tile.crop = {
      id: cropDef.id,
      stage: 0,
      plantedAt: now,
      currentStageStartedAt: now,
      ready: false
    };

    this.save();
    return { 
      success: true, 
      tile, 
      inventory: this.state.inventory,
      message: `Plantou ${cropDef.name}!`
    };
  }

  harvestCrop(x, y) {
    this.updateGrowth();
    const key = `${x},${y}`;
    const tile = this.state.farm.tiles[key];
    if (!tile || !tile.crop) {
      throw new Error("Não há nada para colher aqui.");
    }

    const cropDef = cropsConfig[tile.crop.id];
    if (!cropDef) {
      throw new Error("Cultura inválida.");
    }

    const maxStage = cropDef.stages - 1;
    if (tile.crop.stage < maxStage && !tile.crop.ready) {
      throw new Error(`${cropDef.name} ainda está crescendo! Aguarde o amadurecimento.`);
    }

    // Determine quality: normal, silver, gold, iridium
    const roll = Math.random();
    let quality = 'normal';
    const chances = cropDef.qualityChances || { silver: 0.2, gold: 0.08, iridium: 0.01 };
    
    // Bonus chance based on player level
    const levelBonus = (this.state.player.level - 1) * 0.02;
    if (roll < (chances.iridium + levelBonus * 0.2)) {
      quality = 'iridium';
    } else if (roll < (chances.gold + levelBonus * 0.5)) {
      quality = 'gold';
    } else if (roll < (chances.silver + levelBonus)) {
      quality = 'silver';
    }

    // Yield quantity (e.g. potatoes can yield extra)
    let yieldCount = 1;
    if (cropDef.extraYieldChance && Math.random() < cropDef.extraYieldChance) {
      yieldCount += 1;
    }

    // Add to inventory
    this.addItemToInventory(cropDef.produceId, yieldCount, quality);

    // Give XP
    const xpGained = (cropDef.xp || 10) * yieldCount;
    this.addPlayerXP(xpGained);

    this.state.stats.cropsHarvested = (this.state.stats.cropsHarvested || 0) + yieldCount;

    // Reset tile
    const harvestedCropName = cropDef.name;
    tile.crop = null;
    tile.isWatered = false; // Soil dries after harvest

    this.save();
    return {
      success: true,
      tile,
      harvested: {
        id: cropDef.produceId,
        name: harvestedCropName,
        quantity: yieldCount,
        quality,
        xpGained
      },
      player: this.state.player,
      inventory: this.state.inventory
    };
  }

  addItemToInventory(itemId, quantity, quality = 'normal') {
    // Check if matching item with same quality exists in inventory
    const existing = this.state.inventory.find(i => i.id === itemId && (i.quality || 'normal') === quality);
    if (existing) {
      existing.quantity += quantity;
    } else {
      // Find lowest free slot (0 to 23)
      const usedSlots = new Set(this.state.inventory.map(i => i.slot));
      let freeSlot = 0;
      while (usedSlots.has(freeSlot) && freeSlot < 24) {
        freeSlot++;
      }
      this.state.inventory.push({
        id: itemId,
        quantity,
        quality,
        slot: freeSlot
      });
    }
  }

  addPlayerXP(amount) {
    this.state.player.xp += amount;
    const nextLevelXP = this.state.player.level * 100;
    if (this.state.player.xp >= nextLevelXP) {
      this.state.player.level += 1;
      this.state.player.xp -= nextLevelXP;
      this.state.player.maxEnergy += 10;
      this.state.player.energy = this.state.player.maxEnergy; // Full energy restore on level up
    }
  }

  // Helper for fast dev/testing: advance crop time or reset
  advanceCropTime(seconds = 60) {
    const ms = seconds * 1000;
    for (const key in this.state.farm.tiles) {
      const tile = this.state.farm.tiles[key];
      if (tile.crop && tile.crop.currentStageStartedAt) {
        tile.crop.currentStageStartedAt -= ms;
      }
    }
    this.updateGrowth();
    this.save();
    return this.getState();
  }
}

module.exports = new FarmEngine();
