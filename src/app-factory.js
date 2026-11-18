const express = require('express');
const path = require('path');
const { createCharacter, rollAbilities, HIT_DICE } = require('./character');
const { createStore } = require('./store');

function buildApp({ store = createStore() } = {}) {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/classes', (_req, res) => res.json(Object.keys(HIT_DICE)));
  app.get('/roll', (_req, res) => res.json(rollAbilities()));

  // CREATE
  app.post('/characters', (req, res) => {
    try {
      res.status(201).json(store.create(createCharacter(req.body || {})));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // READ (todas)
  app.get('/characters', (_req, res) => res.json(store.list()));

  // READ (uma)
  app.get('/characters/:id', (req, res) => {
    const c = store.get(Number(req.params.id));
    if (!c) return res.status(404).json({ error: 'Ficha não encontrada' });
    res.json(c);
  });

  // UPDATE (substitui a ficha inteira; valores derivados são recalculados)
  app.put('/characters/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!store.get(id)) return res.status(404).json({ error: 'Ficha não encontrada' });
    try {
      res.json(store.update(id, createCharacter(req.body || {})));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  // DELETE
  app.delete('/characters/:id', (req, res) => {
    if (!store.remove(Number(req.params.id))) return res.status(404).json({ error: 'Ficha não encontrada' });
    res.status(204).end();
  });

  return app;
}

module.exports = { buildApp };