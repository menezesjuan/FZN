# FZN — Jogo de Fazenda 2D

Jogo de fazenda e simulação agrícola desenvolvido com arquitetura autoritativa em **JavaScript + React + Node.js**.

---

## 🌟 Principais Funcionalidades do Vertical Slice

* **Ciclo Agrícola Completo (Core Loop):**
  * **Preparação:** Arar a terra com a Enxada de Trabalho.
  * **Plantio:** Plantar sementes de Morango, Batata, Alho-poró ou Cebola.
  * **Hidratação:** Regar com o Regador de Cobre para viabilizar o crescimento.
  * **Crescimento Visual:** 6 a 7 estágios reais com spritesheets de pixel art (`Spring Crops.png`).
  * **Colheita:** Coleta de colheita com rolagem de qualidade (Normal, Prata, Ouro, Iridium) e ganho de XP.
* **Economia Autoritativa & Anti-Tampering:**
  * Servidor Node.js valida e calcula todas as compras, vendas, dinheiro, inventário e XP.
  * Saturação e cálculo de preços dinâmicos por qualidade.
* **Empório do Vilarejo (Loja):**
  * Compra de sementes e venda de produtos agrícolas com feedback imediato.
* **Motor 2D em HTML5 Canvas:**
  * Renderização com `image-rendering: pixelated` para pixel art autêntico.
  * Animações de personagem (4 direções, caminhada com 6 frames e respiração em repouso com 4 frames).
  * Câmera dinâmica centralizada no jogador.
  * Partículas táteis de terra e água, além de números e textos flutuantes (+15 XP, +1 Morango).
* **Persistência Atômica:**
  * Gravação segura em disco (`server/data/savegame.json`) imune a corrupção em desligamento abrupto.

---

## 🕹️ Controles

* **W / A / S / D** ou **Setas:** Movimentar o personagem.
* **1 a 8:** Selecionar ferramenta ou semente na barra inferior (Hotbar).
* **Clique Esquerdo do Mouse:** Interagir com o lote apontado (arar, regar, plantar, colher).
* **I:** Abrir / Fechar Mochila (Inventário de 24 slots).
* **B:** Abrir / Fechar Empório (Loja de compra e venda).
* **ESC:** Fechar janelas e modais.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* Node.js (versão 18 ou superior)
* npm

### Instalação
```bash
# Instala as dependências do servidor e cliente
npm run install:all
```

### Modo de Desenvolvimento
```bash
npm run dev
```
* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **Backend:** [http://localhost:3001](http://localhost:3001)

### Testes Automatizados
```bash
npm test
```

### Produção
```bash
npm run build
npm start
```
O servidor Express servirá o jogo compilado em [http://localhost:3001](http://localhost:3001).

---

## 🗺️ Roadmap de Desenvolvimento

- [x] **Fase 1: Vertical Slice & Core Loop** (Arar, Plantar, Regar, Colher, Vender, Comprar, Backend Autoritativo)
- [ ] **Fase 2: Expansão da Fazenda & Ferramentas** (Melhoria de ferramentas, remoção de árvores/tocos, expansão de lotes)
- [ ] **Fase 3: Tempo & Estações do Ano** (Relógio do jogo, Primavera/Verão/Outono/Inverno com culturas sazonais)
- [ ] **Fase 4: Pecuária & Animais** (Pintinhos, galinhas, vacas, ovos, leite, baú de armazenamento)
- [ ] **Fase 5: Processamento & Máquinas** (Moinho, queijaria, agregação de valor)
- [ ] **Fase 6: NPCs, Missões & Reputação** (Moradores, diálogos, contratos e favores)
- [ ] **Fase 7: Mercado Dinâmico & Contratos Globais**
- [ ] **Fase 8: Casa & Decoração de Interiores**
- [ ] **Fase 9: Conquistas & Endgame**
