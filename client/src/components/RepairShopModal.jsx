import React, { useState } from 'react';
import { api } from '../api/client';

export default function RepairShopModal({ isOpen, onClose, tools, onRefreshState, showToast }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleRepairTool(toolId) {
    setLoading(true);
    try {
      const res = await api.repairTool(toolId);
      showToast(res.message, 'success');
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRepairAll() {
    setLoading(true);
    try {
      const res = await api.repairAllTools();
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
        width: '640px',
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
            <span style={{ fontSize: '13px' }}>🔨 FERRARIA & OFICINA DE REPAROS</span>
            <div style={{ fontSize: '8px', color: '#ffde99', marginTop: '4px' }}>
              Manutenção de equipamentos agrícolas e restauração de durabilidade
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

        {/* Info Banner */}
        <div style={{
          padding: '8px 14px',
          background: '#fff2d6',
          borderBottom: '2px solid #bda37c',
          fontSize: '8px',
          lineHeight: '1.5'
        }}>
          ⚠️ <strong>Regra Econômica:</strong> Ferramentas desgastadas perdem eficiência no cultivo e colheita.
          Ferramentas com 0% quebram e não podem ser utilizadas.
        </div>

        {/* Tools List */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(tools || []).map(tool => {
            const pct = Math.round((tool.durability / tool.max_durability) * 100);
            const isBroken = tool.durability <= 0;
            const barColor = pct >= 80 ? '#2e7d32' : pct >= 50 ? '#fbc02d' : pct >= 20 ? '#f57c00' : '#d32f2f';

            return (
              <div
                key={tool.tool_id}
                style={{
                  background: '#fffdfa',
                  border: '2px solid #8d5b35',
                  borderRadius: '4px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {tool.tool_id.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '8px', color: '#666', marginBottom: '6px' }}>
                    Estado: <span style={{ color: barColor, fontWeight: 'bold' }}>{tool.condition}</span> ({pct}% durabilidade)
                    • Eficiência: <strong>{Math.round((tool.efficiencyMultiplier || 1) * 100)}%</strong>
                  </div>

                  {/* Durability Bar */}
                  <div style={{ width: '100%', height: '8px', background: '#ddd', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.3s' }} />
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    disabled={loading || pct === 100}
                    onClick={() => handleRepairTool(tool.tool_id)}
                    style={{
                      padding: '8px 12px',
                      background: pct === 100 ? '#ccc' : '#4a8505',
                      color: pct === 100 ? '#777' : '#fff',
                      border: '2px solid #000',
                      borderRadius: '4px',
                      cursor: pct === 100 || loading ? 'not-allowed' : 'pointer',
                      fontSize: '9px',
                      fontWeight: 'bold'
                    }}
                  >
                    {pct === 100 ? 'Perfeito' : isBroken ? 'REPARAR (QUEBRADO)' : 'Consertar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with Repair All */}
        <div style={{
          padding: '12px 18px',
          background: '#d8c29d',
          borderTop: '2px solid #bda37c',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '9px', color: '#5c3a21' }}>
            Consertos são debitados diretamente do seu saldo de moedas no Ledger.
          </div>
          <button
            disabled={loading}
            onClick={handleRepairAll}
            style={{
              padding: '10px 16px',
              background: '#b85d18',
              color: '#fff',
              border: '2px solid #6b350b',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            🛠️ REPARAR TUDO
          </button>
        </div>
      </div>
    </div>
  );
}
