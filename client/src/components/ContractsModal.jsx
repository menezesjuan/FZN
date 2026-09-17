import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export default function ContractsModal({ isOpen, onClose, onRefreshState, showToast }) {
  const [contracts, setContracts] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts', {
        headers: { 'Authorization': `Bearer ${api.getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchEvent = useCallback(async () => {
    try {
      const res = await fetch('/api/events/current');
      if (res.ok) {
        const data = await res.json();
        setActiveEvent(data.event);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchContracts();
    fetchEvent();
  }, [isOpen, fetchContracts, fetchEvent]);

  if (!isOpen) return null;

  async function handleAccept(contractId) {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`
        },
        body: JSON.stringify({ contractId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message, 'success');
      fetchContracts();
      if (onRefreshState) onRefreshState();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeliver(contractId) {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts/deliver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api.getToken()}`
        },
        body: JSON.stringify({ contractId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message, 'success');
      fetchContracts();
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
        width: '740px',
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
            <span style={{ fontSize: '13px' }}>📜 MURAL DE CONTRATOS & EVENTOS</span>
            <div style={{ fontSize: '8px', color: '#ffde99', marginTop: '4px' }}>
              Fornecimento comercial e demandas do mercado regional (Game.md Seção 29 & 34)
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

        {/* Active Event Banner */}
        {activeEvent && (
          <div style={{
            padding: '10px 16px',
            background: 'linear-gradient(90deg, #fff3cd, #ffeaa7)',
            borderBottom: '2px solid #e1b12c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#8d5b00' }}>
                🎉 EVENTO ECONÔMICO ATIVO: {activeEvent.title}
              </div>
              <div style={{ fontSize: '8px', color: '#665200', marginTop: '3px' }}>
                {activeEvent.description}
              </div>
            </div>
            <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#b7791f' }}>
              🔥 Demanda Alta
            </div>
          </div>
        )}

        {/* Contracts List */}
        <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {contracts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#777', fontStyle: 'italic', fontSize: '9px' }}>
              Nenhum contrato disponível no mural no momento.
            </div>
          ) : (
            contracts.map(c => {
              const isAccepted = c.status === 'ACCEPTED';
              const isCompleted = c.status === 'COMPLETED';
              const isAvailable = c.status === 'AVAILABLE';

              return (
                <div
                  key={c.id}
                  style={{
                    background: isCompleted ? '#f0f9eb' : '#fffdf9',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{c.title}</span>
                      <span style={{
                        fontSize: '7px',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: isCompleted ? '#27ae60' : isAccepted ? '#e67e22' : '#3498db',
                        color: '#fff',
                        fontWeight: 'bold'
                      }}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '8px', color: '#555', lineHeight: '1.5' }}>
                      Cliente: <strong>{c.client_name}</strong> • Item Requerido: <strong>{c.required_quantity}x {c.item_id.toUpperCase()}</strong>
                      <br />
                      Recompensa: <strong style={{ color: '#b85d18' }}>🪙 {c.reward_coins}G</strong>
                    </div>
                  </div>

                  <div>
                    {isAvailable && (
                      <button
                        disabled={loading}
                        onClick={() => handleAccept(c.id)}
                        style={{
                          padding: '8px 12px',
                          background: '#2980b9',
                          color: '#fff',
                          border: '1px solid #1a5276',
                          borderRadius: '4px',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Aceitar Pedido
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        disabled={loading}
                        onClick={() => handleDeliver(c.id)}
                        style={{
                          padding: '8px 12px',
                          background: '#27ae60',
                          color: '#fff',
                          border: '1px solid #1e8449',
                          borderRadius: '4px',
                          fontSize: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        📦 Entregar
                      </button>
                    )}

                    {isCompleted && (
                      <span style={{ fontSize: '9px', color: '#27ae60', fontWeight: 'bold' }}>
                        ✓ Entregue
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
