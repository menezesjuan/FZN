const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('../src/routes/api');
const farmEngine = require('../src/services/farmEngine');

test('E2E API Integration: Complete Loop Test (till -> plant -> water -> grow -> harvest -> sell -> buy)', async (t) => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', apiRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  async function post(url, data) {
    const res = await fetch(`${baseUrl}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return { status: res.status, json: await res.json() };
  }

  async function get(url) {
    const res = await fetch(`${baseUrl}${url}`);
    return { status: res.status, json: await res.json() };
  }

  try {
    // 1. Get initial state
    const stateRes = await get('/state');
    assert.strictEqual(stateRes.status, 200);
    assert.strictEqual(stateRes.json.success, true);
    assert.ok(stateRes.json.state.player);

    const initialMoney = stateRes.json.state.player.money;

    // 2. Till tile (6, 6)
    farmEngine.getState().farm.tiles['6,6'].state = 'grass';
    farmEngine.getState().farm.tiles['6,6'].crop = null;

    const tillRes = await post('/farm/till', { x: 6, y: 6 });
    assert.strictEqual(tillRes.status, 200);
    assert.strictEqual(tillRes.json.success, true);
    assert.strictEqual(tillRes.json.tile.state, 'tilled');

    // 3. Plant strawberry seed (Spring crop — reset season to ensure compatibility)
    farmEngine.getState().time.season = 'Primavera';
    farmEngine.addItemToInventory('seeds_strawberry', 1, 'normal');
    const plantRes = await post('/farm/plant', { x: 6, y: 6, seedId: 'seeds_strawberry' });
    assert.strictEqual(plantRes.status, 200);
    assert.strictEqual(plantRes.json.success, true);
    assert.strictEqual(plantRes.json.tile.crop.id, 'strawberry');

    // 4. Water crop
    const waterRes = await post('/farm/water', { x: 6, y: 6 });
    assert.strictEqual(waterRes.status, 200);
    assert.strictEqual(waterRes.json.tile.isWatered, true);

    // 5. Advance time
    const advanceRes = await post('/dev/advance-time', { seconds: 300 });
    assert.strictEqual(advanceRes.status, 200);

    // 6. Harvest crop
    const harvestRes = await post('/farm/harvest', { x: 6, y: 6 });
    assert.strictEqual(harvestRes.status, 200);
    assert.strictEqual(harvestRes.json.success, true);
    assert.strictEqual(harvestRes.json.harvested.id, 'crop_strawberry');

    // 7. Sell harvest
    const harvestSlot = harvestRes.json.inventory.find(i => i.id === 'crop_strawberry').slot;
    const sellRes = await post('/shop/sell', { slotIndex: harvestSlot, quantity: 1 });
    assert.strictEqual(sellRes.status, 200);
    assert.strictEqual(sellRes.json.success, true);
    assert.ok(sellRes.json.player.money > initialMoney);

    // 8. Buy new seeds
    const moneyBeforeBuy = sellRes.json.player.money;
    const buyRes = await post('/shop/buy', { itemId: 'seeds_strawberry', quantity: 1 });
    assert.strictEqual(buyRes.status, 200);
    assert.strictEqual(buyRes.json.success, true);
    assert.strictEqual(buyRes.json.player.money, moneyBeforeBuy - 25);

  } finally {
    server.close();
  }
});
