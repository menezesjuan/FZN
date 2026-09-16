const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../data');
const SAVE_FILE = path.join(DATA_DIR, 'savegame.json');
const TEMP_FILE = path.join(DATA_DIR, 'savegame.json.tmp');

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultGameState() {
  const farmWidth = 24;
  const farmHeight = 18;
  const tiles = {};

  // Default tiles: mostly grass (0), some trees or boundaries
  for (let y = 0; y < farmHeight; y++) {
    for (let x = 0; x < farmWidth; x++) {
      const key = `${x},${y}`;
      tiles[key] = {
        x,
        y,
        state: 'grass', // 'grass', 'tilled'
        isWatered: false,
        crop: null // { id, stage, plantedAt, lastWateredAt, ready }
      };
    }
  }

  return {
    player: {
      name: "Fazendeiro",
      money: 150, // Initial balance
      level: 1,
      xp: 0,
      energy: 100,
      maxEnergy: 100,
      position: { x: 10, y: 8 },
      location: 'farm'
    },
    farm: {
      width: farmWidth,
      height: farmHeight,
      tiles,
      animals: [
        { id: "chicken_1", type: "adult_chicken", name: "Gertrudes", x: 20, y: 3 },
        { id: "chicken_red_1", type: "red_chicken", name: "Penélope", x: 22, y: 3, affection: 15 },
        { id: "chick_1", type: "baby_chicken", name: "Piu-Piu", x: 19, y: 4 },
        { id: "chick_2", type: "baby_chicken", name: "Amarelinho", x: 21, y: 4 },
        { id: "cow_1", type: "female_cow", name: "Mimosa", x: 19, y: 9, lastMilkedDay: 0, affection: 15 },
        { id: "cow_2", type: "male_cow", name: "Ferdinando", x: 22, y: 10, affection: 15 }
      ],
      eggs: [
        { id: "egg_init_1", x: 20, y: 4, quality: "normal" }
      ],
      chest: [
        { id: "material_wood", quantity: 5, quality: "normal", slot: 0 },
        { id: "seeds_strawberry", quantity: 2, quality: "normal", slot: 1 }
      ],
      trees: [
        { id: "tree_1", x: 2, y: 2, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_2", x: 5, y: 1, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_3", x: 1, y: 8, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_4", x: 2, y: 13, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_5", x: 19, y: 13, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_6", x: 21, y: 7, health: 3, maxHealth: 3, isStump: false }
      ]
    },
    inventory: [
      { id: "tool_hoe", quantity: 1, quality: "normal", slot: 0 },
      { id: "tool_can", quantity: 1, quality: "normal", slot: 1 },
      { id: "seeds_strawberry", quantity: 4, quality: "normal", slot: 2 },
      { id: "seeds_potato", quantity: 4, quality: "normal", slot: 3 },
      { id: "tool_axe", quantity: 1, quality: "normal", slot: 4 },
      { id: "tool_pail", quantity: 1, quality: "normal", slot: 5 }
    ],
    time: {
      day: 1,
      season: "Primavera",
      year: 1,
      hour: 6,
      minute: 0
    },
    stats: {
      cropsHarvested: 0,
      totalMoneyEarned: 0,
      tilesTilled: 0,
      eggsCollected: 0,
      treesChopped: 0,
      woodGathered: 0,
      milkProduced: 0
    },
    weather: "sunny",
    tomorrowWeather: "sunny",
    lastSaved: Date.now()
  };
}

class StorageService {
  constructor() {
    ensureDirectoryExists();
  }

  loadState() {
    try {
      if (fs.existsSync(SAVE_FILE)) {
        const raw = fs.readFileSync(SAVE_FILE, 'utf8');
        const state = JSON.parse(raw);
        if (!state.farm.animals) {
          state.farm.animals = [];
        }
        if (!state.farm.animals.some(a => a.id === 'chicken_red_1')) {
          state.farm.animals.push(
            { id: "chicken_red_1", type: "red_chicken", name: "Penélope", x: 22, y: 3, affection: 15 }
          );
        }
        if (!state.farm.animals.some(a => a.id === 'cow_1')) {
          state.farm.animals.push(
            { id: "cow_1", type: "female_cow", name: "Mimosa", x: 19, y: 9, lastMilkedDay: 0, affection: 15 },
            { id: "cow_2", type: "male_cow", name: "Ferdinando", x: 22, y: 10, affection: 15 }
          );
        }
        if (!state.farm.eggs) {
          state.farm.eggs = [
            { id: "egg_init_1", x: 20, y: 4, quality: "normal" }
          ];
        }
        if (!state.farm.chest) {
          state.farm.chest = [
            { id: "material_wood", quantity: 5, quality: "normal", slot: 0 },
            { id: "seeds_strawberry", quantity: 2, quality: "normal", slot: 1 }
          ];
        }
        if (!state.farm.trees) {
          state.farm.trees = [
            { id: "tree_1", x: 2, y: 2, health: 3, maxHealth: 3, isStump: false },
            { id: "tree_2", x: 5, y: 1, health: 3, maxHealth: 3, isStump: false },
            { id: "tree_3", x: 1, y: 8, health: 3, maxHealth: 3, isStump: false },
            { id: "tree_4", x: 2, y: 13, health: 3, maxHealth: 3, isStump: false },
            { id: "tree_5", x: 19, y: 13, health: 3, maxHealth: 3, isStump: false },
            { id: "tree_6", x: 21, y: 7, health: 3, maxHealth: 3, isStump: false }
          ];
        }
        if (!state.inventory.find(i => i.id === 'tool_axe')) {
          const usedSlots = new Set(state.inventory.map(i => i.slot));
          let freeSlot = 0;
          while (usedSlots.has(freeSlot) && freeSlot < 24) freeSlot++;
          state.inventory.push({ id: 'tool_axe', quantity: 1, quality: 'normal', slot: freeSlot });
        }
        if (!state.inventory.find(i => i.id === 'tool_pail')) {
          const usedSlots = new Set(state.inventory.map(i => i.slot));
          let freeSlot = 0;
          while (usedSlots.has(freeSlot) && freeSlot < 24) freeSlot++;
          state.inventory.push({ id: 'tool_pail', quantity: 1, quality: 'normal', slot: freeSlot });
        }
        if (!state.player.location) {
          state.player.location = 'farm';
        }
        if (!state.stats) {
          state.stats = {};
        }
        if (!state.weather) {
          state.weather = 'sunny';
        }
        if (!state.tomorrowWeather) {
          state.tomorrowWeather = 'sunny';
        }
        return state;
      }
    } catch (err) {
      console.error('[Storage] Error reading save file, creating default state:', err.message);
    }
    const defaultState = getDefaultGameState();
    this.saveState(defaultState);
    return defaultState;
  }

  saveState(state) {
    try {
      ensureDirectoryExists();
      state.lastSaved = Date.now();
      const content = JSON.stringify(state, null, 2);
      try {
        fs.writeFileSync(TEMP_FILE, content, 'utf8');
        fs.renameSync(TEMP_FILE, SAVE_FILE);
      } catch (renameErr) {
        // Fallback for Windows/OneDrive locks
        fs.writeFileSync(SAVE_FILE, content, 'utf8');
        try { if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE); } catch (_) {}
      }
      return true;
    } catch (err) {
      console.error('[Storage] Error saving state:', err.message);
      return false;
    }
  }
}

module.exports = new StorageService();
