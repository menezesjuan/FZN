const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('fzn_jwt_token') || '';
}

function setToken(token) {
  if (token) {
    localStorage.setItem('fzn_jwt_token', token);
  } else {
    localStorage.removeItem('fzn_jwt_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro na comunicação com o servidor');
    }
    return data;
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  getToken,
  setToken,
  register: (username, email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getMe: () => request('/auth/me'),

  // Config & Catalog
  getConfig: () => request('/config'),
  getCatalog: () => request('/shop/catalog'),

  // Farm State & Actions
  getState: () => request('/farm/state'),
  plantCrop: (tileId, seedId) => request('/farm/plant', { method: 'POST', body: JSON.stringify({ tileId, seedId }) }),
  waterPlot: (tileId) => request('/farm/water', { method: 'POST', body: JSON.stringify({ tileId }) }),
  harvestCrop: (tileId) => request('/farm/harvest', { method: 'POST', body: JSON.stringify({ tileId }) }),

  // Durability & Repairs
  repairTool: (toolId) => request('/farm/repair-tool', { method: 'POST', body: JSON.stringify({ toolId }) }),
  repairAllTools: () => request('/farm/repair-all', { method: 'POST' }),

  // Animals & Livestock
  buyAnimal: (animalType, name) => request('/animals/buy', { method: 'POST', body: JSON.stringify({ animalType, name }) }),
  feedAnimal: (animalId) => request('/animals/feed', { method: 'POST', body: JSON.stringify({ animalId }) }),
  collectProduce: (animalId) => request('/animals/collect', { method: 'POST', body: JSON.stringify({ animalId }) }),
  collectEgg: (eggId) => request('/farm/collect-egg', { method: 'POST', body: JSON.stringify({ eggId }) }),
  petAnimal: (animalId) => request('/farm/pet-animal', { method: 'POST', body: JSON.stringify({ animalId }) }),

  // Crafting & Machines
  buyMachine: (machineType) => request('/machines/buy', { method: 'POST', body: JSON.stringify({ machineType }) }),
  startMachineJob: (machineId, recipeId) => request('/machines/start', { method: 'POST', body: JSON.stringify({ machineId, recipeId }) }),
  claimMachineJob: (machineId) => request('/machines/claim', { method: 'POST', body: JSON.stringify({ machineId }) }),

  // Storage
  upgradeStorage: () => request('/storage/upgrade', { method: 'POST' }),

  // NPC Shop
  buySeed: (seedId, quantity = 1) => request('/shop/buy-seed', { method: 'POST', body: JSON.stringify({ seedId, quantity }) }),
  sellItem: (itemId, quantity = 1) => request('/shop/sell-item', { method: 'POST', body: JSON.stringify({ itemId, quantity }) }),

  // Marketplace & Order Book
  getOrderBook: (itemId) => request(`/market/book/${encodeURIComponent(itemId)}`),
  createOrder: (type, itemId, unitPrice, quantity) => request('/market/order', { method: 'POST', body: JSON.stringify({ type, itemId, unitPrice, quantity }) }),
  cancelOrder: (orderId) => request('/market/cancel', { method: 'POST', body: JSON.stringify({ orderId }) }),
  getMyOrders: () => request('/market/my-orders'),

  // Financial Ledger
  getLedgerHistory: () => request('/ledger/history')
};
