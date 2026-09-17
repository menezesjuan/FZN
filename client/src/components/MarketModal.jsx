import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const COMMODITIES = [
  { id: 'wheat', name: 'Trigo' },
  { id: 'tomato', name: 'Tomate' },
  { id: 'radish', name: 'Rabanete' },
  { id: 'potato', name: 'Batata' },
  { id: 'pumpkin', name: 'Abóbora' },
  { id: 'corn', name: 'Milho' },
  { id: 'egg', name: 'Ovo' },
  { id: 'milk', name: 'Leite' },
  { id: 'flour', name: 'Farinha' },
  { id: 'cheese', name: 'Queijo' },
  { id: 'bread', name: 'Pão' }
];

export default function MarketModal({ isOpen, onClose, userWallet, onRefreshState, showToast }) {
  const [activeTab, setActiveTab] = useState('book'); // 'book', 'create', 'my_orders', 'ledger'
  const [selectedItem, setSelectedItem] = useState('wheat');
  const [bookData, setBookData] = useState({ buyOrders: [], sellOrders: [], stats: {} });
  const [myOrders, setMyOrders] = useState([]);
  const [ledgerLogs, setLedgerLogs] = useState([]);

  // Create order form
  const [orderType, setOrderType] = useState('BUY'); // 'BUY' or 'SELL'
  const [orderPrice, setOrderPrice] = useState(15);
  const [orderQty, setOrderQty] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const fetchBook = useCallback(async () => {
    try {
      const data = await api.getOrderBook(selectedItem);
      setBookData(data);
    } catch (err) {
      console.error(err);
    }
  }, [selectedItem]);

  const fetchMyOrders = useCallback(async () => {
    try {
      const data = await api.getMyOrders();
      setMyOrders(data.orders || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLedger = useCallback(async () => {
    try {
      const data = await api.getLedgerHistory();
      setLedgerLogs(data.history || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchBook();
    if (activeTab === 'my_orders') fetchMyOrders();
    if (activeTab === 'ledger') fetchLedger();

    const interval = setInterval(() => {
      fetchBook();
      if (activeTab === 'my_orders') fetchMyOrders();
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, fetchBook, fetchMyOrders, fetchLedger]);

  async function handleCreateOrder(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.createOrder(orderType, selectedItem, parseFloat(orderPrice), parseInt(orderQty, 10));
      showToast(res.message || 'Ordem enviada ao mercado!', 'success');
      fetchBook();
      fetchMyOrders();
      if (onRefreshState) onRefreshState();
      setActiveTab('book');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelOrder(orderId) {
    try {
      const res = await api.cancelOrder(orderId);
      showToast(res.message || 'Ordem cancelada!', 'info');
      fetchBook();
      fetchMyOrders();
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  if (!isOpen) return null;

  const totalCost = Math.round(orderPrice * orderQty * 100) / 100;
  const listingFee = Math.max(1, Math.round(totalCost * 0.01 * 100) / 100);
  const estimatedMarketFee = Math.round(totalCost * 0.08 * 100) / 100;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9000,
      fontFamily: '"Press Start 2P", monospace, sans-serif'
    }}>
      <div style={{
        background: '#e9dac1',
        border: '4px solid #5a381e',
        borderRadius: '8px',
        width: '780px',
        maxWidth: '96vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
        color: '#3d2514'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          background: '#613b1f',
          color: '#f9f3e3',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px'
        }}>
          <div>
            <span style={{ fontSize: '13px' }}>⚖️ MERCADO MULTIPLAYER & ORDER BOOK</span>
            <div style={{ fontSize: '9px', color: '#ffde99', marginTop: '4px' }}>
              Negociação P2P direta • Livro de Ordens em Tempo Real
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#9e2a2b',
              color: '#fff',
              border: '2px solid #591617',
              borderRadius: '4px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Commodity selector & Tabs */}
        <div style={{
          padding: '10px 16px',
          background: '#d8c29d',
          borderBottom: '2px solid #bda37c',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', fontWeight: 'bold' }}>Commodity:</span>
            <select
              value={selectedItem}
              onChange={e => setSelectedItem(e.target.value)}
              style={{
                padding: '6px 8px',
                fontSize: '10px',
                background: '#fffbf2',
                border: '2px solid #6b4423',
                borderRadius: '4px'
              }}
            >
              {COMMODITIES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            {[
              { id: 'book', label: 'LIVRO DE ORDENS' },
              { id: 'create', label: '+ NOVA ORDEM' },
              { id: 'my_orders', label: 'MINHAS ORDENS' },
              { id: 'ledger', label: 'EXTRATO (LEDGER)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id === 'ledger') fetchLedger(); }}
                style={{
                  padding: '6px 10px',
                  fontSize: '9px',
                  background: activeTab === tab.id ? '#5a381e' : '#ba9d77',
                  color: activeTab === tab.id ? '#fff' : '#2b1708',
                  border: '2px solid #4a2d16',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, fontSize: '10px' }}>
          {activeTab === 'book' && (
            <div>
              {/* Stats Bar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '16px',
                background: '#fffaf0',
                padding: '10px',
                border: '2px solid #8f6a48',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '8px', color: '#666' }}>Último Negócio</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#8d420f' }}>
                    {bookData.stats?.lastPrice ? `${bookData.stats.lastPrice}G` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: '#666' }}>Média 24h</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
                    {bookData.stats?.avg24h ? `${bookData.stats.avg24h}G` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: '#666' }}>Média 7d</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#333' }}>
                    {bookData.stats?.avg7d ? `${bookData.stats.avg7d}G` : '—'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '8px', color: '#666' }}>Volume 24h</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1a7522' }}>
                    {bookData.stats?.volume24h || 0} un
                  </div>
                </div>
              </div>

              {/* Order Book Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* BUY ORDERS (BIDS) */}
                <div style={{
                  background: '#f0f9eb',
                  border: '2px solid #5b9948',
                  borderRadius: '4px',
                  padding: '10px'
                }}>
                  <div style={{ color: '#2b6e17', fontWeight: 'bold', marginBottom: '8px', fontSize: '10px' }}>
                    🟢 COMPRADORES (BIDS)
                  </div>
                  {bookData.buyOrders.length === 0 ? (
                    <div style={{ color: '#888', fontStyle: 'italic', fontSize: '9px', padding: '10px 0' }}>
                      Nenhuma ordem de compra aberta.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #c2e0b6', textAlign: 'left' }}>
                          <th style={{ padding: '4px' }}>Preço</th>
                          <th style={{ padding: '4px' }}>Qtd</th>
                          <th style={{ padding: '4px' }}>Ordens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookData.buyOrders.map((bo, i) => (
                          <tr key={i} style={{ borderBottom: '1px dotted #e1edd8' }}>
                            <td style={{ padding: '4px', color: '#1c6609', fontWeight: 'bold' }}>{bo.unit_price}G</td>
                            <td style={{ padding: '4px' }}>{bo.total_quantity}</td>
                            <td style={{ padding: '4px', color: '#666' }}>{bo.order_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* SELL ORDERS (ASKS) */}
                <div style={{
                  background: '#fdf0f0',
                  border: '2px solid #b85454',
                  borderRadius: '4px',
                  padding: '10px'
                }}>
                  <div style={{ color: '#8f2323', fontWeight: 'bold', marginBottom: '8px', fontSize: '10px' }}>
                    🔴 VENDEDORES (ASKS)
                  </div>
                  {bookData.sellOrders.length === 0 ? (
                    <div style={{ color: '#888', fontStyle: 'italic', fontSize: '9px', padding: '10px 0' }}>
                      Nenhuma oferta de venda aberta.
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e8bcbc', textAlign: 'left' }}>
                          <th style={{ padding: '4px' }}>Preço</th>
                          <th style={{ padding: '4px' }}>Qtd</th>
                          <th style={{ padding: '4px' }}>Ordens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookData.sellOrders.map((so, i) => (
                          <tr key={i} style={{ borderBottom: '1px dotted #f2d8d8' }}>
                            <td style={{ padding: '4px', color: '#a31c1c', fontWeight: 'bold' }}>{so.unit_price}G</td>
                            <td style={{ padding: '4px' }}>{so.total_quantity}</td>
                            <td style={{ padding: '4px', color: '#666' }}>{so.order_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <form onSubmit={handleCreateOrder} style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Tipo de Ordem:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setOrderType('BUY')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: orderType === 'BUY' ? '#2e7d32' : '#ddd',
                      color: orderType === 'BUY' ? '#fff' : '#444',
                      border: '2px solid #1b5e20',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    🟢 COMPRAR (BUY)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('SELL')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: orderType === 'SELL' ? '#c62828' : '#ddd',
                      color: orderType === 'SELL' ? '#fff' : '#444',
                      border: '2px solid #b71c1c',
                      borderRadius: '4px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    🔴 VENDER (SELL)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px' }}>Preço Unitário (G):</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={orderPrice}
                  onChange={e => setOrderPrice(e.target.value)}
                  style={{ width: '100%', padding: '8px', fontSize: '11px', border: '2px solid #6b4423', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px' }}>Quantidade:</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={orderQty}
                  onChange={e => setOrderQty(e.target.value)}
                  style={{ width: '100%', padding: '8px', fontSize: '11px', border: '2px solid #6b4423', borderRadius: '4px' }}
                />
              </div>

              {/* Economic Summary Box */}
              <div style={{ background: '#fffcf0', border: '2px solid #bda37c', padding: '10px', borderRadius: '4px', fontSize: '9px', lineHeight: '1.6' }}>
                <div>Valor Total da Ordem: <strong>{totalCost}G</strong></div>
                <div style={{ color: '#8d420f' }}>Taxa de Listagem (1%, não-reembolsável): <strong>{listingFee}G</strong></div>
                {orderType === 'SELL' && (
                  <div style={{ color: '#666' }}>Taxa de Mercado na Execução (8% retenção): ~<strong>{estimatedMarketFee}G</strong></div>
                )}
                <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
                  {orderType === 'BUY' ? `Total a Bloquear: ${totalCost + listingFee}G` : `Itens a Bloquear: ${orderQty}x ${selectedItem}`}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px',
                  background: orderType === 'BUY' ? '#2e7d32' : '#c62828',
                  color: '#fff',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}
              >
                {submitting ? 'Postando...' : `CONFIRMAR ORDEM DE ${orderType}`}
              </button>
            </form>
          )}

          {activeTab === 'my_orders' && (
            <div>
              <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Minhas Ordens Recentes:</div>
              {myOrders.length === 0 ? (
                <div style={{ color: '#777', fontStyle: 'italic', padding: '20px 0' }}>Você não tem ordens ativas.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                  <thead>
                    <tr style={{ background: '#d8c29d', borderBottom: '2px solid #5a381e', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Tipo</th>
                      <th style={{ padding: '6px' }}>Item</th>
                      <th style={{ padding: '6px' }}>Preço</th>
                      <th style={{ padding: '6px' }}>Restante</th>
                      <th style={{ padding: '6px' }}>Status</th>
                      <th style={{ padding: '6px' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myOrders.map(ord => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid #e0ceb1' }}>
                        <td style={{ padding: '6px', fontWeight: 'bold', color: ord.type === 'BUY' ? '#2e7d32' : '#c62828' }}>
                          {ord.type}
                        </td>
                        <td style={{ padding: '6px' }}>{ord.item_id}</td>
                        <td style={{ padding: '6px' }}>{ord.unit_price}G</td>
                        <td style={{ padding: '6px' }}>{ord.quantity_remaining}/{ord.quantity_total}</td>
                        <td style={{ padding: '6px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: ord.status === 'FILLED' ? '#d4edda' : ord.status === 'OPEN' ? '#fff3cd' : '#f8d7da',
                            color: ord.status === 'FILLED' ? '#155724' : ord.status === 'OPEN' ? '#856404' : '#721c24'
                          }}>
                            {ord.status}
                          </span>
                        </td>
                        <td style={{ padding: '6px' }}>
                          {ord.status === 'OPEN' && (
                            <button
                              onClick={() => handleCancelOrder(ord.id)}
                              style={{
                                padding: '4px 8px',
                                background: '#c62828',
                                color: '#fff',
                                border: '1px solid #000',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '8px'
                              }}
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Livro-Razão (Ledger Imutável):</div>
              <div style={{ fontSize: '8px', color: '#666', marginBottom: '10px' }}>
                Registro contábil de dupla entrada para auditoria econômica (Game.md Seção 26 & 39).
              </div>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                  <thead>
                    <tr style={{ background: '#d8c29d', borderBottom: '2px solid #5a381e', textAlign: 'left' }}>
                      <th style={{ padding: '6px' }}>Tipo</th>
                      <th style={{ padding: '6px' }}>Valor</th>
                      <th style={{ padding: '6px' }}>Saldo Ant.</th>
                      <th style={{ padding: '6px' }}>Novo Saldo</th>
                      <th style={{ padding: '6px' }}>Referência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerLogs.map(log => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #e0ceb1' }}>
                        <td style={{ padding: '5px', fontWeight: 'bold' }}>{log.type}</td>
                        <td style={{ padding: '5px', color: log.amount >= 0 ? '#1b5e20' : '#b71c1c', fontWeight: 'bold' }}>
                          {log.amount >= 0 ? `+${log.amount}G` : `${log.amount}G`}
                        </td>
                        <td style={{ padding: '5px' }}>{log.balance_before}G</td>
                        <td style={{ padding: '5px' }}>{log.balance_after}G</td>
                        <td style={{ padding: '5px', color: '#444' }}>{log.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
