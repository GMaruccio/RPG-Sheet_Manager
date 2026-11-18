// Armazenamento de fichas. Com `filePath` persiste em JSON; sem ele, fica só em memória (usado nos testes).
const fs = require('fs');
const path = require('path');

function createStore(filePath) {
  const items = new Map();
  let nextId = 1;

  if (filePath && fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    data.forEach((c) => items.set(c.id, c));
    nextId = Math.max(0, ...data.map((c) => c.id)) + 1;
  }

  function save() {
    if (!filePath) return;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify([...items.values()], null, 2));
  }

  return {
    list: () => [...items.values()],
    get: (id) => items.get(id),
    create(data) {
      const character = { id: nextId++, ...data };
      items.set(character.id, character);
      save();
      return character;
    },
    update(id, data) {
      if (!items.has(id)) return undefined;
      const character = { id, ...data };
      items.set(id, character);
      save();
      return character;
    },
    remove(id) {
      const ok = items.delete(id);
      if (ok) save();
      return ok;
    },
  };
}

module.exports = { createStore };
