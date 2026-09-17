import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ShopModal({ isOpen, onClose, inventory, onRefreshState, showToast }) {
  const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
  const [catalog, setCatalog] = useState({ seeds: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api.getCatalog().then(setCatalog).catch(console.error);
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleBuySeed(seedId, qty) {
    setLoading(true);
    try {
      const res = await api.buySeed(seedId, qty);
      showToast(res.message, 'success');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSellItem(itemId, qty) {
    setLoading(true);
    try {
      const res = await api.sellItem(itemId, qty);
      showToast(res.message, 'success');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

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
        width: '680px',
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
            <span style={{ fontSize: '13px' }}>🏪 ARMAZÉM DO VALE (LOJA NPC)</span>
            <div style={{ fontSize: '8px', color: '#ffde99', marginTop: '4px' }}>
              Fornecimento de sementes e liquidez básica garantida
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

        {/* Tab switcher */}
        <div style={{ padding: '8px 16px', background: '#d8c29d', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('buy')}
            style={{
              padding: '6px 12px',
              fontSize: '9px',
              background: activeTab === 'buy' ? '#5a381e' : '#ba9d77',
              color: activeTab === 'buy' ? '#fff' : '#2b1708',
              border: '2px solid #4a2d16',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            COMPRAR SEMENTES
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            style={{
              padding: '6px 12px',
              fontSize: '9px',
              background: activeTab === 'sell' ? '#5a381e' : '#ba9d77',
              color: activeTab === 'sell' ? '#fff' : '#2b1708',
              border: '2px solid #4a2d16',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            VENDER MINHA PRODUÇÃO
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, fontSize: '9px' }}>
          {activeTab === 'buy' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {(catalog.seeds || []).map(seed => (
                <div
                  key={seed.id}
                  style={{
                    background: '#fffdf9',
                    border: '2px solid #8d5b35',
                    borderRadius: '4px',
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>🌱 {seed.name}</div>
                    <div style={{ fontSize: '8px', color: '#666', lineHeight: '1.5', marginBottom: '8px' }}>
                      Preço: <strong style={{ color: '#b85d18' }}>{seed.price}G</strong><br />
                      Tempo: <strong>{seed.growthTimeSec}s</strong> • Colheita: <strong>{seed.yield}x</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      disabled={loading}
                      onClick={() => handleBuySeed(seed.id, 1)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: '#4a8505',
                        color: '#fff',
                        border: '1px solid #2e5403',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '8px',
                        fontWeight: 'bold'
                      }}
                    >
                      +1 ({seed.price}G)
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => handleBuySeed(seed.id, 5)}
                      style={{
                        flex: 1,
                        padding: '6px',
                        background: '#306900',
                        color: '#fff',
                        border: '1px solid #1a3800',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '8px',
                        fontWeight: 'bold'
                      }}
                    >
                      +5 ({seed.price * 5}G)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sell' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(inventory || []).filter(i => !i.item_id.startsWith('seed_')).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#777', fontStyle: 'italic' }}>
                  Você não possui colheitas ou produtos processados no inventário para vender.
                </div>
              ) : (
                (inventory || []).filter(i => !i.item_id.startsWith('seed_')).map(item => {
                  const available = item.quantity - item.reserved;
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#fffdf9',
                        border: '2px solid #8d5b35',
                        borderRadius: '4px',
                        padding: '10px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>📦 {item.item_id.toUpperCase()}</div>
                        <div style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>
                          Quantidade Disponível: <strong>{available}</strong> (Reservado: {item.reserved})
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          disabled={loading || available < 1}
                          onClick={() => handleSellItem(item.item_id, 1)}
                          style={{
                            padding: '6px 10px',
                            background: available >= 1 ? '#d35400' : '#ccc',
                            color: available >= 1 ? '#fff' : '#777',
                            border: '1px solid #000',
                            borderRadius: '3px',
                            cursor: available >= 1 && !loading ? 'pointer' : 'not-allowed',
                            fontSize: '8px'
                          }}
                        >
                          Vender 1
                        </button>
                        <button
                          disabled={loading || available < 1}
                          onClick={() => handleSellItem(item.item_id, available)}
                          style={{
                            padding: '6px 10px',
                            background: available >= 1 ? '#ba4a00' : '#ccc',
                            color: available >= 1 ? '#fff' : '#777',
                            border: '1px solid #000',
                            borderRadius: '3px',
                            cursor: available >= 1 && !loading ? 'pointer' : 'not-allowed',
                            fontSize: '8px',
                            fontWeight: 'bold'
                          }}
                        >
                          Vender Tudo ({available})
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
