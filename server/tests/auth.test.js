const test = require('node:test');
const assert = require('node:assert');
const authService = require('../src/services/authService');
const { db } = require('../src/db/database');

test('Auth Service: Register, Hashing, Wallet, Farm and Login', (t) => {
  const username = 'testuser_' + Date.now();
  const email = `${username}@example.com`;
  const password = 'SecretPassword123!';

  // 1. Register
  const regResult = authService.register(username, email, password);
  assert.ok(regResult.token, 'Token must be generated');
  assert.equal(regResult.user.username, username);

  // 2. Verify DB state
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(regResult.user.id);
  assert.ok(user, 'User must exist in DB');
  assert.notEqual(user.password_hash, password, 'Password must never be plaintext');
  assert.ok(user.password_hash.startsWith('$2'), 'Must be bcrypt hash');

  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(user.id);
  assert.equal(wallet.coins, 150.0, 'Starting balance must be 150');

  const farm = db.prepare('SELECT * FROM farms WHERE user_id = ?').get(user.id);
  assert.ok(farm, 'Farm must be created');

  const tiles = db.prepare('SELECT * FROM farm_tiles WHERE farm_id = ?').all(farm.id);
  assert.ok(tiles.length >= 4, 'Must have initial plots');

  const inventory = db.prepare('SELECT * FROM inventories WHERE user_id = ?').all(user.id);
  assert.ok(inventory.length >= 2, 'Starter seeds must be in inventory');

  const tools = db.prepare('SELECT * FROM tools WHERE user_id = ?').all(user.id);
  assert.ok(tools.length >= 4, 'Starter tools must be created');

  // 3. Login
  const loginResult = authService.login(username, password);
  assert.ok(loginResult.token, 'Login must return token');
  assert.equal(loginResult.user.id, user.id);

  // 4. Invalid Login
  assert.throws(() => {
    authService.login(username, 'WrongPassword');
  }, /Credenciais inválidas/);
});
