const economyConfig = {
  currency: {
    startingCoins: 150.0,
    startingStorage: 100
  },
  market: {
    marketFeeRatio: 0.08, // 8% fee on trade
    listingFeeRatio: 0.01 // 1% non-refundable listing fee
  },
  offline: {
    defaultLimitHours: 8,
    upgradedLimitHours: 24
  },
  tools: {
    watering_can: {
      name: 'Regador de Cobre',
      maxDurability: 100,
      wearPerAction: 1,
      repairCostRatio: 0.35 // 0.35 coins per durability point restored
    },
    axe: {
      name: 'Machado Agrícola',
      maxDurability: 80,
      wearPerAction: 2,
      repairCostRatio: 0.45
    },
    pickaxe: {
      name: 'Picareta de Minerador',
      maxDurability: 80,
      wearPerAction: 2,
      repairCostRatio: 0.45
    },
    milk_collector: {
      name: 'Coletor de Leite',
      maxDurability: 100,
      wearPerAction: 1,
      repairCostRatio: 0.40
    },
    egg_basket: {
      name: 'Cesta de Ovos',
      maxDurability: 120,
      wearPerAction: 1,
      repairCostRatio: 0.25
    }
  },
  crops: {
    wheat: {
      id: 'wheat',
      name: 'Trigo Dourado',
      seedId: 'seed_wheat',
      seedName: 'Semente de Trigo',
      seedPrice: 10,
      sellPrice: 16,
      growthTimeSec: 15,
      totalStages: 5,
      yield: 2,
      assetCrop: 'wheat'
    },
    tomato: {
      id: 'tomato',
      name: 'Tomate Cereja',
      seedId: 'seed_tomato',
      seedName: 'Semente de Tomate',
      seedPrice: 18,
      sellPrice: 28,
      growthTimeSec: 25,
      totalStages: 5,
      yield: 2,
      assetCrop: 'tomato'
    },
    radish: {
      id: 'radish',
      name: 'Rabanete Fresco',
      seedId: 'seed_radish',
      seedName: 'Semente de Rabanete',
      seedPrice: 12,
      sellPrice: 20,
      growthTimeSec: 18,
      totalStages: 5,
      yield: 2,
      assetCrop: 'radish'
    },
    potato: {
      id: 'potato',
      name: 'Batata Rústica',
      seedId: 'seed_potato',
      seedName: 'Semente de Batata',
      seedPrice: 15,
      sellPrice: 24,
      growthTimeSec: 22,
      totalStages: 5,
      yield: 2,
      assetCrop: 'potato'
    },
    pumpkin: {
      id: 'pumpkin',
      name: 'Abóbora Real',
      seedId: 'seed_pumpkin',
      seedName: 'Semente de Abóbora',
      seedPrice: 35,
      sellPrice: 58,
      growthTimeSec: 40,
      totalStages: 5,
      yield: 1,
      assetCrop: 'pumpkin'
    },
    corn: {
      id: 'corn',
      name: 'Milho Doce',
      seedId: 'seed_corn',
      seedName: 'Semente de Milho',
      seedPrice: 22,
      sellPrice: 36,
      growthTimeSec: 30,
      totalStages: 5,
      yield: 2,
      assetCrop: 'corn'
    },
    pepper: {
      id: 'pepper',
      name: 'Pimenta Vermelha',
      seedId: 'seed_pepper',
      seedName: 'Semente de Pimenta',
      seedPrice: 20,
      sellPrice: 32,
      growthTimeSec: 26,
      totalStages: 5,
      yield: 2,
      assetCrop: 'pepper'
    },
    onion: {
      id: 'onion',
      name: 'Cebola Roxa',
      seedId: 'seed_onion',
      seedName: 'Semente de Cebola',
      seedPrice: 14,
      sellPrice: 22,
      growthTimeSec: 20,
      totalStages: 5,
      yield: 2,
      assetCrop: 'onion'
    },
    lettuce: {
      id: 'lettuce',
      name: 'Alface Crespa',
      seedId: 'seed_lettuce',
      seedName: 'Semente de Alface',
      seedPrice: 11,
      sellPrice: 17,
      growthTimeSec: 16,
      totalStages: 5,
      yield: 2,
      assetCrop: 'lettuce'
    },
    grape: {
      id: 'grape',
      name: 'Uva Niágara',
      seedId: 'seed_grape',
      seedName: 'Semente de Uva',
      seedPrice: 30,
      sellPrice: 50,
      growthTimeSec: 38,
      totalStages: 5,
      yield: 3,
      assetCrop: 'grape'
    },
    eggplant: {
      id: 'eggplant',
      name: 'Berinjela Rajada',
      seedId: 'seed_eggplant',
      seedName: 'Semente de Berinjela',
      seedPrice: 24,
      sellPrice: 38,
      growthTimeSec: 32,
      totalStages: 5,
      yield: 2,
      assetCrop: 'eggplant'
    },
    leek: {
      id: 'leek',
      name: 'Alho-poró',
      seedId: 'seed_leek',
      seedName: 'Semente de Alho-poró',
      seedPrice: 16,
      sellPrice: 26,
      growthTimeSec: 24,
      totalStages: 5,
      yield: 2,
      assetCrop: 'leek'
    },
    berry: {
      id: 'berry',
      name: 'Amoras Silvestres',
      seedId: 'seed_berry',
      seedName: 'Muda de Amora',
      seedPrice: 28,
      sellPrice: 48,
      growthTimeSec: 20,
      totalStages: 5,
      yield: 3,
      assetCrop: 'berry'
    },
    carrot: {
      id: 'carrot',
      name: 'Cenoura Fresca',
      seedId: 'seed_carrot',
      seedName: 'Semente de Cenoura',
      seedPrice: 14,
      sellPrice: 24,
      growthTimeSec: 15,
      totalStages: 5,
      yield: 2,
      assetCrop: 'carrot'
    }
  },
  animals: {
    chicken: {
      type: 'chicken',
      name: 'Galinha Caipira',
      price: 120,
      feedCost: 4, // feed cost per day
      feedItem: 'wheat', // can eat wheat
      productId: 'egg',
      productName: 'Ovo Fresco',
      productSellPrice: 8,
      lifespanDays: 180,
      maxProductionCycles: 120,
      cycleDurationSec: 20, // Idle production interval
      requiredTool: 'egg_basket'
    },
    cow: {
      type: 'cow',
      name: 'Vaca Holandesa',
      price: 450,
      feedCost: 10,
      feedItem: 'wheat',
      productId: 'milk',
      productName: 'Leite Cru',
      productSellPrice: 24,
      lifespanDays: 360,
      maxProductionCycles: 250,
      cycleDurationSec: 40,
      requiredTool: 'milk_collector'
    }
  },
  machines: {
    mill: {
      type: 'mill',
      name: 'Moinho de Grãos',
      cost: 300,
      maxDurability: 1000,
      recipes: [
        {
          id: 'make_flour',
          name: 'Moer Farinha',
          inputs: { wheat: 2 },
          outputs: { flour: 2 },
          durationSec: 15,
          wear: 1
        }
      ]
    },
    cheese_maker: {
      type: 'cheese_maker',
      name: 'Prensa Queijeira',
      cost: 500,
      maxDurability: 1000,
      recipes: [
        {
          id: 'make_cheese',
          name: 'Produzir Queijo Colonial',
          inputs: { milk: 2 },
          outputs: { cheese: 1 },
          durationSec: 25,
          wear: 1
        }
      ]
    },
    bakery_oven: {
      type: 'bakery_oven',
      name: 'Forno Rústico',
      cost: 650,
      maxDurability: 1000,
      recipes: [
        {
          id: 'bake_bread',
          name: 'Assar Pão Caseiro',
          inputs: { flour: 2, egg: 1 },
          outputs: { bread: 2 },
          durationSec: 20,
          wear: 1
        }
      ]
    }
  },
  storageUpgrades: [
    { level: 1, capacity: 100, cost: 0 },
    { level: 2, capacity: 250, cost: 250 },
    { level: 3, capacity: 600, cost: 750 },
    { level: 4, capacity: 1500, cost: 2000 }
  ]
};

// Tool degradation calculation helper
function getToolEfficiency(durability, maxDurability) {
  if (durability <= 0) return { multiplier: 0, status: 'BROKEN' };
  const pct = (durability / maxDurability) * 100;
  if (pct >= 80) return { multiplier: 1.0, status: 'EXCELLENT' };
  if (pct >= 50) return { multiplier: 0.95, status: 'GOOD' };
  if (pct >= 20) return { multiplier: 0.80, status: 'WORN' };
  return { multiplier: 0.60, status: 'CRITICAL' };
}

module.exports = {
  economyConfig,
  getToolEfficiency
};
