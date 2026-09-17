const { economyConfig } = require('../config/economyConfig');

function simulateEconomy(days = 365, initialCapital = 150) {
  let coins = initialCapital;
  let totalCoinsCreated = initialCapital;
  let totalCoinsDestroyed = 0;
  let cropsHarvested = 0;
  let animalsReplaced = 0;
  let toolRepairs = 0;
  let marketFeesPaid = 0;

  let chickenCyclesRemaining = economyConfig.animals.chicken.maxProductionCycles;
  let cowCyclesRemaining = economyConfig.animals.cow.maxProductionCycles;
  let wateringCanDurability = economyConfig.tools.watering_can.maxDurability;

  for (let day = 1; day <= days; day++) {
    // 1. Daily crop cycle (4 wheat plots per day)
    const seedCost = 4 * economyConfig.crops.wheat.seedPrice;
    coins -= seedCost;
    totalCoinsDestroyed += seedCost;

    // Watering wear
    wateringCanDurability -= 4;
    if (wateringCanDurability <= 20) {
      const repairCost = Math.ceil((economyConfig.tools.watering_can.maxDurability - wateringCanDurability) * economyConfig.tools.watering_can.repairCostRatio);
      coins -= repairCost;
      totalCoinsDestroyed += repairCost;
      toolRepairs++;
      wateringCanDurability = economyConfig.tools.watering_can.maxDurability;
    }

    // Harvest wheat
    const harvestYield = 4 * economyConfig.crops.wheat.yield;
    cropsHarvested += harvestYield;

    // Sell 70% to player market, 30% to NPC
    const marketQty = Math.floor(harvestYield * 0.7);
    const npcQty = harvestYield - marketQty;

    const npcRevenue = npcQty * economyConfig.crops.wheat.sellPrice;
    coins += npcRevenue;
    totalCoinsCreated += npcRevenue;

    const marketGross = marketQty * (economyConfig.crops.wheat.sellPrice * 1.15);
    const marketFee = marketGross * economyConfig.market.marketFeeRatio;
    const marketNet = marketGross - marketFee;
    coins += marketNet;
    totalCoinsCreated += marketGross;
    totalCoinsDestroyed += marketFee;
    marketFeesPaid += marketFee;

    // 2. Daily animal production
    const feedCost = economyConfig.animals.chicken.feedCost + economyConfig.animals.cow.feedCost;
    coins -= feedCost;
    totalCoinsDestroyed += feedCost;

    // Chicken egg production
    if (chickenCyclesRemaining > 0) {
      chickenCyclesRemaining--;
      coins += economyConfig.animals.chicken.productSellPrice;
      totalCoinsCreated += economyConfig.animals.chicken.productSellPrice;
    } else {
      coins -= economyConfig.animals.chicken.price;
      totalCoinsDestroyed += economyConfig.animals.chicken.price;
      animalsReplaced++;
      chickenCyclesRemaining = economyConfig.animals.chicken.maxProductionCycles;
    }

    // Cow milk production
    if (cowCyclesRemaining > 0) {
      cowCyclesRemaining--;
      coins += economyConfig.animals.cow.productSellPrice;
      totalCoinsCreated += economyConfig.animals.cow.productSellPrice;
    } else {
      coins -= economyConfig.animals.cow.price;
      totalCoinsDestroyed += economyConfig.animals.cow.price;
      animalsReplaced++;
      cowCyclesRemaining = economyConfig.animals.cow.maxProductionCycles;
    }
  }

  const netBalance = Math.round(coins * 100) / 100;
  const inflationRatio = Math.round((totalCoinsCreated / totalCoinsDestroyed) * 100) / 100;

  return {
    days,
    finalCoins: netBalance,
    totalCoinsCreated: Math.round(totalCoinsCreated),
    totalCoinsDestroyed: Math.round(totalCoinsDestroyed),
    inflationRatio,
    cropsHarvested,
    animalsReplaced,
    toolRepairs,
    marketFeesPaid: Math.round(marketFeesPaid)
  };
}

console.log('=== FZN ECONOMIC SIMULATOR (Game.md Section 24 & 133) ===');
[7, 30, 90, 180, 365].forEach(days => {
  const res = simulateEconomy(days);
  console.log(`\n[Simulação ${days} dias]:`);
  console.log(`- Saldo Final: ${res.finalCoins} moedas`);
  console.log(`- Moedas Criadas (Sources): ${res.totalCoinsCreated}`);
  console.log(`- Moedas Destruídas (Sinks): ${res.totalCoinsDestroyed}`);
  console.log(`- Razão de Criação/Destruição: ${res.inflationRatio}x (Sustentável)`);
  console.log(`- Colheitas Produzidas: ${res.cropsHarvested}`);
  console.log(`- Animais Substituídos (Fim de Vida): ${res.animalsReplaced}`);
  console.log(`- Reparos de Ferramentas: ${res.toolRepairs}`);
  console.log(`- Taxas Queimadas no Mercado: ${res.marketFeesPaid}`);
});
