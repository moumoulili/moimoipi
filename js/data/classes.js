// =====================================================================
//  CLASSES. base = stats au niveau 1, growth = gain par niveau.
//  attack : attaque de base (les compétences arrivent en phase 4).
//  sprite : modèle pixel art + palette de couleurs.
//  threat : plus c'est haut, plus les monstres ciblent ce héros.
// =====================================================================
G.data.roles = {
  adventurer: 'Polyvalent', tank: 'Tank', melee: 'Mêlée', ranged: 'Distance', healer: 'Soin', support: 'Soutien', control: 'Contrôle',
};
G.data.classes = {
  // Classe de départ de tous les héros : au niveau 20, elle choisit une vraie classe (et repasse niveau 1)
  adventurer: {
    name: 'Aventurier', role: 'adventurer', tier: -1, threat: 1.5, starter: true,
    desc: 'Débutant polyvalent : un peu de tout. Au niveau 20, il choisit sa voie.',
    base:   { hp: 115, mp: 40, str: 7, agi: 7, int: 7, def: 9, spd: 100, crit: 0.05 },
    growth: { hp: 11, mp: 3, str: 1.4, agi: 1.4, int: 1.4, def: 1.2, spd: 0.4, crit: 0 },
    attack: { type: 'melee', stat: 'str', range: 1.15, dmgType: 'phys', element: 'physical' },
    sprite: { tpl: 'warrior', pal: { m: '#8a6a3a', s: '#f1c59a', e: '#1a1020', a: '#7a8a4a', b: '#6a4a24', c: '#c9a070' } },
  },
  warrior: {
    name: 'Guerrier', role: 'tank', tier: 0, threat: 3,
    desc: 'Robuste, encaisse les coups en première ligne.',
    base:   { hp: 140, mp: 20, str: 10, agi: 4, int: 2, def: 12, spd: 95, crit: 0.05 },
    growth: { hp: 15, mp: 2, str: 2.2, agi: 0.6, int: 0.2, def: 1.8, spd: 0.3, crit: 0 },
    attack: { type: 'melee', stat: 'str', range: 1.15, dmgType: 'phys', element: 'physical' },
    sprite: { tpl: 'warrior', pal: { m: '#c9d1dc', s: '#f1c59a', e: '#1a1020', a: '#3d6fd1', b: '#8a5a2b', c: '#e3b341' } },
  },
  archer: {
    name: 'Archer', role: 'ranged', tier: 0, threat: 1,
    desc: 'Tire de loin avec précision.',
    base:   { hp: 90, mp: 25, str: 5, agi: 11, int: 3, def: 5, spd: 108, crit: 0.08 },
    growth: { hp: 9, mp: 2, str: 0.8, agi: 2.3, int: 0.3, def: 0.8, spd: 0.5, crit: 0 },
    attack: { type: 'ranged', stat: 'agi', range: 5, dmgType: 'phys', element: 'physical', projectile: 'arrow' },
    sprite: { tpl: 'archer', pal: { h: '#3f8f3a', s: '#f1c59a', e: '#1a1020', a: '#5aa64a', b: '#7a4a24', c: '#e8e0c8' } },
  },
  mage: {
    name: 'Mage', role: 'ranged', tier: 0, threat: 1,
    desc: 'Puissants sorts à distance, mais fragile.',
    base:   { hp: 75, mp: 60, str: 2, agi: 4, int: 13, def: 4, spd: 95, crit: 0.05 },
    growth: { hp: 7, mp: 6, str: 0.2, agi: 0.5, int: 2.6, def: 0.6, spd: 0.3, crit: 0 },
    attack: { type: 'ranged', stat: 'int', range: 4.5, dmgType: 'magic', element: 'physical', projectile: 'orb', mult: 1.25, interval: 1.25 },
    sprite: { tpl: 'mage', pal: { h: '#6a3fb5', s: '#f1c59a', e: '#1a1020', a: '#7d4fd1', c: '#7fd8ff', m: '#8a5a2b' } },
  },
  priest: {
    name: 'Prêtre', role: 'healer', tier: 0, threat: 1,
    desc: 'Soigne l\'équipe (compétence Soin majeur, offerte) et frappe avec la lumière.',
    base:   { hp: 85, mp: 70, str: 3, agi: 4, int: 10, def: 6, spd: 98, crit: 0.05 },
    growth: { hp: 8, mp: 7, str: 0.3, agi: 0.5, int: 2.1, def: 0.9, spd: 0.3, crit: 0 },
    attack: { type: 'ranged', stat: 'int', range: 4, dmgType: 'magic', element: 'light', projectile: 'holy', mult: 0.6 },
    sprite: { tpl: 'priest', pal: { h: '#e8d9a8', s: '#f1c59a', e: '#1a1020', a: '#f2f2f2', c: '#e3b341', m: '#a0743c' } },
  },
  rogue: {
    name: 'Voleur', role: 'melee', tier: 0, threat: 1.5,
    desc: 'Rapide, coups critiques fréquents.',
    base:   { hp: 95, mp: 30, str: 7, agi: 12, int: 3, def: 6, spd: 120, crit: 0.15 },
    growth: { hp: 10, mp: 2, str: 1.2, agi: 2.4, int: 0.3, def: 1, spd: 0.6, crit: 0.001 },
    attack: { type: 'melee', stat: 'agi', range: 1.1, dmgType: 'phys', element: 'physical', interval: 0.9 },
    sprite: { tpl: 'rogue', pal: { b: '#2e2a3a', w: '#ffd34d', s: '#f1c59a', a: '#4a4560', c: '#a4343a', m: '#c9d1dc' } },
  },
};
// Équipe de départ : 4 aventuriers
G.data.startingTeam = ['adventurer', 'adventurer', 'adventurer', 'adventurer'];
G.data.baseClasses = ['warrior', 'archer', 'mage', 'priest', 'rogue']; // choix proposés à l'aventurier
