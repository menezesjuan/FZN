import React from 'react';

export default function ChestModal({
  isOpen,
  onClose,
  chest = [],
  inventory = [],
  itemsConfig,
  onDeposit,
  onWithdraw,
  onQuickStack
}) {
  if (!isOpen) return null;

  // Chest slots (16 slots: 2 rows x 8 cols)
  const chestSlots = Array.from({ length: 16 }).map((_, index) => {
    const item = chest.find(c => c.slot === index);
    const itemDef = item ? itemsConfig?.items?.[item.id] : null;
    return { slotIndex: index, item, itemDef };
  });

  // Player inventory slots (24 slots: 3 rows x 8 cols)
  const inventorySlots = Array.from({ length: 24 }).map((_, index) => {
    const item = inventory.find(i => i.slot === index);
    const itemDef = item ? itemsConfig?.items?.[item.id] : null;
    return { slotIndex: index, item, itemDef };
  });

  const renderItemIcon = (item) => {
    if (!item) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', width: '100%', height: '100%', justifyContent: 'center' }}>
        {item.id === 'tool_hoe' && <span style={{ fontSize: '20px' }}>⛏️</span>}
        {item.id === 'tool_can' && <span style={{ fontSize: '20px' }}>🚰</span>}
        {item.id === 'tool_axe' && <span style={{ fontSize: '20px' }}>🪓</span>}
        {item.id === 'tool_pail' && <span style={{ fontSize: '20px' }}>🪣</span>}
        {item.id === 'produce_egg' && <span style={{ fontSize: '20px' }}>🥚</span>}
        {item.id === 'produce_milk' && <span style={{ fontSize: '20px' }}>🥛</span>}
        {item.id === 'material_wood' && <span style={{ fontSize: '20px' }}>🪵</span>}
        {item.id === 'seeds_strawberry' && <span style={{ fontSize: '20px' }}>🍓🌱</span>}
        {item.id === 'seeds_leek' && <span style={{ fontSize: '20px' }}>🧅🌱</span>}
        {item.id === 'seeds_potato' && <span style={{ fontSize: '20px' }}>🥔🌱</span>}
        {item.id === 'seeds_onion' && <span style={{ fontSize: '20px' }}>🌰🌱</span>}
        {item.id === 'crop_strawberry' && <span style={{ fontSize: '20px' }}>🍓</span>}
        {item.id === 'crop_leek' && <span style={{ fontSize: '20px' }}>🥗</span>}
        {item.id === 'crop_potato' && <span style={{ fontSize: '20px' }}>🥔</span>}
        {item.id === 'crop_onion' && <span style={{ fontSize: '20px' }}>🧅</span>}

        {item.quantity > 1 && (
          <span style={{
            position: 'absolute',
            bottom: '2px',
            right: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#fff',
            textShadow: '1px 1px 0 #000'
          }}>
            {item.quantity}
          </span>
        )}

        {item.quality === 'silver' && <span className="star-silver" style={{ position: 'absolute', bottom: '2px', left: '4px' }}>★</span>}
        {item.quality === 'gold' && <span className="star-gold" style={{ position: 'absolute', bottom: '2px', left: '4px' }}>★</span>}
        {item.quality === 'iridium' && <span className="star-iridium" style={{ position: 'absolute', bottom: '2px', left: '4px' }}>★</span>}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.68)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60
    }}>
      <div className="pixel-panel" style={{ width: '580px', maxWidth: '95vw', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📦</span>
            <h2 className="font-pixel" style={{ fontSize: '14px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
              Baú de Armazenamento Rústico
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="pixel-btn"
              onClick={onQuickStack}
              title="Transfere automaticamente itens da mochila que já existem no baú"
              style={{ padding: '4px 10px', fontSize: '11px', background: '#d97706', color: '#fff' }}
            >
              ⚡ Guardar Iguais
            </button>
            <button className="pixel-btn" onClick={onClose} style={{ padding: '4px 10px' }}>
              ✖ Fechar
            </button>
          </div>
        </div>

        {/* Chest Grid (16 slots) */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fef3c7' }}>
              Compartimento do Baú ({chest.length}/16):
            </span>
            <span style={{ fontSize: '10px', color: '#fed7aa' }}>
              Clique para retirar para a mochila
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px',
            background: '#6b3f19',
            padding: '10px',
            borderRadius: '6px',
            border: '2px solid #43220a'
          }}>
            {chestSlots.map(({ slotIndex, item, itemDef }) => (
              <div
                key={`chest-${slotIndex}`}
                className="hotbar-slot"
                style={{
                  width: '100%',
                  height: '52px',
                  cursor: item ? 'pointer' : 'default',
                  background: item ? '#543118' : 'rgba(40, 20, 10, 0.4)'
                }}
                onClick={() => {
                  if (item && onWithdraw) {
                    onWithdraw(item.slot, item.quantity);
                  }
                }}
                title={item ? `${itemDef?.name || item.id} (${item.quantity}x) — Clique para retirar` : `Compartimento ${slotIndex + 1}`}
              >
                {renderItemIcon(item)}
              </div>
            ))}
          </div>
        </div>

        {/* Player Inventory Grid (24 slots) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fef3c7' }}>
              Mochila do Fazendeiro ({inventory.length}/24):
            </span>
            <span style={{ fontSize: '10px', color: '#bbf7d0' }}>
              Clique para guardar no baú
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '8px',
            background: '#8b5a2b',
            padding: '10px',
            borderRadius: '6px',
            border: '2px solid #543118'
          }}>
            {inventorySlots.map(({ slotIndex, item, itemDef }) => (
              <div
                key={`inv-${slotIndex}`}
                className="hotbar-slot"
                style={{
                  width: '100%',
                  height: '52px',
                  cursor: item ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (item && onDeposit) {
                    onDeposit(item.slot, item.quantity);
                  }
                }}
                title={item ? `${itemDef?.name || item.id} (${item.quantity}x) — Clique para guardar no baú` : `Espaço ${slotIndex + 1}`}
              >
                {renderItemIcon(item)}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Hint */}
        <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '10px', color: '#fef08a' }}>
          💡 Dica: Itens com mesma qualidade se empilham automaticamente no baú!
        </div>
      </div>
    </div>
  );
}
