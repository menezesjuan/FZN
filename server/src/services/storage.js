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
  // Default tiles: lush grass, plus a generous 32-tile tilled & irrigated planting field
  for (let y = 0; y < farmHeight; y++) {
    for (let x = 0; x < farmWidth; x++) {
      const key = `${x},${y}`;
      // Expansive 8x4 central planting field ready for crops (32 fertile tiles)
      const isStarterField = (x >= 2 && x <= 9 && y >= 12 && y <= 15);
      tiles[key] = {
        x,
        y,
        state: isStarterField ? 'tilled' : 'grass',
        isWatered: isStarterField,
        crop: null
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
      position: { x: 5, y: 11 }, // Spawns directly adjacent to the expansive planting field
      location: 'farm',
      isIdleAuthorized: true
    },
    farmTiers: {
      unlockedTier: 1,
      licenses: ["license_tier_1"]
    },
    toolsOwned: ["tool_hoe", "tool_can", "tool_scythe"],
    farm: {
      width: farmWidth,
      height: farmHeight,
      tiles,
      animals: [
        { id: "chicken_1", type: "adult_chicken", name: "Gertrudes", x: 20, y: 3, harvestsRemaining: 20, maxHarvests: 20, isAlive: true },
        { id: "chicken_red_1", type: "red_chicken", name: "Penélope", x: 22, y: 3, affection: 15, harvestsRemaining: 20, maxHarvests: 20, isAlive: true },
        { id: "chick_1", type: "baby_chicken", name: "Piu-Piu", x: 19, y: 4, harvestsRemaining: 20, maxHarvests: 20, isAlive: true },
        { id: "chick_2", type: "baby_chicken", name: "Amarelinho", x: 21, y: 4, harvestsRemaining: 20, maxHarvests: 20, isAlive: true },
        { id: "cow_1", type: "female_cow", name: "Mimosa", x: 19, y: 9, lastMilkedDay: 0, affection: 15, harvestsRemaining: 30, maxHarvests: 30, isAlive: true },
        { id: "cow_2", type: "male_cow", name: "Ferdinando", x: 22, y: 10, affection: 15, harvestsRemaining: 30, maxHarvests: 30, isAlive: true }
      ],
      eggs: [
        { id: "egg_init_1", x: 20, y: 4, quality: "normal" }
      ],
      chest: [
        { id: "material_wood", quantity: 5, quality: "normal", slot: 0 },
        { id: "seeds_onion", quantity: 4, quality: "normal", slot: 1 }
      ],
      trees: [
        { id: "tree_1", x: 1, y: 1, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_2", x: 5, y: 1, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_3", x: 1, y: 6, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_4", x: 1, y: 17, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_5", x: 22, y: 14, health: 3, maxHealth: 3, isStump: false },
        { id: "tree_6", x: 22, y: 6, health: 3, maxHealth: 3, isStump: false }
      ]
    },
    inventory: [
      { id: "seeds_berry", quantity: 6, quality: "normal", slot: 0 },
      { id: "seeds_carrot", quantity: 6, quality: "normal", slot: 1 },
      { id: "seeds_wheat", quantity: 6, quality: "normal", slot: 2 },
      { id: "seeds_onion", quantity: 6, quality: "normal", slot: 3 }
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
    lastActive: Date.now(),
    offlineReport: null,
    idlePlots: [
      { id: 1, name: "Talhão Alfa", status: "AVAILABLE", cropId: null, autoLoop: false, assignedCropId: null, startedAt: null, durationMs: null, completedAt: null, quantity: 0, quality: "normal", bounds: { x1: 3, y1: 4, x2: 5, y2: 6 } },
      { id: 2, name: "Talhão Beta", status: "AVAILABLE", cropId: null, autoLoop: false, assignedCropId: null, startedAt: null, durationMs: null, completedAt: null, quantity: 0, quality: "normal", bounds: { x1: 7, y1: 4, x2: 9, y2: 6 } },
      { id: 3, name: "Talhão Gama", status: "AVAILABLE", cropId: null, autoLoop: false, assignedCropId: null, startedAt: null, durationMs: null, completedAt: null, quantity: 0, quality: "normal", bounds: { x1: 3, y1: 8, x2: 5, y2: 10 } },
      { id: 4, name: "Talhão Delta", status: "AVAILABLE", cropId: null, autoLoop: false, assignedCropId: null, startedAt: null, durationMs: null, completedAt: null, quantity: 0, quality: "normal", bounds: { x1: 7, y1: 8, x2: 9, y2: 10 } }
    ],
    facilities: {
      coop: {
        id: "coop",
        name: "Galinheiro Automatizado",
        status: "RUNNING",
        cycleDurationMs: 120000,
        lastCollectedAt: Date.now(),
        outputPerCycle: 2,
        currentYield: 0,
        maxYield: 12,
        feedCostPerCycle: 15,
        autoDrain: false,
        produceId: "produce_egg",
        produceName: "Ovo Caipira"
      },
      barn: {
        id: "barn",
        name: "Curral Leiteiro",
        status: "RUNNING",
        cycleDurationMs: 180000,
        lastCollectedAt: Date.now(),
        outputPerCycle: 1,
        currentYield: 0,
        maxYield: 8,
        feedCostPerCycle: 35,
        autoDrain: false,
        produceId: "produce_milk",
        produceName: "Leite Fresco Caipira"
      }
    },
    processors: {
      cheese_press: {
        id: "cheese_press",
        status: "IDLE",
        startedAt: null,
        durationMs: 90000,
        completedAt: null,
        inputItem: null,
        outputItem: null
      },
      mayo_machine: {
        id: "mayo_machine",
        status: "IDLE",
        startedAt: null,
        durationMs: 60000,
        completedAt: null,
        inputItem: null,
        outputItem: null
      },
      preserves_jar: {
        id: "preserves_jar",
        status: "IDLE",
        startedAt: null,
        durationMs: 100000,
        completedAt: null,
        inputItem: null,
        outputItem: null
      }
    },
    warehouse: {
      level: 1,
      capacity: 40,
      maxLevel: 3,
      upgrades: {
        2: { cost: 400, woodCost: 25, capacity: 80, name: "Armazém Ampliado" },
        3: { cost: 1000, woodCost: 60, capacity: 160, name: "Complexo Logístico Rural" }
      }
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
      let raw = null;
      if (fs.existsSync(SAVE_FILE)) {
        raw = fs.readFileSync(SAVE_FILE, 'utf8');
      }
      if ((!raw || raw.trim().length === 0) && fs.existsSync(TEMP_FILE)) {
        raw = fs.readFileSync(TEMP_FILE, 'utf8');
      }

      if (raw && raw.trim().length > 0) {
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
        if (!state.toolsOwned) {
          state.toolsOwned = ["tool_hoe", "tool_can", "tool_scythe"];
        }
        // Migrate any tools found in inventory into toolsOwned, and purge from inventory
        const toolItems = state.inventory.filter(i => i.id.startsWith('tool_'));
        for (const t of toolItems) {
          if (!state.toolsOwned.includes(t.id)) {
            state.toolsOwned.push(t.id);
          }
        }
        if (toolItems.length > 0) {
          state.inventory = state.inventory.filter(i => !i.id.startsWith('tool_'));
        }
        if (!state.player.isIdleAuthorized) {
          state.player.isIdleAuthorized = true;
        }
        if (!state.farmTiers) {
          state.farmTiers = { unlockedTier: 1, licenses: ["license_tier_1"] };
        }
        for (const animal of state.farm.animals) {
          if (animal.harvestsRemaining === undefined) {
            animal.harvestsRemaining = (animal.type.includes('cow') ? 30 : 20);
          }
          if (animal.maxHarvests === undefined) {
            animal.maxHarvests = (animal.type.includes('cow') ? 30 : 20);
          }
          if (animal.isAlive === undefined) {
            animal.isAlive = true;
          }
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
        if (!state.lastActive) {
          state.lastActive = Date.now();
        }
        if (state.farm && state.farm.tiles) {
          for (let y = 12; y <= 15; y++) {
            for (let x = 2; x <= 9; x++) {
              const k = `${x},${y}`;
              if (state.farm.tiles[k] && state.farm.tiles[k].state === 'grass') {
                state.farm.tiles[k].state = 'tilled';
                state.farm.tiles[k].isWatered = true;
              }
            }
          }
        }
        if (state.inventory && !state.inventory.some(i => i.id === 'seeds_berry')) {
          state.inventory.push({ id: 'seeds_berry', quantity: 6, quality: 'normal', slot: state.inventory.length });
        }
        if (state.inventory && !state.inventory.some(i => i.id === 'seeds_carrot')) {
          state.inventory.push({ id: 'seeds_carrot', quantity: 6, quality: 'normal', slot: state.inventory.length });
        }
        if (!state.idlePlots) {
          state.idlePlots = [
            { id: 1, name: "Talhão Alfa", status: "AVAILABLE", cropId: null, autoLoop: false, assignedCropId: null, startedAt: null, durationMs: null, completedAt: null, quantity: 0, quality: "normal", bounds: { x1: 3, y1: 4, x2: 5, y2: 6 } },
            { id: 2, name: "Talhão Beta", status: "AVAILABLE", cropId: null, autoLoop: false, assignedCropId: null, startedAt: null, durationMs: null, completedAt: null, quantity: 0, quality: "normal", bounds: { x1: 7, y1: 4, x2: 9, y2: 6 } },
            { id: 3, name: "Talhão Gama", status: "AVAILABLE", cropId: null, autoLoop: false, assignedCropId: null, startedAt: null, durationMs: null, completedAt: null, quantity: 0, quality: "normal", bounds: { x1: 3, y1: 8, x2: 5, y2: 10 } },
            { id: 4, name: "Talhão Delta", status: "AVAILABLE", cropId: null, autoLoop: false, assignedCropId: null, startedAt: null, durationMs: null, completedAt: null, quantity: 0, quality: "normal", bounds: { x1: 7, y1: 8, x2: 9, y2: 10 } }
          ];
        } else {
          for (const p of state.idlePlots) {
            if (p.autoLoop === undefined) p.autoLoop = false;
            if (p.assignedCropId === undefined) p.assignedCropId = p.cropId || null;
          }
        }
        if (!state.facilities) {
          state.facilities = {
            coop: {
              id: "coop",
              name: "Galinheiro Automatizado",
              status: "RUNNING",
              cycleDurationMs: 120000,
              lastCollectedAt: Date.now(),
              outputPerCycle: 2,
              currentYield: 0,
              maxYield: 12,
              produceId: "produce_egg",
              produceName: "Ovo Caipira"
            },
            barn: {
              id: "barn",
              name: "Curral Leiteiro",
              status: "RUNNING",
              cycleDurationMs: 180000,
              lastCollectedAt: Date.now(),
              outputPerCycle: 1,
              currentYield: 0,
              maxYield: 8,
              produceId: "produce_milk",
              produceName: "Leite Fresco Caipira"
            }
          };
        }
        if (state.offlineReport === undefined) {
          state.offlineReport = null;
        }
        if (!state.processors) {
          state.processors = {
            cheese_press: {
              id: "cheese_press",
              status: "IDLE",
              startedAt: null,
              durationMs: 90000,
              completedAt: null,
              inputItem: null,
              outputItem: null
            },
            mayo_machine: {
              id: "mayo_machine",
              status: "IDLE",
              startedAt: null,
              durationMs: 60000,
              completedAt: null,
              inputItem: null,
              outputItem: null
            },
            preserves_jar: {
              id: "preserves_jar",
              status: "IDLE",
              startedAt: null,
              durationMs: 100000,
              completedAt: null,
              inputItem: null,
              outputItem: null
            }
          };
        }
        if (!state.warehouse) {
          state.warehouse = {
            level: 1,
            capacity: 40,
            maxLevel: 3,
            upgrades: {
              2: { cost: 400, woodCost: 25, capacity: 80, name: "Armazém Ampliado" },
              3: { cost: 1000, woodCost: 60, capacity: 160, name: "Complexo Logístico Rural" }
            }
          };
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
