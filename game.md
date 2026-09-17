# PROJETO — FARMING IDLE ECONOMY

## 1. VISÃO GERAL

Desenvolver um jogo online de farming, social e econômico, com inspiração conceitual em jogos como Stardew Valley e Colheita Feliz, mas com identidade e sistemas próprios.

O projeto NÃO deverá ser uma simples cópia de Stardew Valley.

O objetivo é utilizar como referências:

* sensação de possuir e desenvolver uma propriedade;
* cultivo;
* criação de animais;
* fabricação;
* progressão de ferramentas;
* expansão territorial;
* coleta de recursos;
* economia baseada em produção.

A principal diferença é:

**o mercado deve ser o verdadeiro endgame.**

O jogador não deve simplesmente:

> plantar → colher → vender para NPC → ficar rico.

O loop deverá ser:

> analisar mercado → decidir o que produzir → investir → produzir → processar → armazenar → negociar → reinvestir → escalar operação.

A fazenda é a fábrica.

O mercado é o jogo.

---

# 2. REGRA CRÍTICA SOBRE ASSETS

## ATENÇÃO AO DESENVOLVEDOR

O projeto JÁ POSSUI ASSETS.

Os assets encontram-se distribuídos em SUBPASTAS NA RAIZ DO PROJETO.

Antes de criar QUALQUER:

* sprite;
* imagem;
* textura;
* ícone;
* terreno;
* personagem;
* animal;
* objeto;
* construção;
* árvore;
* cerca;
* planta;
* elemento de HUD;
* botão;
* background;
* tile;
* animação;

o desenvolvedor deverá PRIMEIRO inspecionar os diretórios existentes.

### É PROIBIDO:

1. apagar assets existentes sem autorização;
2. sobrescrever assets;
3. renomear arquivos em massa;
4. mover pastas;
5. modificar a estrutura dos diretórios apenas por conveniência;
6. substituir um asset funcional por placeholder;
7. gerar assets novos quando já existir algo apropriado;
8. alterar referências existentes sem verificar dependências;
9. reorganizar o projeto inteiro sem necessidade;
10. executar operações destrutivas para "limpar" o projeto.

Se um asset aparentemente estiver faltando:

1. procurar recursivamente nas subpastas da raiz;
2. verificar extensões alternativas;
3. verificar spritesheets;
4. verificar arquivos de tiles;
5. verificar assets que possam cumprir função equivalente;
6. somente então utilizar placeholder.

Placeholder deve ser claramente identificado no código.

Exemplo:

`TODO_ASSET_COW_BARN`

Nunca substituir silenciosamente um asset definitivo.

---

# 3. PILARES DO JOGO

O jogo possuirá cinco pilares.

### Farming

Produção de matérias-primas.

### Crafting e processamento

Transformação de recursos em produtos de maior valor.

### Economia

Oferta, demanda, custos e risco.

### Mercado multiplayer

Jogadores negociando com jogadores.

### Progressão empresarial

O personagem começa como pequeno produtor e eventualmente administra uma operação agrícola.

---

# 4. FILOSOFIA ECONÔMICA

O jogo NÃO pode possuir geração infinita de dinheiro.

Toda economia deverá possuir:

**Sources**

formas de criação de moeda.

E:

**Sinks**

formas de destruição de moeda.

O equilíbrio entre os dois determinará inflação ou deflação.

Objetivo aproximado:

`Moeda destruída ≈ moeda criada`

em jogadores economicamente maduros.

Jogadores novos poderão apresentar saldo líquido positivo para facilitar onboarding.

---

# 5. MOEDAS

Nunca utilizar uma única variável para representar todo tipo de saldo.

Criar pelo menos três conceitos independentes.

## 5.1 Coins

Moeda operacional do jogo.

Utilizada para:

* sementes;
* ferramentas;
* salários;
* manutenção;
* crafting;
* mercado;
* impostos;
* expansão;
* energia;
* NPCs.

Coins não devem obrigatoriamente representar dinheiro real.

---

# 5.2 Premium Currency

Opcional.

Utilizada para:

* cosméticos;
* skins;
* decorações;
* conveniências;
* passe;
* personalização.

Evitar transformar a moeda premium em impressora direta de lucro econômico.

---

# 5.3 RMT Balance

Saldo relacionado a valores reais.

Deve ser contabilizado separadamente.

Nunca fazer:

```text
player.money = coins + dinheiroReal
```

Implementar livros-contábeis separados.

Exemplo conceitual:

```text
Wallet
├── Coins
├── PremiumCurrency
├── PendingRMT
├── AvailableRMT
└── WithdrawnRMT
```

Toda movimentação relacionada a RMT deve possuir histórico imutável.

---

# 6. PRINCÍPIO FUNDAMENTAL DO RMT

Dinheiro real não pode surgir arbitrariamente do servidor.

Deve existir origem econômica identificável.

Exemplo:

Jogador A compra determinado ativo.

Jogador B vende.

A plataforma:

* processa pagamento;
* desconta taxas;
* registra transação;
* credita saldo elegível do vendedor.

Isso permite uma economia:

**Player → Player**

em vez de:

**Servidor → dinheiro infinito → Player**

---

# 7. MARKETPLACE

O marketplace deverá ser o coração do jogo.

Possíveis categorias:

* sementes;
* colheitas;
* animais;
* produtos animais;
* minérios;
* madeira;
* produtos processados;
* ingredientes;
* comida;
* equipamentos;
* ferramentas;
* fertilizantes;
* recursos raros;
* itens sazonais.

---

# 8. TIPOS DE MERCADO

## Venda imediata

O jogador aceita ofertas existentes.

---

## Ordem de venda

Exemplo:

```text
100 tomates
R$ virtual: 17 moedas/unidade
```

---

## Ordem de compra

Exemplo:

```text
Comprar:
500 trigo
máximo: 4,20 moedas/unidade
```

---

# 9. ORDER BOOK

Para itens importantes, utilizar sistema parecido com mercado financeiro.

Exemplo:

```text
COMPRADORES

Quantidade     Valor
500            12,30
800            12,20
1200           12,10

VENDEDORES

Quantidade     Valor
300            12,50
900            12,70
2000           13,00
```

Isso cria gameplay econômica.

O jogador poderá decidir:

* vender imediatamente;
* esperar;
* acumular;
* especular;
* produzir outra commodity.

---

# 10. HISTÓRICO DE PREÇO

Cada item deverá registrar:

* último preço;
* média de 1 hora;
* média de 24 horas;
* média de 7 dias;
* máxima;
* mínima;
* volume negociado.

Gráficos poderão existir posteriormente.

Exemplo:

```text
Tomate

Agora:        14.32
24h:          13.87
7 dias:       12.91
Volume 24h:   82.419
```

---

# 11. MARKET FEE

Toda transação deverá remover parte da economia.

Exemplo inicial:

`5–10%`

Esse percentual será uma variável configurável do servidor.

Nunca hardcoded no frontend.

Exemplo:

```text
marketplace_fee = 0.08
```

Venda:

```text
1000 coins
```

Taxa:

```text
80 coins
```

Vendedor recebe:

```text
920 coins
```

Os 80 são destruídos ou encaminhados conforme modelo econômico definido.

---

# 12. LISTING FEE

Além da taxa de conclusão, poderá existir taxa de anúncio.

Exemplo:

`1%`.

Isso reduz spam de ordens absurdas.

---

# 13. DIFICULDADE FINANCEIRA

A dificuldade não deverá ser criada apenas diminuindo recompensas.

Ela deverá aparecer através de:

* despesas;
* risco;
* capital imobilizado;
* tempo;
* logística;
* deterioração;
* manutenção;
* competição.

O jogador deve frequentemente pensar:

> Tenho dinheiro para fazer isso?

E não:

> Quanto tempo falta para eu ficar milionário?

---

# 14. CUSTOS DA FAZENDA

Exemplos:

* sementes;
* fertilizantes;
* água;
* eletricidade;
* combustível;
* manutenção;
* alimentação dos animais;
* medicamentos veterinários;
* reparo de máquinas;
* armazenamento;
* expansão;
* transporte;
* salários.

---

# 15. MANUTENÇÃO

Máquinas deverão possuir condição.

Exemplo:

```text
Trator
Durabilidade: 71%
Eficiência: 95%
```

Quanto pior a condição:

* menor produtividade;
* maior consumo;
* risco de defeito.

---

# 16. STORAGE

Armazenamento deve ter custo.

Começar pequeno:

```text
Celeiro nível 1
Capacidade: 100 slots
```

Depois:

```text
Celeiro nível 5
Capacidade: 2500 slots
```

Expansionismo excessivo deve custar capital.

---

# 17. PRODUTOS PERECÍVEIS

Uma ferramenta importante contra acumulação infinita.

Exemplo:

Morangos:

```text
0–24h: qualidade 100%
24–48h: 90%
48–72h: 70%
72h+: deteriorado
```

Armazenamento refrigerado aumenta validade.

Isso cria escolhas:

> vender agora barato

ou

> investir em infraestrutura.

---

# 18. FARMING

Loop básico:

1. preparar terreno;
2. selecionar plantação;
3. plantar;
4. irrigar;
5. aplicar melhorias;
6. aguardar;
7. colher;
8. armazenar;
9. vender/processar.

Como o jogo é Idle, muitas dessas operações poderão ser automatizadas posteriormente.

---

# 19. TEMPO DE CULTIVO

Exemplos iniciais:

```text
Rabanete:     10 min
Trigo:        30 min
Milho:        2 h
Tomate:       4 h
Morango:      8 h
Abóbora:      12 h
```

Valores são parâmetros de balanceamento.

---

# 20. ESTAÇÕES

Introduzir posteriormente:

* primavera;
* verão;
* outono;
* inverno.

Cada estação favorece diferentes culturas.

Isso gera ciclos econômicos.

Exemplo:

No inverno:

tomates ficam raros.

Consequência:

preço potencialmente aumenta.

---

# 21. PRODUÇÃO SECUNDÁRIA

Matéria-prima deve alimentar cadeias produtivas.

Exemplo:

```text
Trigo
 ↓
Farinha
 ↓
Massa
 ↓
Pão
```

Outro:

```text
Leite
 ↓
Queijo
 ↓
Queijo envelhecido
```

Produtos processados oferecem maior margem, mas exigem:

* máquinas;
* energia;
* tempo;
* espaço;
* capital.

---

# 22. ANIMAIS

Exemplos:

* galinhas;
* vacas;
* porcos;
* ovelhas.

Custos:

* aquisição;
* alimentação;
* estrutura;
* cuidados.

Produtos:

* ovos;
* leite;
* lã;
* outros recursos pertinentes.

---

# 23. IDLE GAMEPLAY

Offline progression deverá existir.

Ao desconectar:

```text
last_login = timestamp
```

Ao retornar:

```text
offline_time = current_time - last_login
```

O servidor calcula:

* plantações concluídas;
* produção;
* consumo;
* automações;
* desgaste.

Nunca confiar no relógio local do jogador.

---

# 24. LIMITE DE OFFLINE PROGRESS

Evitar progresso infinito.

Exemplo inicial:

`8 horas`

Upgrade:

```text
Silo inteligente
+2 horas
```

Máximo eventual:

`24 horas`.

---

# 25. AUTOMAÇÃO

Early game:

manual.

Mid game:

* sprinkler;
* alimentador;
* coletor;
* plantadeira;
* harvester.

Late game:

gestão estratégica.

O objetivo é transformar gradualmente:

**jogo de clique**

em:

**jogo de gestão econômica.**

---

# 26. PROGRESSÃO

Não utilizar apenas XP.

Progressão deve depender também de:

* patrimônio;
* área;
* produção;
* reputação;
* infraestrutura.

---

# 27. EXPANSÃO

Exemplo:

```text
Terreno 1: gratuito
Terreno 2: 5.000
Terreno 3: 18.000
Terreno 4: 60.000
Terreno 5: 200.000
```

Crescimento exponencial controlado.

---

# 28. FARM LEVEL

Exemplo:

```text
Nível 1
pequeno produtor

Nível 10
fazenda familiar

Nível 20
fazenda comercial

Nível 30
operação agrícola

Nível 40+
agronegócio
```

---

# 29. CONTRATOS

Adicionar contratos entre sistema e jogadores.

Exemplo:

```text
Restaurante do Vale

Pedido:
400 tomates

Prazo:
12 horas

Pagamento:
5.800 coins
```

Contrato exige planejamento.

Falha poderá causar:

* perda de reputação;
* multa;
* cooldown.

---

# 30. NPC MARKET

NPC deve existir como mecanismo estabilizador.

Porém:

NPC NÃO deverá normalmente oferecer melhor preço que jogadores.

Exemplo:

Preço médio:

```text
100 coins
```

NPC compra:

```text
60–75 coins
```

Assim sempre existe liquidez mínima sem destruir o marketplace.

---

# 31. PREÇO MÍNIMO ECONÔMICO

Antes de liberar qualquer produto, calcular aproximadamente:

```text
Custo médio =
semente
+ energia
+ manutenção
+ terreno
+ fertilizante
+ tempo
```

O design precisa saber quanto custa produzir cada item.

Caso contrário, será impossível balancear a economia.

---

# 32. PROFIT MARGIN

Uma cultura não deve sempre ser melhor que todas as outras.

Exemplo:

Trigo:

* baixo risco;
* baixo retorno.

Morango:

* maior investimento;
* maior margem;
* maior risco.

Produto raro:

* grande margem potencial;
* mercado pequeno;
* risco de encalhe.

---

# 33. DEMANDA DINÂMICA

NPCs e eventos poderão consumir commodities.

Exemplo:

```text
Festival da Pizza
```

Durante o evento:

demanda de:

* tomate;
* queijo;
* trigo;

aumenta.

Isso movimenta mercado.

---

# 34. MARKET EVENTS

Exemplos:

* seca;
* chuva abundante;
* festival;
* inverno severo;
* doença animal;
* boom gastronômico;
* feira regional.

Evitar eventos puramente aleatórios que destruam patrimônio.

Eles devem alterar estratégias, não funcionar como aposta.

---

# 35. SOCIAL

Posteriormente:

* visitar fazendas;
* ranking de produção;
* cooperativas;
* comércio;
* contratos privados;
* guildas rurais.

---

# 36. COOPERATIVAS

Jogadores poderão formar cooperativas.

Benefícios possíveis:

* depósitos conjuntos;
* contratos maiores;
* objetivos comunitários;
* infraestrutura compartilhada.

---

# 37. REPUTAÇÃO

Marketplace deverá possuir reputação.

Exemplo:

```text
Merchant Rating: 94
```

Reputação poderá influenciar:

* limites;
* contratos;
* acesso a mercados;
* taxas.

---

# 38. RMT — ARQUITETURA

Qualquer RMT deverá ser processado SERVER-SIDE.

Nunca confiar no cliente para:

* saldo;
* preço;
* propriedade;
* confirmação;
* quantidade;
* saque.

---

# 39. LEDGER FINANCEIRO

Criar ledger de transações.

Exemplo:

```text
transaction_id
user_id
type
asset
amount
balance_before
balance_after
reference
timestamp
status
```

Nunca simplesmente atualizar:

```text
balance = balance + x
```

sem registrar origem.

---

# 40. TRANSAÇÕES ATÔMICAS

Marketplace deverá usar transações de banco.

Exemplo:

Jogador A compra item.

Sistema:

1. verifica saldo;
2. bloqueia saldo;
3. verifica estoque;
4. transfere item;
5. transfere moeda;
6. aplica taxas;
7. registra ledger;
8. conclui transação.

Se qualquer etapa falhar:

ROLLBACK.

---

# 41. DUPLICAÇÃO

Servidor deverá ser autoridade sobre:

* inventário;
* fazenda;
* saldo;
* marketplace;
* crafting.

Cliente envia intenção.

Exemplo:

```text
POST /market/buy
item_id
quantity
```

Servidor calcula o restante.

Cliente NÃO envia:

```text
price_total = 500
```

como verdade absoluta.

---

# 42. ANTI-CHEAT

Detectar comportamentos como:

* ações impossivelmente rápidas;
* criação anormal de itens;
* transações circulares;
* múltiplas contas;
* farming automatizado indevido;
* manipulação artificial do mercado;
* duplicação;
* velocidade impossível.

---

# 43. RMT E MULTIACCOUNT

Esse será provavelmente um dos maiores problemas do projeto.

Exemplo:

Jogador cria:

100 contas.

Cada uma recebe:

100 moedas iniciais.

Depois transfere tudo.

Resultado:

10.000 moedas artificiais.

Portanto moeda gratuita de onboarding deverá:

* ser limitada;
* eventualmente ser account-bound;
* não ser imediatamente convertível;
* possuir controles antifraude.

---

# 44. SALDO PENDENTE

Transações RMT não devem gerar saque imediatamente.

Modelo:

```text
Pending Balance
↓
fraud review / prazo
↓
Available Balance
↓
Withdrawal
```

---

# 45. WITHDRAWAL

Fluxo conceitual:

```text
Solicitar saque
↓
validação de conta
↓
validação antifraude
↓
validação de saldo
↓
taxas
↓
processamento
↓
concluído
```

Idempotência obrigatória.

Uma requisição repetida não poderá criar dois pagamentos.

---

# 46. KYC

Caso dinheiro real seja sacável, estudar implementação de verificação de identidade conforme regras do provedor e legislação aplicável.

Possíveis verificações:

* identidade;
* CPF;
* idade;
* conta de destino;
* limites.

Não implementar solução improvisada própria para documentos sensíveis se um processador especializado puder cumprir essa função.

---

# 47. TAXA DA PLATAFORMA

Exemplo conceitual:

Venda RMT:

```text
R$10,00
```

Taxa:

```text
8%
```

Vendedor:

```text
R$9,20
```

Os valores definitivos deverão ser definidos somente depois da análise de:

* gateway;
* chargebacks;
* impostos;
* fraude;
* infraestrutura.

---

# 48. PROIBIÇÃO DE PAY-TO-WIN DESCONTROLADO

Comprar recursos infinitamente e transformá-los diretamente em renda poderá quebrar a economia.

Dinheiro real deve preferencialmente oferecer:

* cosméticos;
* serviços;
* conveniência controlada;
* troca P2P devidamente limitada.

---

# 49. BANCO DE DADOS

Sugestão:

PostgreSQL.

Entidades principais:

```text
users
profiles
farms
farm_tiles
inventory
items
crops
crop_instances
animals
buildings
machines
recipes
production_jobs
market_orders
market_trades
wallets
ledger
transactions
withdrawals
deposits
contracts
events
notifications
audit_logs
```

---

# 50. USERS

Exemplo:

```text
users

id
email
password_hash
status
created_at
last_login
```

Nunca armazenar senha em texto puro.

---

# 51. INVENTORY

Não armazenar o inventário inteiro como JSON gigante se houver mercado/RMT.

Utilizar estrutura relacional.

Exemplo:

```text
inventory

id
user_id
item_id
quantity
quality
created_at
```

---

# 52. MARKET ORDERS

```text
market_orders

id
seller_id
item_id
quantity_total
quantity_remaining
unit_price
status
created_at
expires_at
```

---

# 53. MARKET TRADES

```text
market_trades

id
buy_order_id
sell_order_id
buyer_id
seller_id
item_id
quantity
unit_price
fee
created_at
```

Nunca apagar histórico financeiro concluído.

---

# 54. AUDIT LOG

Registrar ações críticas:

```text
USER_LOGIN
MARKET_ORDER
MARKET_TRADE
WITHDRAW_REQUEST
WITHDRAW_COMPLETE
ADMIN_BALANCE_CHANGE
ADMIN_ITEM_CREATION
```

Principalmente ações administrativas.

---

# 55. ADMIN PANEL

Criar posteriormente painel administrativo com:

* usuários;
* bans;
* saldo;
* mercado;
* logs;
* alertas;
* economia;
* inflação;
* itens;
* eventos.

Qualquer alteração administrativa de saldo deverá exigir motivo e gerar log.

---

# 56. DASHBOARD ECONÔMICO

Métricas essenciais:

```text
Coins criadas / dia
Coins destruídas / dia
Coins em circulação
Market volume
Market fees
Preço médio por commodity
Número de trades
Saldo médio
Saldo mediano
Top 1% patrimônio
```

Sem telemetria econômica será impossível balancear o jogo.

---

# 57. ECONOMY CONFIG

Valores de economia não devem ficar espalhados pelo código.

Criar configuração central.

Exemplo:

```text
economyConfig

marketFee
listingFee
npcSellMultiplier
storageCost
repairMultiplier
offlineLimit
energyCost
withdrawFee
```

---

# 58. FEATURE FLAGS

Funcionalidades perigosas devem poder ser desligadas.

Exemplo:

```text
ENABLE_RMT=false
ENABLE_WITHDRAWALS=false
ENABLE_PLAYER_MARKET=true
ENABLE_COOPERATIVES=false
```

Especialmente durante desenvolvimento.

---

# 59. PRIMEIRO MVP

NÃO tentar criar tudo simultaneamente.

MVP:

### Fase 1

* mapa;
* terreno;
* personagem;
* plantio;
* crescimento;
* colheita;
* inventário.

### Fase 2

* NPC shop;
* compra de sementes;
* venda;
* moedas;
* upgrades.

### Fase 3

* offline progression;
* automações;
* storage;
* crafting.

### Fase 4

* marketplace P2P;
* buy/sell orders;
* fees;
* histórico.

### Fase 5

* economia dinâmica;
* contratos;
* eventos;
* reputação.

### Fase 6

* infraestrutura RMT;
* ledger;
* antifraude;
* pagamento.

### Fase 7

* RMT limitado / ambiente de teste.

### Fase 8

* expansão.

---

# 60. REGRA DE DESENVOLVIMENTO

Cada fase deve funcionar completamente antes da próxima.

É proibido criar simultaneamente:

```text
marketplace
+
guild
+
RMT
+
animals
+
crafting
+
events
```

sem que farming básico esteja sólido.

---

# 61. COMMITS

Cada implementação deverá gerar commits pequenos e compreensíveis.

Exemplos:

```text
Implement crop growth lifecycle

Add persistent player inventory

Create seed purchasing flow

Implement farm tile persistence

Add marketplace order validation

Create transaction ledger

Add market transaction fees
```

Evitar:

```text
update
fix
changes
stuff
new things
```

---

# 62. BACKUPS

Antes de mudança estrutural significativa:

1. commit;
2. confirmar working tree;
3. criar branch quando necessário.

Nunca apagar ou reconstruir grandes partes da aplicação sem ponto de retorno.

---

# 63. NÃO REESCREVER FUNCIONALIDADE FUNCIONAL

Antes de modificar sistema existente:

1. entender implementação;
2. identificar dependências;
3. testar;
4. alterar apenas o necessário.

Não utilizar:

> "vou recriar isso para ficar melhor"

como estratégia padrão.

---

# 64. UI DO MAPA

Verificar especialmente:

* tiles alinhados;
* fences conectadas;
* sprites corretos;
* orientação;
* z-index;
* layers;
* colisões;
* objetos sobrepostos;
* escala consistente.

Cercas deverão formar segmentos coerentes.

Exemplo:

```text
horizontal
vertical
corner_top_left
corner_top_right
corner_bottom_left
corner_bottom_right
```

Nunca simplesmente repetir o mesmo sprite em todas as direções.

---

# 65. SISTEMA DE GRID

O mundo deverá possuir coordenadas previsíveis.

Exemplo:

```text
tile_x
tile_y
```

Objetos associados ao tile.

Isso permitirá:

* salvar;
* carregar;
* plantar;
* construir;
* mover;
* validar colisões.

---

# 66. SERVER AUTHORITY

Regra absoluta:

**o frontend apresenta o mundo.**

**o servidor determina a verdade.**

Especialmente para:

* moedas;
* inventário;
* marketplace;
* crafting;
* produção;
* RMT.

---

# 67. APIs

Estrutura conceitual:

```text
/auth
/player
/farm
/inventory
/crops
/buildings
/production
/market
/contracts
/wallet
```

RMT separado:

```text
/payments
/withdrawals
```

Com controles de segurança superiores.

---

# 68. RATE LIMIT

Implementar rate limiting em operações sensíveis.

Principalmente:

```text
login
register
market
trade
payment
withdraw
```

---

# 69. TRANSACTION LOCK

Itens listados no mercado devem ficar bloqueados.

Exemplo:

Jogador possui:

```text
100 trigo
```

Anuncia:

```text
80 trigo
```

Inventário disponível:

```text
20 trigo
```

Os 80 restantes ficam reservados.

Isso impede double-spending.

---

# 70. ESTADO DO ITEM

Possíveis estados:

```text
AVAILABLE
RESERVED
PROCESSING
LISTED
SOLD
```

---

# 71. QUALIDADE

Produtos poderão possuir qualidade:

```text
Comum
Bom
Excelente
Premium
```

Mas não exagerar no início.

Qualidade influencia preço e contratos.

---

# 72. ENDGAME

O jogador não deverá necessariamente "zerar" o jogo.

Endgame:

* controlar cadeias produtivas;
* especializar fazenda;
* analisar commodities;
* fornecer para outros jogadores;
* participar de grandes contratos;
* construir infraestrutura;
* dominar nichos econômicos.

---

# 73. ESPECIALIZAÇÃO

Evitar jogador produzir tudo eficientemente.

Exemplo:

Jogador A:

```text
grãos
```

Jogador B:

```text
laticínios
```

Jogador C:

```text
processamento
```

Jogador D:

```text
hortaliças
```

Isso força comércio.

---

# 74. PRINCÍPIO DA INTERDEPENDÊNCIA

Quanto mais autossuficiente todo jogador for, menos mercado existirá.

Portanto:

**especialização é essencial.**

Alguns produtos deverão exigir recursos provenientes de cadeias diferentes.

---

# 75. CAPITAL DE GIRO

Criar situações onde o jogador tenha patrimônio, mas pouco dinheiro disponível.

Exemplo:

```text
Patrimônio:
150.000

Coins:
4.200

Estoque:
87.000

Equipamentos:
58.800
```

Isso produz decisões econômicas reais.

---

# 76. NÃO CRIAR DÍVIDA NO MVP

Empréstimos aumentam dramaticamente risco econômico.

Só estudar depois.

Especialmente se houver RMT.

---

# 77. MARKET MANIPULATION

Monitorar:

* wash trading;
* self trading;
* preços artificiais;
* redes de contas;
* transferências suspeitas.

Não proibir automaticamente sem evidência.

Criar sistema de flag.

---

# 78. TEST ENVIRONMENT

RMT nunca deve ser inicialmente desenvolvido apontando para ambiente financeiro real.

Criar:

```text
DEV
STAGING
PRODUCTION
```

Em DEV:

```text
fake payments
fake withdrawals
```

---

# 79. SEGURANÇA

Nunca armazenar:

* segredo de pagamento;
* JWT secret;
* chave privada;
* credenciais;

no frontend.

Utilizar variáveis de ambiente.

---

# 80. VALIDAÇÃO SERVER-SIDE

Mesmo que frontend diga:

```text
quantity <= 100
```

backend deverá validar novamente.

Toda regra econômica crítica deve existir no servidor.

---

# 81. IDEIA DE EXPERIÊNCIA DO JOGADOR

Primeiros minutos:

```text
pequeno terreno
↓
plantar trigo
↓
colher
↓
vender
↓
comprar mais sementes
```

Depois:

```text
descobrir mercado
↓
perceber variação de preço
↓
escolher produção
```

Depois:

```text
automatizar
↓
processar
↓
especializar
```

Finalmente:

```text
administrar cadeia produtiva
↓
operar mercado
↓
realizar contratos
↓
negociar com jogadores
```

---

# 82. EXPERIÊNCIA PRETENDIDA

O jogador deverá pensar:

> Tomate está caro porque existe pouca oferta.

> Será que planto tomate?

> Se todo mundo fizer isso, o preço vai cair.

> Talvez eu compre tomate barato e transforme em molho.

Essa é a essência do jogo.

---

# 83. REGRA FINAL DE DESIGN

Toda nova feature deverá responder pelo menos uma destas perguntas:

### Produção

Ela melhora ou modifica como algo é produzido?

### Economia

Ela cria uma decisão financeira?

### Mercado

Ela aumenta interação entre jogadores?

### Progressão

Ela oferece um objetivo significativo?

### Social

Ela conecta jogadores?

Se não fizer nenhuma dessas coisas, questionar se realmente pertence ao jogo.

---

# 84. ORDEM DE IMPLEMENTAÇÃO OBRIGATÓRIA

Implementar nesta sequência:

```text
1. Asset audit
2. Renderização do mapa
3. Sistema de grid
4. Fazenda persistente
5. Plantio
6. Crescimento
7. Colheita
8. Inventário
9. Coins
10. NPC shop
11. Upgrades
12. Offline progression
13. Storage
14. Crafting
15. Marketplace
16. Order book
17. Market fees
18. Contratos
19. Economia dinâmica
20. Ledger financeiro
21. Antifraude
22. Payment sandbox
23. Withdraw sandbox
24. Auditoria econômica
25. RMT real, somente após validação
```

O desenvolvedor NÃO deverá pular diretamente para RMT.

---

# 85. CHECKLIST ANTES DE QUALQUER ALTERAÇÃO

Antes de programar:

* [ ] Ler estrutura do projeto.
* [ ] Inspecionar subpastas da raiz.
* [ ] Localizar assets existentes.
* [ ] Localizar implementação relacionada.
* [ ] Identificar tecnologias utilizadas.
* [ ] Verificar banco de dados.
* [ ] Verificar dependências.
* [ ] Confirmar que aplicação executa atualmente.
* [ ] Criar ponto de restauração via Git.
* [ ] Implementar alteração mínima necessária.

Depois:

* [ ] Executar projeto.
* [ ] Testar função.
* [ ] Testar regressões.
* [ ] Verificar console.
* [ ] Verificar servidor.
* [ ] Verificar persistência.
* [ ] Commitar alteração funcional.

---

# ADENDO — ECONOMIA DE ALTA DIFICULDADE

## 87. FILOSOFIA DE ECONOMIA EXTREMAMENTE RESTRITIVA

O jogo deverá possuir uma economia deliberadamente difícil.

O jogador não deve conseguir avançar rapidamente apenas repetindo a atividade mais barata.

O crescimento deverá exigir:

* capital;
* planejamento;
* reinvestimento;
* manutenção;
* reposição de ferramentas;
* reposição de animais;
* expansão;
* gerenciamento de estoque;
* análise de preços;
* escolha correta das culturas.

A regra central será:

> **Produzir gera receita, mas produzir também gera custos futuros.**

Portanto:

```text
Receita da produção
        ↓
Lucro operacional
        ↓
Manutenção
        ↓
Reposição
        ↓
Reinvestimento
        ↓
Expansão
```

O jogador nunca deverá considerar toda a receita obtida como dinheiro disponível.

---

# 88. MARGEM DE LUCRO BAIXA

As primeiras culturas deverão possuir margem pequena.

Exemplo conceitual:

```text
Custo total:
80 coins

Receita:
92 coins

Lucro:
12 coins
```

Isso significa:

```text
+15% bruto
```

Porém o jogador ainda terá:

* manutenção;
* ferramentas;
* armazenamento;
* perdas;
* expansão;
* reposição de animais.

Portanto o lucro efetivamente disponível será menor.

---

# 89. ESCADA DE PRODUÇÃO

A progressão deverá aumentar significativamente o capital necessário.

Exemplo:

```text
TIER 1
Culturas baratas
↓
baixo investimento
↓
baixo lucro
```

```text
TIER 2
Culturas intermediárias
↓
maior investimento
↓
maior risco
↓
lucro proporcionalmente maior
```

```text
TIER 3
Culturas avançadas
↓
alto investimento
↓
máquinas
↓
manutenção
↓
insumos
↓
risco elevado
```

A dificuldade não deve ser apenas o tempo de crescimento.

Ela deverá ser principalmente:

**capital necessário para manter a operação.**

---

# 90. EXEMPLO DE PROGRESSÃO FINANCEIRA

### Plantio barato

```text
Investimento: 100
Receita:      115
Lucro:         15
```

### Plantio médio

```text
Investimento: 1.000
Receita:      1.120
Lucro:          120
```

### Plantio avançado

```text
Investimento: 10.000
Receita:      11.300
Lucro:         1.300
```

Os números acima são apenas exemplos de balanceamento.

O objetivo é que o jogador precise acumular capital progressivamente.

---

# 91. REGRA DE REINVESTIMENTO

O jogador não deverá conseguir gastar todo o lucro e continuar produzindo normalmente.

Parte do dinheiro deverá obrigatoriamente ser reservada para:

* manutenção;
* substituição;
* alimentação;
* sementes;
* ferramentas;
* infraestrutura.

O jogo deve criar uma diferença entre:

**dinheiro disponível**

e:

**capital operacional.**

---

# 92. RESERVA OPERACIONAL

Recomenda-se criar uma métrica interna:

```text
Operational Reserve
```

Exemplo:

```text
Saldo:
10.000

Reserva recomendada:
6.000

Disponível para expansão:
4.000
```

Isso não precisa necessariamente bloquear o jogador.

Pode funcionar inicialmente como informação de gestão.

---

# 93. DESGASTE GLOBAL

Todos os equipamentos utilizados na produção deverão possuir desgaste.

Exemplos:

* regadores;
* ferramentas;
* machados;
* picaretas;
* máquinas;
* equipamentos de coleta;
* sprinklers;
* tratores;
* colheitadeiras;
* máquinas de processamento.

Nenhum equipamento deverá durar eternamente.

---

# 94. DURABILIDADE

Cada equipamento deverá possuir:

```text
durability
max_durability
condition
```

Exemplo:

```text
Regador

Durabilidade:
72 / 100

Condição:
Boa
```

---

# 95. USO CONSUME DURABILIDADE

Cada ação produtiva deverá consumir durabilidade.

Exemplo:

```text
Regar 1 lote
-1 durabilidade
```

```text
Cortar árvore
-3 durabilidade
```

```text
Colher máquina
-2 durabilidade
```

Os valores deverão ser configuráveis.

---

# 96. DEGRADAÇÃO DE EFICIÊNCIA

Não basta simplesmente quebrar.

Equipamentos deteriorados deverão perder eficiência.

Exemplo:

```text
100–80%
100% eficiência

79–50%
95% eficiência

49–20%
80% eficiência

19–1%
60% eficiência

0%
quebrado
```

Isso cria uma decisão:

> Continuo usando até quebrar ou conserto agora?

---

# 97. CONSERTO

Equipamentos poderão ser reparados.

O reparo deverá possuir custo.

Exemplo:

```text
Machado
Durabilidade: 24/100

Reparo:
35 coins
```

O reparo poderá restaurar parcialmente ou totalmente.

---

# 98. REPARAR VS SUBSTITUIR

Equipamentos avançados deverão ter uma escolha econômica:

```text
Reparar:
800 coins

Comprar novo:
3.500 coins
```

Isso adiciona profundidade.

---

# 99. QUEBRA

Quando chegar a:

```text
durability = 0
```

o equipamento não poderá mais executar sua função.

Estado:

```text
BROKEN
```

O jogador precisará:

* reparar;
* substituir;
* utilizar equipamento alternativo.

---

# 100. FERRAMENTAS DE COLETA

Aplicar desgaste especialmente em:

### Machado

Utilizado para:

* árvores;
* madeira;
* remoção de obstáculos.

### Picareta

Utilizada para:

* pedra;
* minério;
* recursos minerais.

### Regador

Utilizado para:

* irrigação manual.

### Equipamento de coleta animal

Utilizado para:

* leite;
* ovos;
* lã;
* outros produtos.

---

# 101. ÁRVORES E RECURSOS NATURAIS

Caso o jogo tenha árvores:

```text
Árvore
↓
crescimento
↓
maturidade
↓
coleta
↓
queda
↓
replantio
```

Machado sofrerá desgaste a cada corte.

A árvore também não deverá fornecer madeira infinitamente.

---

# 102. ANIMAIS POSSUEM CICLO DE VIDA

Animais NÃO serão ativos eternos.

Cada animal possuirá:

```text
birth_date
age
lifespan
production_cycles
remaining_cycles
health
status
```

---

# 103. MORTE POR CICLO PRODUTIVO

Além da idade, animais terão limite produtivo.

Exemplo:

### Galinha

```text
Vida máxima:
180 dias

Produção máxima:
X ovos
```

A cada ciclo de produção:

```text
remaining_production_cycles -= 1
```

Quando chegar a zero:

```text
animal_status = END_OF_LIFE
```

O animal deverá sair da produção.

---

# 104. EXEMPLO — GALINHA

Configuração inicial:

```text
Lifespan:
180 dias

Produção:
1 ovo / ciclo

Production limit:
120 ovos
```

Portanto:

```text
Galinha
↓
produz
↓
produz
↓
produz
↓
atinge limite
↓
fim do ciclo produtivo
```

Os valores são balanceáveis.

---

# 105. EXEMPLO — VACA

Configuração:

```text
Lifespan:
360 dias

Milk production:
1 coleta / X horas

Maximum productive collections:
250
```

A cada coleta:

```text
milk_collections += 1
```

Ao atingir:

```text
250
```

a vaca deixa de produzir.

---

# 106. IDADE NÃO DEVE SER O ÚNICO FATOR

O sistema poderá utilizar uma combinação:

```text
idade
+
produção acumulada
+
saúde
```

Exemplo:

```text
idade < limite
AND
production_cycles < limite
```

O animal continua produtivo.

Caso contrário:

```text
retirement / end_of_life
```

---

# 107. SAÚDE DOS ANIMAIS

Animais possuirão:

```text
health
hunger
stress
productivity
```

Se alimentação ou cuidados forem negligenciados:

```text
health ↓
productivity ↓
```

Isso reduz a eficiência econômica.

---

# 108. ALIMENTAÇÃO

Animal consumirá alimento periodicamente.

Exemplo:

```text
1 vaca
→ 2 unidades de ração/dia
```

Portanto possuir animais cria custo permanente.

---

# 109. ANIMAL NÃO É APENAS "GERADOR DE DINHEIRO"

Uma vaca:

```text
Compra
+
alimentação
+
estrutura
+
manutenção
+
equipamento
+
tempo
↓
produção de leite
```

O jogador deverá descobrir se a operação é lucrativa.

---

# 110. REPOSIÇÃO DE ANIMAIS

Quando um animal chegar ao fim de sua vida produtiva:

```text
produção = 0
```

O jogador deverá:

* comprar outro;
* criar um novo;
* utilizar reprodução, caso esse sistema exista.

Isso cria um custo recorrente.

---

# 111. CICLO DE ANIMAIS

O ciclo completo será:

```text
Compra/Nascimento
↓
Crescimento
↓
Maturidade
↓
Produção
↓
Declínio
↓
Fim da produção
↓
Substituição
```

---

# 112. REPRODUÇÃO

Sistema opcional para versão posterior.

Animais poderão gerar filhotes.

Mas:

**reprodução não deve criar dinheiro infinito.**

Filhotes devem possuir:

* alimentação;
* tempo de crescimento;
* espaço;
* custo;
* taxa de sobrevivência/configuração.

---

# 113. EQUIPAMENTOS ANIMAIS

A coleta também deverá depender de equipamentos.

Exemplo:

```text
Milk Collector
```

Cada coleta:

```text
durability - 1
```

Quando quebrar:

```text
não coleta
```

---

# 114. MÁQUINAS

Máquinas de processamento terão:

```text
durability
energy_cost
maintenance_cost
processing_time
```

Exemplo:

```text
Cheese Maker

Durabilidade:
1.000 ciclos

Cada queijo:
-1 ciclo

Energia:
5

Tempo:
30 min
```

Após 1.000 ciclos:

```text
maintenance required
```

---

# 115. MÁQUINAS AVANÇADAS

Quanto melhor a máquina:

* maior produtividade;
* maior capacidade;
* maior custo;
* maior manutenção.

Exemplo:

```text
Máquina A

100 unidades/dia
baixo custo
```

```text
Máquina B

500 unidades/dia
alto investimento
alto custo de manutenção
```

---

# 116. AUTOMATIZAÇÃO TAMBÉM CUSTA

Automação não poderá significar:

> comprei uma vez e nunca mais gasto.

Todo sistema automático terá custo operacional.

Exemplo:

```text
Sprinkler

Durabilidade:
500 ciclos

Cada ciclo:
1 utilização

Após 500:
manutenção
```

---

# 117. IRRIGAÇÃO

A irrigação poderá ter três níveis:

### Manual

Barata.

Custa:

* tempo;
* durabilidade do regador.

### Sprinkler

Caro.

Custa:

* manutenção;
* energia/água.

### Sistema avançado

Muito caro.

Custa:

* infraestrutura;
* energia;
* manutenção.

---

# 118. REGRA DE AUTOMATIZAÇÃO

Quanto mais o jogador automatiza:

```text
↓ trabalho manual
↑ custo financeiro
```

Isso é essencial para o equilíbrio do Idle.

O jogador não deve simplesmente comprar automação e eliminar todos os custos.

---

# 119. ÁRVORE DE CUSTOS

Cada produto deve possuir custo econômico rastreável.

Exemplo:

```text
QUEIJO

Leite
↓
Energia
↓
Máquina
↓
Durabilidade
↓
Armazenamento
↓
Taxa de mercado
↓
Preço final
```

O sistema deverá conseguir calcular custo aproximado.

---

# 120. CUSTO REAL DE PRODUÇÃO

Criar internamente:

```text
production_cost
```

Exemplo:

```text
Tomate

Seed:              5
Water:              1
Fertilizer:         2
Land allocation:    1
Equipment wear:     1

Total:
10 coins
```

Preço de venda:

```text
11 coins
```

Lucro:

```text
1 coin
```

Isso cria economia extremamente apertada.

---

# 121. CUSTO OCULTO NÃO DEVE SER INVISÍVEL AO JOGADOR

O jogo poderá ser difícil, mas não deve parecer injusto.

O jogador deverá conseguir descobrir:

```text
Quanto investi?
Quanto produzi?
Quanto gastei?
Quanto ganhei?
Quanto ainda preciso gastar?
```

---

# 122. RELATÓRIO DA FAZENDA

Criar posteriormente:

```text
Fazenda — Últimas 24h

Receita:
+12.430

Sementes:
-4.000

Alimentação:
-2.300

Manutenção:
-1.200

Mercado:
-700

Lucro operacional:
+4.230
```

Esse relatório será muito importante para o foco econômico.

---

# 123. RELATÓRIO POR ATIVIDADE

Exemplo:

```text
Tomate

Receita:
4.500

Custos:
3.900

Lucro:
600
```

```text
Leite

Receita:
7.000

Custos:
6.400

Lucro:
600
```

O jogador consegue comparar estratégias.

---

# 124. MERCADO + DURABILIDADE

Esse sistema deve conversar diretamente com o mercado.

Exemplo:

Preço do leite:

```text
100
```

Mas equipamento:

```text
custo operacional = 30
```

Então o jogador percebe que o preço aparente não representa necessariamente lucro.

Isso cria uma camada estratégica.

---

# 125. CAPITAL DE REPOSIÇÃO

O jogador deverá guardar dinheiro para:

```text
novos animais
+
novas ferramentas
+
manutenção
+
sementes
+
máquinas
```

Exemplo:

```text
Saldo:
50.000

Próximos custos estimados:
37.000

Capital realmente livre:
13.000
```

---

# 126. EVITAR "GRIND INFINITO"

O jogo não deve ser:

```text
clicar 10.000 vezes
```

para obter dinheiro.

O jogador deverá progredir principalmente por:

**decisão econômica.**

---

# 127. RISCO ECONÔMICO

Produções avançadas deverão apresentar maior risco.

Exemplo:

```text
Produto A

Investimento:
100
Retorno:
115
Risco:
baixo
```

```text
Produto B

Investimento:
10.000
Retorno esperado:
12.000
Risco:
médio
```

```text
Produto C

Investimento:
100.000
Retorno esperado:
140.000
Risco:
alto
```

---

# 128. NÃO GARANTIR LUCRO

O jogo deverá evitar que qualquer atividade seja matematicamente dominante para sempre.

O mercado deverá alterar:

* preços;
* demanda;
* margem;
* oportunidade.

---

# 129. LOOP ECONÔMICO COMPLETO

O loop principal passa a ser:

```text
CAPITAL
   ↓
COMPRA DE INSUMOS
   ↓
PRODUÇÃO
   ↓
DESGASTE
   ↓
COLHEITA
   ↓
PROCESSAMENTO
   ↓
ARMAZENAMENTO
   ↓
MERCADO
   ↓
RECEITA
   ↓
TAXAS
   ↓
MANUTENÇÃO
   ↓
REPOSIÇÃO
   ↓
CAPITAL DISPONÍVEL
   ↓
NOVA PRODUÇÃO
```

Esse ciclo deverá estar presente em praticamente todas as atividades do jogo.

---

# 130. REGRA DE BALANCEAMENTO MAIS IMPORTANTE

Antes de implementar uma nova cultura, animal ou máquina, criar uma ficha econômica.

Exemplo:

```text
ITEM: VACA

Compra:
5.000

Alimentação diária:
50

Equipamento:
1.000

Manutenção:
20/dia

Produção:
X litros

Vida:
360 dias

Limite produtivo:
250 coletas

Preço médio esperado:
Y

Receita total estimada:
Z

Custo total estimado:
W

Lucro:
Z-W
```

Nenhum item econômico deverá entrar no jogo sem essa análise.

---

# 131. CONFIGURAÇÃO SERVER-SIDE

Todos os números deverão ser configuráveis.

Exemplo:

```text
animal.lifespan
animal.max_production_cycles
animal.feed_consumption
animal.health_decay
animal.production_rate
```

Equipamentos:

```text
tool.max_durability
tool.wear_per_action
tool.repair_cost
tool.efficiency_decay
```

Culturas:

```text
crop.seed_cost
crop.growth_time
crop.yield
crop.base_price
crop.water_requirement
crop.fertilizer_requirement
```

---

# 132. NÃO CODIFICAR VALORES ECONÔMICOS DIRETAMENTE NO FRONTEND

ERRADO:

```text
if (cowMilk >= 100) {
    cow.die()
}
```

CORRETO:

```text
if (cow.production_cycles >= config.cow.maxProductionCycles) {
    retireAnimal(cow)
}
```

A regra real deverá ser validada pelo servidor.

---

# 133. SISTEMA DE SIMULAÇÃO

Antes do lançamento, criar uma ferramenta capaz de simular:

```text
1 jogador
30 dias
90 dias
180 dias
365 dias
```

Testar:

* saldo;
* inflação;
* produção;
* consumo;
* equipamentos quebrados;
* animais substituídos;
* market fees.

---

# 134. TESTE DE JOGADOR NOVO

Simular:

```text
Dia 1
↓
Dia 7
↓
Dia 30
↓
Dia 90
```

Perguntar:

> O jogador consegue progredir?

Mas também:

> O jogador consegue progredir sem destruir a economia?

---

# 135. TESTE DE JOGADOR EXTREMAMENTE EFICIENTE

Criar um bot/simulador que sempre escolha a melhor atividade.

Se ele conseguir produzir dinheiro infinitamente acima do restante:

**economia quebrada.**

---

# 136. TESTE DE JOGADOR INEFICIENTE

Um jogador que toma decisões ruins deverá perder eficiência.

Mas não necessariamente ficar permanentemente impossibilitado de recuperar-se.

Deve existir uma rota de recuperação.

---

# 137. OBJETIVO FINAL DA ECONOMIA

A economia deverá fazer o jogador sentir:

> "Eu tenho uma fazenda."

Depois:

> "Eu tenho uma empresa."

E finalmente:

> "Eu tenho uma operação econômica dentro de um mercado."

---

# 138. PRINCÍPIO ABSOLUTO

Nada produtivo deve ser eterno.

Tudo que gera valor deverá consumir alguma combinação de:

* tempo;
* dinheiro;
* energia;
* durabilidade;
* espaço;
* matéria-prima;
* capacidade produtiva.

Isso impede que uma infraestrutura construída uma única vez gere dinheiro indefinidamente.

---

# 139. MATRIZ DE DESGASTE

Implementar uma tabela central semelhante a:

| Sistema          |      Desgaste | Reparo | Substituição |
| ---------------- | ------------: | -----: | -----------: |
| Regador          |           Sim |    Sim |          Sim |
| Machado          |           Sim |    Sim |          Sim |
| Picareta         |           Sim |    Sim |          Sim |
| Sprinkler        |           Sim |    Sim |          Sim |
| Máquina          |           Sim |    Sim |          Sim |
| Coletor de leite |           Sim |    Sim |          Sim |
| Coletor de ovos  |           Sim |    Sim |          Sim |
| Trator           |           Sim |    Sim |          Sim |
| Celeiro          |           Sim |    Sim |          Sim |
| Galinha          | Ciclo de vida |    Não |          Sim |
| Vaca             | Ciclo de vida |    Não |          Sim |

---

# 140. REGRA DE DESIGN PARA O ESTAGIÁRIO

Antes de implementar qualquer sistema novo, responder:

1. O que ele produz?
2. O que ele consome?
3. O que o desgasta?
4. Quanto tempo dura?
5. Quanto custa substituir?
6. Como entra no mercado?
7. Como sai do mercado?
8. Qual é a margem?
9. Como o servidor valida isso?
10. Como o jogador visualiza essa informação?

Se não for possível responder essas perguntas, o sistema ainda não está pronto para implementação.


# 86. RESULTADO ESPERADO

O produto final deverá parecer inicialmente um farming game confortável e acessível.

Entretanto, conforme o jogador progride, deverá revelar um jogo muito mais profundo de:

* produção;
* logística;
* investimento;
* gestão de recursos;
* especialização;
* comércio;
* análise de mercado.

A maior habilidade do jogador não será clicar mais rápido.

Será:

**tomar melhores decisões econômicas.**

A fazenda produz.

A indústria agrega valor.

O mercado determina oportunidades.

E a economia conecta todos os jogadores.
