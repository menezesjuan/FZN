import React, { useState, useEffect, useCallback } from 'react';

const QUALITY_LABELS = {
  normal:  { label: 'Normal',  color: '#e2e8f0', icon: '' },
  silver:  { label: 'Prata',   color: '#94a3b8', icon: '★' },
  gold:    { label: 'Ouro',    color: '#facc15', icon: '★' },
  iridium: { label: 'Iridium', color: '#c084fc', icon: '★' }
};

const SELLER_COLORS = {
  npc_fazenda_verde: '#4ade80',
  npc_celeiro_sul:   '#38bdf8',
  npc_mercador:      '#fb923c',
  player:            '#fbbf24'
};

const SELLER_BADGE = {
  npc_fazenda_verde: '🌾',
  npc_celeiro_sul:   '🐄',
  npc_mercador:      '🧳',
  player:            '⭐'
};

const ITEM_ICONS = {
  crop_strawberry:  '🍓',
  crop_potato:      '🥔',
  crop_leek:        '🥗',
  crop_onion:       '🧅',
  produce_egg:      '🥚',
  produce_milk:     '🥛',
  artisan_cheese:   '🧀',
  artisan_mayo:     '🥣',
  artisan_jam:      '🍯',
  material_wood:    '🪵',
  seeds_strawberry: '🍓🌱',
  seeds_potato:     '🥔🌱',
  seeds_leek:       '🥗🌱',
  seeds_onion:      '🧅🌱',
};

function getItemIcon(itemId) {
  return ITEM_ICONS[itemId] || '📦';
}

function formatTimeAgo(ts) {
  if (!ts) return '';
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora mesmo';
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  return `${Math.floor(diffH / 24)}d atrás`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ListingCard({ listing, playerMoney, onBuy, isSelf }) {
  const [qty, setQty] = useState(1);
  const [buying, setBuying] = useState(false);

  const subtotal = listing.unitPrice * qty;
  const fee = Math.ceil(subtotal * 0.05);
  const total = subtotal + fee;
  const canAfford = playerMoney >= total;
  const qualityInfo = QUALITY_LABELS[listing.quality] || QUALITY_LABELS.normal;
  const sellerColor = SELLER_COLORS[listing.sellerId] || '#e2e8f0';
  const sellerBadge = SELLER_BADGE[listing.sellerId] || '👤';

  async function handleBuy() {
    if (buying) return;
    setBuying(true);
    try {
      await onBuy(listing.id, qty);
    } finally {
      setBuying(false);
      setQty(1);
    }
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '24px' }}>{getItemIcon(listing.itemId)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{listing.itemName}</div>
          <div style={{ color: qualityInfo.color, fontSize: '11px' }}>
            {qualityInfo.icon && <span>{qualityInfo.icon} </span>}{qualityInfo.label}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '14px' }}>
            🪙 {listing.unitPrice}G
          </div>
          <div style={{ color: '#94a3b8', fontSize: '10px' }}>por unidade</div>
        </div>
      </div>

      {/* Seller & stock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
        <span style={{ color: sellerColor }}>
          {sellerBadge} {listing.sellerName}
        </span>
        <span style={{ color: '#94a3b8' }}>
          Estoque: <strong style={{ color: '#e2e8f0' }}>{listing.remainingQuantity}</strong>
        </span>
      </div>

      {/* Buy controls */}
      {isSelf ? (
        <div style={{ color: '#facc15', fontSize: '11px', textAlign: 'center' }}>
          ⭐ Seu anúncio — veja em &quot;Meus Anúncios&quot;
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="number"
            min={1}
            max={listing.remainingQuantity}
            value={qty}
            onChange={e => setQty(Math.min(listing.remainingQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
            style={{
              width: '56px',
              padding: '4px 6px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              textAlign: 'center'
            }}
          />
          <div style={{ flex: 1, fontSize: '11px', color: canAfford ? '#4ade80' : '#f87171' }}>
            Total: {total}G
            <span style={{ color: '#64748b' }}> (+{fee}G taxa)</span>
          </div>
          <button
            onClick={handleBuy}
            disabled={buying || !canAfford}
            style={{
              padding: '5px 12px',
              borderRadius: '5px',
              border: 'none',
              background: canAfford ? '#16a34a' : '#374151',
              color: '#fff',
              fontSize: '11px',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}
          >
            {buying ? '...' : '🛒 Comprar'}
          </button>
        </div>
      )}

      <div style={{ color: '#475569', fontSize: '10px', textAlign: 'right' }}>
        {formatTimeAgo(listing.createdAt)}
      </div>
    </div>
  );
}

function SellTab({ inventory, itemsConfig, playerMoney, onCreateListing }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sellableItems = (inventory || []).filter(item => {
    if (!itemsConfig?.items?.[item.id]) return false;
    const def = itemsConfig.items[item.id];
    return def.category !== 'tool' && item.quantity > 0;
  });

  const selectedItem = sellableItems.find(i => i.slot === selectedSlot);
  const itemDef = selectedItem ? itemsConfig?.items?.[selectedItem.id] : null;
  const totalRevenue = selectedItem && price ? Math.floor(Number(price)) * qty : 0;

  async function handleSubmit() {
    if (!selectedItem || !price || Number(price) < 1 || qty < 1) return;
    setSubmitting(true);
    try {
      await onCreateListing(selectedItem.id, qty, Math.floor(Number(price)), selectedItem.quality);
      setSelectedSlot(null);
      setQty(1);
      setPrice('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ color: '#94a3b8', fontSize: '11px' }}>
        Selecione um item do inventário para anunciar no Mercado. O item será deduzido imediatamente e devolvido se você cancelar.
      </div>

      {/* Item grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
        {sellableItems.length === 0 && (
          <div style={{ color: '#64748b', fontSize: '12px', gridColumn: '1/-1', textAlign: 'center', padding: '16px' }}>
            Nenhum item vendável no inventário.
          </div>
        )}
        {sellableItems.map(item => {
          const def = itemsConfig?.items?.[item.id];
          const isSelected = item.slot === selectedSlot;
          const qualityInfo = QUALITY_LABELS[item.quality] || QUALITY_LABELS.normal;
          return (
            <div
              key={item.slot}
              onClick={() => { setSelectedSlot(item.slot); setQty(1); }}
              style={{
                background: isSelected ? 'rgba(37, 99, 235, 0.4)' : 'rgba(0,0,0,0.3)',
                border: `1px solid ${isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '6px',
                padding: '8px 6px',
                cursor: 'pointer',
                textAlign: 'center',
                fontSize: '11px'
              }}
            >
              <div style={{ fontSize: '20px' }}>{getItemIcon(item.id)}</div>
              <div style={{ color: '#e2e8f0', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {def?.name || item.id}
              </div>
              <div style={{ color: qualityInfo.color, fontSize: '10px' }}>
                {qualityInfo.label}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '10px' }}>x{item.quantity}</div>
            </div>
          );
        })}
      </div>

      {/* Listing form */}
      {selectedItem && (
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '10px', fontSize: '13px' }}>
            {getItemIcon(selectedItem.id)} {itemDef?.name} ({QUALITY_LABELS[selectedItem.quality]?.label || 'Normal'})
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Quantidade</label>
              <input
                type="number"
                min={1}
                max={selectedItem.quantity}
                value={qty}
                onChange={e => setQty(Math.min(selectedItem.quantity, Math.max(1, parseInt(e.target.value) || 1)))}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>Máx: {selectedItem.quantity}</div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Preço unitário (G)</label>
              <input
                type="number"
                min={1}
                max={99999}
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ex: 60"
                style={{
                  width: '100%',
                  padding: '6px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              {itemDef?.baseSellPrice && (
                <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                  Base NPC: {itemDef.baseSellPrice}G
                </div>
              )}
            </div>
          </div>

          {price && Number(price) >= 1 && (
            <div style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '4px', padding: '8px', fontSize: '11px', marginBottom: '10px' }}>
              <div style={{ color: '#ffd700' }}>Receita estimada: <strong>{totalRevenue}G</strong></div>
              <div style={{ color: '#94a3b8' }}>
                {qty}x {itemDef?.name} × {price}G = {totalRevenue}G
              </div>
              <div style={{ color: '#64748b', fontSize: '10px' }}>
                (O comprador pagará +5% de taxa de mercado)
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !price || Number(price) < 1 || qty < 1}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: (!price || Number(price) < 1 || qty < 1) ? '#374151' : '#2563eb',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {submitting ? 'Publicando...' : '📦 Publicar Anúncio'}
          </button>
        </div>
      )}
    </div>
  );
}

function MyListingsTab({ myListings, onCancel }) {
  const active = myListings.filter(l => l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD');
  const past = myListings.filter(l => l.status !== 'ACTIVE' && l.status !== 'PARTIALLY_SOLD');

  const statusColor = { ACTIVE: '#4ade80', PARTIALLY_SOLD: '#38bdf8', SOLD: '#94a3b8', CANCELLED: '#f87171', EXPIRED: '#64748b' };
  const statusLabel = { ACTIVE: 'Ativo', PARTIALLY_SOLD: 'Parcialmente Vendido', SOLD: 'Vendido', CANCELLED: 'Cancelado', EXPIRED: 'Expirado' };

  function ListingRow({ listing }) {
    const [cancelling, setCancelling] = useState(false);
    const isActive = listing.status === 'ACTIVE' || listing.status === 'PARTIALLY_SOLD';
    const sold = listing.quantity - listing.remainingQuantity;
    const earned = sold * listing.unitPrice;

    return (
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        border: `1px solid ${isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '6px',
        padding: '10px',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        opacity: isActive ? 1 : 0.6
      }}>
        <span style={{ fontSize: '22px' }}>{getItemIcon(listing.itemId)}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: 'bold' }}>{listing.itemName}</div>
          <div style={{ color: '#94a3b8', fontSize: '11px' }}>
            {listing.unitPrice}G/un · Restante: {listing.remainingQuantity}/{listing.quantity}
          </div>
          {sold > 0 && (
            <div style={{ color: '#4ade80', fontSize: '11px' }}>Vendido: {sold} ({earned}G ganhos)</div>
          )}
          <div style={{ color: statusColor[listing.status] || '#94a3b8', fontSize: '10px', marginTop: '2px' }}>
            {statusLabel[listing.status] || listing.status} · {formatTimeAgo(listing.createdAt)}
          </div>
        </div>
        {isActive && (
          <button
            onClick={async () => {
              setCancelling(true);
              try { await onCancel(listing.id); } finally { setCancelling(false); }
            }}
            disabled={cancelling}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #ef4444',
              background: 'transparent',
              color: '#f87171',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            {cancelling ? '...' : '✕ Cancelar'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {myListings.length === 0 && (
        <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '24px' }}>
          Você ainda não criou nenhum anúncio.
          <br />Use a aba <strong style={{ color: '#94a3b8' }}>📦 Vender</strong> para criar um!
        </div>
      )}
      {active.length > 0 && (
        <>
          <div style={{ color: '#4ade80', fontSize: '11px', fontWeight: 'bold' }}>🟢 Anúncios Ativos</div>
          {active.map(l => <ListingRow key={l.id} listing={l} />)}
        </>
      )}
      {past.length > 0 && (
        <>
          <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', marginTop: '8px' }}>📋 Histórico</div>
          {past.slice(0, 10).map(l => <ListingRow key={l.id} listing={l} />)}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main MarketModal
// ─────────────────────────────────────────────────────────────────────────────

export default function MarketModal({
  isOpen,
  onClose,
  listings = [],
  myListings = [],
  inventory = [],
  itemsConfig,
  playerMoney = 0,
  onRefresh,
  onBuy,
  onCreateListing,
  onCancelListing
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && onRefresh) onRefresh();
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { label: '🛒 Comprar', key: 'buy' },
    { label: '📦 Vender',  key: 'sell' },
    { label: '📋 Meus Anúncios', key: 'mine' }
  ];

  const filteredListings = listings.filter(l => {
    if (!searchTerm) return true;
    return l.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           l.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)'
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: '2px solid rgba(255,255,255,0.15)',
        borderRadius: '12px',
        width: '640px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.8)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(0,0,0,0.3)'
        }}>
          <div>
            <div style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '16px', fontFamily: "'Press Start 2P', monospace" }}>
              🏪 Mercado Global
            </div>
            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
              Compre e venda com outros fazendeiros — Taxa de mercado: 5%
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(250,204,21,0.15)',
              border: '1px solid rgba(250,204,21,0.3)',
              borderRadius: '6px',
              padding: '4px 10px',
              color: '#ffd700',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              🪙 {playerMoney}G
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', color: '#94a3b8',
              fontSize: '20px', cursor: 'pointer', padding: '0 4px'
            }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {tabs.map((tab, idx) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(idx)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: activeTab === idx ? 'rgba(37,99,235,0.3)' : 'transparent',
                borderBottom: activeTab === idx ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === idx ? '#93c5fd' : '#64748b',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: activeTab === idx ? 'bold' : 'normal',
                transition: 'all 0.15s'
              }}
            >
              {tab.label}
              {idx === 2 && myListings.filter(l => l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD').length > 0 && (
                <span style={{
                  marginLeft: '6px',
                  background: '#3b82f6',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 6px',
                  fontSize: '10px'
                }}>
                  {myListings.filter(l => l.status === 'ACTIVE' || l.status === 'PARTIALLY_SOLD').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Tab 0: Comprar */}
          {activeTab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Search */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar item ou vendedor..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={onRefresh}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(37,99,235,0.3)',
                    border: '1px solid rgba(37,99,235,0.5)',
                    borderRadius: '6px',
                    color: '#93c5fd',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title="Atualizar listagens"
                >
                  🔄
                </button>
              </div>

              {filteredListings.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center', padding: '32px', fontSize: '13px' }}>
                  Nenhum anúncio encontrado.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {filteredListings.map(listing => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      playerMoney={playerMoney}
                      onBuy={onBuy}
                      isSelf={listing.sellerId === 'player'}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 1: Vender */}
          {activeTab === 1 && (
            <SellTab
              inventory={inventory}
              itemsConfig={itemsConfig}
              playerMoney={playerMoney}
              onCreateListing={onCreateListing}
            />
          )}

          {/* Tab 2: Meus Anúncios */}
          {activeTab === 2 && (
            <MyListingsTab
              myListings={myListings}
              onCancel={onCancelListing}
            />
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          color: '#475569',
          fontSize: '10px',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.2)'
        }}>
          Pressione <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '3px', color: '#94a3b8' }}>E</kbd> ou clique fora para fechar · NPCs Fazenda Verde, Celeiro do Sul e Mercador Itinerante reabastecem automaticamente
        </div>
      </div>
    </div>
  );
}
