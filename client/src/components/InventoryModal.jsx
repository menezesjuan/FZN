import React from 'react';

export default function InventoryModal({ isOpen, onClose, inventory, itemsConfig, onSelectItem, selectedSlot }) {
  if (!isOpen) return null;

  // 24 slots grid (3 rows x 8 columns)
  const totalSlots = 24;
  const slots = Array.from({ length: totalSlots }).map((_, index) => {
    const item = inventory.find(i => i.slot === index);
    const itemDef = item ? itemsConfig?.items?.[item.id] : null;
    return { slotIndex: index, item, itemDef };
  });

  const selectedItemObj = inventory.find(i => i.slot === selectedSlot);
  const selectedDef = selectedItemObj ? itemsConfig?.items?.[selectedItemObj.id] : null;

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
      <div className="pixel-panel" style={{ width: '560px', maxWidth: '95vw', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="font-pixel" style={{ fontSize: '14px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
            🎒 Mochila do Fazendeiro
          </h2>
          <button className="pixel-btn" onClick={onClose} style={{ padding: '4px 10px' }}>
            ✖ Fechar
          </button>
        </div>

        {/* Slots Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '8px',
          background: '#8b5a2b',
          padding: '12px',
          borderRadius: '6px',
          border: '2px solid #543118'
        }}>
          {slots.map(({ slotIndex, item, itemDef }) => {
            const isSelected = selectedSlot === slotIndex;

            return (
              <div
                key={slotIndex}
                className={`hotbar-slot ${isSelected ? 'active' : ''}`}
                style={{ width: '100%', height: '54px' }}
                onClick={() => onSelectItem(slotIndex)}
              >
                {item && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {item.id === 'tool_hoe' && <span style={{ fontSize: '20px' }}>⛏️</span>}
                    {item.id === 'tool_can' && <span style={{ fontSize: '20px' }}>🚰</span>}
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
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Item Detail Card */}
        <div className="pixel-panel-inner" style={{ marginTop: '16px', padding: '12px' }}>
          {selectedItemObj && selectedDef ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {selectedDef.name} {selectedItemObj.quality !== 'normal' && `(★ ${selectedItemObj.quality.toUpperCase()})`}
                </h3>
                <span style={{ fontSize: '12px', background: '#e2a65d', padding: '2px 6px', borderRadius: '3px' }}>
                  Qtd: {selectedItemObj.quantity}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#553315', marginTop: '4px' }}>
                {selectedDef.description}
              </p>
              {selectedDef.baseSellPrice && (
                <div style={{ marginTop: '6px', fontSize: '12px', fontWeight: 'bold', color: '#8b5a2b' }}>
                  🪙 Preço estimado de venda: {Math.round(selectedDef.baseSellPrice * (itemsConfig.qualities[selectedItemObj.quality]?.multiplier || 1))}G por unidade
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: '12px', color: '#7e5535', textAlign: 'center' }}>
              Selecione um item na mochila para ver detalhes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
