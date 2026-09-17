const test = require('node:test');
const assert = require('node:assert');
const authService = require('../src/services/authService');
const contractService = require('../src/services/contractService');
const eventService = require('../src/services/eventService');
const ledgerService = require('../src/services/ledgerService');
const { db } = require('../src/db/database');
const crypto = require('crypto');

test('Contracts & Events: Acceptance, Delivery, Ledger Reward & Seasonal Multipliers', (t) => {
  const user = authService.register('contract_farmer_' + Date.now(), `cf_${Date.now()}@test.com`, 'testpass123');

  // 1. Fetch contracts
  const contracts = contractService.getContracts(user.user.id);
  assert.ok(contracts.length >= 3, 'Must have at least 3 contracts available');

  const selected = contracts[0];
  assert.equal(selected.status, 'AVAILABLE');

  // 2. Accept contract
  const accepted = contractService.acceptContract(user.user.id, selected.id);
  assert.equal(accepted.contract.status, 'ACCEPTED');

  // 3. Attempt delivery without required goods -> should fail gracefully
  assert.throws(() => {
    contractService.deliverContract(user.user.id, selected.id);
  }, /Estoque insuficiente/);

  // 4. Provide required goods in inventory
  db.prepare(`
    INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
    VALUES (?, ?, ?, ?, 0, 'normal')
  `).run('inv_' + crypto.randomUUID(), user.user.id, selected.item_id, selected.required_quantity + 5);

  const initialWallet = ledgerService.getWallet(user.user.id);

  // 5. Deliver contract
  const delivery = contractService.deliverContract(user.user.id, selected.id);
  assert.equal(delivery.reward, selected.reward_coins);

  // Verify wallet received reward
  const finalWallet = ledgerService.getWallet(user.user.id);
  assert.equal(finalWallet.coins, initialWallet.coins + selected.reward_coins);

  // Verify contract is COMPLETED in DB
  const completedContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(selected.id);
  assert.equal(completedContract.status, 'COMPLETED');

  // 6. Verify Seasonal Events
  const event = eventService.getCurrentEvent();
  assert.ok(event.id);
  assert.ok(event.title);
  const mult = eventService.getItemPriceMultiplier('tomato');
  assert.ok(mult >= 1.0);
});
