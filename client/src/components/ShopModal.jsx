import React, { useState } from 'react';

export default function ShopModal({ 
  isOpen, 
  onClose, 
  catalog, 
  inventory, 
  playerMoney, 
  itemsConfig, 
  onBuy, 
  onSell 
}) {
  const [tab, setTab] = useState('buy'); // 'buy' or 'sell'

  if (!isOpen) return null;

  // Items in inventory available to sell (produce or surplus seeds)
  const sellableItems = inventory.filter(item => {
    const def = itemsConfig?.items?.[item.id];
    return def && def.category !== 'tool';
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div className="pixel-panel" style={{ width: '600px', maxWidth: '95vw', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="font-pixel" style={{ fontSize: '14px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
              🏪 Empório do Vilarejo
            </h2>
            <div style={{ fontSize: '12px', color: '#f7e6c4', marginTop: '4px' }}>
              Seu Saldo: <strong style={{ color: '#ffd700' }}>{playerMoney}G</strong>
            </div>
          </div>
          <button className="pixel-btn" onClick={onClose} style={{ padding: '4px 10px' }}>
            ✖ Fechar
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            className="pixel-btn"
            style={{
              flex: 1,
              background: tab === 'buy' ? '#ffdf94' : '#c28d5d',
              borderBottom: tab === 'buy' ? '3px solid #ffaa00' : undefined
            }}
            onClick={() => setTab('buy')}
          >
            🌱 Comprar Sementes
          </button>
          <button
            className="pixel-btn"
            style={{
              flex: 1,
              background: tab === 'sell' ? '#ffdf94' : '#c28d5d',
              borderBottom: tab === 'sell' ? '3px solid #ffaa00' : undefined
            }}
            onClick={() => setTab('sell')}
          >
            💰 Vender Mercadorias ({sellableItems.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="pixel-panel-inner" style={{ padding: '12px', maxHeight: '340px', overflowY: 'auto' }}>
          {tab === 'buy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {catalog.map(seed => (
                <div
                  key={seed.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    background: '#fff9ed',
                    border: '1px solid #d4a373',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🌱</span>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: 'bold' }}>{seed.name}</h4>
                      <p style={{ fontSize: '11px', color: '#664422' }}>{seed.description}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="font-pixel" style={{ fontSize: '12px', color: '#b45309' }}>
                      {seed.buyPrice}G
                    </span>
                    <button
                      className="pixel-btn"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      disabled={playerMoney < seed.buyPrice}
                      onClick={() => onBuy(seed.id, 1)}
                    >
                      Comprar 1x
                    </button>
                    <button
                      className="pixel-btn"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                      disabled={playerMoney < seed.buyPrice * 5}
                      onClick={() => onBuy(seed.id, 5)}
                    >
                      5x ({seed.buyPrice * 5}G)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'sell' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sellableItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#7e5535' }}>
                  Você ainda não possui mercadorias ou colheitas para vender na mochila!
                </div>
              ) : (
                sellableItems.map(item => {
                  const def = itemsConfig?.items?.[item.id];
                  const quality = item.quality || 'normal';
                  const qualityMult = itemsConfig?.qualities?.[quality]?.multiplier || 1.0;
                  const unitPrice = Math.round((def?.baseSellPrice || def?.sellPrice || 10) * qualityMult);
                  const totalPrice = unitPrice * item.quantity;

                  return (
                    <div
                      key={`${item.slot}_${item.id}_${quality}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px',
                        background: '#fff9ed',
                        border: '1px solid #d4a373',
                        borderRadius: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>
                          {item.id.includes('strawberry') ? '🍓' : 
                           item.id.includes('potato') ? '🥔' :
                           item.id.includes('leek') ? '🥗' : '🧅'}
                        </span>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: 'bold' }}>{def?.name || item.id}</h4>
                            {quality === 'silver' && <span className="star-silver font-pixel" style={{ fontSize: '10px' }}>★ Prata</span>}
                            {quality === 'gold' && <span className="star-gold font-pixel" style={{ fontSize: '10px' }}>★ Ouro</span>}
                            {quality === 'iridium' && <span className="star-iridium font-pixel" style={{ fontSize: '10px' }}>★ Iridium</span>}
                          </div>
                          <p style={{ fontSize: '11px', color: '#664422' }}>
                            Quantidade em posse: {item.quantity} | {unitPrice}G cada
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className="pixel-btn"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => onSell(item.slot, 1)}
                        >
                          Vender 1x (+{unitPrice}G)
                        </button>
                        {item.quantity > 1 && (
                          <button
                            className="pixel-btn"
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#4ade80', color: '#064e3b', borderColor: '#047857' }}
                            onClick={() => onSell(item.slot, item.quantity)}
                          >
                            Tudo ({totalPrice}G)
                          </button>
                        )}
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
