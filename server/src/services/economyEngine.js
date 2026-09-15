const itemsConfig = require('../config/items.json');
const farmEngine = require('./farmEngine');

class EconomyEngine {
  constructor() {
    this.farm = farmEngine;
  }

  getShopCatalog() {
    const catalog = [];
    for (const [id, item] of Object.entries(itemsConfig.items)) {
      if (item.category === 'seed') {
        catalog.push({
          id,
          name: item.name,
          category: item.category,
          cropId: item.cropId,
          buyPrice: item.buyPrice,
          description: item.description
        });
      }
    }
    return catalog;
  }

  buyItem(itemId, quantity = 1) {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error("Quantidade inválida para compra.");
    }

    const itemDef = itemsConfig.items[itemId];
    if (!itemDef || !itemDef.buyPrice) {
      throw new Error("Item não disponível para compra.");
    }

    const state = this.farm.getState();
    const totalCost = itemDef.buyPrice * quantity;

    if (state.player.money < totalCost) {
      throw new Error(`Ouro insuficiente! Necessário: ${totalCost}G, Disponível: ${state.player.money}G.`);
    }

    // Process purchase
    state.player.money -= totalCost;
    this.farm.addItemToInventory(itemId, quantity, 'normal');
    this.farm.save();

    return {
      success: true,
      message: `Comprou ${quantity}x ${itemDef.name} por ${totalCost}G.`,
      player: state.player,
      inventory: state.inventory
    };
  }

  sellItem(slotIndex, quantity = 1) {
    if (quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error("Quantidade inválida para venda.");
    }

    const state = this.farm.getState();
    const itemInSlot = state.inventory.find(i => i.slot === slotIndex);
    if (!itemInSlot) {
      throw new Error("Nenhum item encontrado no compartimento especificado.");
    }

    if (itemInSlot.quantity < quantity) {
      throw new Error("Quantidade insuficiente para vender.");
    }

    const itemDef = itemsConfig.items[itemInSlot.id];
    if (!itemDef) {
      throw new Error("Definição de item inválida.");
    }

    if (itemDef.category === 'tool') {
      throw new Error("Ferramentas não podem ser vendidas!");
    }

    // Determine price with quality multiplier
    const basePrice = itemDef.baseSellPrice || itemDef.sellPrice || 10;
    const quality = itemInSlot.quality || 'normal';
    const qualityMultiplier = itemsConfig.qualities[quality]?.multiplier || 1.0;
    const unitPrice = Math.round(basePrice * qualityMultiplier);
    const totalPrice = unitPrice * quantity;

    // Deduct from inventory
    itemInSlot.quantity -= quantity;
    if (itemInSlot.quantity <= 0) {
      const idx = state.inventory.indexOf(itemInSlot);
      state.inventory.splice(idx, 1);
    }

    // Add money
    state.player.money += totalPrice;
    state.stats.totalMoneyEarned = (state.stats.totalMoneyEarned || 0) + totalPrice;
    this.farm.save();

    return {
      success: true,
      message: `Vendeu ${quantity}x ${itemDef.name} (${itemsConfig.qualities[quality].name}) por ${totalPrice}G.`,
      sold: {
        id: itemInSlot.id,
        name: itemDef.name,
        quantity,
        quality,
        totalPrice
      },
      player: state.player,
      inventory: state.inventory
    };
  }
}

module.exports = new EconomyEngine();
