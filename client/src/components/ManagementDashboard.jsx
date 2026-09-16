import React, { useState, useEffect } from 'react';

export default function ManagementDashboard({
  isOpen,
  onClose,
  idlePlots = [],
  facilities = {},
  cropsConfig = {},
  playerMoney = 0,
  stats = {},
  onStartPlot,
  onCollectPlot,
  onCollectAllPlots,
  onCollectFacility
}) {
  const [activeTab, setActiveTab] = useState('plots'); // 'plots' | 'facilities' | 'overview'
  const [selectedCropByPlot, setSelectedCropByPlot] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Live timer tick for accurate countdowns and progress bars
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const availableCrops = Object.values(cropsConfig || {});
  const readyPlotsCount = idlePlots.filter(
    p => p.status === 'COMPLETED' || (p.status === 'RUNNING' && p.completedAt && currentTime >= p.completedAt)
  ).length;

  const runningPlotsCount = idlePlots.filter(
    p => p.status === 'RUNNING' && p.completedAt && currentTime < p.completedAt
  ).length;

  const handleSelectCrop = (plotId, cropId) => {
    setSelectedCropByPlot(prev => ({ ...prev, [plotId]: cropId }));
  };

  const coop = facilities?.coop;
  const barn = facilities?.barn;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 55,
      backdropFilter: 'blur(2px)'
    }}>
      <div className="pixel-panel" style={{
        width: '740px',
        maxWidth: '96vw',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
        border: '3px solid #3b82f6'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 className="font-pixel" style={{ fontSize: '15px', color: '#60a5fa', textShadow: '1px 1px 0 #000' }}>
              🚜 Gestão da Fazenda & Produção Idle
            </h2>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px' }}>
              Administre lotes de cultivo e instalações produtivas contínuas. Saldo: <strong style={{ color: '#ffd700' }}>{playerMoney}G</strong>
            </div>
          </div>
          <button className="pixel-btn" onClick={onClose} style={{ padding: '4px 10px' }}>
            ✖ Fechar
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            className="pixel-btn"
            onClick={() => setActiveTab('plots')}
            style={{
              flex: 1,
              background: activeTab === 'plots' ? '#3b82f6' : '#1e293b',
              color: '#fff',
              borderColor: activeTab === 'plots' ? '#60a5fa' : '#334155'
            }}
          >
            🌾 Talhões de Cultivo ({readyPlotsCount > 0 ? `✨ ${readyPlotsCount} prontos` : `${runningPlotsCount}/4 ativos`})
          </button>
          <button
            className="pixel-btn"
            onClick={() => setActiveTab('facilities')}
            style={{
              flex: 1,
              background: activeTab === 'facilities' ? '#3b82f6' : '#1e293b',
              color: '#fff',
              borderColor: activeTab === 'facilities' ? '#60a5fa' : '#334155'
            }}
          >
            🏭 Instalações Produtivas
          </button>
          <button
            className="pixel-btn"
            onClick={() => setActiveTab('overview')}
            style={{
              flex: 1,
              background: activeTab === 'overview' ? '#3b82f6' : '#1e293b',
              color: '#fff',
              borderColor: activeTab === 'overview' ? '#60a5fa' : '#334155'
            }}
          >
            📊 Visão Geral
          </button>
        </div>

        {/* Tab Content Container */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {/* TAB 1: PLOTS */}
          {activeTab === 'plots' && (
            <div>
              {/* Quick Actions Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.3)',
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '14px',
                border: '1px solid rgba(255,255,255,0.08)'
              }}>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  {runningPlotsCount} talhões em andamento • {readyPlotsCount} aguardando colheita
                </span>
                <button
                  className="pixel-btn"
                  onClick={onCollectAllPlots}
                  disabled={readyPlotsCount === 0}
                  style={{
                    background: readyPlotsCount > 0 ? 'linear-gradient(180deg, #22c55e, #15803d)' : '#475569',
                    color: '#fff',
                    borderColor: readyPlotsCount > 0 ? '#166534' : '#334155',
                    padding: '6px 12px',
                    fontSize: '11px',
                    opacity: readyPlotsCount > 0 ? 1 : 0.5,
                    cursor: readyPlotsCount > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  🧺 Colher Todos os Prontos ({readyPlotsCount})
                </button>
              </div>

              {/* 4 Plots Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                {idlePlots.map(plot => {
                  const isReady = plot.status === 'COMPLETED' || (plot.status === 'RUNNING' && plot.completedAt && currentTime >= plot.completedAt);
                  const isRunning = plot.status === 'RUNNING' && !isReady;
                  const isAvailable = !isRunning && !isReady;

                  let progressPct = 0;
                  let remainingSec = 0;
                  if (isRunning && plot.startedAt && plot.durationMs) {
                    const elapsed = currentTime - plot.startedAt;
                    progressPct = Math.min(100, Math.max(0, Math.round((elapsed / plot.durationMs) * 100)));
                    remainingSec = Math.max(0, Math.ceil((plot.completedAt - currentTime) / 1000));
                  } else if (isReady) {
                    progressPct = 100;
                  }

                  const selectedCropId = selectedCropByPlot[plot.id] || (availableCrops[0]?.id || 'strawberry');
                  const selectedCropDef = cropsConfig[selectedCropId];

                  return (
                    <div key={plot.id} style={{
                      background: isReady ? 'rgba(34, 197, 94, 0.12)' : 'rgba(15, 23, 42, 0.65)',
                      border: isReady ? '2px solid #22c55e' : (isRunning ? '2px solid #3b82f6' : '1px solid #334155'),
                      borderRadius: '8px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {/* Plot Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong className="font-pixel" style={{ fontSize: '11px', color: '#f8fafc' }}>
                            {plot.name}
                          </strong>
                          <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px' }}>
                            (Setor 3x3)
                          </span>
                        </div>
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          background: isReady ? '#166534' : (isRunning ? '#1e40af' : '#374151'),
                          color: isReady ? '#86efac' : (isRunning ? '#93c5fd' : '#d1d5db')
                        }}>
                          {isReady ? '✨ PRONTO' : (isRunning ? '⏳ CULTIVANDO' : '🟢 LIVRE')}
                        </span>
                      </div>

                      {/* State: AVAILABLE */}
                      {isAvailable && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '10px', color: '#94a3b8' }}>Escolha a cultura:</label>
                            <select
                              value={selectedCropId}
                              onChange={e => handleSelectCrop(plot.id, e.target.value)}
                              style={{
                                background: '#1e293b',
                                color: '#f8fafc',
                                border: '1px solid #475569',
                                borderRadius: '4px',
                                padding: '6px 8px',
                                fontSize: '11px'
                              }}
                            >
                              {availableCrops.map(crop => (
                                <option key={crop.id} value={crop.id}>
                                  {crop.name} — Custo: {crop.seedBatchCost || 20}G | Rend: {crop.batchYield || 10} un | Tempo: {crop.idleDurationSeconds || 60}s
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedCropDef && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '10px',
                              color: '#cbd5e1',
                              background: 'rgba(0,0,0,0.2)',
                              padding: '4px 8px',
                              borderRadius: '4px'
                            }}>
                              <span>Investimento: <strong style={{ color: '#facc15' }}>{selectedCropDef.seedBatchCost || 20}G</strong></span>
                              <span>Retorno Est.: <strong style={{ color: '#4ade80' }}>{selectedCropDef.batchYield || 10} un</strong></span>
                              <span>Duração: <strong>{selectedCropDef.idleDurationSeconds || 60}s</strong></span>
                            </div>
                          )}

                          <button
                            className="pixel-btn"
                            onClick={() => onStartPlot(plot.id, selectedCropId)}
                            disabled={playerMoney < (selectedCropDef?.seedBatchCost || 20)}
                            style={{
                              background: playerMoney >= (selectedCropDef?.seedBatchCost || 20) ? '#2563eb' : '#475569',
                              color: '#fff',
                              borderColor: '#1d4ed8',
                              padding: '6px 10px',
                              fontSize: '11px',
                              cursor: playerMoney >= (selectedCropDef?.seedBatchCost || 20) ? 'pointer' : 'not-allowed'
                            }}
                          >
                            🌱 Iniciar Lote de Cultivo
                          </button>
                        </div>
                      )}

                      {/* State: RUNNING */}
                      {isRunning && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span style={{ color: '#bae6fd' }}>
                              Cultura: <strong>{plot.cropName || plot.cropId}</strong>
                            </span>
                            <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>
                              {Math.floor(remainingSec / 60)}m {remainingSec % 60}s
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div style={{ width: '100%', height: '10px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                            <div style={{
                              width: `${progressPct}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                              transition: 'width 0.5s linear'
                            }} />
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                            <span>Progresso: {progressPct}%</span>
                            <span>Safra estimada: {plot.quantity} un</span>
                          </div>
                        </div>
                      )}

                      {/* State: READY / COMPLETED */}
                      {isReady && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', color: '#bbf7d0' }}>
                              🌾 <strong>{plot.quantity}x {plot.cropName || plot.cropId}</strong> prontos!
                            </span>
                            <span style={{ fontSize: '10px', color: '#86efac' }}>
                              100% Concluído
                            </span>
                          </div>

                          <button
                            className="pixel-btn"
                            onClick={() => onCollectPlot(plot.id)}
                            style={{
                              background: 'linear-gradient(180deg, #22c55e, #15803d)',
                              color: '#fff',
                              borderColor: '#166534',
                              padding: '7px 12px',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}
                          >
                            🧺 Colher para a Mochila
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FACILITIES */}
          {activeTab === 'facilities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Coop Facility */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '2px solid #ca8a04',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🐔</span>
                    <div>
                      <h3 className="font-pixel" style={{ fontSize: '12px', color: '#fef08a' }}>
                        {coop?.name || 'Galinheiro Automatizado'}
                      </h3>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Produz 2 ovos a cada 2 minutos • Capacidade máxima: {coop?.maxYield || 12}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    background: '#854d0e',
                    color: '#fef9c3',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    Estoque: {coop?.currentYield || 0} / {coop?.maxYield || 12}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round(((coop?.currentYield || 0) / (coop?.maxYield || 12)) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #eab308, #ca8a04)',
                    transition: 'width 0.3s'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="pixel-btn"
                    onClick={() => onCollectFacility('coop')}
                    disabled={!coop || coop.currentYield <= 0}
                    style={{
                      background: coop && coop.currentYield > 0 ? '#ca8a04' : '#475569',
                      color: '#fff',
                      borderColor: '#a16207',
                      padding: '6px 14px',
                      fontSize: '11px',
                      opacity: coop && coop.currentYield > 0 ? 1 : 0.5,
                      cursor: coop && coop.currentYield > 0 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    🥚 Recolher Ovos ({coop?.currentYield || 0})
                  </button>
                </div>
              </div>

              {/* Barn Facility */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '2px solid #0284c7',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>🐄</span>
                    <div>
                      <h3 className="font-pixel" style={{ fontSize: '12px', color: '#bae6fd' }}>
                        {barn?.name || 'Curral Leiteiro'}
                      </h3>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Produz 1 leite fresco a cada 3 minutos • Capacidade máxima: {barn?.maxYield || 8}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    background: '#075985',
                    color: '#e0f2fe',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    Estoque: {barn?.currentYield || 0} / {barn?.maxYield || 8}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1e293b' }}>
                  <div style={{
                    width: `${Math.min(100, Math.round(((barn?.currentYield || 0) / (barn?.maxYield || 8)) * 100))}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
                    transition: 'width 0.3s'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="pixel-btn"
                    onClick={() => onCollectFacility('barn')}
                    disabled={!barn || barn.currentYield <= 0}
                    style={{
                      background: barn && barn.currentYield > 0 ? '#0284c7' : '#475569',
                      color: '#fff',
                      borderColor: '#0369a1',
                      padding: '6px 14px',
                      fontSize: '11px',
                      opacity: barn && barn.currentYield > 0 ? 1 : 0.5,
                      cursor: barn && barn.currentYield > 0 ? 'pointer' : 'not-allowed'
                    }}
                  >
                    🥛 Recolher Leite ({barn?.currentYield || 0})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <h3 className="font-pixel" style={{ fontSize: '12px', color: '#f1f5f9' }}>
                📊 Relatório de Desempenho Operacional
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Total de Colheitas:</span>
                  <div style={{ fontSize: '16px', color: '#4ade80', fontWeight: 'bold', marginTop: '2px' }}>
                    {stats.cropsHarvested || 0} un
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Ovos Caipiras Coletados:</span>
                  <div style={{ fontSize: '16px', color: '#facc15', fontWeight: 'bold', marginTop: '2px' }}>
                    {stats.eggsCollected || 0} un
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Leite Fresco Produzido:</span>
                  <div style={{ fontSize: '16px', color: '#38bdf8', fontWeight: 'bold', marginTop: '2px' }}>
                    {stats.milkProduced || 0} un
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>Madeiras Coletadas:</span>
                  <div style={{ fontSize: '16px', color: '#fb923c', fontWeight: 'bold', marginTop: '2px' }}>
                    {stats.woodGathered || 0} un
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontSize: '11px',
                color: '#93c5fd'
              }}>
                💡 <strong>Dica de Gestão:</strong> Seus lotes continuam crescendo mesmo quando você sai do jogo. Ao retornar, o relatório de ausência apresentará todos os itens aguardando coleta.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
