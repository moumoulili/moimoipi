// =====================================================================
//  BOSS ET MINI-BOSS : un de chaque par biome, avec leurs mécaniques.
//  monster : monstre de base (stats, élément, faiblesses)
//  sprite : apparence (modèle + palette), scale : taille
//  mods : multiplicateurs en plus de balance.guardian
//  mechs : mécaniques (voir systems/bosses.js)
//    summon     : invoque des renforts toutes les `every` s
//    aoe        : zones de danger sous `targets` héros (préavis `warn` s)
//    slam       : onde de choc autour du boss
//    charge     : fonce sur le héros le plus éloigné
//    barrage    : tire un projectile sur chaque héros
//    shield     : sous `below` % de PV, bouclier de `value` x PV max (une fois)
//    phaseSummon: invoque des renforts à chaque seuil de PV `at`
//    enrage     : sous `below` % de PV (ou après `after` s) : plus de dégâts/vitesse
//    regen      : régénère `pct` des PV max par seconde
// =====================================================================
G.data.bosses = {
  // ---- Crypte ----
  crypt_mini: { name: 'Capitaine squelette', monster: 'skeleton', scale: 1.5,
    sprite: { tpl: 'skeleton', pal: { w: '#f4ecd8', e: '#ff3b3b' } },
    mechs: [{ type: 'summon', every: 11, count: 2, monster: 'skeleton' }, { type: 'enrage', below: 0.3, dmg: 0.4, spd: 0.25 }] },
  crypt_boss: { name: 'Roi-liche', monster: 'ghost', scale: 1.9,
    sprite: { tpl: 'ghost', pal: { a: '#8a5ad0', e: '#ffe14d' } },
    mechs: [{ type: 'aoe', every: 7, targets: 2, radius: 1.4, warn: 1.3, mult: 1.6, element: 'shadow' },
      { type: 'phaseSummon', at: [0.66, 0.33], count: 3, monster: 'skeleton' }, { type: 'barrage', every: 11, mult: 0.7, element: 'shadow', proj: 'orb' }] },
  // ---- Forêt ----
  forest_mini: { name: 'Alpha des ombres', monster: 'wolf', scale: 1.5,
    sprite: { tpl: 'wolf', pal: { a: '#2e2e38', b: '#15151c', e: '#ff3030' } },
    mechs: [{ type: 'charge', every: 8, mult: 1.5, stun: 1 }, { type: 'phaseSummon', at: [0.5], count: 2, monster: 'wolf' }] },
  forest_boss: { name: 'Cœur-de-ronce', monster: 'treant', scale: 2,
    sprite: { tpl: 'golem', pal: { a: '#4a3018', b: '#2a6a24', e: '#ff5ad0' } },
    mechs: [{ type: 'aoe', every: 8, targets: 3, radius: 1.3, warn: 1.4, mult: 1.3, element: 'earth', status: { id: 'stun', dur: 1.2 } },
      { type: 'regen', pct: 0.006 }, { type: 'summon', every: 14, count: 2, monster: 'slime_green' }] },
  // ---- Cavernes ----
  caves_mini: { name: 'Chef gobelin', monster: 'goblin', scale: 1.5,
    sprite: { tpl: 'imp', pal: { a: '#5a8a2a', w: '#ffe080', e: '#ff3030' } },
    mechs: [{ type: 'summon', every: 10, count: 2, monster: 'goblin' }, { type: 'enrage', below: 0.35, dmg: 0.5, spd: 0.3 }] },
  caves_boss: { name: 'Colosse tonnerre', monster: 'stone_golem', scale: 2,
    sprite: { tpl: 'golem', pal: { a: '#6a6a78', b: '#ffe14d', e: '#7fd8ff' } },
    mechs: [{ type: 'shield', below: 0.5, value: 0.25 }, { type: 'barrage', every: 8, mult: 0.8, element: 'lightning', proj: 'spark' },
      { type: 'slam', every: 11, radius: 2.4, warn: 1.2, mult: 1.4, element: 'lightning', status: { id: 'stun', dur: 0.8 } }] },
  // ---- Volcan ----
  volcano_mini: { name: 'Cerbère', monster: 'hellhound', scale: 1.6,
    sprite: { tpl: 'wolf', pal: { a: '#5a1a10', b: '#2a0a06', e: '#ffe14d' } },
    mechs: [{ type: 'charge', every: 7, mult: 1.4, stun: 0.8 }, { type: 'slam', every: 10, radius: 2, warn: 1.1, mult: 1.2, element: 'fire', status: { id: 'burn', dur: 3 } }] },
  volcano_boss: { name: 'Seigneur du magma', monster: 'lava_golem', scale: 2.1,
    sprite: { tpl: 'golem', pal: { a: '#2a1a1a', b: '#ff7a20', e: '#ffff80' } },
    mechs: [{ type: 'aoe', every: 6, targets: 4, radius: 1.3, warn: 1.3, mult: 1.3, element: 'fire', status: { id: 'burn', dur: 3 } },
      { type: 'summon', every: 15, count: 2, monster: 'magma_slime' }, { type: 'enrage', below: 0.3, dmg: 0.6, spd: 0.3 }] },
  // ---- Glacier ----
  ice_mini: { name: 'Croc-de-givre', monster: 'ice_wolf', scale: 1.6,
    sprite: { tpl: 'wolf', pal: { a: '#ffffff', b: '#6a9ac0', e: '#1a4aff' } },
    mechs: [{ type: 'charge', every: 8, mult: 1.4, stun: 1 }, { type: 'slam', every: 11, radius: 2, warn: 1.2, mult: 1.1, element: 'ice', status: { id: 'freeze', dur: 1.2 } }] },
  ice_boss: { name: 'Roi yéti', monster: 'yeti', scale: 2.1,
    sprite: { tpl: 'golem', pal: { a: '#e8f0ff', b: '#7fd8ff', e: '#ff3030' } },
    mechs: [{ type: 'slam', every: 9, radius: 2.6, warn: 1.3, mult: 1.5, element: 'ice', status: { id: 'slow', dur: 3, value: 0.5 } },
      { type: 'barrage', every: 10, mult: 0.8, element: 'ice', proj: 'ice' }, { type: 'enrage', after: 90, dmg: 0.6, spd: 0.4 }] },
  // ---- Abysses ----
  abyss_mini: { name: 'Bourreau abyssal', monster: 'demon', scale: 1.6,
    sprite: { tpl: 'imp', pal: { a: '#3a0a2a', w: '#ff80c0', e: '#ffe14d' } },
    mechs: [{ type: 'charge', every: 7, mult: 1.6, stun: 1 }, { type: 'enrage', below: 0.4, dmg: 0.5, spd: 0.3 }] },
  abyss_boss: { name: 'Œil du néant', monster: 'abyss_eye', scale: 2.2,
    sprite: { tpl: 'eye', pal: { w: '#3a1a5a', a: '#ff3bd0', e: '#000000' } },
    mechs: [{ type: 'barrage', every: 6, mult: 0.8, element: 'shadow', proj: 'orb' }, { type: 'phaseSummon', at: [0.75, 0.5, 0.25], count: 2, monster: 'abyss_eye' },
      { type: 'shield', below: 0.4, value: 0.3 }] },
  // ---- Sanctuaire céleste ----
  celestial_mini: { name: 'Sentinelle dorée', monster: 'gold_golem', scale: 1.6,
    sprite: { tpl: 'golem', pal: { a: '#ffe080', b: '#c08020', e: '#ffffff' } },
    mechs: [{ type: 'shield', below: 0.5, value: 0.3 }, { type: 'slam', every: 10, radius: 2.2, warn: 1.2, mult: 1.3, element: 'light' }] },
  celestial_boss: { name: 'Archange déchu', monster: 'seraph', scale: 2.1,
    sprite: { tpl: 'ghost', pal: { a: '#fff8e0', e: '#ff3030' } },
    mechs: [{ type: 'aoe', every: 6, targets: 3, radius: 1.5, warn: 1.3, mult: 1.5, element: 'light' }, { type: 'regen', pct: 0.005 },
      { type: 'barrage', every: 9, mult: 0.9, element: 'light', proj: 'holy' }, { type: 'enrage', below: 0.25, dmg: 0.6, spd: 0.3 }] },
};
