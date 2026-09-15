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

  // Advance in-game clock
  advanceClock(minutes = 10) {
    if (!this.state.time) {
      this.state.time = { day: 1, season: "Primavera", year: 1, hour: 6, minute: 0 };
    }
    this.state.time.minute += minutes;
    while (this.state.time.minute >= 60) {
      this.state.time.minute -= 60;
      this.state.time.hour += 1;
    }
    while (this.state.time.hour >= 24) {
      this.state.time.hour -= 24;
      this.state.time.day += 1;
      if (this.state.time.day > 28) {
        this.state.time.day = 1;
        const seasons = ["Primavera", "Verão", "Outono", "Inverno"];
        const curIdx = seasons.indexOf(this.state.time.season);
        const nextIdx = (curIdx + 1) % seasons.length;
        this.state.time.season = seasons[nextIdx];
        if (nextIdx === 0) this.state.time.year += 1;
      }
    }
    this.save();
    return this.state.time;
  }

  // Sleep in the farmhouse: passes to next day 06:00, restores energy, advances watered crops
  sleep() {
    if (!this.state.time) {
      this.state.time = { day: 1, season: "Primavera", year: 1, hour: 6, minute: 0 };
    }

    // Advance to next day
    this.state.time.day += 1;
    if (this.state.time.day > 28) {
      this.state.time.day = 1;
      const seasons = ["Primavera", "Verão", "Outono", "Inverno"];
      const curIdx = seasons.indexOf(this.state.time.season);
      const nextIdx = (curIdx + 1) % seasons.length;
      this.state.time.season = seasons[nextIdx];
      if (nextIdx === 0) this.state.time.year += 1;
    }

    this.state.time.hour = 6;
    this.state.time.minute = 0;

    // Full restore of energy
    this.state.player.energy = this.state.player.maxEnergy;

    // Grow crops that were watered yesterday
    for (const key in this.state.farm.tiles) {
      const tile = this.state.farm.tiles[key];
      if (tile.crop) {
        const cropDef = cropsConfig[tile.crop.id];
        const maxStage = cropDef ? cropDef.stages - 1 : 5;

        if (tile.isWatered) {
          // Advance 1 to 2 stages on overnight rest
          tile.crop.stage = Math.min(maxStage, tile.crop.stage + 2);
          if (tile.crop.stage >= maxStage) {
            tile.crop.ready = true;
          }
          tile.crop.currentStageStartedAt = Date.now();
        }
      }
      // Soil dries in the morning
      tile.isWatered = false;
    }

    // Chicken egg production
    if (!this.state.farm.eggs) {
      this.state.farm.eggs = [];
    }
    if (this.state.farm.eggs.length < 4) {
      const roll = Math.random();
      const quality = roll < 0.15 ? 'gold' : roll < 0.40 ? 'silver' : 'normal';
      const eggX = 19 + Math.floor(Math.random() * 3);
      const eggY = 3 + Math.floor(Math.random() * 2);
      this.state.farm.eggs.push({
        id: `egg_${Date.now()}_${Math.floor(Math.random() * 100)}`,
        x: eggX,
        y: eggY,
        quality
      });
    }

    // Small chance for a new tree to sprout overnight if farm has fewer than 6 trees
    if (this.state.farm.trees && this.state.farm.trees.length < 6 && Math.random() < 0.4) {
      const candidates = [
        { id: `tree_${Date.now()}`, x: 2, y: 13, health: 3, maxHealth: 3, isStump: false },
        { id: `tree_${Date.now()}`, x: 19, y: 13, health: 3, maxHealth: 3, isStump: false },
        { id: `tree_${Date.now()}`, x: 1, y: 8, health: 3, maxHealth: 3, isStump: false }
      ];
      const newTree = candidates.find(c => !this.state.farm.trees.some(t => t.x === c.x && t.y === c.y));
      if (newTree) {
        this.state.farm.trees.push(newTree);
      }
    }

    this.save();
    return {
      success: true,
      message: `Amanheceu o Dia ${this.state.time.day} da ${this.state.time.season}!`,
      time: this.state.time,
      player: this.state.player,
      state: this.getState()
    };
  }

  // Collect fresh egg from chicken pasture
  collectEgg(eggId, tileX, tileY) {
    if (!this.state.farm.eggs || this.state.farm.eggs.length === 0) {
      throw new Error("Nenhum ovo encontrado para coletar.");
    }

    let eggIndex = -1;
    if (eggId) {
      eggIndex = this.state.farm.eggs.findIndex(e => e.id === eggId);
    }
    if (eggIndex === -1 && typeof tileX === 'number' && typeof tileY === 'number') {
      eggIndex = this.state.farm.eggs.findIndex(e => Math.abs(e.x - tileX) <= 1 && Math.abs(e.y - tileY) <= 1);
    }

    if (eggIndex === -1) {
      throw new Error("Ovo não encontrado nesta posição.");
    }

    const egg = this.state.farm.eggs[eggIndex];
    this.state.farm.eggs.splice(eggIndex, 1);

    // Add to player inventory
    this.addItemToInventory('produce_egg', 1, egg.quality || 'normal');

    // Give animal farming XP
    this.addPlayerXP(8);
    this.state.stats.eggsCollected = (this.state.stats.eggsCollected || 0) + 1;

    this.save();
    return {
      success: true,
      egg,
      message: `Coletou 1x Ovo Caipira (${egg.quality === 'gold' ? 'Ouro' : egg.quality === 'silver' ? 'Prata' : 'Normal'})!`,
      player: this.state.player,
      inventory: this.state.inventory,
      eggs: this.state.farm.eggs
    };
  }

  // Chop tree on the farm with axe
  chopTree(treeId, tileX, tileY) {
    if (this.state.player.energy < 2) {
      throw new Error("Você está exausto demais para cortar árvores! Descanse na casa da fazenda.");
    }

    const hasAxe = this.state.inventory.some(i => i.id === 'tool_axe');
    if (!hasAxe) {
      throw new Error("Você precisa de um machado para cortar árvores!");
    }

    if (!this.state.farm.trees) {
      this.state.farm.trees = [];
    }

    let treeIndex = -1;
    if (treeId) {
      treeIndex = this.state.farm.trees.findIndex(t => t.id === treeId);
    }
    if (treeIndex === -1 && typeof tileX === 'number' && typeof tileY === 'number') {
      treeIndex = this.state.farm.trees.findIndex(t => Math.abs(t.x - tileX) <= 1 && Math.abs(t.y - tileY) <= 1);
    }

    if (treeIndex === -1) {
      throw new Error("Árvore não encontrada nesta posição.");
    }

    const tree = this.state.farm.trees[treeIndex];
    if (tree.health === undefined) tree.health = 3;
    if (tree.maxHealth === undefined) tree.maxHealth = 3;

    // Deduct energy
    this.state.player.energy = Math.max(0, this.state.player.energy - 2);

    // Deal 1 hit of damage
    tree.health -= 1;

    let actionResult = 'hit';
    let woodGained = 0;
    let woodQuality = 'normal';
    let xpGained = 0;

    // Quality chance based on player level
    const levelBonus = (this.state.player.level - 1) * 0.05;
    const roll = Math.random();
    if (roll < (0.10 + levelBonus)) woodQuality = 'gold';
    else if (roll < (0.30 + levelBonus)) woodQuality = 'silver';

    if (tree.health <= 0) {
      if (!tree.isStump) {
        // Tree fell down! Transforms into stump
        tree.isStump = true;
        tree.health = 2;
        tree.maxHealth = 2;
        woodGained = 3 + Math.floor(Math.random() * 2); // 3-4 wood
        xpGained = 14;
        actionResult = 'felled';
      } else {
        // Stump cleared completely
        this.state.farm.trees.splice(treeIndex, 1);
        woodGained = 2;
        xpGained = 8;
        actionResult = 'cleared';
      }

      this.addItemToInventory('material_wood', woodGained, woodQuality);
      this.addPlayerXP(xpGained);
      this.state.stats.treesChopped = (this.state.stats.treesChopped || 0) + 1;
      this.state.stats.woodGathered = (this.state.stats.woodGathered || 0) + woodGained;
    }

    this.save();
    return {
      success: true,
      actionResult,
      tree: actionResult === 'cleared' ? null : tree,
      wood: woodGained > 0 ? { quantity: woodGained, quality: woodQuality, name: 'Madeira Rústica' } : null,
      xpGained,
      player: this.state.player,
      inventory: this.state.inventory,
      trees: this.state.farm.trees
    };
  }

  // Milk dairy cow
  milkCow(cowId, tileX, tileY) {
    if (this.state.player.energy < 2) {
      throw new Error("Você está exausto demais para ordenhar! Descanse na casa da fazenda.");
    }

    const hasPail = this.state.inventory.some(i => i.id === 'tool_pail');
    if (!hasPail) {
      throw new Error("Você precisa de um Balde de Ordenha para tirar leite da vaca!");
    }

    if (!this.state.farm.animals) {
      this.state.farm.animals = [];
    }

    let cow = null;
    if (cowId) {
      cow = this.state.farm.animals.find(a => a.id === cowId);
    }
    if (!cow && typeof tileX === 'number' && typeof tileY === 'number') {
      cow = this.state.farm.animals.find(a => (a.type === 'female_cow' || a.type === 'male_cow') && Math.abs(a.x - tileX) <= 1.5 && Math.abs(a.y - tileY) <= 1.5);
    }

    if (!cow) {
      throw new Error("Nenhum animal bovino encontrado nesta posição.");
    }

    if (cow.type === 'male_cow') {
      throw new Error(`${cow.name || 'O animal'} é um touro! Apenas vacas leiteiras produzem leite.`);
    }

    const currentDay = this.state.time?.day || 1;
    if (cow.lastMilkedDay === currentDay) {
      throw new Error(`${cow.name || 'A vaca'} já foi ordenhada hoje! Aguarde até amanhã cedo.`);
    }

    // Deduct energy
    this.state.player.energy = Math.max(0, this.state.player.energy - 2);

    // Mark as milked today
    cow.lastMilkedDay = currentDay;
    cow.affection = (cow.affection || 10) + 5;

    // Quality chance based on level and affection
    const affectionBonus = ((cow.affection || 10) / 100) * 0.2;
    const levelBonus = (this.state.player.level - 1) * 0.05;
    const roll = Math.random();
    let quality = 'normal';
    if (roll < (0.10 + affectionBonus + levelBonus)) quality = 'gold';
    else if (roll < (0.35 + affectionBonus + levelBonus)) quality = 'silver';

    // Add milk to inventory
    this.addItemToInventory('produce_milk', 1, quality);

    // Give XP
    const xpGained = 16;
    this.addPlayerXP(xpGained);

    this.state.stats.milkProduced = (this.state.stats.milkProduced || 0) + 1;
    this.save();

    return {
      success: true,
      milk: {
        id: 'produce_milk',
        name: 'Leite Fresco Caipira',
        quantity: 1,
        quality,
        xpGained
      },
      cow,
      player: this.state.player,
      inventory: this.state.inventory
    };
  }

  // Pet animal (hen, chick, cow, bull)
  petAnimal(animalId) {
    if (!this.state.farm.animals) return { success: false };
    const animal = this.state.farm.animals.find(a => a.id === animalId);
    if (!animal) return { success: false };

    const currentDay = this.state.time?.day || 1;
    let gainedAffection = false;
    if (animal.lastPettedDay !== currentDay) {
      animal.lastPettedDay = currentDay;
      animal.affection = (animal.affection || 10) + 2;
      gainedAffection = true;
      this.save();
    }

    return {
      success: true,
      animal,
      gainedAffection
    };
  }

  // Transition player between farm outdoors and farmhouse interior
  transitionLocation(location, x, y) {
    if (location !== 'farm' && location !== 'house_interior') {
      throw new Error("Destino de localização inválido.");
    }

    this.state.player.location = location;
    if (x !== undefined && y !== undefined) {
      this.state.player.position = { x, y };
    } else {
      if (location === 'house_interior') {
        this.state.player.position = { x: 5.5, y: 7 };
      } else {
        this.state.player.position = { x: 17.5, y: 6 };
      }
    }

    this.save();
    return {
      success: true,
      location,
      player: this.state.player
    };
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
    this.advanceClock(Math.max(5, Math.floor(seconds / 10)));
    this.updateGrowth();
    this.save();
    return this.getState();
  }
}

module.exports = new FarmEngine();
