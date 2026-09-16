const express = require('express');
const router = express.Router();
const farmEngine = require('../services/farmEngine');
const economyEngine = require('../services/economyEngine');
const marketplaceEngine = require('../services/marketplaceEngine');
const cropsConfig = require('../config/crops.json');
const itemsConfig = require('../config/items.json');
const processorsConfig = require('../config/processors.json');

// Get current authoritative state
router.get('/state', (req, res) => {
  try {
    const state = farmEngine.getState();
    const catalog = economyEngine.getShopCatalog();
    res.json({
      success: true,
      state,
      catalog,
      cropsConfig,
      itemsConfig,
      processorsConfig
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Till tile
router.post('/farm/till', (req, res) => {
  try {
    const { x, y } = req.body;
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ success: false, error: "Coordenadas inválidas." });
    }
    const result = farmEngine.tillTile(x, y);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Water tile
router.post('/farm/water', (req, res) => {
  try {
    const { x, y } = req.body;
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ success: false, error: "Coordenadas inválidas." });
    }
    const result = farmEngine.waterTile(x, y);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Plant crop
router.post('/farm/plant', (req, res) => {
  try {
    const { x, y, seedId } = req.body;
    if (typeof x !== 'number' || typeof y !== 'number' || !seedId) {
      return res.status(400).json({ success: false, error: "Parâmetros inválidos para plantio." });
    }
    const result = farmEngine.plantCrop(x, y, seedId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Harvest crop
router.post('/farm/harvest', (req, res) => {
  try {
    const { x, y } = req.body;
    if (typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ success: false, error: "Coordenadas inválidas." });
    }
    const result = farmEngine.harvestCrop(x, y);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Collect fresh egg
router.post('/farm/collect-egg', (req, res) => {
  try {
    const { eggId, x, y } = req.body;
    const result = farmEngine.collectEgg(eggId, x, y);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Chop tree on farm
router.post('/farm/chop-tree', (req, res) => {
  try {
    const { treeId, x, y } = req.body;
    const result = farmEngine.chopTree(treeId, x, y);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Milk cow
router.post('/farm/milk-cow', (req, res) => {
  try {
    const { cowId, x, y } = req.body;
    const result = farmEngine.milkCow(cowId, x, y);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Pet animal
router.post('/farm/pet-animal', (req, res) => {
  try {
    const { animalId } = req.body;
    const result = farmEngine.petAnimal(animalId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Buy item
router.post('/shop/buy', (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const result = economyEngine.buyItem(itemId, Number(quantity) || 1);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Sell item
router.post('/shop/sell', (req, res) => {
  try {
    const { slotIndex, quantity } = req.body;
    const result = economyEngine.sellItem(Number(slotIndex), Number(quantity) || 1);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update player position
router.post('/player/move', (req, res) => {
  try {
    const { x, y } = req.body;
    const state = farmEngine.getState();
    if (typeof x === 'number' && typeof y === 'number') {
      state.player.position = { x, y };
      farmEngine.save();
    }
    res.json({ success: true, position: state.player.position });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Sleep in farmhouse
router.post('/player/sleep', (req, res) => {
  try {
    const result = farmEngine.sleep();
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Transition location (farm <-> house_interior)
router.post('/player/transition-location', (req, res) => {
  try {
    const { location, x, y } = req.body;
    const result = farmEngine.transitionLocation(location, x, y);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Storage Chest: Deposit item
router.post('/chest/deposit', (req, res) => {
  try {
    const { inventorySlot, quantity, targetChestSlot } = req.body;
    const result = farmEngine.depositToChest(inventorySlot, quantity, targetChestSlot);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Storage Chest: Withdraw item
router.post('/chest/withdraw', (req, res) => {
  try {
    const { chestSlot, quantity, targetInventorySlot } = req.body;
    const result = farmEngine.withdrawFromChest(chestSlot, quantity, targetInventorySlot);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Storage Chest: Quick Stack
router.post('/chest/quick-stack', (req, res) => {
  try {
    const result = farmEngine.quickStackChest();
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Dev helper: advance crop time
router.post('/dev/advance-time', (req, res) => {
  try {
    const seconds = Number(req.body.seconds) || 60;
    const updated = farmEngine.advanceCropTime(seconds);
    res.json({ success: true, state: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Dev helper: restore energy
router.post('/dev/restore-energy', (req, res) => {
  try {
    const state = farmEngine.getState();
    state.player.energy = state.player.maxEnergy;
    farmEngine.save();
    res.json({ success: true, energy: state.player.energy });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Weather: Get forecast for today and tomorrow
router.get('/weather/forecast', (req, res) => {
  try {
    const result = farmEngine.getWeatherForecast();
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Dev helper: set weather
router.post('/dev/set-weather', (req, res) => {
  try {
    const { weather, tomorrowWeather } = req.body;
    const state = farmEngine.getState();
    if (weather) state.weather = weather;
    if (tomorrowWeather) state.tomorrowWeather = tomorrowWeather;
    farmEngine.save();
    res.json({ success: true, weather: state.weather, tomorrowWeather: state.tomorrowWeather });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Idle Management: Start plot production
router.post('/idle/start-plot', (req, res) => {
  try {
    const { plotId, cropId } = req.body;
    if (!plotId || !cropId) {
      return res.status(400).json({ success: false, error: "plotId e cropId são obrigatórios." });
    }
    const result = farmEngine.startPlotProduction(plotId, cropId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Idle Management: Collect mature plot
router.post('/idle/collect-plot', (req, res) => {
  try {
    const { plotId } = req.body;
    if (!plotId) {
      return res.status(400).json({ success: false, error: "plotId é obrigatório." });
    }
    const result = farmEngine.collectPlot(plotId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Idle Management: Collect all mature plots
router.post('/idle/collect-all', (req, res) => {
  try {
    const result = farmEngine.collectAllPlots();
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Idle Management: Collect facility yield (coop, barn)
router.post('/idle/collect-facility', (req, res) => {
  try {
    const { facilityId } = req.body;
    if (!facilityId) {
      return res.status(400).json({ success: false, error: "facilityId é obrigatório." });
    }
    const result = farmEngine.collectFacility(facilityId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Idle Management: Acknowledge offline report
router.post('/idle/acknowledge-offline', (req, res) => {
  try {
    const result = farmEngine.acknowledgeOfflineReport();
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Dev helper: simulate offline elapsed time
router.post('/dev/simulate-offline', (req, res) => {
  try {
    const seconds = Number(req.body.seconds) || 120;
    farmEngine.processOfflineProgress(seconds * 1000);
    res.json({ success: true, state: farmEngine.getState() });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Processors: Start machine processing
router.post('/processors/start', (req, res) => {
  try {
    const { processorId } = req.body;
    if (!processorId) {
      return res.status(400).json({ success: false, error: "processorId é obrigatório." });
    }
    const result = farmEngine.startProcessor(processorId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Processors: Collect processed artisan output
router.post('/processors/collect', (req, res) => {
  try {
    const { processorId } = req.body;
    if (!processorId) {
      return res.status(400).json({ success: false, error: "processorId é obrigatório." });
    }
    const result = farmEngine.collectProcessor(processorId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Warehouse: Upgrade storage level
router.post('/warehouse/upgrade', (req, res) => {
  try {
    const result = farmEngine.upgradeWarehouse();
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Marketplace: Get active listings (optionally filter by ?itemId=)
router.get('/market/listings', (req, res) => {
  try {
    const itemId = req.query.itemId || null;
    const listings = marketplaceEngine.getListings(itemId);
    res.json({ success: true, listings });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Marketplace: Create a listing (sell)
router.post('/market/list', (req, res) => {
  try {
    const { itemId, quantity, unitPrice, quality } = req.body;
    if (!itemId || !quantity || !unitPrice) {
      return res.status(400).json({ success: false, error: 'itemId, quantity e unitPrice são obrigatórios.' });
    }
    const result = marketplaceEngine.createListing(itemId, Number(quantity), Number(unitPrice), quality);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Marketplace: Buy from a listing
router.post('/market/buy', (req, res) => {
  try {
    const { listingId, quantity } = req.body;
    if (!listingId || !quantity) {
      return res.status(400).json({ success: false, error: 'listingId e quantity são obrigatórios.' });
    }
    const result = marketplaceEngine.buyFromListing(listingId, Number(quantity));
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Marketplace: Cancel player's own listing
router.post('/market/cancel', (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) {
      return res.status(400).json({ success: false, error: 'listingId é obrigatório.' });
    }
    const result = marketplaceEngine.cancelListing(listingId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Marketplace: Get player's own listings
router.get('/market/my-listings', (req, res) => {
  try {
    const listings = marketplaceEngine.getPlayerListings();
    res.json({ success: true, listings });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
