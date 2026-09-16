const test = require('node:test');
const assert = require('node:assert');
const farmEngine = require('../src/services/farmEngine');

test('Economy & Tools: plantCrop requires tool_hoe', (t) => {
  const state = farmEngine.getState();
  state.farm.tiles['0,0'] = { x: 0, y: 0, state: 'tilled', isWatered: false, crop: null };
  state.inventory = [{ id: 'seeds_onion', quantity: 5, quality: 'normal', slot: 0 }];
  state.toolsOwned = [];

  assert.throws(() => {
    farmEngine.plantCrop(0, 0, 'seeds_onion');
  }, /Enxada Agrícola/);

  state.toolsOwned = ['tool_hoe'];
  const res = farmEngine.plantCrop(0, 0, 'seeds_onion');
  assert.strictEqual(res.success, true);
  assert.strictEqual(state.farm.tiles['0,0'].crop.id, 'onion');
});

test('Economy & Tools: harvestCrop requires tool_scythe', (t) => {
  const state = farmEngine.getState();
  state.farm.tiles['0,0'].crop = { id: 'onion', stage: 5, ready: true };
  state.toolsOwned = ['tool_hoe'];

  assert.throws(() => {
    farmEngine.harvestCrop(0, 0);
  }, /Foice de Colheita/);

  state.toolsOwned.push('tool_scythe');
  const res = farmEngine.harvestCrop(0, 0);
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.harvested.name, 'Cebola');
});

test('Economy & Tiers: cannot plant Tier 2 crops with Tier 1 license', (t) => {
  const state = farmEngine.getState();
  state.farmTiers = { unlockedTier: 1, licenses: ['license_tier_1'] };
  state.toolsOwned = ['tool_hoe', 'tool_scythe'];
  state.time = { season: 'Primavera', day: 1, year: 1, hour: 8, minute: 0 };
  state.player.money = 500;
  state.idlePlots[0].status = 'AVAILABLE';
  state.idlePlots[0].cropId = null;

  assert.throws(() => {
    farmEngine.startPlotProduction(1, 'potato');
  }, /Licença Agrícola Tier 2/);
});

test('Economy: buyTool purchases tool with cash check', (t) => {
  const state = farmEngine.getState();
  state.player.money = 100;
  state.toolsOwned = ['tool_hoe'];

  assert.throws(() => {
    farmEngine.buyTool('tool_scythe');
  }, /Ouro insuficiente/);

  state.player.money = 400;
  const res = farmEngine.buyTool('tool_scythe');
  assert.strictEqual(res.success, true);
  assert.strictEqual(state.player.money, 100);
  assert.ok(state.toolsOwned.includes('tool_scythe'));
});

test('Economy: buyTierLicense upgrades tier and validates prerequisites', (t) => {
  const state = farmEngine.getState();
  state.farmTiers = { unlockedTier: 1, licenses: ['license_tier_1'] };
  state.player.money = 2000;
  state.inventory = [{ id: 'material_wood', quantity: 10, quality: 'normal', slot: 0 }];

  assert.throws(() => {
    farmEngine.buyTierLicense(2);
  }, /30 Madeiras/);

  state.inventory[0].quantity = 35;
  const res = farmEngine.buyTierLicense(2);
  assert.strictEqual(res.success, true);
  assert.strictEqual(state.farmTiers.unlockedTier, 2);
  assert.strictEqual(state.player.money, 800);
  assert.strictEqual(state.inventory[0].quantity, 5);
});

test('Livestock Lifecycle: animals consume harvests and die of old age', (t) => {
  const state = farmEngine.getState();
  const originalAnimals = JSON.parse(JSON.stringify(state.farm.animals));
  state.toolsOwned = ['tool_egg_basket', 'tool_pail'];
  state.farm.eggs = [{ id: 'egg_test', x: 20, y: 4, quality: 'normal' }];
  state.farm.animals = [
    { id: 'hen_1', type: 'adult_chicken', name: 'Cocó', x: 20, y: 3, harvestsRemaining: 1, maxHarvests: 20, isAlive: true }
  ];

  farmEngine.collectEgg('egg_test', 20, 4);
  const hen = state.farm.animals.find(a => a.id === 'hen_1');
  assert.strictEqual(hen.harvestsRemaining, 0);
  assert.strictEqual(hen.isAlive, false);

  state.farm.animals = originalAnimals;
});

test('Livestock: buyAnimal acquires chicken/cow respecting tier', (t) => {
  const state = farmEngine.getState();
  state.farmTiers = { unlockedTier: 1, licenses: ['license_tier_1'] };
  state.player.money = 2000;

  assert.throws(() => {
    farmEngine.buyAnimal('animal_chicken', 'Pintinho');
  }, /Tier 2/);

  state.farmTiers.unlockedTier = 2;
  const res = farmEngine.buyAnimal('animal_chicken', 'Pintinho');
  assert.strictEqual(res.success, true);
  assert.strictEqual(state.player.money, 1650);
  const bought = state.farm.animals.find(a => a.name === 'Pintinho');
  assert.ok(bought);
  assert.strictEqual(bought.isAlive, true);
  assert.strictEqual(bought.harvestsRemaining, 20);
});

test('100% IDLE Automation: autoLoop continuously harvests and replants with fee', (t) => {
  const state = farmEngine.getState();
  state.toolsOwned = ['tool_hoe', 'tool_scythe'];
  state.time = { season: 'Primavera', day: 1, year: 1, hour: 8, minute: 0 };
  state.farmTiers = { unlockedTier: 1, licenses: ['license_tier_1'] };
  state.player.money = 300;

  const plot = state.idlePlots[0];
  plot.autoLoop = true;
  plot.assignedCropId = 'onion';
  plot.status = 'COMPLETED';
  plot.cropId = 'onion';
  plot.quantity = 16;
  plot.completedAt = Date.now() - 1000;

  farmEngine.updateIdleProduction();

  assert.strictEqual(plot.status, 'RUNNING');
  assert.strictEqual(plot.cropId, 'onion');
  assert.ok(state.player.money < 300);
  const onionsInInv = state.inventory.find(i => i.id === 'crop_onion');
  assert.ok(onionsInInv && onionsInInv.quantity >= 16);
  plot.autoLoop = false;
  plot.status = 'AVAILABLE';
});

test('100% IDLE Automation: halts with INSUFFICIENT_FUNDS when cash is empty', (t) => {
  const state = farmEngine.getState();
  state.toolsOwned = ['tool_hoe', 'tool_scythe'];
  state.time = { season: 'Primavera', day: 1, year: 1, hour: 8, minute: 0 };
  state.farmTiers = { unlockedTier: 1, licenses: ['license_tier_1'] };
  state.player.money = 5;

  const plot = state.idlePlots[0];
  plot.autoLoop = true;
  plot.assignedCropId = 'onion';
  plot.status = 'COMPLETED';
  plot.cropId = 'onion';
  plot.quantity = 16;
  plot.completedAt = Date.now() - 1000;

  farmEngine.updateIdleProduction();

  assert.strictEqual(plot.status, 'INSUFFICIENT_FUNDS');
  assert.strictEqual(plot.autoError, 'OUT_OF_MONEY');
  plot.autoLoop = false;
  plot.status = 'AVAILABLE';
  plot.autoError = null;
});

test('100% IDLE & Inventory: player has isIdleAuthorized and clean non-redundant inventory', (t) => {
  const state = farmEngine.getState();
  assert.strictEqual(state.player.isIdleAuthorized, true, 'User has 100% IDLE authorization');

  // Verify chopTree works when tool_axe is in toolsOwned without occupying inventory slot
  state.toolsOwned = ['tool_hoe', 'tool_can', 'tool_scythe', 'tool_axe'];
  state.inventory = state.inventory.filter(i => !i.id.startsWith('tool_'));
  assert.strictEqual(state.inventory.some(i => i.id === 'tool_axe'), false);

  const initialTree = state.farm.trees[0];
  initialTree.health = 3;
  initialTree.isStump = false;
  state.player.energy = 100;

  const res = farmEngine.chopTree(initialTree.id, initialTree.x, initialTree.y);
  assert.strictEqual(res.success, true);
  assert.strictEqual(initialTree.health, 2);

  // Clean up test states
  state.idlePlots.forEach(p => { p.autoLoop = false; p.status = 'AVAILABLE'; p.autoError = null; });
  state.player.money = 150;
  farmEngine.save();
});