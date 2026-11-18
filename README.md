# ⚔️ Fichas D&D — Testes Automatizados + CI

![CI](https://github.com/GMaruccio/RPG-Sheet_Manager/actions/workflows/ci.yml/badge.svg)

Projeto de **CRUD de fichas de personagem de D&D 5e** (Node.js + Express) criado como base para demonstrar:

1. **Três tipos de testes automatizados** — unitário, integração e performance — organizados para rodar e ser analisados **de forma independente**;
2. **Uma pipeline de Integração Contínua (GitHub Actions)** que, a cada `push` na branch `main`, instala as dependências, executa os três tipos de teste e apresenta os resultados.

A aplicação em si é simples de propósito: ela serve de "objeto de teste" para os três níveis de teste.

---

## 📁 Estrutura do projeto

```
.
├── .github/workflows/ci.yml     # Pipeline de CI (GitHub Actions)
├── src/
│   ├── character.js             # Regras do D&D (modificadores, PV, proficiência, 4d6)
│   ├── store.js                 # Armazenamento das fichas (memória ou arquivo JSON)
│   ├── app.js                   # API REST (Express)
│   └── server.js                # Inicialização do servidor
├── public/index.html            # Interface web do CRUD
├── tests/
│   ├── unit/                    # 🧪 Testes unitários
│   ├── integration/             # 🔗 Testes de integração
│   └── performance/             # 🚀 Testes de performance
├── scripts/summary.js           # Gera o resumo dos resultados em Markdown
└── package.json                 # Scripts de teste (um por tipo)
```

---

## 🧪 Os três tipos de teste

Cada tipo vive em sua própria pasta, tem seu próprio comando e gera seu próprio relatório em `results/`.

| | 🧪 Unitário | 🔗 Integração | 🚀 Performance |
|---|---|---|---|
| **Pasta** | `tests/unit/` | `tests/integration/` | `tests/performance/` |
| **Comando** | `npm run test:unit` | `npm run test:integration` | `npm run test:performance` |
| **Ferramentas** | Jest | Jest + Supertest | Jest + Autocannon |
| **O que valida** | Funções isoladas, sem rede nem I/O de servidor | Rotas HTTP + regras + armazenamento funcionando juntos | Tempo de resposta e vazão sob carga |
| **Nº de testes** | 45 | 14 | 2 |
| **Relatório** | `results/unit.json` e `results/coverage/` | `results/integration.json` | `results/performance.json` |

### 🧪 Testes unitários
Testam a lógica pura em `src/character.js` e `src/store.js`:
- modificador de atributo, bônus de proficiência e pontos de vida;
- rolagem 4d6 (descartando o menor dado) com gerador de números aleatórios **injetado**, para o resultado ser determinístico;
- validações da criação de ficha (nome, classe, raça, atributos);
- operações do armazenamento (criar, buscar, atualizar, remover) e persistência em arquivo.

Também geram **cobertura de código** (atualmente 100% das linhas).

### 🔗 Testes de integração
Sobem a API de verdade (via Supertest) e testam o fluxo completo do CRUD:
- criar, listar, buscar, **editar** e apagar fichas;
- respostas de erro (`400` para dados inválidos, `404` para ficha inexistente);
- independência entre várias fichas;
- **persistência**: os dados sobrevivem a um "reinício" do servidor.

### 🚀 Testes de performance
Usam o Autocannon para gerar carga (10 conexões simultâneas, 5 s) nas rotas `GET /health` e `POST /characters`. O teste **falha** se qualquer um dos limites for violado:

| Métrica | Limite | Variável para ajustar |
|---|---|---|
| Latência p99 | < 200 ms | `PERF_MAX_P99_MS` |
| Vazão média | > 200 req/s | `PERF_MIN_RPS` |
| Erros / respostas não-2xx | 0 | — |
| Duração da carga | 5 s | `PERF_DURATION` |

Exemplo de saída local: `~4500 req/s`, `p99 ≈ 12 ms`, `0 erros`.

---

## ▶️ Como executar

### Pré-requisitos
- Node.js 18 ou superior (a pipeline usa o 20)

### Instalação
```bash
npm install
```

### Rodando cada teste de forma independente
```bash
npm run test:unit          # só unitários (+ cobertura)
npm run test:integration   # só integração
npm run test:performance   # só performance
```

### Rodando tudo
```bash
npm test                   # unit -> integration -> performance
npm run summary            # tabela-resumo em Markdown dos três relatórios
```

### Como analisar os resultados
- **No terminal:** a saída do Jest mostra cada teste aprovado/reprovado; o de performance imprime uma linha `[perf]` com req/s, latência média, p99 e erros.
- **Cobertura:** abra `results/coverage/lcov-report/index.html` no navegador.
- **Relatórios brutos:** `results/*.json` (um por tipo de teste), úteis para processar em outras ferramentas.

---

## 🔄 Pipeline de CI (`.github/workflows/ci.yml`)

**Gatilho:** executa automaticamente a cada `push` na branch `main`.

```yaml
on:
  push:
    branches: [main]
```

### Etapas

| # | Etapa | O que faz |
|---|---|---|
| 1 | Checkout do código | `actions/checkout@v4` |
| 2 | Configurar Node.js | `actions/setup-node@v4` (Node 20, com cache do npm) |
| 3 | **Instalar dependências** | `npm ci` (instalação limpa a partir do `package-lock.json`) |
| 4 | **Testes unitários** | `npm run test:unit` |
| 5 | **Testes de integração** | `npm run test:integration` |
| 6 | **Testes de performance** | `npm run test:performance` |
| 7 | **Apresentar resultados** | `npm run summary` escreve uma tabela na aba *Summary* da execução |
| 8 | Publicar relatórios | `actions/upload-artifact@v4` envia a pasta `results/` |
| 9 | Veredito final | Falha a pipeline se **qualquer** suíte tiver falhado |

**Decisão de projeto:** os passos 4 a 6 usam `continue-on-error`, então os **três tipos de teste sempre rodam**, mesmo que um deles falhe. Assim você vê o quadro completo em uma única execução. O passo 9 garante que o resultado final da pipeline continue vermelho se algo falhou.

### Onde ver os resultados no GitHub
1. Abra a aba **Actions** do repositório e clique na execução mais recente.
2. Na página da execução, veja o **Summary**: tabela com total, aprovados e reprovados de cada suíte, mais a cobertura.
3. Em **Artifacts**, baixe `relatorios-de-teste` para obter os JSONs e o relatório de cobertura em HTML.

Exemplo do resumo gerado:

| Suíte | Testes | ✅ Passaram | ❌ Falharam | Status |
|---|---|---|---|---|
| 🧪 Unitários | 45 | 45 | 0 | 🟢 OK |
| 🔗 Integração | 14 | 14 | 0 | 🟢 OK |
| 🚀 Performance | 2 | 2 | 0 | 🟢 OK |

---

## 🎲 Sobre a aplicação (objeto de teste)

### Rodando localmente
```bash
npm start      # http://localhost:3000
```
As fichas ficam salvas em `data/characters.json` (variável `DATA_FILE` para mudar o caminho; `PORT` para mudar a porta).

### API

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/characters` | Cria uma ficha |
| `GET` | `/characters` | Lista todas |
| `GET` | `/characters/:id` | Visualiza uma |
| `PUT` | `/characters/:id` | Edita (recalcula PV, CA, proficiência e iniciativa) |
| `DELETE` | `/characters/:id` | Apaga |
| `GET` | `/roll` | Rola 4d6 (descarta o menor) para os seis atributos |
| `GET` | `/classes` | Lista as 12 classes |
| `GET` | `/health` | Verificação de saúde |

Exemplo de corpo para `POST`/`PUT`:

```json
{
  "name": "Thorin",
  "charClass": "fighter",
  "race": "Anão",
  "level": 3,
  "abilities": { "str": 16, "dex": 12, "con": 14, "int": 8, "wis": 10, "cha": 10 }
}
```

### Regras implementadas (D&D 5e simplificado)
- **Modificador:** `floor((atributo − 10) / 2)`
- **Proficiência:** `ceil(nível / 4) + 1`
- **PV:** nível 1 = dado de vida cheio + CON; demais níveis = média do dado (`dado/2 + 1`) + CON (mínimo 1 por nível)
- **CA:** `10 + mod. DEX` · **Iniciativa:** `mod. DEX`

### Interface web
Em `http://localhost:3000` há uma lista lateral de fichas, com botões para **criar**, **visualizar**, **editar** e **excluir**.

---

## 🛠️ Tecnologias

Node.js · Express · Jest · Supertest · Autocannon · GitHub Actions
