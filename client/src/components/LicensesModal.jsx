import React from 'react';

const TIERS_LIST = [
  {
    tier: 1,
    name: 'Subsistência Familiar',
    cost: 0,
    costFormatted: 'Grátis',
    prereqText: 'Disponível inicialmente',
    unlocks: ['Cebola (Primavera)', 'Alho-poró (Primavera)'],
    description: 'Cultivos de subsistência de baixo risco e margens estreitas para estabelecer a base da sua fazenda.'
  },
  {
    tier: 2,
    name: 'Produtor Comercial',
    cost: 1200,
    costFormatted: '1.200G + 30 Toras de Madeira',
    prereqText: 'Tier 1 + 30 Madeiras no inventário',
    unlocks: ['Batata (Primavera)', 'Morango (Primavera)', 'Criação de Galinhas'],
    description: 'Permite ingressar no mercado comercial com colheitas mais rentáveis e galinhas poedeiras.'
  },
  {
    tier: 3,
    name: 'Agroindústria Regional',
    cost: 4500,
    costFormatted: '4.500G + Armazém Nível 2',
    prereqText: 'Tier 2 + Armazém Nível 2 (80 slots)',
    unlocks: ['Mirtilo (Verão)', 'Melancia (Verão)', 'Uva (Outono)', 'Gado Leiteiro Bovino'],
    description: 'Expansão em grande escala, permitindo culturas valiosas de verão e outono e gado de leite.'
  },
  {
    tier: 4,
    name: 'Barão Rural & Automação',
    cost: 14000,
    costFormatted: '14.000G + Armazém Nível 3',
    prereqText: 'Tier 3 + Armazém Nível 3 (160 slots)',
    unlocks: ['Abóbora (Outono)', 'Automação Irrestrita'],
    description: 'O ápice da produção agrícola! Acesso a colheitas de prestígio supremo com retornos exponenciais.'
  }
];

export default function LicensesModal({
  isOpen,
  onClose,
  unlockedTier = 1,
  playerMoney = 0,
  warehouseLevel = 1,
  woodCount = 0,
  onBuyLicense
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
      <div className="pixel-panel" style={{ width: '680px', maxWidth: '96vw', padding: '22px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 className="font-pixel" style={{ fontSize: '15px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
              🏛️ Cooperativa Agrícola Central
            </h2>
            <div style={{ fontSize: '12px', color: '#f7e6c4', marginTop: '4px' }}>
              Seu Patamar: <strong style={{ color: '#4ade80' }}>Tier {unlockedTier}</strong> | Saldo: <strong style={{ color: '#ffd700' }}>{playerMoney}G</strong> | Madeiras: <strong style={{ color: '#f59e0b' }}>{woodCount}</strong>
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
          borderLeft: '4px solid #8b5cf6'
        }}>
          📜 <strong>Progressão por Licenças:</strong> Cada licença desbloqueia sementes avançadas e novas espécies animais. Subir de patamar exige planejamento financeiro, reformas e materiais.
        </div>

        {/* Tiers List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '430px', overflowY: 'auto' }}>
          {TIERS_LIST.map(t => {
            const isUnlocked = unlockedTier >= t.tier;
            const isNext = t.tier === unlockedTier + 1;

            let canBuy = false;
            let missingReason = '';

            if (isNext) {
              if (t.tier === 2) {
                if (playerMoney < 1200) missingReason = 'Faltam fundos (1.200G)';
                else if (woodCount < 30) missingReason = 'Faltam 30 Toras de Madeira';
                else canBuy = true;
              } else if (t.tier === 3) {
                if (playerMoney < 4500) missingReason = 'Faltam fundos (4.500G)';
                else if (warehouseLevel < 2) missingReason = 'Requer Armazém Nível 2';
                else canBuy = true;
              } else if (t.tier === 4) {
                if (playerMoney < 14000) missingReason = 'Faltam fundos (14.000G)';
                else if (warehouseLevel < 3) missingReason = 'Requer Armazém Nível 3';
                else canBuy = true;
              }
            }

            return (
              <div
                key={t.tier}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: isUnlocked ? 'rgba(34, 197, 94, 0.1)' : (isNext ? 'rgba(59, 130, 246, 0.1)' : 'rgba(0,0,0,0.2)'),
                  border: isUnlocked ? '1px solid #15803d' : (isNext ? '1px solid #3b82f6' : '1px solid #374151'),
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    fontSize: '20px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isUnlocked ? '#14532d' : (isNext ? '#1e3a8a' : '#1f2937'),
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}>
                    T{t.tier}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="font-pixel" style={{ fontSize: '13px', color: isUnlocked ? '#86efac' : '#fff' }}>
                        Tier {t.tier} — {t.name}
                      </span>
                      {isUnlocked && (
                        <span style={{ fontSize: '10px', background: '#166534', color: '#fff', padding: '1px 6px', borderRadius: '4px' }}>
                          ✓ Ativo
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px', maxWidth: '380px' }}>
                      {t.description}
                    </div>
                    <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
                      🔓 Desbloqueia: <strong>{t.unlocks.join(', ')}</strong>
                    </div>
                    {!isUnlocked && (
                      <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '2px' }}>
                        Custo: {t.costFormatted}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  {isUnlocked ? (
                    <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: 'bold' }}>
                      Desbloqueado
                    </div>
                  ) : isNext ? (
                    <div>
                      <button
                        className="pixel-btn"
                        disabled={!canBuy}
                        onClick={() => onBuyLicense(t.tier)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          background: canBuy ? '#2563eb' : '#4b5563',
                          borderColor: canBuy ? '#1d4ed8' : '#374151',
                          color: canBuy ? '#fff' : '#9ca3af',
                          cursor: canBuy ? 'pointer' : 'not-allowed'
                        }}
                      >
                        {canBuy ? 'Adquirir' : missingReason}
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Requer Tier {t.tier - 1}
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
