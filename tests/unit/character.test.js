const {
  abilityModifier, proficiencyBonus, hitPoints,
  rollAbilityScore, rollAbilities, createCharacter,
} = require('../../src/character');

describe('abilityModifier', () => {
  test.each([[1, -5], [8, -1], [10, 0], [11, 0], [12, 1], [15, 2], [20, 5], [30, 10]])(
    'atributo %i => modificador %i', (score, mod) => expect(abilityModifier(score)).toBe(mod));

  test.each([0, 31, 10.5, 'a'])('rejeita valor inválido %p', (v) =>
    expect(() => abilityModifier(v)).toThrow(RangeError));
});

describe('proficiencyBonus', () => {
  test.each([[1, 2], [4, 2], [5, 3], [9, 4], [13, 5], [17, 6], [20, 6]])(
    'nível %i => +%i', (lvl, b) => expect(proficiencyBonus(lvl)).toBe(b));

  test.each([0, 21, 1.5])('rejeita nível inválido %p', (l) =>
    expect(() => proficiencyBonus(l)).toThrow(RangeError));
});

describe('hitPoints', () => {
  test('guerreiro nível 1 com CON 14 = 10 + 2', () => expect(hitPoints('fighter', 1, 14)).toBe(12));
  test('mago nível 3 com CON 10 = 6 + 4*2', () => expect(hitPoints('wizard', 3, 10)).toBe(14));
  test('bárbaro nível 5 com CON 16 = 15 + 4*10', () => expect(hitPoints('barbarian', 5, 16)).toBe(55));
  test('nunca fica abaixo de 1 PV por nível', () => expect(hitPoints('wizard', 2, 1)).toBe(2));
  test('classe inválida lança erro', () => expect(() => hitPoints('xyz', 1, 10)).toThrow('Classe inválida'));
});

describe('rolagem de atributos (rng determinístico)', () => {
  test('4d6 descartando o menor: [1,2,3,4] => 9', () => {
    const seq = [0, 1 / 6, 2 / 6, 3 / 6]; // dados 1,2,3,4
    let i = 0;
    expect(rollAbilityScore(() => seq[i++])).toBe(9);
  });

  test('máximo possível é 18 e mínimo é 3', () => {
    expect(rollAbilityScore(() => 0.999)).toBe(18);
    expect(rollAbilityScore(() => 0)).toBe(3);
  });

  test('rollAbilities retorna os 6 atributos entre 3 e 18', () => {
    const r = rollAbilities();
    expect(Object.keys(r)).toHaveLength(6);
    Object.values(r).forEach((v) => { expect(v).toBeGreaterThanOrEqual(3); expect(v).toBeLessThanOrEqual(18); });
  });
});

describe('createCharacter', () => {
  const base = {
    name: '  Thorin ', charClass: 'fighter', race: 'Anão', level: 5,
    abilities: { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 10 },
  };

  test('monta a ficha com valores derivados', () => {
    const c = createCharacter(base);
    expect(c.name).toBe('Thorin');
    expect(c.proficiencyBonus).toBe(3);
    expect(c.modifiers.str).toBe(3);
    expect(c.armorClass).toBe(11);
    expect(c.initiative).toBe(1);
    expect(c.hitPoints).toBe(12 + 8 * 4);
  });

  test('nível padrão é 1', () => expect(createCharacter({ ...base, level: undefined }).level).toBe(1));

  test.each([
    [{ name: '' }, 'Nome'],
    [{ charClass: 'x' }, 'Classe'],
    [{ race: ' ' }, 'Raça'],
    [{ abilities: undefined }, 'Atributos são'],
    [{ abilities: { str: 10 } }, 'Atributo ausente'],
  ])('rejeita dados inválidos %j', (patch, msg) =>
    expect(() => createCharacter({ ...base, ...patch })).toThrow(msg));
});
