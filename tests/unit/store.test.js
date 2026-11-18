const fs = require('fs');
const os = require('os');
const path = require('path');
const { createStore } = require('../../src/store');

describe('store em memória', () => {
  test('create atribui ids incrementais', () => {
    const s = createStore();
    expect(s.create({ name: 'a' }).id).toBe(1);
    expect(s.create({ name: 'b' }).id).toBe(2);
    expect(s.list()).toHaveLength(2);
  });

  test('get retorna a ficha ou undefined', () => {
    const s = createStore();
    const c = s.create({ name: 'a' });
    expect(s.get(c.id)).toEqual(c);
    expect(s.get(99)).toBeUndefined();
  });

  test('update substitui os dados mantendo o id', () => {
    const s = createStore();
    const c = s.create({ name: 'a' });
    expect(s.update(c.id, { name: 'b' })).toEqual({ id: c.id, name: 'b' });
    expect(s.get(c.id).name).toBe('b');
  });

  test('update de id inexistente retorna undefined', () => {
    expect(createStore().update(5, { name: 'x' })).toBeUndefined();
  });

  test('remove apaga e informa se existia', () => {
    const s = createStore();
    const c = s.create({ name: 'a' });
    expect(s.remove(c.id)).toBe(true);
    expect(s.remove(c.id)).toBe(false);
    expect(s.list()).toEqual([]);
  });

  test('ids não são reaproveitados após remover', () => {
    const s = createStore();
    const a = s.create({});
    s.remove(a.id);
    expect(s.create({}).id).toBe(2);
  });
});

describe('store com persistência em arquivo', () => {
  let file;
  beforeEach(() => { file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dnd-')), 'sub', 'c.json'); });

  test('grava em disco e recarrega em uma nova instância', () => {
    const s1 = createStore(file);
    const a = s1.create({ name: 'a' });
    s1.create({ name: 'b' });
    s1.update(a.id, { name: 'a2' });

    const s2 = createStore(file);
    expect(s2.list().map((c) => c.name)).toEqual(['a2', 'b']);
    expect(s2.create({ name: 'c' }).id).toBe(3);
  });

  test('remoção também é persistida', () => {
    const s1 = createStore(file);
    const a = s1.create({ name: 'a' });
    s1.remove(a.id);
    expect(createStore(file).list()).toEqual([]);
  });
});
