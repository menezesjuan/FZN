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
      position: { x: 10, y: 8 }
    },
    farm: {
      width: farmWidth,
      height: farmHeight,
      tiles,
      animals: [
        { id: "chicken_1", type: "adult_chicken", name: "Gertrudes", x: 20, y: 3 },
        { id: "chick_1", type: "baby_chicken", name: "Piu-Piu", x: 19, y: 4 },
        { id: "chick_2", type: "baby_chicken", name: "Amarelinho", x: 21, y: 4 }
      ],
      eggs: [
        { id: "egg_init_1", x: 20, y: 4, quality: "normal" }
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
      { id: "tool_axe", quantity: 1, quality: "normal", slot: 4 }
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
      woodGathered: 0
    },
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
          state.farm.animals = [
            { id: "chicken_1", type: "adult_chicken", name: "Gertrudes", x: 20, y: 3 },
            { id: "chick_1", type: "baby_chicken", name: "Piu-Piu", x: 19, y: 4 },
            { id: "chick_2", type: "baby_chicken", name: "Amarelinho", x: 21, y: 4 }
          ];
        }
        if (!state.farm.eggs) {
          state.farm.eggs = [
            { id: "egg_init_1", x: 20, y: 4, quality: "normal" }
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
        if (!state.stats) {
          state.stats = {};
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
      fs.writeFileSync(TEMP_FILE, content, 'utf8');
      fs.renameSync(TEMP_FILE, SAVE_FILE);
      return true;
    } catch (err) {
      console.error('[Storage] Error saving state:', err.message);
      return false;
    }
  }
}

module.exports = new StorageService();
