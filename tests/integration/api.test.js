const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');
const { buildApp } = require('../../src/app-factory');
const { createStore } = require('../../src/store');

const valid = {
  name: 'Elara', charClass: 'wizard', race: 'Elfa', level: 3,
  abilities: { str: 8, dex: 14, con: 12, int: 17, wis: 13, cha: 10 },
};

describe('API de fichas (integração: rotas + regras + armazenamento)', () => {
  let app;
  beforeEach(() => { app = buildApp(); }); // armazenamento limpo a cada teste

  test('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('GET /classes lista as 12 classes', async () => {
    const res = await request(app).get('/classes');
    expect(res.body).toHaveLength(12);
    expect(res.body).toContain('wizard');
  });

  test('GET /roll retorna 6 atributos válidos', async () => {
    const res = await request(app).get('/roll');
    expect(Object.keys(res.body)).toEqual(['str', 'dex', 'con', 'int', 'wis', 'cha']);
  });

  test('POST /characters cria ficha com valores calculados', async () => {
    const res = await request(app).post('/characters').send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, name: 'Elara', proficiencyBonus: 2, hitPoints: 7 + 5 * 2, armorClass: 12 });
  });

  test('POST /characters com dados inválidos retorna 400', async () => {
    const res = await request(app).post('/characters').send({ ...valid, charClass: 'pirata' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Classe inválida/);
  });

  test('POST sem corpo retorna 400', async () => {
    expect((await request(app).post('/characters')).status).toBe(400);
  });

  test('fluxo completo: criar, listar, buscar e deletar', async () => {
    const { body: created } = await request(app).post('/characters').send(valid);

    const list = await request(app).get('/characters');
    expect(list.body).toHaveLength(1);

    const one = await request(app).get(`/characters/${created.id}`);
    expect(one.body.name).toBe('Elara');

    expect((await request(app).delete(`/characters/${created.id}`)).status).toBe(204);
    expect((await request(app).get(`/characters/${created.id}`)).status).toBe(404);
    expect((await request(app).get('/characters')).body).toEqual([]);
  });

  test('buscar/deletar id inexistente retorna 404', async () => {
    expect((await request(app).get('/characters/999')).status).toBe(404);
    expect((await request(app).delete('/characters/999')).status).toBe(404);
  });

  test('ids são incrementais', async () => {
    const a = await request(app).post('/characters').send(valid);
    const b = await request(app).post('/characters').send(valid);
    expect([a.body.id, b.body.id]).toEqual([1, 2]);
  });

  describe('UPDATE (PUT /characters/:id)', () => {
    test('edita a ficha e recalcula os valores derivados', async () => {
      const { body: c } = await request(app).post('/characters').send(valid);
      const res = await request(app).put(`/characters/${c.id}`).send({
        ...valid, name: 'Elara, a Arquimaga', level: 9,
        abilities: { ...valid.abilities, dex: 18 },
      });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: c.id, name: 'Elara, a Arquimaga', level: 9, proficiencyBonus: 4, armorClass: 14 });

      const again = await request(app).get(`/characters/${c.id}`);
      expect(again.body.name).toBe('Elara, a Arquimaga');
      expect((await request(app).get('/characters')).body).toHaveLength(1);
    });

    test('PUT em id inexistente retorna 404', async () => {
      expect((await request(app).put('/characters/42').send(valid)).status).toBe(404);
    });

    test('PUT com dados inválidos retorna 400 e não altera a ficha', async () => {
      const { body: c } = await request(app).post('/characters').send(valid);
      const res = await request(app).put(`/characters/${c.id}`).send({ ...valid, name: '' });
      expect(res.status).toBe(400);
      expect((await request(app).get(`/characters/${c.id}`)).body.name).toBe('Elara');
    });
  });

  test('várias fichas independentes: editar/apagar uma não afeta as outras', async () => {
    const a = (await request(app).post('/characters').send({ ...valid, name: 'A' })).body;
    const b = (await request(app).post('/characters').send({ ...valid, name: 'B' })).body;
    await request(app).put(`/characters/${a.id}`).send({ ...valid, name: 'A2' });
    await request(app).delete(`/characters/${b.id}`);
    const list = (await request(app).get('/characters')).body;
    expect(list.map((c) => c.name)).toEqual(['A2']);
  });

  test('persistência: dados sobrevivem a um "reinício" do servidor', async () => {
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dnd-int-')), 'c.json');
    const app1 = buildApp({ store: createStore(file) });
    await request(app1).post('/characters').send(valid);

    const app2 = buildApp({ store: createStore(file) }); // novo "processo"
    const res = await request(app2).get('/characters');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Elara');
  });
});
