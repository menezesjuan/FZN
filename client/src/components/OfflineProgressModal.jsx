import React from 'react';

export default function OfflineProgressModal({ isOpen, report, onCollectAll, onClose }) {
  if (!isOpen || !report) return null;

  const timeAwaySec = report.timeAwaySeconds || 0;
  const hours = Math.floor(timeAwaySec / 3600);
  const minutes = Math.floor((timeAwaySec % 3600) / 60);
  const seconds = timeAwaySec % 60;
  let formattedTime = '';
  if (hours > 0) formattedTime += `${hours}h `;
  if (minutes > 0 || hours > 0) formattedTime += `${minutes}m `;
  formattedTime += `${seconds}s`;

  const completedPlots = report.completedPlots || [];
  const facilityYields = report.facilityYields || [];
  const processorYields = report.processorYields || [];
  const hasProduce = completedPlots.length > 0 || facilityYields.length > 0 || processorYields.length > 0;

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
      <div className="pixel-panel" style={{
        width: '560px',
        maxWidth: '92vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
        border: '3px solid #eab308'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <span style={{ fontSize: '32px' }}>🌅</span>
          <h2 className="font-pixel" style={{ fontSize: '15px', color: '#ffea75', marginTop: '6px', textShadow: '1px 1px 0 #000' }}>
            Bem-vindo de Volta, Fazendeiro!
          </h2>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px' }}>
            Sua fazenda trabalhou incansavelmente enquanto você esteve ausente por{' '}
            <strong style={{ color: '#38bdf8' }}>{formattedTime}</strong>.
          </p>
        </div>

        {/* Content list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {/* Completed plots */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '6px',
            padding: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-pixel" style={{ fontSize: '11px', color: '#4ade80', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🌾</span> Talhões de Cultivo Prontos ({completedPlots.length})
            </h3>
            {completedPlots.length === 0 ? (
              <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Nenhum lote de cultivo finalizou durante esse período.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {completedPlots.map((plot, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '6px 10px',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <strong style={{ color: '#fef08a', fontSize: '12px' }}>{plot.plotName}</strong>
                      <span style={{ fontSize: '11px', color: '#cbd5e1', marginLeft: '6px' }}>
                        ({plot.cropName})
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        background: '#15803d',
                        color: '#f0fdf4',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        +{plot.quantity} unidades
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Facility yields */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '6px',
            padding: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-pixel" style={{ fontSize: '11px', color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏡</span> Instalações & Produção Animal ({facilityYields.length})
            </h3>
            {facilityYields.length === 0 ? (
              <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Nenhum produto animal acumulado durante esse período.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {facilityYields.map((fac, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '6px 10px',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <strong style={{ color: '#bae6fd', fontSize: '12px' }}>{fac.facilityName}</strong>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                        ({fac.produceName})
                      </span>
                    </div>
                    <div>
                      <span style={{
                        background: '#0369a1',
                        color: '#f0f9ff',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        +{fac.quantity} acumulados
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Processor yields */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '6px',
            padding: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 className="font-pixel" style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚙️</span> Produtos Artesanais Finalizados ({processorYields.length})
            </h3>
            {processorYields.length === 0 ? (
              <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Nenhuma máquina artesanal finalizou ciclo durante a ausência.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {processorYields.map((proc, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '6px 10px',
                    borderRadius: '4px'
                  }}>
                    <div>
                      <strong style={{ color: '#fed7aa', fontSize: '12px' }}>{proc.processorName}</strong>
                      <span style={{ fontSize: '11px', color: '#fde68a', marginLeft: '6px' }}>
                        ➔ {proc.outputName}
                      </span>
                    </div>
                    <div>
                      <span style={{
                        background: '#b45309',
                        color: '#fffbeb',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        +{proc.quantity} pronto
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          {hasProduce && (
            <button
              className="pixel-btn"
              onClick={onCollectAll}
              style={{
                background: 'linear-gradient(180deg, #22c55e, #15803d)',
                color: '#fff',
                borderColor: '#166534',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              🧺 Coletar Tudo para a Mochila
            </button>
          )}
          <button
            className="pixel-btn"
            onClick={onClose}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            {hasProduce ? 'Depois' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
}
