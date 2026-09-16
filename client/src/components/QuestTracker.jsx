import React, { useState } from 'react';

export default function QuestTracker({ gameState }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!gameState) return null;

  const stats = gameState.stats || {};
  const tiles = gameState.farm?.tiles || {};
  const day = gameState.time?.day || 1;

  // Calculate dynamic goals
  let activeQuest = null;

  const tilledCount = Object.values(tiles).filter(t => t.state === 'tilled').length;
  const plantedCount = Object.values(tiles).filter(t => t.crop !== null).length;
  const idlePlotsCount = gameState.idlePlots?.filter(p => p.status === 'RUNNING' || p.status === 'COMPLETED').length || 0;
  const harvestedCount = stats.cropsHarvested || 0;
  const moneyEarned = stats.totalMoneyEarned || 0;

  if (plantedCount < 2 && idlePlotsCount === 0) {
    activeQuest = {
      title: "1. O Primeiro Cultivo",
      description: "Inicie o plantio em um Talhão Agrícola (painel de Gestão M) ou semeie um lote arado.",
      progress: `${plantedCount + idlePlotsCount}/2 plantios`,
      percent: Math.min(100, Math.round(((plantedCount + idlePlotsCount) / 2) * 100))
    };
  } else if (harvestedCount < 1) {
    activeQuest = {
      title: "2. A Primeira Colheita",
      description: "Aguarde o amadurecimento das culturas e colha sua safra (ou use o botão Colher Tudo).",
      progress: `${harvestedCount}/1 colheita realizada`,
      percent: harvestedCount ? 100 : 0
    };
  } else if ((stats.eggsCollected || 0) < 1) {
    activeQuest = {
      title: "3. Cuidados no Galinheiro",
      description: "Visite o cercado das galinhas ao lado da casa ou deixe o Piloto IDLE apanhar ovos frescos.",
      progress: `${stats.eggsCollected || 0}/1 ovo recolhido`,
      percent: stats.eggsCollected ? 100 : 0
    };
  } else if (moneyEarned < 60) {
    activeQuest = {
      title: "4. Comércio Rural",
      description: "Abra o Mercado Global (K) ou a Loja (B) e venda seus produtos para acumular moedas de ouro.",
      progress: `${moneyEarned}/60G arrecadados`,
      percent: Math.min(100, Math.round((moneyEarned / 60) * 100))
    };
  } else if ((stats.milkProduced || 0) < 1) {
    activeQuest = {
      title: "5. Pecuária Leiteira & Ordenha",
      description: "Adquira o Balde no Ferreiro (T) e ordenhe a vaca Mimosa no pasto sul para obter leite fresco.",
      progress: `${stats.milkProduced || 0}/1 leite ordenhado`,
      percent: stats.milkProduced ? 100 : 0
    };
  } else if ((stats.woodGathered || 0) < 3) {
    activeQuest = {
      title: "6. Silvicultura e Coleta",
      description: "Adquira o Machado no Ferreiro (T) e corte árvores na fazenda para coletar toras de madeira.",
      progress: `${stats.woodGathered || 0}/3 madeiras coletadas`,
      percent: Math.min(100, Math.round(((stats.woodGathered || 0) / 3) * 100))
    };
  } else {
    activeQuest = {
      title: "7. Expansão da Propriedade",
      description: "Acumule recursos e adquira a Licença Tier 2 na Cooperativa Agrícola (L).",
      progress: `${gameState.player?.money || 0}/1200G`,
      percent: Math.min(100, Math.round(((gameState.player?.money || 0) / 1200) * 100))
    };
  }

  return (
    <div
      className="pixel-panel pointer-events-auto"
      style={{
        position: 'fixed',
        top: '155px',
        left: '12px',
        width: collapsed ? '42px' : '280px',
        transition: 'width 0.2s ease',
        zIndex: 40,
        padding: '8px 12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-pixel" style={{ fontSize: '10px', color: '#ffec40', textShadow: '1px 1px 0 #000' }}>
          📜 {collapsed ? '' : 'Missão Ativa'}
        </span>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'none',
            border: 'none',
            color: '#f7e6c4',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '2px 4px'
          }}
          title={collapsed ? "Expandir Missão" : "Recolher Missão"}
        >
          {collapsed ? '▶' : '▼'}
        </button>
      </div>

      {!collapsed && (
        <div style={{ marginTop: '6px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>
            {activeQuest.title}
          </h4>
          <p style={{ fontSize: '11px', color: '#f3e1c6', lineHeight: '1.3', marginBottom: '6px' }}>
            {activeQuest.description}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#e6ba8c', marginBottom: '2px' }}>
            <span>Progresso</span>
            <span>{activeQuest.progress}</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#3b2210', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${activeQuest.percent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b, #eab308)',
                transition: 'width 0.3s'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
