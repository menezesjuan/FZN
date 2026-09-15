import React from 'react';

export default function Toast({ message, type }) {
  if (!message) return null;

  const typeStyles = {
    info: { background: '#2563eb', border: '#1d4ed8' },
    success: { background: '#16a34a', border: '#15803d' },
    warning: { background: '#d97706', border: '#b45309' },
    error: { background: '#dc2626', border: '#b91c1c' }
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div
      className="animate-toast"
      style={{
        position: 'fixed',
        top: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: style.background,
        border: `2px solid ${style.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        padding: '10px 20px',
        borderRadius: '6px',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '13px',
        zIndex: 100,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span>{message}</span>
    </div>
  );
}
