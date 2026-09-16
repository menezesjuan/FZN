const API_BASE = '/api';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erro na comunicação com o servidor');
    }
    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  getState: () => request('/state'),
  tillTile: (x, y) => request('/farm/till', { method: 'POST', body: JSON.stringify({ x, y }) }),
  waterTile: (x, y) => request('/farm/water', { method: 'POST', body: JSON.stringify({ x, y }) }),
  plantCrop: (x, y, seedId) => request('/farm/plant', { method: 'POST', body: JSON.stringify({ x, y, seedId }) }),
  harvestCrop: (x, y) => request('/farm/harvest', { method: 'POST', body: JSON.stringify({ x, y }) }),
  collectEgg: (eggId, x, y) => request('/farm/collect-egg', { method: 'POST', body: JSON.stringify({ eggId, x, y }) }),
  chopTree: (treeId, x, y) => request('/farm/chop-tree', { method: 'POST', body: JSON.stringify({ treeId, x, y }) }),
  milkCow: (cowId, x, y) => request('/farm/milk-cow', { method: 'POST', body: JSON.stringify({ cowId, x, y }) }),
  petAnimal: (animalId) => request('/farm/pet-animal', { method: 'POST', body: JSON.stringify({ animalId }) }),
  buyItem: (itemId, quantity = 1) => request('/shop/buy', { method: 'POST', body: JSON.stringify({ itemId, quantity }) }),
  sellItem: (slotIndex, quantity = 1) => request('/shop/sell', { method: 'POST', body: JSON.stringify({ slotIndex, quantity }) }),
  updatePlayerPosition: (x, y) => request('/player/move', { method: 'POST', body: JSON.stringify({ x, y }) }),
  sleep: () => request('/player/sleep', { method: 'POST' }),
  transitionLocation: (location, x, y) => request('/player/transition-location', { method: 'POST', body: JSON.stringify({ location, x, y }) }),
  depositToChest: (inventorySlot, quantity = 1, targetChestSlot = null) => request('/chest/deposit', { method: 'POST', body: JSON.stringify({ inventorySlot, quantity, targetChestSlot }) }),
  withdrawFromChest: (chestSlot, quantity = 1, targetInventorySlot = null) => request('/chest/withdraw', { method: 'POST', body: JSON.stringify({ chestSlot, quantity, targetInventorySlot }) }),
  quickStackChest: () => request('/chest/quick-stack', { method: 'POST' }),
  devAdvanceTime: (seconds = 60) => request('/dev/advance-time', { method: 'POST', body: JSON.stringify({ seconds }) }),
  devRestoreEnergy: () => request('/dev/restore-energy', { method: 'POST' }),
  getWeatherForecast: () => request('/weather/forecast'),
  devSetWeather: (weather, tomorrowWeather) => request('/dev/set-weather', { method: 'POST', body: JSON.stringify({ weather, tomorrowWeather }) }),
  startPlotProduction: (plotId, cropId) => request('/idle/start-plot', { method: 'POST', body: JSON.stringify({ plotId, cropId }) }),
  collectPlot: (plotId) => request('/idle/collect-plot', { method: 'POST', body: JSON.stringify({ plotId }) }),
  collectAllPlots: () => request('/idle/collect-all', { method: 'POST' }),
  collectFacility: (facilityId) => request('/idle/collect-facility', { method: 'POST', body: JSON.stringify({ facilityId }) }),
  acknowledgeOfflineReport: () => request('/idle/acknowledge-offline', { method: 'POST' }),
  devSimulateOffline: (seconds = 120) => request('/dev/simulate-offline', { method: 'POST', body: JSON.stringify({ seconds }) }),
  startProcessor: (processorId) => request('/processors/start', { method: 'POST', body: JSON.stringify({ processorId }) }),
  collectProcessor: (processorId) => request('/processors/collect', { method: 'POST', body: JSON.stringify({ processorId }) }),
  upgradeWarehouse: () => request('/warehouse/upgrade', { method: 'POST' }),
  // Marketplace
  getMarketListings: (itemId) => request(`/market/listings${itemId ? `?itemId=${encodeURIComponent(itemId)}` : ''}`),
  getMyListings: () => request('/market/my-listings'),
  createListing: (itemId, quantity, unitPrice, quality) => request('/market/list', { method: 'POST', body: JSON.stringify({ itemId, quantity, unitPrice, quality }) }),
  buyFromListing: (listingId, quantity) => request('/market/buy', { method: 'POST', body: JSON.stringify({ listingId, quantity }) }),
  cancelListing: (listingId) => request('/market/cancel', { method: 'POST', body: JSON.stringify({ listingId }) }),
  // Hardcore Economy & Automation
  buyTool: (toolId) => request('/farm/buy-tool', { method: 'POST', body: JSON.stringify({ toolId }) }),
  buyAnimal: (animalItemId, customName) => request('/farm/buy-animal', { method: 'POST', body: JSON.stringify({ animalItemId, customName }) }),
  buyTierLicense: (targetTier) => request('/farm/buy-tier-license', { method: 'POST', body: JSON.stringify({ targetTier }) }),
  togglePlotAutoLoop: (plotId, enable, cropId) => request(`/farm/idle-plots/${plotId}/auto-loop`, { method: 'POST', body: JSON.stringify({ enable, cropId }) })
};
