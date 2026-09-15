const test = require('node:test');
const assert = require('node:assert');
const farmEngine = require('../src/services/farmEngine');
const economyEngine = require('../src/services/economyEngine');

test('FarmEngine: till, water, plant, and grow lifecycle', (t) => {
  const state = farmEngine.getState();
  assert.ok(state.player, 'Player exists');
  assert.ok(state.farm.tiles['5,5'], 'Tile exists');

  // Till tile
  const tileKey = '5,5';
  state.farm.tiles[tileKey].state = 'grass';
  state.farm.tiles[tileKey].crop = null;
  state.farm.tiles[tileKey].isWatered = false;

  const tillRes = farmEngine.tillTile(5, 5);
  assert.strictEqual(tillRes.success, true);
  assert.strictEqual(tillRes.tile.state, 'tilled');

  // Cannot plant invalid seed
  assert.throws(() => {
    farmEngine.plantCrop(5, 5, 'invalid_seed');
  });

  // Ensure player has strawberry seeds
  farmEngine.addItemToInventory('seeds_strawberry', 1, 'normal');
  const plantRes = farmEngine.plantCrop(5, 5, 'seeds_strawberry');
  assert.strictEqual(plantRes.success, true);
  assert.strictEqual(plantRes.tile.crop.id, 'strawberry');
  assert.strictEqual(plantRes.tile.crop.stage, 0);

  // Water tile
  const waterRes = farmEngine.waterTile(5, 5);
  assert.strictEqual(waterRes.success, true);
  assert.strictEqual(waterRes.tile.isWatered, true);

  // Advance time to mature crop
  farmEngine.advanceCropTime(300); // 5 minutes
  const updatedState = farmEngine.getState();
  assert.strictEqual(updatedState.farm.tiles[tileKey].crop.ready, true);

  // Harvest
  const initialHarvestCount = updatedState.stats.cropsHarvested || 0;
  const harvestRes = farmEngine.harvestCrop(5, 5);
  assert.strictEqual(harvestRes.success, true);
  assert.strictEqual(harvestRes.harvested.id, 'crop_strawberry');
  assert.ok(harvestRes.harvested.quantity >= 1);
  assert.strictEqual(harvestRes.tile.crop, null);
  assert.strictEqual(farmEngine.getState().stats.cropsHarvested, initialHarvestCount + harvestRes.harvested.quantity);
});

test('EconomyEngine: seed purchasing and crop selling with quality multiplier', (t) => {
  const state = farmEngine.getState();
  state.player.money = 100;

  // Cannot buy without enough money
  assert.throws(() => {
    economyEngine.buyItem('seeds_strawberry', 9999);
  });

  // Buy 2 seeds of potato (18G each = 36G)
  const buyRes = economyEngine.buyItem('seeds_potato', 2);
  assert.strictEqual(buyRes.success, true);
  assert.strictEqual(state.player.money, 64);

  // Sell item test
  farmEngine.addItemToInventory('crop_strawberry', 2, 'gold');
  const itemInInv = state.inventory.find(i => i.id === 'crop_strawberry' && i.quality === 'gold');
  assert.ok(itemInInv, 'Item in inventory');

  const moneyBefore = state.player.money;
  const sellRes = economyEngine.sellItem(itemInInv.slot, 1);
  assert.strictEqual(sellRes.success, true);
  // Base 60 * 1.5 gold = 90G
  assert.strictEqual(sellRes.sold.totalPrice, 90);
  assert.strictEqual(state.player.money, moneyBefore + 90);
});

test('FarmEngine: sleep and natural day transition', (t) => {
  const state = farmEngine.getState();
  const dayBefore = state.time.day;
  state.player.energy = 10; // Low energy

  // Till, plant and water a test tile
  state.farm.tiles['3,3'].state = 'tilled';
  state.farm.tiles['3,3'].crop = { id: 'strawberry', stage: 0, ready: false };
  state.farm.tiles['3,3'].isWatered = true;

  // Sleep
  const sleepRes = farmEngine.sleep();
  assert.strictEqual(sleepRes.success, true);
  assert.strictEqual(sleepRes.time.day, dayBefore + 1);
  assert.strictEqual(sleepRes.time.hour, 6);
  assert.strictEqual(sleepRes.time.minute, 0);
  assert.strictEqual(sleepRes.player.energy, sleepRes.player.maxEnergy);

  // Watered crop advanced and soil is dry in the morning
  const morningTile = farmEngine.getState().farm.tiles['3,3'];
  assert.ok(morningTile.crop.stage > 0);
  assert.strictEqual(morningTile.isWatered, false);
});

test('FarmEngine: livestock and egg collection system', (t) => {
  const state = farmEngine.getState();
  assert.ok(state.farm.animals.length >= 3, 'Farm has animals');

  // Sleep should lay eggs if under cap
  state.farm.eggs = [];
  farmEngine.sleep();
  const eggsAfterSleep = farmEngine.getState().farm.eggs;
  assert.ok(eggsAfterSleep.length > 0, 'Chickens laid an egg overnight');

  const eggToCollect = eggsAfterSleep[0];
  const initialEggsCollectedStat = state.stats.eggsCollected || 0;
  const initialXP = state.player.xp;

  // Collect egg
  const collectRes = farmEngine.collectEgg(eggToCollect.id, eggToCollect.x, eggToCollect.y);
  assert.strictEqual(collectRes.success, true);
  assert.strictEqual(collectRes.egg.id, eggToCollect.id);

  // Check inventory has produce_egg
  const invEgg = state.inventory.find(i => i.id === 'produce_egg');
  assert.ok(invEgg, 'Egg in player inventory');
  assert.ok(invEgg.quantity >= 1);

  // Check stats and XP gained
  assert.strictEqual(farmEngine.getState().stats.eggsCollected, initialEggsCollectedStat + 1);
  assert.ok(state.player.xp > initialXP);
});

test('FarmEngine: tree chopping, stump clearing and wood foraging', (t) => {
  const state = farmEngine.getState();
  state.player.energy = 50;

  // Ensure axe is in inventory
  if (!state.inventory.find(i => i.id === 'tool_axe')) {
    farmEngine.addItemToInventory('tool_axe', 1, 'normal');
  }

  // Create a test tree
  const testTreeId = 'tree_test_wood';
  state.farm.trees = state.farm.trees.filter(tr => tr.id !== testTreeId);
  state.farm.trees.push({ id: testTreeId, x: 2, y: 2, health: 3, maxHealth: 3, isStump: false });

  const initialWoodInInv = state.inventory.find(i => i.id === 'material_wood')?.quantity || 0;
  const initialEnergy = state.player.energy;

  // Hit 1: damage tree
  const hit1 = farmEngine.chopTree(testTreeId);
  assert.strictEqual(hit1.success, true);
  assert.strictEqual(hit1.actionResult, 'hit');
  assert.strictEqual(hit1.tree.health, 2);
  assert.strictEqual(state.player.energy, initialEnergy - 2);

  // Hit 2: damage tree
  const hit2 = farmEngine.chopTree(testTreeId);
  assert.strictEqual(hit2.success, true);
  assert.strictEqual(hit2.actionResult, 'hit');
  assert.strictEqual(hit2.tree.health, 1);

  // Hit 3: tree falls, turns into stump, drops wood
  const hit3 = farmEngine.chopTree(testTreeId);
  assert.strictEqual(hit3.success, true);
  assert.strictEqual(hit3.actionResult, 'felled');
  assert.strictEqual(hit3.tree.isStump, true);
  assert.ok(hit3.wood.quantity >= 3);

  const woodAfterFell = state.inventory.find(i => i.id === 'material_wood')?.quantity || 0;
  assert.ok(woodAfterFell > initialWoodInInv);

  // Hit 4 & 5: chop the stump
  farmEngine.chopTree(testTreeId);
  const clearStump = farmEngine.chopTree(testTreeId);
  assert.strictEqual(clearStump.success, true);
  assert.strictEqual(clearStump.actionResult, 'cleared');
  assert.strictEqual(state.farm.trees.find(tr => tr.id === testTreeId), undefined);

  // Can sell wood
  const woodItem = state.inventory.find(i => i.id === 'material_wood');
  assert.ok(woodItem);
  const moneyBefore = state.player.money;
  const sellWoodRes = economyEngine.sellItem(woodItem.slot, 1);
  assert.strictEqual(sellWoodRes.success, true);
  assert.ok(state.player.money > moneyBefore);
});

test('FarmEngine: dairy cattle, petting and daily milking system', (t) => {
  const state = farmEngine.getState();
  state.player.energy = 50;

  // Ensure tool_pail is in inventory
  if (!state.inventory.find(i => i.id === 'tool_pail')) {
    farmEngine.addItemToInventory('tool_pail', 1, 'normal');
  }

  // Ensure cows exist
  let cow = state.farm.animals.find(a => a.type === 'female_cow');
  let bull = state.farm.animals.find(a => a.type === 'male_cow');
  if (!cow) {
    cow = { id: "cow_1", type: "female_cow", name: "Mimosa", x: 19, y: 9, lastMilkedDay: 0, affection: 15 };
    state.farm.animals.push(cow);
  }
  if (!bull) {
    bull = { id: "cow_2", type: "male_cow", name: "Ferdinando", x: 22, y: 10, affection: 15 };
    state.farm.animals.push(bull);
  }

  // Petting increases affection
  const initialAffection = cow.affection || 10;
  cow.lastPettedDay = -1; // Reset petted
  const petRes = farmEngine.petAnimal(cow.id);
  assert.strictEqual(petRes.success, true);
  assert.ok(cow.affection > initialAffection);

  // Cannot milk a bull!
  assert.throws(() => {
    farmEngine.milkCow(bull.id);
  }, /touro/);

  // Milk the cow
  cow.lastMilkedDay = -1; // Ready to milk
  const initialMilkStat = state.stats.milkProduced || 0;
  const initialXP = state.player.xp;
  const initialEnergy = state.player.energy;

  const milkRes = farmEngine.milkCow(cow.id);
  assert.strictEqual(milkRes.success, true);
  assert.strictEqual(milkRes.milk.id, 'produce_milk');
  assert.strictEqual(state.player.energy, initialEnergy - 2);
  assert.ok(state.player.xp > initialXP);
  assert.strictEqual(state.stats.milkProduced, initialMilkStat + 1);

  // Inventory has fresh milk
  const invMilk = state.inventory.find(i => i.id === 'produce_milk');
  assert.ok(invMilk, 'Milk in inventory');
  assert.ok(invMilk.quantity >= 1);

  // Cannot milk twice on the same day
  assert.throws(() => {
    farmEngine.milkCow(cow.id);
  }, /já foi ordenhada/);

  // Sleep advances day and allows milking again
  farmEngine.sleep();
  const nextDayMilking = farmEngine.milkCow(cow.id);
  assert.strictEqual(nextDayMilking.success, true);

  // Can sell milk in shop
  const milkToSell = state.inventory.find(i => i.id === 'produce_milk');
  const moneyBefore = state.player.money;
  const sellRes = economyEngine.sellItem(milkToSell.slot, 1);
  assert.strictEqual(sellRes.success, true);
  assert.ok(state.player.money > moneyBefore);
});

test('FarmEngine: player location transition and farmhouse interior exploration', (t) => {
  const state = farmEngine.getState();

  // Initial location should be 'farm' or valid
  assert.ok(['farm', 'house_interior'].includes(state.player.location));

  // Transition to house interior
  const insideRes = farmEngine.transitionLocation('house_interior');
  assert.strictEqual(insideRes.success, true);
  assert.strictEqual(insideRes.location, 'house_interior');
  assert.strictEqual(farmEngine.getState().player.location, 'house_interior');
  assert.strictEqual(farmEngine.getState().player.position.x, 5.5);
  assert.strictEqual(farmEngine.getState().player.position.y, 7);

  // Transition to custom coordinates inside
  const customCoordRes = farmEngine.transitionLocation('house_interior', 3, 3);
  assert.strictEqual(customCoordRes.success, true);
  assert.strictEqual(farmEngine.getState().player.position.x, 3);
  assert.strictEqual(farmEngine.getState().player.position.y, 3);

  // Rejects invalid destination
  assert.throws(() => {
    farmEngine.transitionLocation('secret_dimension');
  }, /inválido/);

  // Sleeping in house interior restores energy and advances day
  farmEngine.getState().player.energy = 5;
  const dayBefore = farmEngine.getState().time.day;
  const sleepRes = farmEngine.sleep();
  assert.strictEqual(sleepRes.success, true);
  assert.strictEqual(farmEngine.getState().time.day, dayBefore + 1);
  assert.strictEqual(farmEngine.getState().player.energy, farmEngine.getState().player.maxEnergy);

  // Transition back to farm
  const farmRes = farmEngine.transitionLocation('farm');
  assert.strictEqual(farmRes.success, true);
  assert.strictEqual(farmRes.location, 'farm');
  assert.strictEqual(farmEngine.getState().player.location, 'farm');
  assert.strictEqual(farmEngine.getState().player.position.x, 17.5);
  assert.strictEqual(farmEngine.getState().player.position.y, 6);
});
