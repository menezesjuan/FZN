const fs = require('fs');
const path = require('path');
const farmEngine = require('./farmEngine');
const itemsConfig = require('../config/items.json');

const DATA_DIR = path.resolve(__dirname, '../../data');
const MARKET_FILE = path.join(DATA_DIR, 'marketplace.json');

// -------------------------------------------------------------------
// NPC seed listings — populated on first run and refreshed if expired
// -------------------------------------------------------------------
const NPC_SEED_LISTINGS = [
  // Fazenda Verde — crops
  { sellerId: 'npc_fazenda_verde', sellerName: 'Fazenda Verde',      itemId: 'crop_strawberry',  itemName: 'Morango',                  quality: 'normal', quantity: 40, unitPrice: 55  },
  { sellerId: 'npc_fazenda_verde', sellerName: 'Fazenda Verde',      itemId: 'crop_strawberry',  itemName: 'Morango',                  quality: 'silver', quantity: 20, unitPrice: 70  },
  { sellerId: 'npc_fazenda_verde', sellerName: 'Fazenda Verde',      itemId: 'crop_potato',      itemName: 'Batata',                   quality: 'normal', quantity: 60, unitPrice: 40  },
  { sellerId: 'npc_fazenda_verde', sellerName: 'Fazenda Verde',      itemId: 'crop_leek',        itemName: 'Alho-poró',                quality: 'normal', quantity: 50, unitPrice: 28  },
  { sellerId: 'npc_fazenda_verde', sellerName: 'Fazenda Verde',      itemId: 'crop_onion',       itemName: 'Cebola',                   quality: 'normal', quantity: 80, unitPrice: 20  },
  // Celeiro do Sul — produce & artisan
  { sellerId: 'npc_celeiro_sul',   sellerName: 'Celeiro do Sul',     itemId: 'produce_egg',      itemName: 'Ovo Caipira',              quality: 'normal', quantity: 30, unitPrice: 32  },
  { sellerId: 'npc_celeiro_sul',   sellerName: 'Celeiro do Sul',     itemId: 'produce_milk',     itemName: 'Leite Fresco Caipira',     quality: 'normal', quantity: 25, unitPrice: 60  },
  { sellerId: 'npc_celeiro_sul',   sellerName: 'Celeiro do Sul',     itemId: 'artisan_cheese',   itemName: 'Queijo Curado da Fazenda', quality: 'normal', quantity: 12, unitPrice: 130 },
  { sellerId: 'npc_celeiro_sul',   sellerName: 'Celeiro do Sul',     itemId: 'artisan_mayo',     itemName: 'Maionese Caipira Especial',quality: 'normal', quantity: 15, unitPrice: 78  },
  { sellerId: 'npc_celeiro_sul',   sellerName: 'Celeiro do Sul',     itemId: 'artisan_jam',      itemName: 'Geléia Real de Morango',   quality: 'silver', quantity: 8,  unitPrice: 195 },
  // Mercador Itinerante — materials & seeds
  { sellerId: 'npc_mercador',      sellerName: 'Mercador Itinerante',itemId: 'material_wood',    itemName: 'Madeira Rústica',          quality: 'normal', quantity: 100,unitPrice: 6   },
  { sellerId: 'npc_mercador',      sellerName: 'Mercador Itinerante',itemId: 'seeds_strawberry', itemName: 'Sementes de Morango',      quality: 'normal', quantity: 30, unitPrice: 22  },
  { sellerId: 'npc_mercador',      sellerName: 'Mercador Itinerante',itemId: 'seeds_potato',     itemName: 'Sementes de Batata',       quality: 'normal', quantity: 40, unitPrice: 15  },
  { sellerId: 'npc_mercador',      sellerName: 'Mercador Itinerante',itemId: 'seeds_leek',       itemName: 'Sementes de Alho-poró',    quality: 'normal', quantity: 35, unitPrice: 10  },
  { sellerId: 'npc_mercador',      sellerName: 'Mercador Itinerante',itemId: 'crop_strawberry',  itemName: 'Morango',                  quality: 'gold',   quantity: 10, unitPrice: 88  },
];

// Listings expire after 48 hours real time
const LISTING_TTL_MS = 48 * 60 * 60 * 1000;
// NPC listings are refreshed every 30 minutes real time
const NPC_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

function generateId() {
  return `lst_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

class MarketplaceEngine {
  constructor() {
    this._ensureDir();
    this.listings = this._load();
    this.seedNpcListings();
  }

  // ------------------------------------------------------------------
  // Persistence helpers
  // ------------------------------------------------------------------
  _ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  _load() {
    try {
      if (fs.existsSync(MARKET_FILE)) {
        const raw = fs.readFileSync(MARKET_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Marketplace] Error loading marketplace.json:', err.message);
    }
    return [];
  }

  _save() {
    try {
      this._ensureDir();
      const tmp = MARKET_FILE + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(this.listings, null, 2), 'utf8');
      try {
        fs.renameSync(tmp, MARKET_FILE);
      } catch (_) {
        fs.writeFileSync(MARKET_FILE, JSON.stringify(this.listings, null, 2), 'utf8');
        try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_2) {}
      }
    } catch (err) {
      console.error('[Marketplace] Error saving marketplace.json:', err.message);
    }
  }

  // ------------------------------------------------------------------
  // NPC seed / refresh
  // ------------------------------------------------------------------
  seedNpcListings() {
    const now = Date.now();
    this._expireOldListings(now);

    const lastNpcRefresh = this.listings
      .filter(l => l.sellerId !== 'player')
      .reduce((max, l) => Math.max(max, l.createdAt || 0), 0);

    const activeNpcCount = this.listings.filter(l =>
      l.sellerId !== 'player' && (l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD')
    ).length;

    const shouldRefresh = (now - lastNpcRefresh) > NPC_REFRESH_INTERVAL_MS || activeNpcCount === 0;

    if (shouldRefresh) {
      for (const template of NPC_SEED_LISTINGS) {
        const alreadyActive = this.listings.some(l =>
          l.sellerId === template.sellerId &&
          l.itemId === template.itemId &&
          l.quality === template.quality &&
          (l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD')
        );
        if (!alreadyActive) {
          this.listings.push({
            id: generateId(),
            sellerId: template.sellerId,
            sellerName: template.sellerName,
            itemId: template.itemId,
            itemName: template.itemName,
            quality: template.quality,
            quantity: template.quantity,
            remainingQuantity: template.quantity,
            unitPrice: template.unitPrice,
            status: 'ACTIVE',
            createdAt: now,
            expiresAt: now + LISTING_TTL_MS
          });
        }
      }
      this._save();
    }
  }

  _expireOldListings(now) {
    let changed = false;
    for (const l of this.listings) {
      if ((l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD') && l.expiresAt && now > l.expiresAt) {
        if (l.sellerId === 'player' && l.remainingQuantity > 0) {
          farmEngine.addItemToInventory(l.itemId, l.remainingQuantity, l.quality);
        }
        l.status = 'EXPIRED';
        changed = true;
      }
    }
    if (changed) this._save();
  }

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Get active listings, optionally filtered by itemId.
   */
  getListings(itemId) {
    const now = Date.now();
    this._expireOldListings(now);
    this.seedNpcListings();

    return this.listings.filter(l => {
      if (l.status !== 'ACTIVE' && l.status !== 'PARTIALLY_SOLD') return false;
      if (itemId && l.itemId !== itemId) return false;
      return true;
    }).sort((a, b) => a.unitPrice - b.unitPrice);
  }

  /**
   * Player creates a sell listing.
   * Deducts item from inventory immediately; item returns only on cancel/expire.
   */
  createListing(itemId, quantity, unitPrice, quality) {
    quality = quality || 'normal';
    quantity = Math.floor(Number(quantity));
    unitPrice = Math.floor(Number(unitPrice));

    if (!itemId) throw new Error('Item inválido.');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
      throw new Error('Quantidade inválida (1-9999).');
    }
    if (!Number.isInteger(unitPrice) || unitPrice < 1 || unitPrice > 99999) {
      throw new Error('Preço inválido (1G a 99999G por unidade).');
    }

    const itemDef = itemsConfig.items[itemId];
    if (!itemDef) throw new Error('Item não encontrado.');
    if (itemDef.category === 'tool') throw new Error('Ferramentas não podem ser anunciadas no mercado.');

    const state = farmEngine.getState();
    const invItem = state.inventory.find(i => i.id === itemId && i.quality === quality);
    if (!invItem || invItem.quantity < quantity) {
      throw new Error(`Você não possui ${quantity}x ${itemDef.name} (${quality}) no inventário.`);
    }

    // Deduct atomically
    invItem.quantity -= quantity;
    if (invItem.quantity <= 0) {
      const idx = state.inventory.indexOf(invItem);
      state.inventory.splice(idx, 1);
    }
    farmEngine.save();

    const now = Date.now();
    const listing = {
      id: generateId(),
      sellerId: 'player',
      sellerName: state.player.name || 'Você',
      itemId,
      itemName: itemDef.name,
      quality,
      quantity,
      remainingQuantity: quantity,
      unitPrice,
      status: 'ACTIVE',
      createdAt: now,
      expiresAt: now + LISTING_TTL_MS
    };

    this.listings.push(listing);
    this._save();

    return {
      success: true,
      message: `Anúncio criado: ${quantity}x ${itemDef.name} a ${unitPrice}G cada.`,
      listing,
      inventory: state.inventory,
      player: state.player
    };
  }

  /**
   * Player buys `quantity` units from a listing.
   * 5% market fee is charged on top of the purchase price (currency drain).
   */
  buyFromListing(listingId, quantity) {
    quantity = Math.floor(Number(quantity));

    if (!listingId) throw new Error('ID de anúncio inválido.');
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Quantidade inválida.');

    const listing = this.listings.find(l => l.id === listingId);
    if (!listing) throw new Error('Anúncio não encontrado.');
    if (listing.status !== 'ACTIVE' && listing.status !== 'PARTIALLY_SOLD') {
      throw new Error('Este anúncio não está mais disponível.');
    }
    if (listing.expiresAt && Date.now() > listing.expiresAt) {
      listing.status = 'EXPIRED';
      this._save();
      throw new Error('Este anúncio expirou.');
    }
    if (listing.sellerId === 'player') {
      throw new Error('Você não pode comprar seu próprio anúncio.');
    }
    if (quantity > listing.remainingQuantity) {
      throw new Error(`Quantidade solicitada (${quantity}) excede o disponível (${listing.remainingQuantity}).`);
    }

    const subtotal = listing.unitPrice * quantity;
    const fee = Math.ceil(subtotal * 0.05);
    const totalCost = subtotal + fee;

    const state = farmEngine.getState();
    if (state.player.money < totalCost) {
      throw new Error(
        `Ouro insuficiente! Necessário: ${totalCost}G (incluindo taxa 5%: ${fee}G), Disponível: ${state.player.money}G.`
      );
    }

    // Atomic update
    state.player.money -= totalCost;
    listing.remainingQuantity -= quantity;
    listing.status = listing.remainingQuantity <= 0 ? 'SOLD' : 'PARTIALLY_SOLD';

    farmEngine.addItemToInventory(listing.itemId, quantity, listing.quality);
    farmEngine.save();
    this._save();

    return {
      success: true,
      message: `Comprou ${quantity}x ${listing.itemName} por ${subtotal}G + ${fee}G (taxa 5%) = ${totalCost}G.`,
      purchased: {
        itemId: listing.itemId,
        itemName: listing.itemName,
        quality: listing.quality,
        quantity,
        subtotal,
        fee,
        totalCost
      },
      listing,
      player: state.player,
      inventory: state.inventory
    };
  }

  /**
   * Player cancels their own active listing. Returns remaining items to inventory.
   */
  cancelListing(listingId) {
    if (!listingId) throw new Error('ID de anúncio inválido.');

    const listing = this.listings.find(l => l.id === listingId);
    if (!listing) throw new Error('Anúncio não encontrado.');
    if (listing.sellerId !== 'player') throw new Error('Você só pode cancelar seus próprios anúncios.');
    if (listing.status !== 'ACTIVE' && listing.status !== 'PARTIALLY_SOLD') {
      throw new Error('Anúncio não está ativo e não pode ser cancelado.');
    }

    const returnQty = listing.remainingQuantity;
    listing.status = 'CANCELLED';

    if (returnQty > 0) {
      farmEngine.addItemToInventory(listing.itemId, returnQty, listing.quality);
    }
    farmEngine.save();
    this._save();

    const state = farmEngine.getState();
    return {
      success: true,
      message: `Anúncio cancelado. ${returnQty}x ${listing.itemName} devolvidos ao inventário.`,
      returnedQuantity: returnQty,
      listing,
      inventory: state.inventory,
      player: state.player
    };
  }

  /**
   * Get all of the player's own listings (all statuses).
   */
  getPlayerListings() {
    return this.listings.filter(l => l.sellerId === 'player');
  }
}

module.exports = new MarketplaceEngine();
