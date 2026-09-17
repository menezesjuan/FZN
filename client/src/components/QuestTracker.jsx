import React, { useState } from 'react';

export default function QuestTracker({ gameState, onOpenTutorial }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!gameState) return null;

  const stats = gameState.stats || {};
  const tiles = gameState.farm?.tiles || {};
  const harvestedCount = stats.cropsHarvested || 0;
  const eggsCount = stats.eggsCollected || 0;
  const money = gameState.player?.money || 0;
  const isIdleBot = gameState.isIdleBotActive;

  // Track progress of starter checklist
  const readyCrops = Object.values(tiles).filter(t => t.crop && t.crop.ready).length;
  const plantedCrops = Object.values(tiles).filter(t => t.crop !== null).length;
  const wateredCrops = Object.values(tiles).filter(t => t.crop !== null && t.isWatered).length;

  let activeStep = 1;
  let title = "1. 🌾 Colheita Imediata";
  let description = "Aproxime-se do canteiro brilhando (Amora / Trigo) e clique para colher!";
  let progress = `${harvestedCount}/1 colhido`;
  let percent = harvestedCount > 0 ? 100 : 0;

  if (harvestedCount < 1) {
    activeStep = 1;
    title = "1. 🌾 Colheita de Frutas";
    description = "Clique no canteiro com partículas brilhantes para colher sua primeira Amora ou Trigo!";
    progress = readyCrops > 0 ? "1 safra pronta esperando!" : "Colha 1 safra";
    percent = 0;
  } else if (plantedCrops < 4) {
    activeStep = 2;
    title = "2. 🌱 Semear a Terra";
    description = "Selecione uma semente na barra inferior (teclas 1-8) e clique em um canteiro livre!";
    progress = `${plantedCrops}/4 plantados`;
    percent = Math.min(100, Math.round((plantedCrops / 4) * 100));
  } else if (wateredCrops < 3) {
    activeStep = 3;
    title = "3. 💧 Irrigar as Mudas";
    description = "Equipe o Regador de Cobre na hotbar e regue o solo das mudas semeadas.";
    progress = `${wateredCrops}/3 irrigados`;
    percent = Math.min(100, Math.round((wateredCrops / 3) * 100));
  } else if (eggsCount < 1) {
    activeStep = 4;
    title = "4. 🥚 Coletar Ovo no Pasto";
    description = "Vá até o cercado das galinhas (ao lado da casa) e recolha o ovo caipira no chão!";
    progress = `${eggsCount}/1 recolhido`;
    percent = 0;
  } else if (money < 200) {
    activeStep = 5;
    title = "5. ⚖️ Vender no Mercado (K)";
    description = "Abra o Mercado Global (tecla K) ou a Loja (tecla H) e venda seus produtos para lucrar!";
    progress = `${money}/200G ouro`;
    percent = Math.min(100, Math.round(((money - 150) / 50) * 100));
  } else {
    activeStep = 6;
    title = "6. 🤖 Ativar Piloto 100% IDLE";
    description = "Pressione [Z] para ativar o Vigilante da Fazenda e relaxar enquanto ele trabalha!";
    progress = isIdleBot ? "Ativo! 🎉" : "Pressione Z";
    percent = isIdleBot ? 100 : 50;
  }

  return (
    <div
      className="pixel-panel pointer-events-auto"
      style={{
        position: 'fixed',
        top: '150px',
        left: '12px',
        width: collapsed ? '46px' : '290px',
        transition: 'width 0.2s ease',
        zIndex: 50,
        padding: '10px 12px',
        background: '#3e2723',
        borderColor: '#8d6e63',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="font-pixel" style={{ fontSize: '11px', color: '#ffea75', textShadow: '1px 1px 0 #000' }}>
          📜 {collapsed ? '' : 'Missão Inicial'}
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          {!collapsed && onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              style={{
                background: '#8d420f',
                border: '1px solid #ffd54f',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '3px'
              }}
              title="Abrir Manual Completo"
            >
              📖 Guia
            </button>
          )}
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
      </div>

      {!collapsed && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#81c784', marginBottom: '3px' }}>
            {title}
          </div>
          <div style={{ fontSize: '10px', color: '#d7ccc8', lineHeight: '1.4', marginBottom: '8px' }}>
            {description}
          </div>

          {/* Progress bar */}
          <div style={{
            height: '10px',
            background: 'rgba(0,0,0,0.5)',
            borderRadius: '5px',
            overflow: 'hidden',
            border: '1px solid #5d4037',
            marginBottom: '4px',
            position: 'relative'
          }}>
            <div style={{
              width: `${percent}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #f59e0b, #10b981)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#ffea75' }}>
            <span>Progresso: {progress}</span>
            <span>{percent}%</span>
          </div>

          {/* Quick Step Indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            paddingTop: '6px',
            borderTop: '1px solid #5d4037',
            fontSize: '12px'
          }}>
            <span title="1. Colher" style={{ opacity: activeStep >= 1 ? (harvestedCount > 0 ? 1 : 0.8) : 0.4 }}>🌾{harvestedCount > 0 ? '✓' : ''}</span>
            <span title="2. Semear" style={{ opacity: activeStep >= 2 ? (plantedCrops >= 4 ? 1 : 0.8) : 0.4 }}>🌱{plantedCrops >= 4 ? '✓' : ''}</span>
            <span title="3. Irrigar" style={{ opacity: activeStep >= 3 ? (wateredCrops >= 3 ? 1 : 0.8) : 0.4 }}>💧{wateredCrops >= 3 ? '✓' : ''}</span>
            <span title="4. Coletar Ovo" style={{ opacity: activeStep >= 4 ? (eggsCount > 0 ? 1 : 0.8) : 0.4 }}>🥚{eggsCount > 0 ? '✓' : ''}</span>
            <span title="5. Vender" style={{ opacity: activeStep >= 5 ? (money >= 200 ? 1 : 0.8) : 0.4 }}>⚖️{money >= 200 ? '✓' : ''}</span>
            <span title="6. IDLE" style={{ opacity: activeStep >= 6 ? (isIdleBot ? 1 : 0.8) : 0.4 }}>🤖{isIdleBot ? '✓' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}
