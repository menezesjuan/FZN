const test = require('node:test');
const assert = require('node:assert');
const authService = require('../src/services/authService');
const farmService = require('../src/services/farmService');
const durabilityService = require('../src/services/durabilityService');
const animalService = require('../src/services/animalService');
const npcShopService = require('../src/services/npcShopService');
const marketEngine = require('../src/services/marketEngine');
const ledgerService = require('../src/services/ledgerService');
const { db } = require('../src/db/database');

test('Complete End-to-End Game Flow (Auth, Farming, Durability, Animal, Market & Ledger)', async (t) => {
  const ts = Date.now();
  const username = `farmer_${ts}`;
  const email = `${username}@test.com`;
  const password = 'FarmPassword2026!';

  // 1. User Registration
  const auth = authService.register(username, email, password);
  assert.ok(auth.token);
  const userId = auth.user.id;

  // 2. Initial Farm State
  const state = farmService.getFarmState(userId);
  assert.equal(state.wallet.coins, 150);
  assert.equal(state.tiles.length, 4);
  assert.equal(state.animals.length, 1);
  assert.equal(state.tools.length, 5);

  // 3. Plant Wheat
  const emptyTile = state.tiles[0];
  const plantResult = farmService.plantCrop(userId, emptyTile.id, 'seed_wheat');
  const plantedTile = plantResult.tiles.find(t => t.id === emptyTile.id);
  assert.equal(plantedTile.state, 'GROWING');
  assert.equal(plantedTile.crop_id, 'wheat');

  // 4. Water Plot (consumes watering can durability)
  const initialWaterTool = state.tools.find(t => t.tool_id === 'watering_can');
  const waterResult = farmService.waterPlot(userId, emptyTile.id);
  assert.equal(waterResult.tool.durability, initialWaterTool.durability - 1);

  // 5. Fast-forward growth in DB and Harvest
  db.prepare("UPDATE farm_tiles SET planted_at = ?, harvest_ready_at = ?, state = 'READY' WHERE id = ?")
    .run(Date.now() - 30000, Date.now() - 10000, emptyTile.id);

  const harvestResult = farmService.harvestCrop(userId, emptyTile.id);
  assert.equal(harvestResult.harvestedItem, 'wheat');
  assert.equal(harvestResult.yield, 2);

  // 6. Sell 1 wheat to NPC Shop
  const sellResult = npcShopService.sellItem(userId, 'wheat', 1);
  assert.equal(sellResult.revenue, 16);

  // 7. Buy 1 radish seed from NPC Shop
  const buyResult = npcShopService.buySeed(userId, 'seed_radish', 1);
  assert.equal(buyResult.cost, 12);

  // 8. Repair Watering Can
  const repairResult = durabilityService.repairTool(userId, 'watering_can');
  assert.equal(repairResult.durability, initialWaterTool.max_durability);

  // 9. Feed starter chicken
  const chicken = state.animals[0];
  const feedResult = animalService.feedAnimal(userId, chicken.id);
  assert.ok(feedResult.animal.fed_today === 1);

  // 10. Collect Egg
  db.prepare('UPDATE animals SET last_collected_at = 0 WHERE id = ?').run(chicken.id);
  const collectResult = animalService.collectProduce(userId, chicken.id);
  assert.equal(collectResult.product, 'egg');
  assert.equal(collectResult.animal.production_cycles, 1);

  // 11. Ledger Integrity Check
  const history = ledgerService.getLedgerHistory(userId, 20);
  assert.ok(history.length >= 4, 'Ledger must contain at least 4 transaction history entries');
  console.log(`✓ End-to-end integration verified. Total ledger transactions recorded: ${history.length}`);
});
