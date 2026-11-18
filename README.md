# ⚔️ Ficha D&D

CRUD de fichas de personagem de D&D 5e (Node.js + Express): crie várias fichas, visualize, edite e apague.
Os dados ficam salvos em `data/characters.json`. Inclui testes automatizados e pipeline de CI.

## Rodando

```bash
npm install
npm start          # http://localhost:3000
```

## API (CRUD)

| Método | Rota | Ação |
|---|---|---|
| POST | `/characters` | Cria ficha |
| GET | `/characters` | Lista todas |
| GET | `/characters/:id` | Visualiza uma |
| PUT | `/characters/:id` | Edita (recalcula PV, CA, proficiência...) |
| DELETE | `/characters/:id` | Apaga |
| GET | `/roll` · `/classes` · `/health` | Rolar 4d6, listar classes, health check |

## Testes (cada tipo roda de forma independente)

| Comando | O que testa | Ferramenta | Relatório |
|---|---|---|---|
| `npm run test:unit` | Regras puras (`character.js`) e armazenamento (`store.js`) | Jest | `results/unit.json` + `results/coverage/` |
| `npm run test:integration` | API HTTP completa (rotas + regras + armazenamento) | Jest + Supertest | `results/integration.json` |
| `npm run test:performance` | Carga em `GET /health` e `POST /characters` (p99 e req/s) | Jest + Autocannon | `results/performance.json` |
| `npm test` | Os três em sequência | | |
| `npm run summary` | Gera tabela-resumo em Markdown dos três | | |

Limites de performance ajustáveis: `PERF_MAX_P99_MS` (200), `PERF_MIN_RPS` (200), `PERF_DURATION` (5s).

## CI (GitHub Actions)

`.github/workflows/ci.yml` roda a cada **push na `main`**: instala dependências (`npm ci`), executa os três
tipos de teste, mostra o resumo na aba *Summary* da execução e publica os relatórios como artefato.
Os três testes sempre executam (mesmo se um falhar) e a pipeline falha no final se qualquer um falhou.

## Estrutura

```
src/            character.js (regras), store.js (armazenamento), app.js (API), server.js
public/         index.html (interface da ficha)
tests/unit/ tests/integration/ tests/performance/
scripts/summary.js
.github/workflows/ci.yml
```
