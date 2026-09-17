import React, { useState } from 'react';

export default function TutorialModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('inicio');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.78)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      backdropFilter: 'blur(3px)'
    }}>
      <div className="pixel-panel" style={{
        width: '680px',
        maxWidth: '92vw',
        maxHeight: '88vh',
        overflowY: 'auto',
        background: '#3e2723',
        border: '3px solid #8d6e63',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), inset 0 0 12px rgba(0, 0, 0, 0.5)',
        color: '#fef3c7',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        pointerEvents: 'auto',
        zIndex: 210
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #5d4037', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📖</span>
            <div>
              <h2 className="font-pixel" style={{ fontSize: '15px', color: '#ffea75', margin: 0 }}>
                Manual do Novo Fazendeiro
              </h2>
              <span style={{ fontSize: '11px', color: '#d7ccc8' }}>
                Guia Rápido de Primeiros Passos & Controles FZN
              </span>
            </div>
          </div>
          <button 
            className="pixel-btn" 
            onClick={onClose}
            style={{ padding: '4px 10px', fontSize: '13px', background: '#b71c1c', borderColor: '#7f0000', color: '#fff' }}
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #5d4037', paddingBottom: '8px' }}>
          <button
            className="pixel-btn"
            onClick={() => setActiveTab('inicio')}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              background: activeTab === 'inicio' ? '#8d420f' : '#4e342e',
              borderColor: activeTab === 'inicio' ? '#ffd54f' : '#3e2723',
              color: '#fff'
            }}
          >
            🌾 O Que Fazer Primeiro?
          </button>
          <button
            className="pixel-btn"
            onClick={() => setActiveTab('controles')}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              background: activeTab === 'controles' ? '#8d420f' : '#4e342e',
              borderColor: activeTab === 'controles' ? '#ffd54f' : '#3e2723',
              color: '#fff'
            }}
          >
            ⌨️ Teclas & Controles
          </button>
          <button
            className="pixel-btn"
            onClick={() => setActiveTab('idle')}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              background: activeTab === 'idle' ? '#8d420f' : '#4e342e',
              borderColor: activeTab === 'idle' ? '#ffd54f' : '#3e2723',
              color: '#fff'
            }}
          >
            🤖 Automação 100% IDLE
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'inicio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #facc15' }}>
              <div style={{ fontWeight: 'bold', color: '#ffea75', marginBottom: '4px' }}>
                🌟 A sua fazenda JÁ COMEÇA em plena atividade!
              </div>
              <div>
                Logo abaixo de onde você surge, há um <strong>campo com 32 canteiros férteis</strong> com frutas e cereais maduros esperando por você:
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#4e342e', padding: '10px', borderRadius: '4px', border: '1px solid #6d4c41' }}>
                <div style={{ color: '#81c784', fontWeight: 'bold', marginBottom: '4px' }}>
                  1. 🌾 Colheita de Frutas & Trigo
                </div>
                <div style={{ color: '#d7ccc8', fontSize: '11px' }}>
                  Aproxime-se dos canteiros com <strong>partículas brilhantes</strong> (Amoras Silvestres, Tomates e Trigo) e clique com o botão esquerdo para colher diretamente para o inventário.
                </div>
              </div>

              <div style={{ background: '#4e342e', padding: '10px', borderRadius: '4px', border: '1px solid #6d4c41' }}>
                <div style={{ color: '#81c784', fontWeight: 'bold', marginBottom: '4px' }}>
                  2. 🌱 Semeie os Canteiros Livres
                </div>
                <div style={{ color: '#d7ccc8', fontSize: '11px' }}>
                  Selecione uma semente na barra inferior (teclas <strong>1 a 8</strong>) e clique nos canteiros arados vazios para semear novas safras.
                </div>
              </div>

              <div style={{ background: '#4e342e', padding: '10px', borderRadius: '4px', border: '1px solid #6d4c41' }}>
                <div style={{ color: '#81c784', fontWeight: 'bold', marginBottom: '4px' }}>
                  3. 💧 Irrigue suas Mudas
                </div>
                <div style={{ color: '#d7ccc8', fontSize: '11px' }}>
                  Equipe o <strong>Regador de Cobre</strong> na hotbar e regue o solo. A terra ficará escura e úmida, acelerando o tempo de maturação!
                </div>
              </div>

              <div style={{ background: '#4e342e', padding: '10px', borderRadius: '4px', border: '1px solid #6d4c41' }}>
                <div style={{ color: '#81c784', fontWeight: 'bold', marginBottom: '4px' }}>
                  4. 🥚 Colete Ovos no Cercado
                </div>
                <div style={{ color: '#d7ccc8', fontSize: '11px' }}>
                  Ao lado da casa fica o cercado com as galinhas. Há <strong>ovos caipiras frescos caídos no chão</strong>: aproxime-se e clique para recolher com sua Cesta!
                </div>
              </div>

              <div style={{ background: '#4e342e', padding: '10px', borderRadius: '4px', border: '1px solid #6d4c41' }}>
                <div style={{ color: '#81c784', fontWeight: 'bold', marginBottom: '4px' }}>
                  5. 🐮 Cuide da Vaca Mimosa
                </div>
                <div style={{ color: '#d7ccc8', fontSize: '11px' }}>
                  No pasto das vacas, aproxime-se da vaca Mimosa para fazer carinho (ganhe XP) ou use o <strong>Coletor de Leite</strong> para obter leite fresco diário.
                </div>
              </div>

              <div style={{ background: '#4e342e', padding: '10px', borderRadius: '4px', border: '1px solid #6d4c41' }}>
                <div style={{ color: '#81c784', fontWeight: 'bold', marginBottom: '4px' }}>
                  6. ⚖️ Venda no Mercado Global (K)
                </div>
                <div style={{ color: '#d7ccc8', fontSize: '11px' }}>
                  Abra o <strong>Mercado (K)</strong> para negociar suas colheitas com outros fazendeiros pelo melhor preço, ou venda na <strong>Loja (H)</strong> por dinheiro na hora!
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'controles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fef3c7' }}>
              <thead>
                <tr style={{ background: '#2d1a13', borderBottom: '2px solid #5d4037', textAlign: 'left' }}>
                  <th style={{ padding: '8px' }}>Comando / Tecla</th>
                  <th style={{ padding: '8px' }}>Ação no Jogo</th>
                  <th style={{ padding: '8px' }}>Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #4e342e' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>W, A, S, D / Setas</td>
                  <td style={{ padding: '6px 8px' }}>Movimentar Personagem</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Desloca o fazendeiro livremente pelo cenário da fazenda</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #4e342e' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>Clique Esquerdo</td>
                  <td style={{ padding: '6px 8px' }}>Interagir no Mundo</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Colher, plantar, regar, pegar ovos, abrir baús e talhões</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #4e342e' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>Teclas 1 a 8</td>
                  <td style={{ padding: '6px 8px' }}>Selecionar na Hotbar</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Equipa a ferramenta ou semente correspondente ao slot</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #4e342e' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>Z</td>
                  <td style={{ padding: '6px 8px' }}>Piloto 100% IDLE</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Ativa/Desativa o bot autônomo vigilante da fazenda</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #4e342e' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>H</td>
                  <td style={{ padding: '6px 8px' }}>Loja do Vilarejo</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Compre sementes, ração e venda produtos instantaneamente</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #4e342e' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>K</td>
                  <td style={{ padding: '6px 8px' }}>Mercado Global</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Livro de ofertas P2P entre jogadores com taxa de 8%</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #4e342e' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>R</td>
                  <td style={{ padding: '6px 8px' }}>Rancho Marlene</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Compre novas galinhas, vacas e gerencie seus rebanhos</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #4e342e' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>T</td>
                  <td style={{ padding: '6px 8px' }}>Oficina do Ferreiro</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Monitore a durabilidade e repare suas ferramentas de trabalho</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 8px', fontWeight: 'bold', color: '#ffea75' }}>M</td>
                  <td style={{ padding: '6px 8px' }}>Indústria & Gestão</td>
                  <td style={{ padding: '6px 8px', color: '#d7ccc8' }}>Moinho, Queijeira, Prensa e Talhões Automatizados</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', lineHeight: '1.5' }}>
            <div style={{ background: '#1e293b', border: '1px solid #38bdf8', padding: '12px', borderRadius: '6px', color: '#e0f2fe' }}>
              <div style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '13px', marginBottom: '4px' }}>
                🤖 O Que é o Piloto 100% IDLE?
              </div>
              <div>
                O jogo possui automação nativa completa. Quando o <strong>Piloto IDLE está ATIVO</strong> (tecla <strong>Z</strong> ou botão no painel superior):
              </div>
              <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
                <li>O bot anda automaticamente até qualquer talhão ou canteiro pronto para colheita;</li>
                <li>Realiza o replantio imediato com sementes disponíveis no inventário;</li>
                <li>Coleta ovos e interage com animais sem você precisar clicar em nada;</li>
                <li>Ao assumir os controles manuais (W, A, S, D), a automação cede passagem instantaneamente para você!</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #5d4037', paddingTop: '12px', marginTop: '4px' }}>
          <button
            className="pixel-btn"
            onClick={onClose}
            style={{
              padding: '8px 24px',
              fontSize: '13px',
              background: '#2e7d32',
              borderColor: '#1b5e20',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}
          >
            🌾 Entendi! Vamos Trabalhar na Fazenda!
          </button>
        </div>
      </div>
    </div>
  );
}
