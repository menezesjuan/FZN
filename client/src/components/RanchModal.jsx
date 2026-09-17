import React, { useState } from 'react';
import { api } from '../api/client';

export default function RanchModal({ isOpen, onClose, animals, onRefreshState, showToast }) {
  const [activeTab, setActiveTab] = useState('herd'); // 'herd' or 'buy'
  const [loading, setLoading] = useState(false);
  const [newAnimalName, setNewAnimalName] = useState('');

  if (!isOpen) return null;

  async function handleFeed(animalId) {
    setLoading(true);
    try {
      const res = await api.feedAnimal(animalId);
      showToast(res.message, 'success');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCollect(animalId) {
    setLoading(true);
    try {
      const res = await api.collectProduce(animalId);
      showToast(res.message, 'success');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(animalType) {
    setLoading(true);
    try {
      const res = await api.buyAnimal(animalType, newAnimalName);
      showToast(res.message, 'success');
      setNewAnimalName('');
      if (onRefreshState) onRefreshState();
      setActiveTab('herd');
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
        width: '680px',
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
            <span style={{ fontSize: '13px' }}>🐮 RANCHO & PECUÁRIA</span>
            <div style={{ fontSize: '8px', color: '#ffde99', marginTop: '4px' }}>
              Ciclo de vida, alimentação e produção animal finita (Game.md Seção 102-111)
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
            onClick={() => setActiveTab('herd')}
            style={{
              padding: '6px 12px',
              fontSize: '9px',
              background: activeTab === 'herd' ? '#5a381e' : '#ba9d77',
              color: activeTab === 'herd' ? '#fff' : '#2b1708',
              border: '2px solid #4a2d16',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            REBANHO ATUAL ({(animals || []).length})
          </button>
          <button
            onClick={() => setActiveTab('buy')}
            style={{
              padding: '6px 12px',
              fontSize: '9px',
              background: activeTab === 'buy' ? '#5a381e' : '#ba9d77',
              color: activeTab === 'buy' ? '#fff' : '#2b1708',
              border: '2px solid #4a2d16',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + ADQUIRIR ANIMAIS
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, fontSize: '9px' }}>
          {activeTab === 'herd' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(animals || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#777', fontStyle: 'italic' }}>
                  Você ainda não possui animais. Compre uma galinha ou vaca na aba acima!
                </div>
              ) : (
                animals.map(animal => {
                  const isEndOfLife = animal.status === 'END_OF_LIFE';
                  const remainingCycles = Math.max(0, animal.max_production_cycles - animal.production_cycles);

                  return (
                    <div
                      key={animal.id}
                      style={{
                        background: isEndOfLife ? '#f5ebeb' : '#fffcf7',
                        border: '2px solid #8d5b35',
                        borderRadius: '4px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {animal.animal_type === 'cow' ? '🐄' : '🐔'} {animal.name} ({animal.animal_type === 'cow' ? 'Vaca' : 'Galinha'})
                        </div>
                        <div style={{ fontSize: '8px', color: '#555', lineHeight: '1.5' }}>
                          Saúde: <strong>{animal.health}%</strong> • Alimentado hoje: <strong>{animal.fed_today ? 'Sim ✅' : 'Não ❌'}</strong>
                          <br />
                          Produções: <strong>{animal.production_cycles} / {animal.max_production_cycles}</strong> (Restam: {remainingCycles})
                          <br />
                          Status: <span style={{ color: isEndOfLife ? '#a31c1c' : '#1e7e34', fontWeight: 'bold' }}>
                            {isEndOfLife ? 'FIM DE VIDA PRODUTIVA (APOSENTADO)' : 'ATIVO & PRODUTIVO'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        {!isEndOfLife && (
                          <>
                            <button
                              disabled={loading || animal.fed_today}
                              onClick={() => handleFeed(animal.id)}
                              style={{
                                padding: '8px 10px',
                                background: animal.fed_today ? '#aaa' : '#e67e22',
                                color: '#fff',
                                border: '1px solid #000',
                                borderRadius: '4px',
                                cursor: animal.fed_today || loading ? 'not-allowed' : 'pointer',
                                fontSize: '8px',
                                fontWeight: 'bold'
                              }}
                            >
                              🌾 Alimentar
                            </button>
                            <button
                              disabled={loading}
                              onClick={() => handleCollect(animal.id)}
                              style={{
                                padding: '8px 10px',
                                background: '#27ae60',
                                color: '#fff',
                                border: '1px solid #000',
                                borderRadius: '4px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontSize: '8px',
                                fontWeight: 'bold'
                              }}
                            >
                              🧺 Coletar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'buy' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Buy Chicken */}
              <div style={{ background: '#fff', border: '2px solid #8d5b35', borderRadius: '4px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>🐔 Galinha Caipira</div>
                <div style={{ fontSize: '8px', color: '#555', lineHeight: '1.6', marginBottom: '10px' }}>
                  Preço: <strong>120G</strong><br />
                  Alimentação diária: <strong>4G ou 1x Trigo</strong><br />
                  Vida útil: <strong>180 dias</strong><br />
                  Teto produtivo: <strong>120 ovos</strong><br />
                  Exige: <strong>Cesta de Ovos</strong>
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleBuy('chicken')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#4a8505',
                    color: '#fff',
                    border: '2px solid #2e5403',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: 'bold'
                  }}
                >
                  Comprar por 120G
                </button>
              </div>

              {/* Buy Cow */}
              <div style={{ background: '#fff', border: '2px solid #8d5b35', borderRadius: '4px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>🐄 Vaca Holandesa</div>
                <div style={{ fontSize: '8px', color: '#555', lineHeight: '1.6', marginBottom: '10px' }}>
                  Preço: <strong>450G</strong><br />
                  Alimentação diária: <strong>10G ou 1x Trigo</strong><br />
                  Vida útil: <strong>360 dias</strong><br />
                  Teto produtivo: <strong>250 coletas</strong><br />
                  Exige: <strong>Coletor de Leite</strong>
                </div>
                <button
                  disabled={loading}
                  onClick={() => handleBuy('cow')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#4a8505',
                    color: '#fff',
                    border: '2px solid #2e5403',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: 'bold'
                  }}
                >
                  Comprar por 450G
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
