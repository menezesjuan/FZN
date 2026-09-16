import React, { useState } from 'react';

const CATALOG_ANIMALS = [
  {
    id: 'animal_chicken',
    name: 'Galinha Caipira',
    type: 'adult_chicken',
    icon: '🐔',
    price: 350,
    requiredTier: 2,
    maxHarvests: 20,
    product: 'Ovo Caipira (produce_egg)',
    description: 'Põe ovos diariamente se alimentada. Tem expectativa de vida produtiva de 20 posturas.'
  },
  {
    id: 'animal_cow',
    name: 'Vaca Holandesa',
    type: 'female_cow',
    icon: '🐄',
    price: 1600,
    requiredTier: 3,
    maxHarvests: 30,
    product: 'Leite Fresco (produce_milk)',
    description: 'Produz leite diário de alta qualidade. Tem expectativa de vida produtiva de 30 ordenhas.'
  }
];

export default function RanchModal({
  isOpen,
  onClose,
  animals = [],
  unlockedTier = 1,
  playerMoney = 0,
  onBuyAnimal
}) {
  const [tab, setTab] = useState('shop'); // 'shop' | 'herd'
  const [customNames, setCustomNames] = useState({});

  if (!isOpen) return null;

  const handleNameChange = (id, name) => {
    setCustomNames(prev => ({ ...prev, [id]: name }));
  };

  const handleBuy = (animal) => {
    const name = customNames[animal.id] || (animal.id === 'animal_chicken' ? 'Cocó' : 'Mimosa');
    onBuyAnimal(animal.id, name);
    setCustomNames(prev => ({ ...prev, [animal.id]: '' }));
  };

  const liveAnimals = animals.filter(a => a.isAlive !== false);

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
      zIndex: 60,
      backdropFilter: 'blur(3px)'
    }}>
      <div className="pixel-panel" style={{ width: '680px', maxWidth: '96vw', padding: '22px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="font-pixel" style={{ fontSize: '15px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
              🐄 Rancho da Marlene
            </h2>
            <div style={{ fontSize: '12px', color: '#f7e6c4', marginTop: '4px' }}>
              Saldo: <strong style={{ color: '#ffd700' }}>{playerMoney}G</strong> | Licença: <strong style={{ color: '#6ee7b7' }}>Tier {unlockedTier}</strong>
            </div>
          </div>
          <button className="pixel-btn" onClick={onClose} style={{ padding: '4px 12px' }}>
            ✖ Fechar
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className="pixel-btn"
            style={{
              flex: 1,
              background: tab === 'shop' ? '#ffdf94' : '#c28d5d',
              borderBottom: tab === 'shop' ? '3px solid #ffaa00' : undefined
            }}
            onClick={() => setTab('shop')}
          >
            🏪 Comprar Animais
          </button>
          <button
            className="pixel-btn"
            style={{
              flex: 1,
              background: tab === 'herd' ? '#ffdf94' : '#c28d5d',
              borderBottom: tab === 'herd' ? '3px solid #ffaa00' : undefined
            }}
            onClick={() => setTab('herd')}
          >
            📋 Rebanho Atual ({liveAnimals.length} Vivos)
          </button>
        </div>

        {tab === 'shop' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#e2e8f0',
              borderLeft: '4px solid #38bdf8'
            }}>
              ⚠️ <strong>Ciclo Biológico:</strong> Cada animal possui uma quantidade limitada de coletas úteis (20 ovos ou 30 ordenhas). Ao término de sua vida produtiva, o animal encerra suas atividades e deve ser reposto.
            </div>

            {CATALOG_ANIMALS.map(animal => {
              const tierOk = unlockedTier >= animal.requiredTier;
              const canAfford = playerMoney >= animal.price;
              const canBuy = tierOk && canAfford;

              return (
                <div
                  key={animal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid #5c3e1e',
                    borderRadius: '8px',
                    opacity: tierOk ? 1 : 0.75
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      fontSize: '32px',
                      width: '52px',
                      height: '52px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.35)',
                      borderRadius: '8px',
                      border: '1px solid #78522b'
                    }}>
                      {animal.icon}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="font-pixel" style={{ fontSize: '13px', color: '#ffea75' }}>
                          {animal.name}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          background: tierOk ? '#065f46' : '#991b1b',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}>
                          Requer Tier {animal.requiredTier}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          ⏱️ {animal.maxHarvests} Coletas
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', maxWidth: '350px' }}>
                        {animal.description}
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Nome do animal..."
                          value={customNames[animal.id] || ''}
                          onChange={(e) => handleNameChange(animal.id, e.target.value)}
                          style={{
                            padding: '3px 8px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            border: '1px solid #64748b',
                            background: '#1e293b',
                            color: '#fff',
                            width: '160px'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <div style={{ fontSize: '13px', color: '#ffd700', fontWeight: 'bold', marginBottom: '6px' }}>
                      {animal.price}G
                    </div>
                    <button
                      className="pixel-btn"
                      disabled={!canBuy}
                      onClick={() => handleBuy(animal)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        background: canBuy ? '#15803d' : '#4b5563',
                        borderColor: canBuy ? '#166534' : '#374151',
                        color: canBuy ? '#fff' : '#9ca3af',
                        cursor: canBuy ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {!tierOk ? 'Tier Bloqueado' : (!canAfford ? 'Sem Saldo' : 'Adquirir')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {animals.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#cbd5e1', padding: '30px' }}>
                Nenhum animal na fazenda ainda. Visite a aba de compras para adquirir galinhas ou vacas!
              </div>
            ) : (
              animals.map(a => {
                const isHen = a.type.includes('chicken');
                const maxH = a.maxHarvests || (isHen ? 20 : 30);
                const rem = a.harvestsRemaining !== undefined ? a.harvestsRemaining : maxH;
                const isAlive = a.isAlive !== false && rem > 0;
                const percent = Math.max(0, Math.min(100, Math.round((rem / maxH) * 100)));

                return (
                  <div
                    key={a.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isAlive ? 'rgba(0,0,0,0.25)' : 'rgba(153, 27, 27, 0.15)',
                      border: isAlive ? '1px solid #4a3319' : '1px solid #7f1d1d',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>{isHen ? '🐔' : '🐄'}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <strong style={{ color: '#fff', fontSize: '13px' }}>{a.name}</strong>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            ({isHen ? 'Galinha' : 'Vaca'})
                          </span>
                          {!isAlive && (
                            <span style={{ fontSize: '10px', background: '#7f1d1d', color: '#fca5a5', padding: '1px 5px', borderRadius: '3px' }}>
                              ✝ Falecida
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
                          Coletas restantes: <strong>{rem}/{maxH}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ width: '130px', textAlign: 'right' }}>
                      <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: percent + '%',
                          height: '100%',
                          background: percent > 40 ? '#22c55e' : (percent > 15 ? '#f59e0b' : '#ef4444')
                        }} />
                      </div>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>Vida útil: {percent}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
