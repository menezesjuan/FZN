import React from 'react';

const TOOLS_LIST = [
  {
    id: 'tool_hoe',
    name: 'Enxada Agrícola',
    icon: '⛏️',
    price: 250,
    description: 'Ferramenta indispensável para preparar a terra e plantar sementes tanto no campo quanto nos talhões.',
    requirement: 'Necessária para Plantio'
  },
  {
    id: 'tool_scythe',
    name: 'Foice de Colheita',
    icon: '🌾',
    price: 300,
    description: 'Lâmina afiada para ceifar e recolher colheitas maduras. Essencial para a colheita manual e automação IDLE.',
    requirement: 'Necessária para Colheita'
  },
  {
    id: 'tool_egg_basket',
    name: 'Cesto de Ovos',
    icon: '🧺',
    price: 200,
    description: 'Cesto acolchoado com palha para recolher ovos sem quebrar e operar o Galinheiro Automatizado.',
    requirement: 'Necessário para Avicultura'
  },
  {
    id: 'tool_pail',
    name: 'Balde de Ordenha',
    icon: '🥛',
    price: 450,
    description: 'Balde de alumínio esterilizado para ordenhar vacas leiteiras e coletar galões no Curral Leiteiro.',
    requirement: 'Necessário para Pecuária'
  }
];

export default function ToolsShopModal({
  isOpen,
  onClose,
  toolsOwned = [],
  playerMoney = 0,
  onBuyTool
}) {
  if (!isOpen) return null;

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
      <div className="pixel-panel" style={{ width: '620px', maxWidth: '95vw', padding: '22px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="font-pixel" style={{ fontSize: '15px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
              🔨 Oficina do Ferreiro Clint
            </h2>
            <div style={{ fontSize: '12px', color: '#f7e6c4', marginTop: '4px' }}>
              Seu Saldo: <strong style={{ color: '#ffd700' }}>{playerMoney}G</strong>
            </div>
          </div>
          <button className="pixel-btn" onClick={onClose} style={{ padding: '4px 12px' }}>
            ✖ Fechar
          </button>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '16px',
          fontSize: '12px',
          color: '#e2e8f0',
          borderLeft: '4px solid #f59e0b'
        }}>
          💡 <strong>Regra Econômica Estrita:</strong> Sem ferramentas apropriadas, não é possível preparar o solo, ceifar plantações, nem recolher ovos ou leite!
        </div>

        {/* Tools Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
          {TOOLS_LIST.map(tool => {
            const isOwned = toolsOwned.includes(tool.id);
            const canAfford = playerMoney >= tool.price;

            return (
              <div
                key={tool.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: isOwned ? 'rgba(34, 197, 94, 0.12)' : 'rgba(0, 0, 0, 0.2)',
                  border: isOwned ? '1px solid #16a34a' : '1px solid #4a3319',
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    fontSize: '28px',
                    width: '46px',
                    height: '46px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    border: '1px solid #5c3e1e'
                  }}>
                    {tool.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-pixel" style={{ fontSize: '13px', color: '#ffea75' }}>
                        {tool.name}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        background: isOwned ? '#166534' : '#7c2d12',
                        color: '#fff',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {tool.requirement}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', maxWidth: '340px' }}>
                      {tool.description}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '110px' }}>
                  {isOwned ? (
                    <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      <span>✓ Adquirida</span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '12px', color: '#ffd700', fontWeight: 'bold', marginBottom: '4px' }}>
                        {tool.price}G
                      </div>
                      <button
                        className="pixel-btn"
                        disabled={!canAfford}
                        onClick={() => onBuyTool(tool.id)}
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          background: canAfford ? '#15803d' : '#4b5563',
                          borderColor: canAfford ? '#166534' : '#374151',
                          color: canAfford ? '#fff' : '#9ca3af',
                          cursor: canAfford ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {canAfford ? 'Comprar' : 'Sem Saldo'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
