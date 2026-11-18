const autocannon = require('autocannon');
const { buildApp } = require('../../src/app-factory');

// Limites (SLOs) — ajustáveis por variável de ambiente.
const MAX_P99_MS = Number(process.env.PERF_MAX_P99_MS || 200);
const MIN_REQ_PER_SEC = Number(process.env.PERF_MIN_RPS || 200);
const DURATION = Number(process.env.PERF_DURATION || 5);

const payload = JSON.stringify({
  name: 'Carga', charClass: 'fighter', race: 'Humano', level: 5,
  abilities: { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 10 },
});

let server;
let url;

beforeAll((done) => {
  server = buildApp().listen(0, () => {
    url = `http://localhost:${server.address().port}`;
    done();
  });
});
afterAll((done) => { server.close(() => done()); });

function run({ path, ...opts }) {
  // o autocannon usa o path contido na própria URL
  return autocannon({ url: `${url}${path}`, connections: 10, duration: DURATION, ...opts });
}

function report(name, r) {
  console.log(
    `[perf] ${name}: ${Math.round(r.requests.average)} req/s | ` +
    `latência média ${r.latency.average}ms | p99 ${r.latency.p99}ms | ` +
    `erros ${r.errors} | non-2xx ${r.non2xx}`,
  );
}

describe('Performance', () => {
  jest.setTimeout((DURATION + 15) * 1000);

  test(`GET /health: p99 < ${MAX_P99_MS}ms, ≥ ${MIN_REQ_PER_SEC} req/s, sem erros`, async () => {
    const r = await run({ path: '/health' });
    report('GET /health', r);
    expect(r.errors).toBe(0);
    expect(r.non2xx).toBe(0);
    expect(r.latency.p99).toBeLessThan(MAX_P99_MS);
    expect(r.requests.average).toBeGreaterThan(MIN_REQ_PER_SEC);
  });

  test(`POST /characters: p99 < ${MAX_P99_MS}ms, ≥ ${MIN_REQ_PER_SEC} req/s, sem erros`, async () => {
    const r = await run({
      path: '/characters', method: 'POST',
      headers: { 'content-type': 'application/json' }, body: payload,
    });
    report('POST /characters', r);
    expect(r.errors).toBe(0);
    expect(r.non2xx).toBe(0);
    expect(r.latency.p99).toBeLessThan(MAX_P99_MS);
    expect(r.requests.average).toBeGreaterThan(MIN_REQ_PER_SEC);
  });
});
