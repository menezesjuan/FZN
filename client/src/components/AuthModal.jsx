import React, { useState } from 'react';
import { api } from '../api/client';

export default function AuthModal({ onAuthenticated }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let data;
      if (isLogin) {
        data = await api.login(username, password);
      } else {
        data = await api.register(username, email, password);
      }

      api.setToken(data.token);
      if (onAuthenticated) {
        onAuthenticated(data.user, data.offlineReport);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickDemo() {
    setError('');
    setLoading(true);
    const demoId = Math.floor(Math.random() * 8999 + 1000);
    const demoUser = `fazendeiro_${demoId}`;
    const demoEmail = `fazendeiro_${demoId}@fazenda.fzn`;
    const demoPass = 'fzn123456';

    try {
      const data = await api.register(demoUser, demoEmail, demoPass);
      api.setToken(data.token);
      if (onAuthenticated) {
        onAuthenticated(data.user, null);
      }
    } catch (err) {
      setError(err.message);
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
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      fontFamily: '"Press Start 2P", monospace, sans-serif'
    }}>
      <div style={{
        background: '#e2d3b4',
        border: '4px solid #5c3a21',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 0 0 2px #d1be9b',
        borderRadius: '8px',
        padding: '24px 28px',
        width: '420px',
        maxWidth: '92vw',
        color: '#3c2415'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#5c3a21' }}>
            🌾 FZN FARMING ONLINE
          </h2>
          <p style={{ margin: 0, fontSize: '10px', color: '#7a5230' }}>
            Economia Persistente & Mercado Multiplayer
          </p>
        </div>

        {error && (
          <div style={{
            background: '#ffdddd',
            border: '2px solid #cc3333',
            color: '#990000',
            padding: '8px',
            fontSize: '9px',
            marginBottom: '14px',
            borderRadius: '4px',
            lineHeight: '1.4'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', marginBottom: '4px', fontWeight: 'bold' }}>
              Usuário:
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Seu apelido de fazendeiro"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '11px',
                border: '2px solid #8d5b35',
                borderRadius: '4px',
                boxSizing: 'border-box',
                background: '#fffbf2'
              }}
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '10px', marginBottom: '4px', fontWeight: 'bold' }}>
                E-mail:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '11px',
                  border: '2px solid #8d5b35',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  background: '#fffbf2'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '10px', marginBottom: '4px', fontWeight: 'bold' }}>
              Senha:
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '11px',
                border: '2px solid #8d5b35',
                borderRadius: '4px',
                boxSizing: 'border-box',
                background: '#fffbf2'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '12px',
              background: '#4a8505',
              color: '#fff',
              border: '2px solid #2e5403',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 3px 0 #2e5403'
            }}
          >
            {loading ? 'Entrando...' : isLogin ? 'ENTRAR NA FAZENDA' : 'CRIAR MINHA CONTA'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px dashed #ad8864', paddingTop: '12px' }}>
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: '#8d420f',
              fontSize: '9px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Não tem conta? Cadastre-se aqui' : 'Já possui conta? Clique para entrar'}
          </button>

          <div style={{ marginTop: '14px' }}>
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                background: '#c27e38',
                color: '#fff',
                border: '2px solid #7d4d1a',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 0 #7d4d1a'
              }}
            >
              🚀 ENTRAR RÁPIDO (CONTA TESTE)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
