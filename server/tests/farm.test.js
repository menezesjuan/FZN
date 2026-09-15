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
