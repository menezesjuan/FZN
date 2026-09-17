const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const farmService = require('../services/farmService');
const durabilityService = require('../services/durabilityService');
const animalService = require('../services/animalService');
const craftingService = require('../services/craftingService');
const npcShopService = require('../services/npcShopService');
const marketEngine = require('../services/marketEngine');
const ledgerService = require('../services/ledgerService');
const offlineProgressService = require('../services/offlineProgressService');
const { economyConfig } = require('../config/economyConfig');

// Middleware for authentication
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente ou inválido.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }

  req.user = payload;
  next();
}

// ----------------------------------------------------
// Public Routes
// ----------------------------------------------------
router.get('/config', (req, res) => {
  res.json({
    crops: economyConfig.crops,
    animals: economyConfig.animals,
    tools: economyConfig.tools,
    machines: economyConfig.machines,
    market: economyConfig.market
  });
});

router.get('/shop/catalog', (req, res) => {
  res.json(npcShopService.getCatalog());
});

router.get('/market/book/:itemId', (req, res) => {
  try {
    const book = marketEngine.getOrderBook(req.params.itemId);
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Auth endpoints
router.post('/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = authService.register(username, email, password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = authService.login(username, password);
    const offlineReport = offlineProgressService.calculateOffline(result.user.id);
    res.json({ ...result, offlineReport });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----------------------------------------------------
// Protected Routes (Player must be logged in)
// ----------------------------------------------------
router.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.get('/farm/state', requireAuth, (req, res) => {
  try {
    const state = farmService.getFarmState(req.user.id);
    res.json({ state });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/farm/plant', requireAuth, (req, res) => {
  try {
    const { tileId, seedId } = req.body;
    const updatedState = farmService.plantCrop(req.user.id, tileId, seedId);
    res.json({ state: updatedState });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/farm/water', requireAuth, (req, res) => {
  try {
    const { tileId } = req.body;
    const result = farmService.waterPlot(req.user.id, tileId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/farm/harvest', requireAuth, (req, res) => {
  try {
    const { tileId } = req.body;
    const result = farmService.harvestCrop(req.user.id, tileId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/farm/repair-tool', requireAuth, (req, res) => {
  try {
    const { toolId } = req.body;
    const result = durabilityService.repairTool(req.user.id, toolId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/farm/repair-all', requireAuth, (req, res) => {
  try {
    const result = durabilityService.repairAllTools(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/animals/buy', requireAuth, (req, res) => {
  try {
    const { animalType, name } = req.body;
    const animal = animalService.buyAnimal(req.user.id, animalType, name);
    res.json({ animal, message: `${animal.name} chegou à sua fazenda!` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/animals/feed', requireAuth, (req, res) => {
  try {
    const { animalId } = req.body;
    const result = animalService.feedAnimal(req.user.id, animalId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/animals/collect', requireAuth, (req, res) => {
  try {
    const { animalId } = req.body;
    const result = animalService.collectProduce(req.user.id, animalId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/machines/buy', requireAuth, (req, res) => {
  try {
    const { machineType } = req.body;
    const machines = craftingService.buyMachine(req.user.id, machineType);
    res.json({ machines });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/machines/start', requireAuth, (req, res) => {
  try {
    const { machineId, recipeId } = req.body;
    const result = craftingService.startJob(req.user.id, machineId, recipeId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/machines/claim', requireAuth, (req, res) => {
  try {
    const { machineId } = req.body;
    const result = craftingService.claimJob(req.user.id, machineId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/storage/upgrade', requireAuth, (req, res) => {
  try {
    const result = craftingService.upgradeStorage(req.user.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/shop/buy-seed', requireAuth, (req, res) => {
  try {
    const { seedId, quantity } = req.body;
    const result = npcShopService.buySeed(req.user.id, seedId, quantity || 1);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/shop/sell-item', requireAuth, (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const result = npcShopService.sellItem(req.user.id, itemId, quantity || 1);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/market/order', requireAuth, (req, res) => {
  try {
    const { type, itemId, unitPrice, quantity } = req.body;
    const order = marketEngine.createOrder(req.user.id, type, itemId, parseFloat(unitPrice), parseInt(quantity, 10));
    res.json({ order, message: `Ordem de ${type} postada com sucesso!` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/market/cancel', requireAuth, (req, res) => {
  try {
    const { orderId } = req.body;
    const result = marketEngine.cancelOrder(req.user.id, orderId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/market/my-orders', requireAuth, (req, res) => {
  try {
    const orders = marketEngine.getUserOrders(req.user.id);
    res.json({ orders });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/ledger/history', requireAuth, (req, res) => {
  try {
    const history = ledgerService.getLedgerHistory(req.user.id);
    const wallet = ledgerService.getWallet(req.user.id);
    res.json({ wallet, history });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
