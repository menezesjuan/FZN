const cropsConfig = require('../config/crops.json');
const itemsConfig = require('../config/items.json');
const processorsConfig = require('../config/processors.json');
const storage = require('./storage');

class FarmEngine {
  constructor() {
    this.state = storage.loadState();
    this.processOfflineProgress();
    this.updateGrowth();
    this.updateIdleProduction();
  }

  getState() {
    this.updateGrowth();
    this.updateIdleProduction();
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

    // Season validation — Inverno blocks all crops; otherwise check crop's seasons array
    const currentSeason = this.state.time?.season || 'Primavera';
    if (currentSeason === 'Inverno') {
      throw new Error('É Inverno! Nenhuma cultura pode ser plantada durante o inverno. Aproveite para processar artesanais e vender no mercado.');
    }
    if (cropDef.seasons && !cropDef.seasons.includes(currentSeason)) {
      throw new Error(`${cropDef.name} só cresce na ${cropDef.seasons.join(' ou ')}! Agora é ${currentSeason}.`);
    }

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
    const prevSeason = this.state.time.season;
    let seasonChanged = false;
    if (this.state.time.day > 28) {
      this.state.time.day = 1;
      const seasons = ["Primavera", "Verão", "Outono", "Inverno"];
      const curIdx = seasons.indexOf(this.state.time.season);
      const nextIdx = (curIdx + 1) % seasons.length;
      this.state.time.season = seasons[nextIdx];
      seasonChanged = true;
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

    // Weather transition
    if (!this.state.tomorrowWeather) {
      this.state.tomorrowWeather = this.rollNextWeather();
    }
    this.state.weather = this.state.tomorrowWeather;
    this.state.tomorrowWeather = this.rollNextWeather();

    // Rainy/Stormy day auto-watering: Nature waters all tilled tiles in the morning!
    const isRainingToday = this.state.weather === 'rainy' || this.state.weather === 'stormy';
    if (isRainingToday) {
      for (const key in this.state.farm.tiles) {
        const tile = this.state.farm.tiles[key];
        if (tile.state === 'tilled') {
          tile.isWatered = true;
        }
      }
    }

    this.save();

    const weatherSuffix = this.state.weather === 'stormy'
      ? ' ⛈️ Uma tempestade está caindo no vale! O solo foi regado pela chuva!'
      : (this.state.weather === 'rainy'
        ? ' 🌧️ Um dia chuvoso começou! A chuva regou todas as suas lavouras!'
        : ' ☀️ O sol está radiante!');

    return {
      success: true,
      message: `Amanheceu o Dia ${this.state.time.day} da ${this.state.time.season}!${weatherSuffix}`,
      time: this.state.time,
      player: this.state.player,
      weather: this.state.weather,
      tomorrowWeather: this.state.tomorrowWeather,
      seasonChanged,
      newSeason: this.state.time.season,
      prevSeason,
      state: this.getState()
    };
  }

  rollNextWeather() {
    const roll = Math.random();
    if (roll < 0.68) return 'sunny';
    if (roll < 0.90) return 'rainy';
    return 'stormy';
  }

  getSeasonalCrops() {
    const currentSeason = this.state.time?.season || 'Primavera';
    const allCrops = Object.values(cropsConfig);
    const seasonal = allCrops.filter(crop => {
      if (currentSeason === 'Inverno') return false;
      if (!crop.seasons) return true; // no restriction = always available
      return crop.seasons.includes(currentSeason);
    });
    return {
      success: true,
      season: currentSeason,
      crops: seasonal
    };
  }

  getWeatherForecast() {
    const weather = this.state.weather || 'sunny';
    const tomorrow = this.state.tomorrowWeather || 'sunny';

    const descriptions = {
      sunny: 'Céu limpo com sol radiante brilhando sobre o vale.',
      rainy: 'Chuva mansa e fértil fertilizando toda a plantação.',
      stormy: 'Tempestade de primavera com ventos fortes, relâmpagos e trovões!'
    };

    const tomorrowDescriptions = {
      sunny: 'Amanhã teremos um lindo dia ensolarado, perfeito para cuidar da fazenda!',
      rainy: 'Amanhã o dia será chuvoso! A natureza regará todas as suas plantações.',
      stormy: 'Alerta meteorológico! Uma tempestade cairá sobre o vale amanhã com raios e chuva forte.'
    };

    return {
      success: true,
      today: {
        weather,
        description: descriptions[weather] || descriptions.sunny
      },
      tomorrow: {
        weather: tomorrow,
        description: tomorrowDescriptions[tomorrow] || tomorrowDescriptions.sunny
      }
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

  // Deposit item from player inventory into farm storage chest
  depositToChest(inventorySlot, quantity = 1, targetChestSlot = null) {
    if (!this.state.farm.chest) {
      this.state.farm.chest = [];
    }

    const invItem = this.state.inventory.find(i => i.slot === inventorySlot);
    if (!invItem) {
      throw new Error("Item não encontrado no inventário.");
    }

    const depositQty = Math.max(1, Math.min(Number(quantity) || 1, invItem.quantity));
    const itemQuality = invItem.quality || 'normal';

    // If targetChestSlot is specified, try to place or stack there
    let placed = false;
    if (targetChestSlot !== null && targetChestSlot !== undefined && targetChestSlot >= 0 && targetChestSlot < 16) {
      const existingInSlot = this.state.farm.chest.find(c => c.slot === targetChestSlot);
      if (existingInSlot) {
        if (existingInSlot.id === invItem.id && (existingInSlot.quality || 'normal') === itemQuality) {
          existingInSlot.quantity += depositQty;
          placed = true;
        }
      } else {
        this.state.farm.chest.push({
          id: invItem.id,
          quantity: depositQty,
          quality: itemQuality,
          slot: targetChestSlot
        });
        placed = true;
      }
    }

    // If not placed in targetChestSlot, stack with existing or find lowest free slot (0..15)
    if (!placed) {
      const matchingStack = this.state.farm.chest.find(c => c.id === invItem.id && (c.quality || 'normal') === itemQuality);
      if (matchingStack) {
        matchingStack.quantity += depositQty;
        placed = true;
      } else {
        const usedSlots = new Set(this.state.farm.chest.map(c => c.slot));
        let freeSlot = 0;
        while (usedSlots.has(freeSlot) && freeSlot < 16) {
          freeSlot++;
        }
        if (freeSlot >= 16) {
          throw new Error("O baú está cheio! Capacidade máxima de 16 itens atingida.");
        }
        this.state.farm.chest.push({
          id: invItem.id,
          quantity: depositQty,
          quality: itemQuality,
          slot: freeSlot
        });
        placed = true;
      }
    }

    // Deduct from inventory
    if (invItem.quantity - depositQty <= 0) {
      const idx = this.state.inventory.indexOf(invItem);
      if (idx !== -1) {
        this.state.inventory.splice(idx, 1);
      }
    } else {
      invItem.quantity -= depositQty;
    }

    this.save();
    return {
      success: true,
      deposited: { id: invItem.id, quantity: depositQty, quality: itemQuality },
      chest: this.state.farm.chest,
      inventory: this.state.inventory
    };
  }

  // Withdraw item from chest into player inventory
  withdrawFromChest(chestSlot, quantity = 1, targetInventorySlot = null) {
    if (!this.state.farm.chest) {
      this.state.farm.chest = [];
    }

    const chestItem = this.state.farm.chest.find(c => c.slot === chestSlot);
    if (!chestItem) {
      throw new Error("Item não encontrado no baú.");
    }

    const withdrawQty = Math.max(1, Math.min(Number(quantity) || 1, chestItem.quantity));
    const itemQuality = chestItem.quality || 'normal';

    // Verify inventory capacity
    const matchingInvStack = this.state.inventory.find(i => i.id === chestItem.id && (i.quality || 'normal') === itemQuality);
    const usedInvSlots = new Set(this.state.inventory.map(i => i.slot));
    if (!matchingInvStack && usedInvSlots.size >= 24) {
      throw new Error("Mochila cheia! Libere espaço no inventário antes de retirar.");
    }

    // Place into inventory
    let placedInInv = false;
    if (targetInventorySlot !== null && targetInventorySlot !== undefined && targetInventorySlot >= 0 && targetInventorySlot < 24) {
      const existingInInvSlot = this.state.inventory.find(i => i.slot === targetInventorySlot);
      if (existingInInvSlot) {
        if (existingInInvSlot.id === chestItem.id && (existingInInvSlot.quality || 'normal') === itemQuality) {
          existingInInvSlot.quantity += withdrawQty;
          placedInInv = true;
        }
      } else {
        this.state.inventory.push({
          id: chestItem.id,
          quantity: withdrawQty,
          quality: itemQuality,
          slot: targetInventorySlot
        });
        placedInInv = true;
      }
    }

    if (!placedInInv) {
      this.addItemToInventory(chestItem.id, withdrawQty, itemQuality);
    }

    // Deduct from chest
    if (chestItem.quantity - withdrawQty <= 0) {
      const idx = this.state.farm.chest.indexOf(chestItem);
      if (idx !== -1) {
        this.state.farm.chest.splice(idx, 1);
      }
    } else {
      chestItem.quantity -= withdrawQty;
    }

    this.save();
    return {
      success: true,
      withdrawn: { id: chestItem.id, quantity: withdrawQty, quality: itemQuality },
      chest: this.state.farm.chest,
      inventory: this.state.inventory
    };
  }

  // Quick stack all matching items from player inventory into farm chest
  quickStackChest() {
    if (!this.state.farm.chest) {
      this.state.farm.chest = [];
    }

    let stackedTotal = 0;
    const itemsToTransfer = [];

    for (const invItem of this.state.inventory) {
      // Don't auto-deposit tools
      if (invItem.id.startsWith('tool_')) continue;

      const matchingChest = this.state.farm.chest.find(c => c.id === invItem.id && (c.quality || 'normal') === (invItem.quality || 'normal'));
      if (matchingChest) {
        itemsToTransfer.push({
          invItem,
          matchingChest,
          quantity: invItem.quantity
        });
      }
    }

    for (const t of itemsToTransfer) {
      t.matchingChest.quantity += t.quantity;
      stackedTotal += t.quantity;
      const idx = this.state.inventory.indexOf(t.invItem);
      if (idx !== -1) {
        this.state.inventory.splice(idx, 1);
      }
    }

    if (stackedTotal > 0) {
      this.save();
    }

    return {
      success: true,
      stackedCount: stackedTotal,
      chest: this.state.farm.chest,
      inventory: this.state.inventory
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

  updateIdleProduction() {
    const now = Date.now();
    let changed = false;

    if (this.state.idlePlots) {
      for (const plot of this.state.idlePlots) {
        if (plot.status === 'RUNNING' && plot.completedAt && now >= plot.completedAt) {
          plot.status = 'COMPLETED';
          changed = true;
        }
      }
    }

    if (this.state.facilities) {
      for (const [facKey, fac] of Object.entries(this.state.facilities)) {
        const elapsedMs = now - (fac.lastCollectedAt || now);
        const cycles = Math.floor(elapsedMs / (fac.cycleDurationMs || 120000));
        const newYield = Math.min(fac.maxYield || 12, cycles * (fac.outputPerCycle || 1));
        if (fac.currentYield !== newYield) {
          fac.currentYield = newYield;
          changed = true;
        }
      }
    }

    if (this.state.processors) {
      for (const [procKey, proc] of Object.entries(this.state.processors)) {
        if (proc.status === 'PROCESSING' && proc.completedAt && now >= proc.completedAt) {
          proc.status = 'COMPLETED';
          changed = true;
        }
      }
    }

    this.state.lastActive = now;
    if (changed) {
      this.save();
    }
  }

  processOfflineProgress(forceTimeAway = null) {
    const now = Date.now();
    const lastActive = this.state.lastActive || now;
    const timeAway = forceTimeAway !== null ? forceTimeAway : (now - lastActive);

    // If away for at least 15 seconds
    if (timeAway >= 15000) {
      const completedPlots = [];
      if (this.state.idlePlots) {
        for (const plot of this.state.idlePlots) {
          if (plot.status === 'RUNNING') {
            if (plot.completedAt && now >= plot.completedAt) {
              plot.status = 'COMPLETED';
              const cropDef = cropsConfig[plot.cropId];
              completedPlots.push({
                plotId: plot.id,
                plotName: plot.name,
                cropId: plot.cropId,
                cropName: cropDef ? cropDef.name : plot.cropId,
                quantity: plot.quantity,
                quality: plot.quality
              });
            }
          }
        }
      }

      const facilityYields = [];
      if (this.state.facilities) {
        for (const [facKey, fac] of Object.entries(this.state.facilities)) {
          const elapsedMs = now - (fac.lastCollectedAt || (now - timeAway));
          const cycles = Math.floor(elapsedMs / (fac.cycleDurationMs || 120000));
          fac.currentYield = Math.min(fac.maxYield || 12, cycles * (fac.outputPerCycle || 1));
          if (fac.currentYield > 0) {
            facilityYields.push({
              facilityId: fac.id,
              facilityName: fac.name,
              produceName: fac.produceName,
              quantity: fac.currentYield
            });
          }
        }
      }

      const processorYields = [];
      if (this.state.processors) {
        for (const [procKey, proc] of Object.entries(this.state.processors)) {
          if (proc.status === 'PROCESSING') {
            if (proc.completedAt && now >= proc.completedAt) {
              proc.status = 'COMPLETED';
              const pDef = processorsConfig[procKey];
              processorYields.push({
                processorId: proc.id,
                processorName: pDef?.name || proc.id,
                outputItemId: proc.outputItem?.id || pDef?.output?.itemId,
                outputName: proc.outputItem?.name || pDef?.output?.name,
                quantity: proc.outputItem?.quantity || pDef?.output?.quantity || 1
              });
            }
          }
        }
      }

      if (completedPlots.length > 0 || facilityYields.length > 0 || processorYields.length > 0 || timeAway >= 60000) {
        this.state.offlineReport = {
          timeAwayMs: timeAway,
          timeAwaySeconds: Math.floor(timeAway / 1000),
          completedPlots,
          facilityYields,
          processorYields,
          timestamp: now
        };
      }
      this.state.lastActive = now;
      this.save();
    }
  }

  acknowledgeOfflineReport() {
    this.state.offlineReport = null;
    this.save();
    return { success: true };
  }

  startPlotProduction(plotId, cropId) {
    this.updateIdleProduction();
    if (!this.state.idlePlots) {
      throw new Error("Talhões não inicializados.");
    }
    const plot = this.state.idlePlots.find(p => p.id === Number(plotId));
    if (!plot) {
      throw new Error(`Talhão #${plotId} não encontrado.`);
    }
    if (plot.status === 'RUNNING') {
      throw new Error(`Talhão "${plot.name}" já está em cultivo ativo.`);
    }
    if (plot.status === 'COMPLETED') {
      throw new Error(`Talhão "${plot.name}" possui colheita pronta. Colete antes de replantar.`);
    }
    const cropDef = cropsConfig[cropId];
    if (!cropDef) {
      throw new Error(`Cultura "${cropId}" não reconhecida.`);
    }

    // Season validation — Inverno blocks all idle plots; otherwise check crop's seasons array
    const currentSeason = this.state.time?.season || 'Primavera';
    if (currentSeason === 'Inverno') {
      throw new Error('É Inverno! Os talhões de produção idle não operam durante o inverno. Aproveite para processar artesanais e vender no mercado.');
    }
    if (cropDef.seasons && !cropDef.seasons.includes(currentSeason)) {
      throw new Error(`${cropDef.name} só cresce na ${cropDef.seasons.join(' ou ')}! Agora é ${currentSeason}. Escolha um cultivo da estação atual.`);
    }

    const cost = cropDef.seedBatchCost || 20;
    if ((this.state.player.money || 0) < cost) {
      throw new Error(`Ouro insuficiente para iniciar lote de ${cropDef.name} (Custo: ${cost}G, Você tem: ${this.state.player.money || 0}G).`);
    }

    this.state.player.money -= cost;

    const now = Date.now();
    const durationMs = (cropDef.idleDurationSeconds || 60) * 1000;
    plot.status = 'RUNNING';
    plot.cropId = cropId;
    plot.cropName = cropDef.name;
    plot.startedAt = now;
    plot.durationMs = durationMs;
    plot.completedAt = now + durationMs;
    plot.quantity = cropDef.batchYield || 10;
    plot.quality = 'normal';

    this.save();
    return {
      success: true,
      plot,
      idlePlots: this.state.idlePlots,
      player: this.state.player
    };
  }

  collectPlot(plotId) {
    this.updateIdleProduction();
    if (!this.state.idlePlots) {
      throw new Error("Talhões não inicializados.");
    }
    const plot = this.state.idlePlots.find(p => p.id === Number(plotId));
    if (!plot) {
      throw new Error(`Talhão #${plotId} não encontrado.`);
    }

    const now = Date.now();
    if (plot.status !== 'COMPLETED') {
      if (plot.status === 'RUNNING' && plot.completedAt && now >= plot.completedAt) {
        plot.status = 'COMPLETED';
      } else {
        const remainingSec = plot.completedAt ? Math.max(0, Math.ceil((plot.completedAt - now) / 1000)) : 0;
        throw new Error(`O lote em "${plot.name}" ainda está em desenvolvimento (${remainingSec}s restantes).`);
      }
    }

    const cropDef = cropsConfig[plot.cropId];
    const produceId = cropDef ? cropDef.produceId : `crop_${plot.cropId}`;
    const qty = plot.quantity || 10;
    const quality = plot.quality || 'normal';

    this.addItemToInventory(produceId, qty, quality);
    const xpGained = (cropDef?.xp || 10) * Math.max(1, Math.floor(qty / 2));
    this.addPlayerXP(xpGained);
    this.state.stats.cropsHarvested = (this.state.stats.cropsHarvested || 0) + qty;

    const collectedInfo = {
      plotId: plot.id,
      plotName: plot.name,
      cropId: plot.cropId,
      cropName: cropDef ? cropDef.name : plot.cropId,
      produceId,
      quantity: qty,
      quality,
      xpGained
    };

    plot.status = 'AVAILABLE';
    plot.cropId = null;
    plot.cropName = null;
    plot.startedAt = null;
    plot.durationMs = null;
    plot.completedAt = null;
    plot.quantity = 0;

    this.save();
    return {
      success: true,
      collected: collectedInfo,
      plot,
      idlePlots: this.state.idlePlots,
      inventory: this.state.inventory,
      player: this.state.player
    };
  }

  collectAllPlots() {
    this.updateIdleProduction();
    if (!this.state.idlePlots) {
      throw new Error("Talhões não inicializados.");
    }
    const now = Date.now();
    const readyPlots = this.state.idlePlots.filter(p =>
      p.status === 'COMPLETED' || (p.status === 'RUNNING' && p.completedAt && now >= p.completedAt)
    );

    if (readyPlots.length === 0) {
      throw new Error("Nenhum talhão pronto para colheita no momento.");
    }

    const collectedList = [];
    let totalXP = 0;

    for (const plot of readyPlots) {
      const cropDef = cropsConfig[plot.cropId];
      const produceId = cropDef ? cropDef.produceId : `crop_${plot.cropId}`;
      const qty = plot.quantity || 10;
      const quality = plot.quality || 'normal';

      this.addItemToInventory(produceId, qty, quality);
      const xpGained = (cropDef?.xp || 10) * Math.max(1, Math.floor(qty / 2));
      totalXP += xpGained;
      this.state.stats.cropsHarvested = (this.state.stats.cropsHarvested || 0) + qty;

      collectedList.push({
        plotId: plot.id,
        plotName: plot.name,
        cropId: plot.cropId,
        cropName: cropDef ? cropDef.name : plot.cropId,
        produceId,
        quantity: qty,
        quality,
        xpGained
      });

      plot.status = 'AVAILABLE';
      plot.cropId = null;
      plot.cropName = null;
      plot.startedAt = null;
      plot.durationMs = null;
      plot.completedAt = null;
      plot.quantity = 0;
    }

    this.addPlayerXP(totalXP);
    this.save();
    return {
      success: true,
      collectedCount: collectedList.length,
      collectedList,
      totalXP,
      idlePlots: this.state.idlePlots,
      inventory: this.state.inventory,
      player: this.state.player
    };
  }

  collectFacility(facilityId) {
    this.updateIdleProduction();
    if (!this.state.facilities || !this.state.facilities[facilityId]) {
      throw new Error(`Instalação "${facilityId}" não encontrada.`);
    }
    const facility = this.state.facilities[facilityId];
    if (facility.currentYield <= 0) {
      throw new Error(`Nenhum produto pronto para coleta no ${facility.name}.`);
    }

    const qty = facility.currentYield;
    this.addItemToInventory(facility.produceId, qty, 'normal');

    if (facilityId === 'coop') {
      this.state.stats.eggsCollected = (this.state.stats.eggsCollected || 0) + qty;
    } else if (facilityId === 'barn') {
      this.state.stats.milkProduced = (this.state.stats.milkProduced || 0) + qty;
    }

    const xpGained = qty * 12;
    this.addPlayerXP(xpGained);

    facility.currentYield = 0;
    facility.lastCollectedAt = Date.now();

    this.save();
    return {
      success: true,
      facility,
      collected: {
        id: facility.produceId,
        name: facility.produceName,
        quantity: qty,
        xpGained
      },
      facilities: this.state.facilities,
      inventory: this.state.inventory,
      player: this.state.player
    };
  }

  startProcessor(processorId) {
    this.updateIdleProduction();
    if (!this.state.processors || !this.state.processors[processorId]) {
      throw new Error(`Processador "${processorId}" não encontrado.`);
    }
    const proc = this.state.processors[processorId];
    if (proc.status === 'PROCESSING') {
      throw new Error(`Esta máquina já está em processamento ativo.`);
    }
    if (proc.status === 'COMPLETED') {
      throw new Error(`Colete o produto pronto antes de iniciar uma nova receita.`);
    }
    const pDef = processorsConfig[processorId];
    if (!pDef) {
      throw new Error(`Receita para "${processorId}" não configurada.`);
    }
    const requiredItemId = pDef.input.itemId;
    const requiredQty = pDef.input.quantity || 1;

    // Find items in player inventory
    const matchingInvItem = this.state.inventory.find(i => i.id === requiredItemId && i.quantity >= requiredQty);
    if (!matchingInvItem) {
      throw new Error(`Insumo insuficiente: você precisa de ${requiredQty}x ${pDef.input.name}.`);
    }

    // Deduct input from inventory
    matchingInvItem.quantity -= requiredQty;
    if (matchingInvItem.quantity <= 0) {
      const idx = this.state.inventory.indexOf(matchingInvItem);
      if (idx !== -1) this.state.inventory.splice(idx, 1);
    }

    const now = Date.now();
    const durationMs = (pDef.durationSeconds || 60) * 1000;
    proc.status = 'PROCESSING';
    proc.startedAt = now;
    proc.durationMs = durationMs;
    proc.completedAt = now + durationMs;
    proc.inputItem = { id: requiredItemId, quantity: requiredQty, name: pDef.input.name };
    proc.outputItem = { id: pDef.output.itemId, quantity: pDef.output.quantity, name: pDef.output.name };

    this.save();
    return {
      success: true,
      processor: proc,
      processors: this.state.processors,
      inventory: this.state.inventory
    };
  }

  collectProcessor(processorId) {
    this.updateIdleProduction();
    if (!this.state.processors || !this.state.processors[processorId]) {
      throw new Error(`Processador "${processorId}" não encontrado.`);
    }
    const proc = this.state.processors[processorId];
    const now = Date.now();

    if (proc.status !== 'COMPLETED') {
      if (proc.status === 'PROCESSING' && proc.completedAt && now >= proc.completedAt) {
        proc.status = 'COMPLETED';
      } else {
        const rem = proc.completedAt ? Math.max(0, Math.ceil((proc.completedAt - now) / 1000)) : 0;
        throw new Error(`O processamento ainda está em andamento (${rem}s restantes).`);
      }
    }

    const pDef = processorsConfig[processorId];
    const outputId = proc.outputItem?.id || pDef.output.itemId;
    const outputQty = proc.outputItem?.quantity || pDef.output.quantity || 1;
    const outputName = proc.outputItem?.name || pDef.output.name;
    const xp = pDef.output.xp || 25;

    this.addItemToInventory(outputId, outputQty, 'normal');
    this.addPlayerXP(xp);

    const collected = {
      processorId,
      outputId,
      name: outputName,
      quantity: outputQty,
      xpGained: xp
    };

    proc.status = 'IDLE';
    proc.startedAt = null;
    proc.durationMs = (pDef.durationSeconds || 60) * 1000;
    proc.completedAt = null;
    proc.inputItem = null;
    proc.outputItem = null;

    this.save();
    return {
      success: true,
      collected,
      processor: proc,
      processors: this.state.processors,
      inventory: this.state.inventory,
      player: this.state.player
    };
  }

  upgradeWarehouse() {
    if (!this.state.warehouse) {
      this.state.warehouse = {
        level: 1,
        capacity: 40,
        maxLevel: 3,
        upgrades: {
          2: { cost: 400, woodCost: 25, capacity: 80, name: "Armazém Ampliado" },
          3: { cost: 1000, woodCost: 60, capacity: 160, name: "Complexo Logístico Rural" }
        }
      };
    }

    const nextLevel = this.state.warehouse.level + 1;
    if (nextLevel > this.state.warehouse.maxLevel) {
      throw new Error("O armazém já atingiu o nível máximo de expansão.");
    }

    const upg = this.state.warehouse.upgrades[nextLevel];
    if (!upg) {
      throw new Error(`Melhoria de nível ${nextLevel} não encontrada.`);
    }

    if ((this.state.player.money || 0) < upg.cost) {
      throw new Error(`Ouro insuficiente para expandir o armazém (Necessário: ${upg.cost}G, Possui: ${this.state.player.money}G).`);
    }

    const woodItem = this.state.inventory.find(i => i.id === 'material_wood');
    const currentWood = woodItem ? woodItem.quantity : 0;
    if (currentWood < upg.woodCost) {
      throw new Error(`Madeira insuficiente (Necessário: ${upg.woodCost} toras, Possui: ${currentWood}).`);
    }

    // Deduct resources
    this.state.player.money -= upg.cost;
    woodItem.quantity -= upg.woodCost;
    if (woodItem.quantity <= 0) {
      const idx = this.state.inventory.indexOf(woodItem);
      if (idx !== -1) this.state.inventory.splice(idx, 1);
    }

    this.state.warehouse.level = nextLevel;
    this.state.warehouse.capacity = upg.capacity;
    this.addPlayerXP(120);

    this.save();
    return {
      success: true,
      warehouse: this.state.warehouse,
      player: this.state.player,
      inventory: this.state.inventory
    };
  }
}

module.exports = new FarmEngine();
