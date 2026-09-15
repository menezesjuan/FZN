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
  const wateredCount = Object.values(tiles).filter(t => t.crop && t.isWatered).length;
  const harvestedCount = stats.cropsHarvested || 0;
  const moneyEarned = stats.totalMoneyEarned || 0;

  if (tilledCount < 4) {
    activeQuest = {
      title: "1. Preparar o Solo",
      description: "Selecione a Enxada de Trabalho (1) e are pelo menos 4 lotes de terra na fazenda.",
      progress: `${tilledCount}/4 lotes arados`,
      percent: Math.min(100, Math.round((tilledCount / 4) * 100))
    };
  } else if (plantedCount < 3) {
    activeQuest = {
      title: "2. Semeadura",
      description: "Selecione sementes na barra inferior e plante-as nos lotes arados.",
      progress: `${plantedCount}/3 sementes plantadas`,
      percent: Math.min(100, Math.round((plantedCount / 3) * 100))
    };
  } else if (wateredCount < 3) {
    activeQuest = {
      title: "3. Hidratação das Culturas",
      description: "Use o Regador de Cobre (2) para regar todas as sementes que você plantou.",
      progress: `${wateredCount}/3 lotes regados`,
      percent: Math.min(100, Math.round((wateredCount / 3) * 100))
    };
  } else if (day === 1 && harvestedCount === 0) {
    activeQuest = {
      title: "4. Passar a Noite",
      description: "Aproxime-se da porta da casa da fazenda e descanse (tecla E) para avançar o dia e restaurar sua energia.",
      progress: `Dia atual: 1`,
      percent: 50
    };
  } else if (harvestedCount < 2) {
    activeQuest = {
      title: "5. A Primeira Colheita",
      description: "Aguarde os vegetais amadurecerem e colha-os com o clique do mouse.",
      progress: `${harvestedCount}/2 colheitas realizadas`,
      percent: Math.min(100, Math.round((harvestedCount / 2) * 100))
    };
  } else if (moneyEarned < 60) {
    activeQuest = {
      title: "6. Comércio Rural",
      description: "Abra o Empório (B) e venda seus produtos agrícolas frescos para lucrar moedas de ouro.",
      progress: `${moneyEarned}/60G arrecadados`,
      percent: Math.min(100, Math.round((moneyEarned / 60) * 100))
    };
  } else {
    activeQuest = {
      title: "7. Expansão da Propriedade",
      description: "Reinvista seus lucros em mais sementes, atinja o Nível 2 de Fazendeiro e acumule 300G.",
      progress: `${gameState.player?.money || 0}/300G`,
      percent: Math.min(100, Math.round(((gameState.player?.money || 0) / 300) * 100))
    };
  }

  return (
    <div
      className="pixel-panel pointer-events-auto"
      style={{
        position: 'absolute',
        top: '160px',
        left: '16px',
        width: collapsed ? '42px' : '260px',
        transition: 'width 0.2s ease',
        zIndex: 10,
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
