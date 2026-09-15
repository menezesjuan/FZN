import React from 'react';

export default function SleepModal({ isOpen, onClose, onConfirmSleep, time }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60
    }}>
      <div className="pixel-panel" style={{ width: '420px', maxWidth: '90vw', padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>
          🏡🛌
        </div>
        <h3 className="font-pixel" style={{ fontSize: '13px', color: '#ffec40', marginBottom: '8px', textShadow: '1px 1px 0 #000' }}>
          Descansar na Casa da Fazenda?
        </h3>
        <p style={{ fontSize: '13px', color: '#f7e6c4', lineHeight: '1.4', marginBottom: '20px' }}>
          Ao descansar, sua energia será <strong>100% restaurada</strong>, as plantações regadas avançarão em direção à colheita e o sol nascerá às <strong>06:00</strong> no Dia {(time?.day || 1) + 1}.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            className="pixel-btn"
            style={{ background: '#4ade80', color: '#064e3b', borderColor: '#047857', padding: '10px 18px' }}
            onClick={onConfirmSleep}
          >
            🌙 Sim, Passar a Noite
          </button>
          <button
            className="pixel-btn"
            style={{ padding: '10px 18px' }}
            onClick={onClose}
          >
            Continuar Trabalhando
          </button>
        </div>
      </div>
    </div>
  );
}
