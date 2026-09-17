const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../db/database');
const ledgerService = require('./ledgerService');
const { economyConfig } = require('../config/economyConfig');

const JWT_SECRET = process.env.JWT_SECRET || 'fzn_super_secret_jwt_key_2026';

class AuthService {
  register(username, email, password) {
    if (!username || username.trim().length < 3) {
      throw new Error('Nome de usuário deve ter no mínimo 3 caracteres.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('E-mail inválido.');
    }
    if (!password || password.length < 6) {
      throw new Error('Senha deve ter no mínimo 6 caracteres.');
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (existing) {
      throw new Error('Nome de usuário ou e-mail já cadastrado.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = 'usr_' + crypto.randomUUID();
    const now = Date.now();

    const tx = db.transaction(() => {
      // 1. Insert User
      db.prepare(`
        INSERT INTO users (id, username, email, password_hash, role, created_at, last_login)
        VALUES (?, ?, ?, ?, 'farmer', ?, ?)
      `).run(userId, cleanUsername, cleanEmail, passwordHash, now, now);

      // 2. Initialize Wallet with starting coins & record in ledger
      db.prepare(`
        INSERT INTO wallets (user_id, coins, premium_currency, pending_rmt, available_rmt)
        VALUES (?, ?, 0, 0, 0)
      `).run(userId, economyConfig.currency.startingCoins);

      db.prepare(`
        INSERT INTO ledger (transaction_id, user_id, type, asset, amount, balance_before, balance_after, reference, timestamp, status)
        VALUES (?, ?, 'ONBOARDING_BONUS', 'coins', ?, 0, ?, 'Saldo inicial de boas-vindas', ?, 'COMPLETED')
      `).run('tx_' + crypto.randomUUID(), userId, economyConfig.currency.startingCoins, economyConfig.currency.startingCoins, now);

      // 3. Create User Farm
      const farmId = 'farm_' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO farms (id, user_id, name, level, xp, storage_capacity, offline_limit_hours, created_at)
        VALUES (?, ?, ?, 1, 0, ?, ?, ?)
      `).run(farmId, userId, `Fazenda de ${cleanUsername}`, economyConfig.currency.startingStorage, economyConfig.offline.defaultLimitHours, now);

      // 4. Create Initial Farm Plots (4 plots in 2x2 cluster, matching the visual layout)
      const plotCoords = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ];
      const insertTile = db.prepare(`
        INSERT INTO farm_tiles (id, farm_id, tile_x, tile_y, type, state, watered, growth_stage)
        VALUES (?, ?, ?, ?, 'soil', 'EMPTY', 0, 0)
      `);
      plotCoords.forEach(p => {
        insertTile.run('tile_' + crypto.randomUUID(), farmId, p.x, p.y);
      });

      // 5. Provide Starter Seeds in Inventory
      const insertInventory = db.prepare(`
        INSERT INTO inventories (id, user_id, item_id, quantity, reserved, quality)
        VALUES (?, ?, ?, ?, 0, 'normal')
      `);
      insertInventory.run('inv_' + crypto.randomUUID(), userId, 'seed_wheat', 6);
      insertInventory.run('inv_' + crypto.randomUUID(), userId, 'seed_tomato', 4);

      // 6. Provide Starter Tools with Max Durability
      const insertTool = db.prepare(`
        INSERT INTO tools (id, user_id, tool_id, durability, max_durability, condition)
        VALUES (?, ?, ?, ?, ?, 'Good')
      `);
      Object.entries(economyConfig.tools).forEach(([toolKey, toolDef]) => {
        insertTool.run('tool_' + crypto.randomUUID(), userId, toolKey, toolDef.maxDurability, toolDef.maxDurability);
      });

      // 7. Add starter chicken for the ranch
      const insertAnimal = db.prepare(`
        INSERT INTO animals (id, farm_id, animal_type, name, birth_date, age_days, lifespan_days, production_cycles, max_production_cycles, health, fed_today, status)
        VALUES (?, ?, 'chicken', 'Pipoca', ?, 0, 180, 0, 120, 100, 1, 'ACTIVE')
      `);
      insertAnimal.run('anim_' + crypto.randomUUID(), farmId, now);
    });

    tx();

    const token = this.generateToken(userId, cleanUsername);
    return {
      token,
      user: {
        id: userId,
        username: cleanUsername,
        email: cleanEmail
      }
    };
  }

  login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      throw new Error('Usuário e senha são obrigatórios.');
    }

    const cleanInput = usernameOrEmail.trim();
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(cleanInput, cleanInput.toLowerCase());
    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      throw new Error('Credenciais inválidas.');
    }

    const now = Date.now();
    db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(now, user.id);

    const token = this.generateToken(user.id, user.username);
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  }

  generateToken(userId, username) {
    return jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }
}

module.exports = new AuthService();
