// Regras de D&D 5e (versão simplificada) — lógica pura, sem dependências externas.

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

const HIT_DICE = {
  barbarian: 12, bard: 8, cleric: 8, druid: 8, fighter: 10, monk: 8,
  paladin: 10, ranger: 10, rogue: 8, sorcerer: 6, warlock: 8, wizard: 6,
};

/** Modificador de atributo: floor((valor - 10) / 2) */
function abilityModifier(score) {
  if (!Number.isInteger(score) || score < 1 || score > 30) {
    throw new RangeError('Atributo deve ser um inteiro entre 1 e 30');
  }
  return Math.floor((score - 10) / 2);
}

/** Bônus de proficiência por nível (1-20) */
function proficiencyBonus(level) {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new RangeError('Nível deve ser um inteiro entre 1 e 20');
  }
  return Math.ceil(level / 4) + 1;
}

/** Pontos de vida: nível 1 = dado de vida cheio; demais = média do dado (+1). Sempre + CON. */
function hitPoints(charClass, level, conScore) {
  const die = HIT_DICE[charClass];
  if (!die) throw new Error(`Classe inválida: ${charClass}`);
  proficiencyBonus(level); // valida o nível
  const conMod = abilityModifier(conScore);
  const first = Math.max(1, die + conMod);
  const perLevel = Math.max(1, Math.floor(die / 2) + 1 + conMod);
  return first + perLevel * (level - 1);
}

/** Rola 4d6 descartando o menor dado. `rng` é injetável para permitir testes determinísticos. */
function rollAbilityScore(rng = Math.random) {
  const dice = Array.from({ length: 4 }, () => Math.floor(rng() * 6) + 1);
  dice.sort((a, b) => a - b);
  return dice.slice(1).reduce((sum, d) => sum + d, 0);
}

function rollAbilities(rng = Math.random) {
  return Object.fromEntries(ABILITIES.map((a) => [a, rollAbilityScore(rng)]));
}

/** Valida os dados e monta a ficha completa com valores derivados. */
function createCharacter({ name, charClass, race, level = 1, abilities }) {
  if (typeof name !== 'string' || !name.trim()) throw new Error('Nome é obrigatório');
  if (!HIT_DICE[charClass]) throw new Error(`Classe inválida: ${charClass}`);
  if (typeof race !== 'string' || !race.trim()) throw new Error('Raça é obrigatória');
  if (!abilities) throw new Error('Atributos são obrigatórios');
  for (const a of ABILITIES) {
    if (abilities[a] === undefined) throw new Error(`Atributo ausente: ${a}`);
  }

  const modifiers = Object.fromEntries(ABILITIES.map((a) => [a, abilityModifier(abilities[a])]));

  return {
    name: name.trim(),
    charClass,
    race: race.trim(),
    level,
    abilities: { ...abilities },
    modifiers,
    proficiencyBonus: proficiencyBonus(level),
    hitPoints: hitPoints(charClass, level, abilities.con),
    armorClass: 10 + modifiers.dex,
    initiative: modifiers.dex,
  };
}

module.exports = {
  ABILITIES, HIT_DICE, abilityModifier, proficiencyBonus,
  hitPoints, rollAbilityScore, rollAbilities, createCharacter,
};
