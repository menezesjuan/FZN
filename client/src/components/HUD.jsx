import React from 'react';

export default function HUD({ 
  player, 
  time, 
  inventory, 
  selectedSlot, 
  onSelectSlot, 
  onOpenInventory, 
  onOpenShop,
  onDevAdvanceTime,
  onDevRestoreEnergy,
  isMuted,
  onToggleMute,
  itemsConfig 
}) {
  const [showDevTools, setShowDevTools] = React.useState(false);

  if (!player) return null;

  const xpRequired = player.level * 100;
  const xpPercent = Math.min(100, Math.round((player.xp / xpRequired) * 100));
  const energyPercent = Math.min(100, Math.round((player.energy / player.maxEnergy) * 100));

  // Hotbar displays slots 0 to 7
  const hotbarSlots = Array.from({ length: 8 }).map((_, index) => {
    const item = inventory.find(i => i.slot === index);
    const itemDef = item ? itemsConfig?.items?.[item.id] : null;
    return { slotIndex: index, item, itemDef };
  });

  return (
    <>
      {/* Top Bar: Stats & Controls */}
      <header className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none z-10" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px' }}>
        {/* Left: Player status */}
        <div className="pixel-panel pointer-events-auto" style={{ padding: '10px 16px', minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span className="font-pixel" style={{ fontSize: '11px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
              Nvl. {player.level} {player.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
              <span style={{ color: '#ffd700', fontWeight: 'bold' }}>🪙</span>
              <span className="font-pixel" style={{ fontSize: '12px', color: '#fff' }}>{player.money}G</span>
            </div>
          </div>

          {/* XP Bar */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px', color: '#f3e1c6' }}>
              <span>XP</span>
              <span>{player.xp}/{xpRequired}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#3b2210', borderRadius: '3px', overflow: 'hidden', border: '1px solid #231307' }}>
              <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #4ade80, #22c55e)', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Energy Bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px', color: '#f3e1c6' }}>
              <span>⚡ Energia</span>
              <span>{player.energy}/{player.maxEnergy}</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#3b2210', borderRadius: '3px', overflow: 'hidden', border: '1px solid #231307' }}>
              <div style={{ 
                width: `${energyPercent}%`, 
                height: '100%', 
                background: energyPercent > 25 ? 'linear-gradient(90deg, #38bdf8, #0ea5e9)' : 'linear-gradient(90deg, #f87171, #ef4444)',
                transition: 'width 0.3s' 
              }} />
            </div>
          </div>
        </div>

        {/* Right: Date & Menu Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div className="pixel-panel pointer-events-auto" style={{ padding: '8px 14px', textAlign: 'right' }}>
            <div className="font-pixel" style={{ fontSize: '11px', color: '#ffea75', marginBottom: '2px' }}>
              🌸 {time?.season || 'Primavera'} — Dia {time?.day || 1}
            </div>
            <div style={{ fontSize: '12px', color: '#fff', opacity: 0.85 }}>
              Ano {time?.year || 1}
            </div>
          </div>

          <div className="pointer-events-auto" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              className="pixel-btn" 
              onClick={onToggleMute} 
              title={isMuted ? "Ativar Áudio (Mudo)" : "Desativar Áudio"}
              style={{ padding: '8px 10px', minWidth: '38px', fontSize: '15px' }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button className="pixel-btn" onClick={onOpenInventory} title="Abrir Mochila (I)">
              🎒 Mochila
            </button>
            <button className="pixel-btn" onClick={onOpenShop} title="Loja do Vilarejo (B)">
              🏪 Loja
            </button>
            <button 
              className="pixel-btn" 
              onClick={() => setShowDevTools(p => !p)} 
              title="Painel de Ferramentas Rápidas"
              style={{ padding: '8px 10px', fontSize: '13px', background: '#64748b', borderColor: '#334155', color: '#fff' }}
            >
              🛠️
            </button>
          </div>

          {/* Optional subtle collapsible dev drawer */}
          {showDevTools && (
            <div className="pointer-events-auto pixel-panel" style={{ display: 'flex', gap: '6px', padding: '6px 10px', marginTop: '4px' }}>
              <button className="pixel-btn" onClick={onDevAdvanceTime} style={{ background: '#7e57c2', color: '#fff', borderColor: '#4527a0', padding: '4px 8px', fontSize: '11px' }} title="Acelerar 60s">
                ⏩ +60s
              </button>
              <button className="pixel-btn" onClick={onDevRestoreEnergy} style={{ background: '#0288d1', color: '#fff', borderColor: '#01579b', padding: '4px 8px', fontSize: '11px' }} title="Restaurar Energia">
                ⚡ Restaurar
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Bottom Bar: Interactive Hotbar */}
      <footer style={{ 
        position: 'absolute', 
        bottom: '16px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        display: 'flex', 
        gap: '6px', 
        zIndex: 10 
      }}>
        {hotbarSlots.map(({ slotIndex, item, itemDef }) => {
          const isActive = selectedSlot === slotIndex;

          return (
            <div
              key={slotIndex}
              className={`hotbar-slot ${isActive ? 'active' : ''}`}
              onClick={() => onSelectSlot(slotIndex)}
              title={itemDef ? `${itemDef.name} (${item.quantity}x)` : `Compartimento ${slotIndex + 1}`}
            >
              {/* Slot number badge */}
              <span style={{ 
                position: 'absolute', 
                top: '2px', 
                left: '4px', 
                fontSize: '9px', 
                fontFamily: "'Press Start 2P', monospace", 
                color: '#fff',
                textShadow: '1px 1px 0 #000',
                opacity: 0.7 
              }}>
                {slotIndex + 1}
              </span>

              {/* Item Icon */}
              {item && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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

                  {/* Stack quantity */}
                  {item.quantity > 1 && (
                    <span style={{ 
                      position: 'absolute', 
                      bottom: '2px', 
                      right: '4px', 
                      fontSize: '11px', 
                      fontWeight: 'bold', 
                      color: '#fff',
                      textShadow: '1px 1px 0 #000' 
                    }}>
                      {item.quantity}
                    </span>
                  )}

                  {/* Quality Star */}
                  {item.quality === 'silver' && <span className="star-silver" style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '10px' }}>★</span>}
                  {item.quality === 'gold' && <span className="star-gold" style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '10px' }}>★</span>}
                  {item.quality === 'iridium' && <span className="star-iridium" style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '10px' }}>★</span>}
                </div>
              )}
            </div>
          );
        })}
      </footer>
    </>
  );
}
