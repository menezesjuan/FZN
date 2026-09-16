import React from 'react';

export default function HUD({ 
  player, 
  time, 
  weather = 'sunny',
  inventory, 
  selectedSlot, 
  onSelectSlot, 
  onOpenInventory, 
  onOpenShop,
  onOpenManagement,
  onOpenMarket,
  onDevAdvanceTime,
  onDevRestoreEnergy,
  isMuted,
  onToggleMute,
  itemsConfig,
  totalReadyHarvests = 0,
  onHarvestAll,
  farmTiers = { unlockedTier: 1 },
  toolsOwned = [],
  onOpenToolsShop,
  onOpenRanch,
  onOpenLicenses,
  isIdleBotActive = true,
  onToggleIdleBot,
  isIdleAuthorized = true
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
      {/* Top Bar: Stats & Controls — Fixed position with explicit high zIndex */}
      <header style={{
        position: 'fixed',
        top: '10px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'none',
        zIndex: 50,
        gap: '12px'
      }}>
        {/* Left: Player status card */}
        <div className="pixel-panel" style={{ padding: '8px 14px', width: '280px', pointerEvents: 'auto', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span className="font-pixel" style={{ fontSize: '11px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
              Nvl. {player.level} {player.name}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(5, 150, 105, 0.3)',
                  border: '1px solid #10b981',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={onOpenLicenses}
                title="Ver Patamar e Licenças da Fazenda na Cooperativa (L)"
              >
                <span style={{ fontSize: '11px' }}>⭐</span>
                <span className="font-pixel" style={{ fontSize: '10px', color: '#6ee7b7' }}>
                  T{farmTiers?.unlockedTier || 1}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                <span style={{ color: '#ffd700', fontWeight: 'bold' }}>🪙</span>
                <span className="font-pixel" style={{ fontSize: '12px', color: '#fff' }}>{player.money}G</span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px', color: '#f3e1c6' }}>
              <span>XP</span>
              <span>{player.xp}/{xpRequired}</span>
            </div>
            <div style={{ width: '100%', height: '7px', background: '#3b2210', borderRadius: '3px', overflow: 'hidden', border: '1px solid #231307' }}>
              <div style={{ width: `${xpPercent}%`, height: '100%', background: 'linear-gradient(90deg, #4ade80, #22c55e)', transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Energy Bar */}
          <div style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px', color: '#f3e1c6' }}>
              <span>⚡ Energia</span>
              <span>{player.energy}/{player.maxEnergy}</span>
            </div>
            <div style={{ width: '100%', height: '7px', background: '#3b2210', borderRadius: '3px', overflow: 'hidden', border: '1px solid #231307' }}>
              <div style={{ 
                width: `${energyPercent}%`, 
                height: '100%', 
                background: energyPercent > 25 ? 'linear-gradient(90deg, #38bdf8, #0ea5e9)' : 'linear-gradient(90deg, #f87171, #ef4444)',
                transition: 'width 0.3s' 
              }} />
            </div>
          </div>

          {/* 100% IDLE Pilot Switch in Player Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 8px',
              borderRadius: '4px',
              background: isIdleBotActive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(71, 85, 105, 0.3)',
              border: `1px solid ${isIdleBotActive ? '#10b981' : '#64748b'}`,
              cursor: 'pointer',
              boxShadow: isIdleBotActive ? '0 0 8px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
            onClick={onToggleIdleBot}
            title={isIdleAuthorized ? "Alternar Piloto Automático 100% IDLE (Atalho rápido: Tecla Z)" : "Requer autorização"}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>🤖</span>
              <span className="font-pixel" style={{ fontSize: '9px', color: isIdleBotActive ? '#34d399' : '#cbd5e1' }}>
                PILOTO 100% IDLE (Z)
              </span>
            </div>
            <span className="font-pixel" style={{
              fontSize: '8px',
              padding: '2px 6px',
              borderRadius: '3px',
              background: isIdleBotActive ? '#059669' : '#475569',
              color: '#fff',
              fontWeight: 'bold'
            }}>
              {isIdleBotActive ? 'ATIVO' : 'PAUSADO'}
            </span>
          </div>
        </div>

        {/* Right: Date, Weather & Responsive Menu Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', pointerEvents: 'none', maxWidth: 'calc(100vw - 320px)' }}>
          {/* Weather & Time Box */}
          <div className="pixel-panel" style={{ padding: '6px 12px', textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              background: weather === 'stormy' ? 'rgba(79, 70, 229, 0.3)' : (weather === 'rainy' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(234, 179, 8, 0.2)'),
              border: `1px solid ${weather === 'stormy' ? '#818cf8' : (weather === 'rainy' ? '#38bdf8' : '#facc15')}`,
              fontSize: '16px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)'
            }} title={weather === 'stormy' ? 'Tempestade de Primavera ⛈️' : (weather === 'rainy' ? 'Chuva Fértil 🌧️' : 'Sol Radiante ☀️')}>
              {weather === 'stormy' ? '⛈️' : (weather === 'rainy' ? '🌧️' : '☀️')}
            </div>
            <div>
              <div className="font-pixel" style={{ fontSize: '11px', color: '#ffea75', marginBottom: '2px' }}>
                {{Primavera: '🌸', Verão: '☀️', Outono: '🍂', Inverno: '❄️'}[time?.season] || '🌸'} {time?.season || 'Primavera'} — Dia {time?.day || 1}
              </div>
              <div style={{ fontSize: '10px', color: '#e2e8f0', display: 'flex', justifyContent: 'space-between', gap: '6px' }}>
                <span>Ano {time?.year || 1}</span>
                <span style={{ color: weather === 'stormy' ? '#a5b4fc' : (weather === 'rainy' ? '#7dd3fc' : '#fef08a'), fontWeight: 'bold' }}>
                  {weather === 'stormy' ? 'Tempestade' : (weather === 'rainy' ? 'Chuvoso' : 'Ensolarado')}
                </span>
              </div>
            </div>
            <button 
              className="pixel-btn" 
              onClick={onToggleMute} 
              title={isMuted ? "Ativar Áudio (Mudo)" : "Desativar Áudio"}
              style={{ padding: '4px 8px', fontSize: '13px', marginLeft: '4px' }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>

          {/* Action & Menu Buttons Grid — Flex Wrap cleanly aligned */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'flex-end', pointerEvents: 'auto' }}>
            {totalReadyHarvests > 0 && (
              <button 
                className="pixel-btn" 
                onClick={onHarvestAll}
                title="Colher toda a produção pronta da fazenda com 1 clique (Atalho: C)"
                style={{ 
                  background: 'linear-gradient(135deg, #15803d, #16a34a)', 
                  borderColor: '#fde047', 
                  color: '#fef08a',
                  fontWeight: 'bold',
                  boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)',
                  fontSize: '11px',
                  padding: '6px 12px'
                }}
              >
                🌾 Colher Tudo ({totalReadyHarvests})
              </button>
            )}

            <button 
              className="pixel-btn" 
              onClick={onOpenInventory} 
              title="Abrir Mochila do Fazendeiro (Atalho: I)"
              style={{ padding: '6px 11px', fontSize: '11px' }}
            >
              🎒 Mochila
            </button>

            <button
              className="pixel-btn"
              onClick={onOpenToolsShop}
              title="Oficina do Ferreiro — Comprar Ferramentas Obrigatórias (Atalho: T)"
              style={{ background: '#b45309', borderColor: '#78350f', color: '#fef3c7', padding: '6px 11px', fontSize: '11px' }}
            >
              🔨 Ferramentas
            </button>

            <button
              className="pixel-btn"
              onClick={onOpenRanch}
              title="Rancho Marlene — Comprar Animais & Gestão de Rebanho (Atalho: R)"
              style={{ background: '#047857', borderColor: '#064e3b', color: '#d1fae5', padding: '6px 11px', fontSize: '11px' }}
            >
              🐄 Rancho
            </button>

            <button
              className="pixel-btn"
              onClick={onOpenLicenses}
              title="Cooperativa Agrícola — Licenças de Expansão de Patamar (Atalho: L)"
              style={{ background: '#4338ca', borderColor: '#312e81', color: '#e0e7ff', padding: '6px 11px', fontSize: '11px' }}
            >
              🏛️ Licenças
            </button>

            <button 
              className="pixel-btn" 
              onClick={onOpenShop} 
              title="Loja de Sementes e Mantimentos (Atalho: B)"
              style={{ padding: '6px 11px', fontSize: '11px' }}
            >
              🏪 Loja
            </button>

            <button 
              className="pixel-btn" 
              onClick={onOpenManagement} 
              title="Gestão da Fazenda & Produção dos Talhões IDLE (Atalho: M)"
              style={{ background: '#2563eb', borderColor: '#1d4ed8', color: '#fff', padding: '6px 11px', fontSize: '11px' }}
            >
              🚜 Gestão
            </button>

            <button 
              className="pixel-btn" 
              onClick={onOpenMarket} 
              title="Mercado Global — Comércio entre Fazendeiros (Atalho: K)"
              style={{ background: '#7c3aed', borderColor: '#5b21b6', color: '#fff', padding: '6px 11px', fontSize: '11px' }}
            >
              🏪 Mercado
            </button>

            <button 
              className="pixel-btn" 
              onClick={() => setShowDevTools(p => !p)} 
              title="Painel de Ferramentas Rápidas de Desenvolvedor"
              style={{ padding: '6px 9px', fontSize: '12px', background: '#64748b', borderColor: '#334155', color: '#fff' }}
            >
              🛠️
            </button>
          </div>

          {/* Collapsible dev drawer */}
          {showDevTools && (
            <div className="pointer-events-auto pixel-panel" style={{ display: 'flex', gap: '6px', padding: '6px 10px', marginTop: '4px' }}>
              <button className="pixel-btn" onClick={onDevAdvanceTime} style={{ background: '#7e57c2', color: '#fff', borderColor: '#4527a0', padding: '4px 8px', fontSize: '11px' }} title="Acelerar 60s">
                ⏩ +60s
              </button>
              <button className="pixel-btn" onClick={onDevRestoreEnergy} style={{ background: '#0288d1', color: '#fff', borderColor: '#01579b', padding: '4px 8px', fontSize: '11px' }} title="Restaurar Energia">
                ⚡ Restaurar
              </button>
              {onDevToggleWeather && (
                <button className="pixel-btn" onClick={onDevToggleWeather} style={{ background: '#059669', color: '#fff', borderColor: '#047857', padding: '4px 8px', fontSize: '11px' }} title="Alternar Clima">
                  🌦️ Clima
                </button>
              )}
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
