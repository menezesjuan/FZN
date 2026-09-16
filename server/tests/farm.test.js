const test = require('node:test');
const assert = require('node:assert');
const farmEngine = require('../src/services/farmEngine');
const economyEngine = require('../src/services/economyEngine');
const marketplaceEngine = require('../src/services/marketplaceEngine');

test('FarmEngine: till, water, plant, and grow lifecycle', (t) => {
  const state = farmEngine.getState();
  assert.ok(state.player, 'Player exists');
  assert.ok(state.farm.tiles['5,5'], 'Tile exists');

  // Till tile
  const tileKey = '5,5';
  state.farm.tiles[tileKey].state = 'grass';
  state.farm.tiles[tileKey].crop = null;
  state.farm.tiles[tileKey].isWatered = false;
  state.time.season = 'Primavera'; // Ensure Spring season for strawberry planting

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

  // Sell item test (clean any existing strawberries from previous random harvest)
  state.inventory = state.inventory.filter(i => i.id !== 'crop_strawberry');
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
  state.tomorrowWeather = 'sunny'; // Ensure sunny morning so soil dries

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

  const getWoodTotal = (inv) => inv.filter(i => i.id === 'material_wood').reduce((sum, i) => sum + i.quantity, 0);
  const initialWoodInInv = getWoodTotal(state.inventory);
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

  const woodAfterFell = getWoodTotal(state.inventory);
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
  farmEngine.getState().time.day = 5;
  const sleepRes = farmEngine.sleep();
  assert.strictEqual(sleepRes.success, true);
  assert.strictEqual(farmEngine.getState().time.day, 6);
  assert.strictEqual(farmEngine.getState().player.energy, farmEngine.getState().player.maxEnergy);

  // Transition back to farm
  const farmRes = farmEngine.transitionLocation('farm');
  assert.strictEqual(farmRes.success, true);
  assert.strictEqual(farmRes.location, 'farm');
  assert.strictEqual(farmEngine.getState().player.location, 'farm');
  assert.strictEqual(farmEngine.getState().player.position.x, 17.5);
  assert.strictEqual(farmEngine.getState().player.position.y, 6);
});

test('FarmEngine: rustic storage chest deposit, withdraw, quick stacking and capacity limits', (t) => {
  const state = farmEngine.getState();

  // Verify red chicken Penelope exists in animals
  const penelope = state.farm.animals.find(a => a.id === 'chicken_red_1');
  assert.ok(penelope, 'Red Hen Penélope exists in farm animals');
  assert.strictEqual(penelope.name, 'Penélope');
  assert.strictEqual(penelope.type, 'red_chicken');

  // Verify initial chest structure
  assert.ok(Array.isArray(state.farm.chest), 'Farm has chest array');

  // Clear chest and inventory for predictable test setup
  state.farm.chest = [
    { slot: 0, id: 'material_wood', quantity: 5, quality: 'normal' }
  ];

  // Give player wood in inventory slot 5
  state.inventory = state.inventory.filter(i => i.id !== 'material_wood' && i.id !== 'seeds_turnip' && i.slot !== 5 && i.slot !== 6);
  state.inventory.push({ slot: 5, id: 'material_wood', quantity: 10, quality: 'normal' });
  state.inventory.push({ slot: 6, id: 'seeds_turnip', quantity: 3, quality: 'normal' });

  // 1. Quick Stack: should move the 10 wood from inventory into slot 0 chest (since slot 0 has wood)
  const quickStackRes = farmEngine.quickStackChest();
  assert.strictEqual(quickStackRes.success, true);
  assert.strictEqual(quickStackRes.stackedCount, 10);

  const chestWood = state.farm.chest.find(c => c.slot === 0);
  assert.ok(chestWood);
  assert.strictEqual(chestWood.quantity, 15);
  assert.strictEqual(state.inventory.find(i => i.id === 'material_wood'), undefined, 'Inventory wood was stacked into chest');

  // 2. Deposit: deposit 2 seeds_turnip from inventory slot 6 into chest
  const depRes = farmEngine.depositToChest(6, 2);
  assert.strictEqual(depRes.success, true);
  assert.strictEqual(state.inventory.find(i => i.slot === 6).quantity, 1);
  const chestTurnip = state.farm.chest.find(c => c.id === 'seeds_turnip');
  assert.ok(chestTurnip, 'Seeds deposited to chest');
  assert.strictEqual(chestTurnip.quantity, 2);

  // 3. Withdraw: withdraw 1 seeds_turnip back to inventory
  const withRes = farmEngine.withdrawFromChest(chestTurnip.slot, 1);
  assert.strictEqual(withRes.success, true);
  assert.strictEqual(chestTurnip.quantity, 1);
  const invTurnip = state.inventory.find(i => i.id === 'seeds_turnip');
  assert.strictEqual(invTurnip.quantity, 2);

  // 4. Capacity limit: fill chest up to 16 slots
  state.farm.chest = [];
  for (let i = 0; i < 16; i++) {
    state.farm.chest.push({ slot: i, id: `test_item_${i}`, quantity: 1, quality: 'normal' });
  }

  // Clear slots 7 and 8 from inventory
  state.inventory = state.inventory.filter(i => i.slot !== 7 && i.slot !== 8);

  // Attempt to deposit a new distinct item should throw/fail
  state.inventory.push({ slot: 7, id: 'item_overflow_test', quantity: 1, quality: 'normal' });
  assert.throws(() => {
    farmEngine.depositToChest(7, 1);
  }, /cheio/i);

  // But can deposit to stack an existing item even if 16 slots are full
  state.inventory.push({ slot: 8, id: 'test_item_0', quantity: 2, quality: 'normal' });
  const stackWhenFull = farmEngine.depositToChest(8, 2);
  assert.strictEqual(stackWhenFull.success, true);
  assert.strictEqual(state.farm.chest.find(c => c.slot === 0).quantity, 3);
});

test('FarmEngine: dynamic weather system, tomorrow forecast, and rainy morning auto-watering', (t) => {
  const state = farmEngine.getState();

  // 1. Weather state integrity
  assert.ok(['sunny', 'rainy', 'stormy'].includes(state.weather), 'Current weather is valid');
  assert.ok(['sunny', 'rainy', 'stormy'].includes(state.tomorrowWeather), 'Tomorrow weather is valid');

  // 2. Weather forecast API method
  const forecast = farmEngine.getWeatherForecast();
  assert.strictEqual(forecast.success, true);
  assert.ok(forecast.today.description.length > 0);
  assert.ok(forecast.tomorrow.description.length > 0);
  assert.strictEqual(forecast.today.weather, state.weather);
  assert.strictEqual(forecast.tomorrow.weather, state.tomorrowWeather);

  // 3. Till tiles without water
  const tileA = state.farm.tiles['3,3'];
  const tileB = state.farm.tiles['3,4'];
  tileA.state = 'tilled';
  tileA.isWatered = false;
  tileB.state = 'tilled';
  tileB.isWatered = false;

  // 4. Force tomorrow weather to 'rainy' and sleep
  state.tomorrowWeather = 'rainy';
  state.time.day = 10;
  const sleepResRain = farmEngine.sleep();

  assert.strictEqual(sleepResRain.success, true);
  assert.strictEqual(state.weather, 'rainy', 'Weather advanced to rainy');
  assert.ok(['sunny', 'rainy', 'stormy'].includes(state.tomorrowWeather));
  assert.strictEqual(tileA.isWatered, true, 'Tile A was auto-watered by the morning rain');
  assert.strictEqual(tileB.isWatered, true, 'Tile B was auto-watered by the morning rain');

  // 5. Force tomorrow weather to 'stormy' and sleep
  state.tomorrowWeather = 'stormy';
  state.time.day = 11;
  tileA.isWatered = false;
  tileB.isWatered = false;
  const sleepResStorm = farmEngine.sleep();

  assert.strictEqual(sleepResStorm.success, true);
  assert.strictEqual(state.weather, 'stormy', 'Weather advanced to stormy');
  assert.strictEqual(tileA.isWatered, true, 'Tile A was auto-watered by the storm');
  assert.strictEqual(tileB.isWatered, true, 'Tile B was auto-watered by the storm');

  // 6. Force tomorrow weather to 'sunny' and sleep
  state.tomorrowWeather = 'sunny';
  state.time.day = 12;
  const sleepResSun = farmEngine.sleep();

  assert.strictEqual(sleepResSun.success, true);
  assert.strictEqual(state.weather, 'sunny', 'Weather advanced to sunny');
  assert.strictEqual(tileA.isWatered, false, 'Soil dries up naturally on a sunny morning');
  assert.strictEqual(tileB.isWatered, false, 'Soil dries up naturally on a sunny morning');
});

test('FarmEngine: Idle plots management, batch planting, timer progression, and collection', (t) => {
  const state = farmEngine.getState();
  assert.ok(Array.isArray(state.idlePlots), 'Idle plots array exists');
  assert.strictEqual(state.idlePlots.length, 4, '4 Idle plots exist (Alfa, Beta, Gama, Delta)');

  const plot1 = state.idlePlots[0];
  // Reset plot to AVAILABLE
  plot1.status = 'AVAILABLE';
  plot1.cropId = null;
  plot1.completedAt = null;

  // Give player enough money and set Spring season for leek
  state.player.money = 1000;
  state.time.season = 'Primavera';
  const initialMoney = state.player.money;

  // 1. Start plot production with leek
  const startRes = farmEngine.startPlotProduction(1, 'leek');
  assert.strictEqual(startRes.success, true);
  assert.strictEqual(startRes.plot.status, 'RUNNING');
  assert.strictEqual(startRes.plot.cropId, 'leek');
  assert.strictEqual(startRes.plot.quantity, 16);
  assert.strictEqual(state.player.money, initialMoney - 22, 'Seed batch cost 22G deducted');

  // Cannot start an already running plot
  assert.throws(() => {
    farmEngine.startPlotProduction(1, 'strawberry');
  }, /já está em cultivo ativo/);

  // Cannot collect while still running
  assert.throws(() => {
    farmEngine.collectPlot(1);
  }, /ainda está em desenvolvimento/);

  // 2. Advance time to complete plot
  plot1.completedAt = Date.now() - 1000;
  farmEngine.updateIdleProduction();
  assert.strictEqual(plot1.status, 'COMPLETED');

  // 3. Collect plot
  const initialHarvested = state.stats.cropsHarvested || 0;
  const collectRes = farmEngine.collectPlot(1);
  assert.strictEqual(collectRes.success, true);
  assert.strictEqual(collectRes.collected.produceId, 'crop_leek');
  assert.strictEqual(collectRes.collected.quantity, 16);
  assert.strictEqual(plot1.status, 'AVAILABLE');
  assert.strictEqual(plot1.cropId, null);
  assert.strictEqual(state.stats.cropsHarvested, initialHarvested + 16);

  // 4. Batch collect all ready plots
  state.idlePlots.forEach(p => {
    p.status = 'AVAILABLE';
    p.cropId = null;
    p.completedAt = null;
  });
  const plot2 = state.idlePlots[1];
  const plot3 = state.idlePlots[2];
  state.player.gold = 200;

  farmEngine.startPlotProduction(2, 'strawberry');
  farmEngine.startPlotProduction(3, 'potato');

  plot2.completedAt = Date.now() - 1000;
  plot3.completedAt = Date.now() - 1000;

  const collectAllRes = farmEngine.collectAllPlots();
  assert.strictEqual(collectAllRes.success, true);
  assert.strictEqual(collectAllRes.collectedCount, 2);
  assert.strictEqual(plot2.status, 'AVAILABLE');
  assert.strictEqual(plot3.status, 'AVAILABLE');
});

test('FarmEngine: Offline progress calculation and welcome report generation', (t) => {
  const state = farmEngine.getState();
  const plot4 = state.idlePlots[3];
  plot4.status = 'AVAILABLE';
  state.player.money = 500;
  state.time.season = 'Primavera'; // Onion is a Spring crop

  // Start plot with onion (45s duration)
  farmEngine.startPlotProduction(4, 'onion');
  assert.strictEqual(plot4.status, 'RUNNING');

  // Set last active and planting to 10 minutes ago
  const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
  state.lastActive = tenMinutesAgo;
  plot4.startedAt = tenMinutesAgo;
  plot4.completedAt = tenMinutesAgo + (45 * 1000);
  state.offlineReport = null;

  // Process offline progress
  farmEngine.processOfflineProgress();

  assert.ok(state.offlineReport, 'Offline report was generated');
  assert.ok(state.offlineReport.timeAwaySeconds >= 590, 'Recorded offline time correctly');
  assert.ok(state.offlineReport.completedPlots.some(p => p.plotId === 4 && p.cropId === 'onion'), 'Plot completed offline');
  assert.strictEqual(plot4.status, 'COMPLETED');

  // Acknowledge report
  const ackRes = farmEngine.acknowledgeOfflineReport();
  assert.strictEqual(ackRes.success, true);
  assert.strictEqual(state.offlineReport, null, 'Report acknowledged and cleared');
});

test('FarmEngine: Automated facilities (coop and barn) accumulation and harvesting', (t) => {
  const state = farmEngine.getState();
  assert.ok(state.facilities, 'Facilities object exists');
  assert.ok(state.facilities.coop, 'Coop exists');
  assert.ok(state.facilities.barn, 'Barn exists');

  // Simulate 10 minutes elapsed for coop (cycle = 2 min, output = 2 eggs -> 5 cycles = 10 eggs)
  state.facilities.coop.lastCollectedAt = Date.now() - (10 * 60 * 1000);
  farmEngine.updateIdleProduction();
  assert.strictEqual(state.facilities.coop.currentYield, 10);

  // Collect coop
  const initialEggs = state.stats.eggsCollected || 0;
  const coopRes = farmEngine.collectFacility('coop');
  assert.strictEqual(coopRes.success, true);
  assert.strictEqual(coopRes.collected.id, 'produce_egg');
  assert.strictEqual(coopRes.collected.quantity, 10);
  assert.strictEqual(state.facilities.coop.currentYield, 0);
  assert.strictEqual(state.stats.eggsCollected, initialEggs + 10);

  // Simulate 15 minutes elapsed for barn (cycle = 3 min, output = 1 milk -> 5 cycles = 5 milks)
  state.facilities.barn.lastCollectedAt = Date.now() - (15 * 60 * 1000);
  farmEngine.updateIdleProduction();
  assert.strictEqual(state.facilities.barn.currentYield, 5);

  const initialMilk = state.stats.milkProduced || 0;
  const barnRes = farmEngine.collectFacility('barn');
  assert.strictEqual(barnRes.success, true);
  assert.strictEqual(barnRes.collected.id, 'produce_milk');
  assert.strictEqual(barnRes.collected.quantity, 5);
  assert.strictEqual(state.facilities.barn.currentYield, 0);
  assert.strictEqual(state.stats.milkProduced, initialMilk + 5);
});

test('FarmEngine: Artisan processors (cheese press, mayo machine, preserves jar) lifecycle', (t) => {
  const state = farmEngine.getState();
  assert.ok(state.processors, 'Processors object exists');
  assert.ok(state.processors.cheese_press, 'Cheese press exists');
  assert.ok(state.processors.mayo_machine, 'Mayo machine exists');
  assert.ok(state.processors.preserves_jar, 'Preserves jar exists');

  // Reset processor states
  state.processors.cheese_press.status = 'IDLE';
  state.processors.mayo_machine.status = 'IDLE';
  state.processors.preserves_jar.status = 'IDLE';

  // Add required raw ingredients to inventory
  farmEngine.addItemToInventory('produce_milk', 2, 'normal');
  farmEngine.addItemToInventory('produce_egg', 3, 'normal');
  farmEngine.addItemToInventory('crop_strawberry', 5, 'normal');

  // 1. Start cheese press
  const cheeseRes = farmEngine.startProcessor('cheese_press');
  assert.strictEqual(cheeseRes.success, true);
  assert.strictEqual(state.processors.cheese_press.status, 'PROCESSING');
  assert.strictEqual(state.processors.cheese_press.inputItem.id, 'produce_milk');

  // 2. Start mayo machine
  const mayoRes = farmEngine.startProcessor('mayo_machine');
  assert.strictEqual(mayoRes.success, true);
  assert.strictEqual(state.processors.mayo_machine.status, 'PROCESSING');

  // 3. Start preserves jar (requires 2 strawberries) — clean all existing strawberries to isolate test
  state.inventory = state.inventory.filter(i => i.id !== 'crop_strawberry');
  farmEngine.addItemToInventory('crop_strawberry', 5, 'normal');
  const strawberryCountBefore = state.inventory.find(i => i.id === 'crop_strawberry').quantity;
  const jarRes = farmEngine.startProcessor('preserves_jar');
  assert.strictEqual(jarRes.success, true);
  assert.strictEqual(state.processors.preserves_jar.status, 'PROCESSING');
  assert.strictEqual(state.inventory.find(i => i.id === 'crop_strawberry').quantity, strawberryCountBefore - 2);

  // Advance time to complete all 3
  state.processors.cheese_press.completedAt = Date.now() - 1000;
  state.processors.mayo_machine.completedAt = Date.now() - 1000;
  state.processors.preserves_jar.completedAt = Date.now() - 1000;

  farmEngine.updateIdleProduction();
  assert.strictEqual(state.processors.cheese_press.status, 'COMPLETED');
  assert.strictEqual(state.processors.mayo_machine.status, 'COMPLETED');
  assert.strictEqual(state.processors.preserves_jar.status, 'COMPLETED');

  // 4. Collect processed outputs
  const collectCheese = farmEngine.collectProcessor('cheese_press');
  assert.strictEqual(collectCheese.success, true);
  assert.strictEqual(collectCheese.collected.outputId, 'artisan_cheese');
  assert.strictEqual(state.processors.cheese_press.status, 'IDLE');
  assert.ok(state.inventory.some(i => i.id === 'artisan_cheese'), 'Cheese in inventory');

  const collectMayo = farmEngine.collectProcessor('mayo_machine');
  assert.strictEqual(collectMayo.success, true);
  assert.strictEqual(collectMayo.collected.outputId, 'artisan_mayo');
  assert.ok(state.inventory.some(i => i.id === 'artisan_mayo'), 'Mayo in inventory');

  const collectJam = farmEngine.collectProcessor('preserves_jar');
  assert.strictEqual(collectJam.success, true);
  assert.strictEqual(collectJam.collected.outputId, 'artisan_jam');
  assert.ok(state.inventory.some(i => i.id === 'artisan_jam'), 'Jam in inventory');

  // 5. Verify selling artisan product in EconomyEngine (Base 145G)
  const cheeseItem = state.inventory.find(i => i.id === 'artisan_cheese');
  const moneyBefore = state.player.money;
  const sellRes = economyEngine.sellItem(cheeseItem.slot, 1);
  assert.strictEqual(sellRes.success, true);
  assert.strictEqual(sellRes.sold.totalPrice, 145);
  assert.strictEqual(state.player.money, moneyBefore + 145);
});

test('FarmEngine: Offline processor completion and report generation', (t) => {
  const state = farmEngine.getState();
  state.processors.mayo_machine.status = 'IDLE';
  farmEngine.addItemToInventory('produce_egg', 1, 'normal');

  farmEngine.startProcessor('mayo_machine');
  assert.strictEqual(state.processors.mayo_machine.status, 'PROCESSING');

  // Simulate 10 minutes ago
  const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
  state.lastActive = tenMinutesAgo;
  state.processors.mayo_machine.startedAt = tenMinutesAgo;
  state.processors.mayo_machine.completedAt = tenMinutesAgo + 60000;
  state.offlineReport = null;

  farmEngine.processOfflineProgress();

  assert.ok(state.offlineReport, 'Offline report generated');
  assert.ok(state.offlineReport.processorYields, 'Processor yields exist in report');
  assert.ok(state.offlineReport.processorYields.some(p => p.processorId === 'mayo_machine'), 'Mayo completed offline');
  assert.strictEqual(state.processors.mayo_machine.status, 'COMPLETED');

  farmEngine.acknowledgeOfflineReport();
  assert.strictEqual(state.offlineReport, null);
});

test('FarmEngine: Warehouse capacity and progressive upgrades', (t) => {
  const state = farmEngine.getState();
  assert.ok(state.warehouse, 'Warehouse exists');
  state.warehouse.level = 1;
  state.warehouse.capacity = 40;

  // Attempt upgrade without sufficient resources
  state.player.money = 0;
  assert.throws(() => {
    farmEngine.upgradeWarehouse();
  }, /Ouro insuficiente/);

  // Give gold but no wood
  state.player.money = 500;
  const woodInInv = state.inventory.find(i => i.id === 'material_wood');
  if (woodInInv) woodInInv.quantity = 0;

  assert.throws(() => {
    farmEngine.upgradeWarehouse();
  }, /Madeira insuficiente/);

  // Give required 25 wood for Level 2 (cost 400G)
  farmEngine.addItemToInventory('material_wood', 30, 'normal');
  const upg2Res = farmEngine.upgradeWarehouse();
  assert.strictEqual(upg2Res.success, true);
  assert.strictEqual(state.warehouse.level, 2);
  assert.strictEqual(state.warehouse.capacity, 80);
  assert.strictEqual(state.player.money, 100); // 500 - 400 = 100

  // Upgrade to Level 3 (cost 1000G + 60 wood -> 160 capacity)
  state.player.money = 1200;
  farmEngine.addItemToInventory('material_wood', 60, 'normal');
  const upg3Res = farmEngine.upgradeWarehouse();
  assert.strictEqual(upg3Res.success, true);
  assert.strictEqual(state.warehouse.level, 3);
  assert.strictEqual(state.warehouse.capacity, 160);

  // Attempt upgrade past maximum level
  assert.throws(() => {
    farmEngine.upgradeWarehouse();
  }, /nível máximo de expansão/);
});


// =====================================================================
// CICLO 12: Marketplace entre Jogadores
// =====================================================================

test('Marketplace: NPC listings exist after initialization', () => {
  const listings = marketplaceEngine.getListings();
  assert.ok(listings.length >= 5, 'Should have at least 5 NPC listings');
  const npcListing = listings.find(l => l.sellerId !== 'player');
  assert.ok(npcListing, 'At least one NPC listing should exist');
  assert.ok(npcListing.itemId, 'NPC listing has an itemId');
  assert.ok(npcListing.unitPrice > 0, 'NPC listing has a positive price');
  assert.ok(['ACTIVE', 'PARTIALLY_SOLD'].includes(npcListing.status), 'NPC listing is active');
});

test('Marketplace: createListing — success with valid item in inventory', () => {
  const state = farmEngine.getState();
  state.player.money = 500;
  // Add strawberries to inventory
  farmEngine.addItemToInventory('crop_strawberry', 10, 'normal');
  const invBefore = state.inventory.find(i => i.id === 'crop_strawberry' && i.quality === 'normal');
  const qtyBefore = invBefore ? invBefore.quantity : 10;

  const result = marketplaceEngine.createListing('crop_strawberry', 5, 60, 'normal');
  assert.strictEqual(result.success, true);
  assert.ok(result.listing, 'Listing returned');
  assert.strictEqual(result.listing.itemId, 'crop_strawberry');
  assert.strictEqual(result.listing.quantity, 5);
  assert.strictEqual(result.listing.remainingQuantity, 5);
  assert.strictEqual(result.listing.unitPrice, 60);
  assert.strictEqual(result.listing.sellerId, 'player');
  assert.strictEqual(result.listing.status, 'ACTIVE');

  // Item should have been deducted from inventory
  const invAfter = state.inventory.find(i => i.id === 'crop_strawberry' && i.quality === 'normal');
  const qtyAfter = invAfter ? invAfter.quantity : 0;
  assert.strictEqual(qtyAfter, qtyBefore - 5, 'Item deducted from inventory on listing creation');
});

test('Marketplace: createListing — fails if item quantity insufficient', () => {
  const state = farmEngine.getState();
  // Remove artisan_jam if present
  const idx = state.inventory.findIndex(i => i.id === 'artisan_jam');
  if (idx !== -1) state.inventory.splice(idx, 1);

  assert.throws(() => {
    marketplaceEngine.createListing('artisan_jam', 50, 100, 'normal');
  }, /não possui/);
});

test('Marketplace: createListing — fails for tool category', () => {
  assert.throws(() => {
    marketplaceEngine.createListing('tool_hoe', 1, 50, 'normal');
  }, /Ferramentas/);
});

test('Marketplace: buyFromListing — full purchase success with 5% fee', () => {
  const state = farmEngine.getState();
  // Find a NPC listing
  const listings = marketplaceEngine.getListings();
  const npcListing = listings.find(l => l.sellerId !== 'player');
  assert.ok(npcListing, 'NPC listing must exist to test buying');

  const buyQty = 2;
  const subtotal = npcListing.unitPrice * buyQty;
  const fee = Math.ceil(subtotal * 0.05);
  const totalCost = subtotal + fee;

  state.player.money = totalCost + 100; // ensure enough gold
  const moneyBefore = state.player.money;

  const result = marketplaceEngine.buyFromListing(npcListing.id, buyQty);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.purchased.quantity, buyQty);
  assert.strictEqual(result.purchased.fee, fee);
  assert.strictEqual(result.purchased.totalCost, totalCost);
  assert.strictEqual(state.player.money, moneyBefore - totalCost, 'Gold deducted including fee');
  // Item should be in inventory
  const invItem = state.inventory.find(i => i.id === npcListing.itemId && i.quality === npcListing.quality);
  assert.ok(invItem && invItem.quantity >= buyQty, 'Item added to inventory');
});

test('Marketplace: buyFromListing — partial buy updates remainingQuantity', () => {
  const state = farmEngine.getState();
  state.player.money = 50000;

  const listings = marketplaceEngine.getListings();
  // Find a large-quantity NPC listing
  const npcListing = listings.find(l => l.sellerId !== 'player' && l.remainingQuantity >= 10);
  assert.ok(npcListing, 'Large NPC listing must exist');

  const buyQty = 1;
  const qtyBefore = npcListing.remainingQuantity;

  const result = marketplaceEngine.buyFromListing(npcListing.id, buyQty);
  assert.strictEqual(result.success, true);
  assert.strictEqual(npcListing.remainingQuantity, qtyBefore - buyQty, 'remainingQuantity decremented');
  assert.ok(
    npcListing.status === 'PARTIALLY_SOLD' || npcListing.status === 'SOLD',
    'Listing status updated'
  );
});

test('Marketplace: buyFromListing — fails with insufficient gold', () => {
  const state = farmEngine.getState();
  const listings = marketplaceEngine.getListings();
  const npcListing = listings.find(l => l.sellerId !== 'player');
  assert.ok(npcListing, 'NPC listing must exist');

  state.player.money = 0; // no gold

  assert.throws(() => {
    marketplaceEngine.buyFromListing(npcListing.id, 1);
  }, /insuficiente/);
});

test('Marketplace: buyFromListing — fails when buying own listing', () => {
  const state = farmEngine.getState();
  state.player.money = 50000;

  // Create a player listing first
  farmEngine.addItemToInventory('material_wood', 5, 'normal');
  const createResult = marketplaceEngine.createListing('material_wood', 3, 10, 'normal');
  const playerListingId = createResult.listing.id;

  assert.throws(() => {
    marketplaceEngine.buyFromListing(playerListingId, 1);
  }, /próprio anúncio/);

  // Cleanup: cancel it
  marketplaceEngine.cancelListing(playerListingId);
});

test('Marketplace: cancelListing — returns items to inventory', () => {
  const state = farmEngine.getState();
  state.player.money = 500;

  farmEngine.addItemToInventory('produce_egg', 8, 'normal');

  const createResult = marketplaceEngine.createListing('produce_egg', 6, 40, 'normal');
  const listingId = createResult.listing.id;

  const invBeforeCancel = state.inventory.find(i => i.id === 'produce_egg' && i.quality === 'normal');
  const qtyBeforeCancel = invBeforeCancel ? invBeforeCancel.quantity : 0;

  const cancelResult = marketplaceEngine.cancelListing(listingId);
  assert.strictEqual(cancelResult.success, true);
  assert.strictEqual(cancelResult.returnedQuantity, 6);
  assert.strictEqual(cancelResult.listing.status, 'CANCELLED');

  const invAfterCancel = state.inventory.find(i => i.id === 'produce_egg' && i.quality === 'normal');
  const qtyAfterCancel = invAfterCancel ? invAfterCancel.quantity : 0;
  assert.strictEqual(qtyAfterCancel, qtyBeforeCancel + 6, 'Items returned to inventory on cancel');
});

test('Marketplace: getPlayerListings — returns only player listings', () => {
  const state = farmEngine.getState();
  state.player.money = 500;

  // Clear existing player listings first
  for (const l of marketplaceEngine.getPlayerListings()) {
    if (l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD') {
      marketplaceEngine.cancelListing(l.id);
    }
  }

  // Create one player listing
  farmEngine.addItemToInventory('crop_potato', 5, 'normal');
  marketplaceEngine.createListing('crop_potato', 3, 45, 'normal');

  const playerListings = marketplaceEngine.getPlayerListings();
  assert.ok(playerListings.length >= 1, 'Player has at least one listing');
  for (const l of playerListings) {
    assert.strictEqual(l.sellerId, 'player', 'All returned listings belong to player');
  }
});

// =====================================================================
// CICLO 13: Sazonalidade — Novos Cultivos e Validação por Estação
// =====================================================================

test('Sazonalidade: Mirtilo cresce no Verão — sucesso no plantio', () => {
  const state = farmEngine.getState();
  state.player.money = 500;
  state.time.season = 'Verão';
  const tile = Object.values(state.farm.tiles)[0];
  tile.state = 'tilled';
  tile.crop = null;
  const [cx, cy] = Object.keys(state.farm.tiles)[0].split(',').map(Number);
  farmEngine.addItemToInventory('seeds_blueberry', 3, 'normal');
  const result = farmEngine.plantCrop(cx, cy, 'seeds_blueberry');
  assert.strictEqual(result.success, true);
  assert.strictEqual(tile.crop.id, 'blueberry');
  tile.crop = null;
  state.time.season = 'Primavera'; // Reset season after test
});

test('Sazonalidade: Mirtilo não cresce na Primavera — erro de estação', () => {
  const state = farmEngine.getState();
  state.time.season = 'Primavera';
  const tile = Object.values(state.farm.tiles)[0];
  tile.state = 'tilled';
  tile.crop = null;
  const [cx, cy] = Object.keys(state.farm.tiles)[0].split(',').map(Number);
  farmEngine.addItemToInventory('seeds_blueberry', 1, 'normal');
  assert.throws(() => {
    farmEngine.plantCrop(cx, cy, 'seeds_blueberry');
  }, /só cresce/);
});

test('Sazonalidade: Melancia não cresce fora do Verão — erro de estação', () => {
  const state = farmEngine.getState();
  state.time.season = 'Outono';
  const tile = Object.values(state.farm.tiles)[0];
  tile.state = 'tilled';
  tile.crop = null;
  const [cx, cy] = Object.keys(state.farm.tiles)[0].split(',').map(Number);
  farmEngine.addItemToInventory('seeds_melon', 1, 'normal');
  assert.throws(() => {
    farmEngine.plantCrop(cx, cy, 'seeds_melon');
  }, /só cresce/);
});

test('Sazonalidade: Abóbora cresce no Outono — sucesso no plantio', () => {
  const state = farmEngine.getState();
  state.player.money = 500;
  state.time.season = 'Outono';
  const tile = Object.values(state.farm.tiles)[0];
  tile.state = 'tilled';
  tile.crop = null;
  const [cx, cy] = Object.keys(state.farm.tiles)[0].split(',').map(Number);
  farmEngine.addItemToInventory('seeds_pumpkin', 1, 'normal');
  const result = farmEngine.plantCrop(cx, cy, 'seeds_pumpkin');
  assert.strictEqual(result.success, true);
  assert.strictEqual(tile.crop.id, 'pumpkin');
  tile.crop = null;
});

test('Sazonalidade: Uva cresce no Outono — sucesso no plantio', () => {
  const state = farmEngine.getState();
  state.player.money = 500;
  state.time.season = 'Outono';
  const tile = Object.values(state.farm.tiles)[0];
  tile.state = 'tilled';
  tile.crop = null;
  const [cx, cy] = Object.keys(state.farm.tiles)[0].split(',').map(Number);
  farmEngine.addItemToInventory('seeds_grape', 1, 'normal');
  const result = farmEngine.plantCrop(cx, cy, 'seeds_grape');
  assert.strictEqual(result.success, true);
  assert.strictEqual(tile.crop.id, 'grape');
  tile.crop = null;
});

test('Sazonalidade: Inverno bloqueia qualquer plantio', () => {
  const state = farmEngine.getState();
  state.time.season = 'Inverno';
  const tile = Object.values(state.farm.tiles)[0];
  tile.state = 'tilled';
  tile.crop = null;
  const [cx, cy] = Object.keys(state.farm.tiles)[0].split(',').map(Number);
  farmEngine.addItemToInventory('seeds_strawberry', 1, 'normal');
  assert.throws(() => {
    farmEngine.plantCrop(cx, cy, 'seeds_strawberry');
  }, /Inverno/);
  state.time.season = 'Primavera';
});

test('Sazonalidade: getSeasonalCrops() retorna apenas cultivos da estação atual', () => {
  const state = farmEngine.getState();
  state.time.season = 'Verão';
  const result = farmEngine.getSeasonalCrops();
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.season, 'Verão');
  const ids = result.crops.map(c => c.id);
  assert.ok(ids.includes('blueberry'), 'Verão deve ter mirtilo');
  assert.ok(ids.includes('melon'), 'Verão deve ter melancia');
  assert.ok(!ids.includes('strawberry'), 'Verão não deve ter morango (Primavera)');
  assert.ok(!ids.includes('pumpkin'), 'Verão não deve ter abóbora (Outono)');
  state.time.season = 'Primavera';
});

