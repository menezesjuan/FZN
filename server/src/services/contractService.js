const crypto = require('crypto');
const { db } = require('../db/database');
const ledgerService = require('./ledgerService');
const { economyConfig } = require('../config/economyConfig');

const BASE_CONTRACTS = [
  {
    title: 'Suprimento para a Pizzaria da Vila',
    clientName: 'Cantina Bella Vista',
    itemId: 'tomato',
    requiredQuantity: 10,
    rewardCoins: 350,
    durationHours: 12
  },
  {
    title: 'Farinha para a Padaria Central',
    clientName: 'Padaria Pão Dourado',
    itemId: 'flour',
    requiredQuantity: 6,
    rewardCoins: 280,
    durationHours: 8
  },
  {
    title: 'Lote de Queijo Colonial para o Empório',
    clientName: 'Empório dos Vales',
    itemId: 'cheese',
    requiredQuantity: 4,
    rewardCoins: 420,
    durationHours: 24
  },
  {
    title: 'Abóboras para o Festival Sazonal',
    clientName: 'Comitê das Festas Rurais',
    itemId: 'pumpkin',
    requiredQuantity: 5,
    rewardCoins: 480,
    durationHours: 18
  },
  {
    title: 'Ovos Caipiras para a Confeitaria',
    clientName: 'Doçaria Sonho Real',
    itemId: 'egg',
    requiredQuantity: 12,
    rewardCoins: 200,
    durationHours: 6
  }
];

class ContractService {
  /**
   * Generates or retrieves available contracts for a user
   */
  getContracts(userId) {
    const now = Date.now();

    // Mark expired accepted contracts
    db.prepare(`
      UPDATE contracts
      SET status = 'EXPIRED'
      WHERE status = 'ACCEPTED' AND deadline < ?
    `).run(now);

    // Fetch user contracts
    let userContracts = db.prepare(`
      SELECT * FROM contracts
      WHERE user_id = ? OR user_id IS NULL
      ORDER BY deadline ASC
    `).all(userId);

    // If fewer than 3 available, populate new ones
    const activeCount = userContracts.filter(c => c.status === 'AVAILABLE' || c.status === 'ACCEPTED').length;
    if (activeCount < 3) {
      this._seedContracts(userId);
      userContracts = db.prepare(`
        SELECT * FROM contracts
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY deadline ASC
      `).all(userId);
    }

    return userContracts;
  }

  _seedContracts(userId) {
    const now = Date.now();
    const insert = db.prepare(`
      INSERT INTO contracts (id, user_id, title, client_name, item_id, required_quantity, reward_coins, deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')
    `);

    // Pick 3 random contracts
    const shuffled = [...BASE_CONTRACTS].sort(() => 0.5 - Math.random());
    shuffled.slice(0, 3).forEach(c => {
      const contractId = 'ct_' + crypto.randomUUID();
      const deadline = now + (c.durationHours * 3600 * 1000);
      insert.run(contractId, userId, c.title, c.clientName, c.itemId, c.requiredQuantity, c.rewardCoins, deadline);
    });
  }

  acceptContract(userId, contractId) {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ? AND (user_id = ? OR user_id IS NULL)').get(contractId, userId);
    if (!contract) throw new Error('Contrato não encontrado.');
    if (contract.status !== 'AVAILABLE') throw new Error('Este contrato não está mais disponível para aceite.');

    db.prepare(`
      UPDATE contracts
      SET status = 'ACCEPTED', user_id = ?
      WHERE id = ?
    `).run(userId, contractId);

    return {
      message: `Contrato "${contract.title}" aceito! Entregue a mercadoria antes do prazo.`,
      contract: db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId)
    };
  }

  deliverContract(userId, contractId) {
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ? AND user_id = ?').get(contractId, userId);
    if (!contract) throw new Error('Contrato não encontrado.');

    if (contract.status !== 'ACCEPTED') {
      throw new Error(`Contrato não está em andamento (status atual: ${contract.status}).`);
    }

    if (Date.now() > contract.deadline) {
      db.prepare("UPDATE contracts SET status = 'EXPIRED' WHERE id = ?").run(contractId);
      throw new Error('O prazo deste contrato expirou!');
    }

    const tx = db.transaction(() => {
      // 1. Verify and deduct inventory
      const inv = db.prepare('SELECT * FROM inventories WHERE user_id = ? AND item_id = ?').get(userId, contract.item_id);
      if (!inv || (inv.quantity - inv.reserved) < contract.required_quantity) {
        throw new Error(`Estoque insuficiente: requer ${contract.required_quantity}x ${contract.item_id}, você possui ${inv ? inv.quantity - inv.reserved : 0}.`);
      }

      db.prepare('UPDATE inventories SET quantity = quantity - ? WHERE id = ?').run(contract.required_quantity, inv.id);

      // 2. Credit reward coins via ledger
      ledgerService.recordTransaction(
        userId,
        'CONTRACT_REWARD',
        contract.reward_coins,
        `Recompensa pela entrega do contrato: ${contract.title}`
      );

      // 3. Mark contract as COMPLETED
      db.prepare("UPDATE contracts SET status = 'COMPLETED' WHERE id = ?").run(contractId);
    });

    tx();

    return {
      message: `Contrato cumprido com sucesso! Você recebeu ${contract.reward_coins} moedas! 🎉`,
      contractId,
      reward: contract.reward_coins
    };
  }
}

module.exports = new ContractService();
