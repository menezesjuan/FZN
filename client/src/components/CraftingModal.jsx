import React, { useState } from 'react';
import { api } from '../api/client';

const RECIPES = [
  {
    machineType: 'mill',
    id: 'make_flour',
    name: 'Moer Farinha de Trigo',
    inputsDesc: '2x Trigo',
    outputsDesc: '2x Farinha',
    durationSec: 15
  },
  {
    machineType: 'cheese_maker',
    id: 'make_cheese',
    name: 'Produzir Queijo Colonial',
    inputsDesc: '2x Leite',
    outputsDesc: '1x Queijo',
    durationSec: 25
  },
  {
    machineType: 'bakery_oven',
    id: 'bake_bread',
    name: 'Assar Pão Caseiro',
    inputsDesc: '2x Farinha + 1x Ovo',
    outputsDesc: '2x Pão',
    durationSec: 20
  }
];

export default function CraftingModal({ isOpen, onClose, machines, farm, onRefreshState, showToast }) {
  const [activeTab, setActiveTab] = useState('machines'); // 'machines', 'buy_machine', 'storage'
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleStartJob(machineId, recipeId) {
    setLoading(true);
    try {
      const res = await api.startMachineJob(machineId, recipeId);
      showToast(res.message, 'success');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimJob(machineId) {
    setLoading(true);
    try {
      const res = await api.claimMachineJob(machineId);
      showToast(res.message, 'success');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuyMachine(machineType) {
    setLoading(true);
    try {
      await api.buyMachine(machineType);
      showToast('Máquina instalada na fazenda com sucesso!', 'success');
      if (onRefreshState) onRefreshState();
      setActiveTab('machines');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgradeStorage() {
    setLoading(true);
    try {
      const res = await api.upgradeStorage();
      showToast(res.message, 'success');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

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
      zIndex: 9000,
      fontFamily: '"Press Start 2P", monospace, sans-serif'
    }}>
      <div style={{
        background: '#e9dac1',
        border: '4px solid #5a381e',
        borderRadius: '8px',
        width: '700px',
        maxWidth: '96vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
        color: '#3d2514'
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          background: '#613b1f',
          color: '#f9f3e3',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTopLeftRadius: '4px',
          borderTopRightRadius: '4px'
        }}>
          <div>
            <span style={{ fontSize: '13px' }}>🏭 INDÚSTRIA & PROCESSAMENTO</span>
            <div style={{ fontSize: '8px', color: '#ffde99', marginTop: '4px' }}>
              Transformação de matérias-primas e expansão de capacidade de estoque
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#9e2a2b',
              color: '#fff',
              border: '2px solid #591617',
              borderRadius: '4px',
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ padding: '8px 16px', background: '#d8c29d', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('machines')}
            style={{
              padding: '6px 12px',
              fontSize: '9px',
              background: activeTab === 'machines' ? '#5a381e' : '#ba9d77',
              color: activeTab === 'machines' ? '#fff' : '#2b1708',
              border: '2px solid #4a2d16',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            MÁQUINAS EM OPERAÇÃO ({(machines || []).length})
          </button>
          <button
            onClick={() => setActiveTab('buy_machine')}
            style={{
              padding: '6px 12px',
              fontSize: '9px',
              background: activeTab === 'buy_machine' ? '#5a381e' : '#ba9d77',
              color: activeTab === 'buy_machine' ? '#fff' : '#2b1708',
              border: '2px solid #4a2d16',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + COMPRAR MÁQUINAS
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            style={{
              padding: '6px 12px',
              fontSize: '9px',
              background: activeTab === 'storage' ? '#5a381e' : '#ba9d77',
              color: activeTab === 'storage' ? '#fff' : '#2b1708',
              border: '2px solid #4a2d16',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📦 EXPANDIR CELEIRO
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, fontSize: '9px' }}>
          {activeTab === 'machines' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(machines || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#777', fontStyle: 'italic' }}>
                  Nenhuma máquina instalada. Adquira um Moinho ou Queijeira na aba acima para agregar valor às suas colheitas!
                </div>
              ) : (
                machines.map(m => {
                  const now = Date.now();
                  const isBusy = m.job_finishes_at && m.job_finishes_at > now;
                  const isReady = m.job_finishes_at && m.job_finishes_at <= now;
                  const relevantRecipes = RECIPES.filter(r => r.machineType === m.machine_type);

                  return (
                    <div
                      key={m.id}
                      style={{
                        background: '#fffdf9',
                        border: '2px solid #8d5b35',
                        borderRadius: '4px',
                        padding: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '11px' }}>⚙️ {m.machine_type.toUpperCase()}</strong>
                          <span style={{ fontSize: '8px', color: '#666', marginLeft: '8px' }}>
                            Durabilidade: {m.durability}/{m.max_durability} ciclos
                          </span>
                        </div>
                        <div>
                          {isBusy && <span style={{ color: '#e67e22', fontWeight: 'bold' }}>⏳ Processando...</span>}
                          {isReady && <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Concluído!</span>}
                          {!m.job_finishes_at && <span style={{ color: '#888' }}>Pronta para operar</span>}
                        </div>
                      </div>

                      {/* Claim Button */}
                      {isReady && (
                        <button
                          disabled={loading}
                          onClick={() => handleClaimJob(m.id)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: '#27ae60',
                            color: '#fff',
                            border: '2px solid #1e8449',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            marginBottom: '10px'
                          }}
                        >
                          🎉 COLETAR PRODUTOS PRONTOS
                        </button>
                      )}

                      {/* Recipe Buttons */}
                      {!isBusy && !isReady && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {relevantRecipes.map(recipe => (
                            <div
                              key={recipe.id}
                              style={{
                                background: '#f5efe4',
                                padding: '8px 10px',
                                border: '1px solid #d5c3aa',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '9px' }}>{recipe.name}</div>
                                <div style={{ fontSize: '8px', color: '#666' }}>
                                  Insumos: <strong>{recipe.inputsDesc}</strong> ➔ Saída: <strong>{recipe.outputsDesc}</strong> ({recipe.durationSec}s)
                                </div>
                              </div>
                              <button
                                disabled={loading}
                                onClick={() => handleStartJob(m.id, recipe.id)}
                                style={{
                                  padding: '6px 12px',
                                  background: '#4a8505',
                                  color: '#fff',
                                  border: '1px solid #2e5403',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontSize: '8px',
                                  fontWeight: 'bold'
                                }}
                              >
                                Produzir
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'buy_machine' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#fff', border: '2px solid #8d5b35', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>⚙️ Moinho de Grãos</div>
                <div style={{ fontSize: '8px', color: '#666', lineHeight: '1.5', marginBottom: '10px' }}>
                  Preço: <strong>300G</strong><br />
                  Processa trigo colhido em farinha fina para panificação.
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleBuyMachine('mill')}
                  style={{ width: '100%', padding: '8px', background: '#4a8505', color: '#fff', border: '1px solid #000', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Comprar (300G)
                </button>
              </div>

              <div style={{ background: '#fff', border: '2px solid #8d5b35', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>🧀 Prensa Queijeira</div>
                <div style={{ fontSize: '8px', color: '#666', lineHeight: '1.5', marginBottom: '10px' }}>
                  Preço: <strong>500G</strong><br />
                  Transforma leite cru de vaca em queijo colonial com alto valor de mercado.
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleBuyMachine('cheese_maker')}
                  style={{ width: '100%', padding: '8px', background: '#4a8505', color: '#fff', border: '1px solid #000', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Comprar (500G)
                </button>
              </div>

              <div style={{ background: '#fff', border: '2px solid #8d5b35', borderRadius: '4px', padding: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>🥖 Forno Rústico</div>
                <div style={{ fontSize: '8px', color: '#666', lineHeight: '1.5', marginBottom: '10px' }}>
                  Preço: <strong>650G</strong><br />
                  Assa pães caseiros deliciosos a partir de farinha e ovos frescos.
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleBuyMachine('bakery_oven')}
                  style={{ width: '100%', padding: '8px', background: '#4a8505', color: '#fff', border: '1px solid #000', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Comprar (650G)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'storage' && (
            <div style={{ background: '#fff', border: '2px solid #8d5b35', borderRadius: '4px', padding: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
                📦 Capacidade Atual do Celeiro: {farm?.storage_capacity || 100} slots
              </div>
              <div style={{ fontSize: '9px', color: '#555', lineHeight: '1.6', marginBottom: '14px' }}>
                O armazenamento na fazenda é limitado por razões de equilíbrio econômico (Game.md Seção 16).
                Expandir a estrutura permite estocar mais commodities para especulação no mercado multiplayer.
              </div>
              <button
                disabled={loading}
                onClick={handleUpgradeStorage}
                style={{
                  padding: '12px 20px',
                  background: '#b85d18',
                  color: '#fff',
                  border: '2px solid #6b350b',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                🛠️ EXPANDIR CELEIRO PARA PRÓXIMO NÍVEL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
