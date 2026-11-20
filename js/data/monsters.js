// =====================================================================
//  MONSTRES. Les stats sont des multiplicateurs de balance.monsterBase,
//  ensuite multipliées par la puissance de l'étage (balance.floorMult).
//  behavior : melee (corps à corps) / ranged (à distance)
//  element : élément de ses attaques ; weak/resist : faiblesses/résistances.
//  family : sert au bestiaire et aux quêtes (« tuer 100 morts-vivants »).
// =====================================================================
(function () {
  const M = {};
  function def(id, o) { o.id = id; M[id] = Object.assign({ hp: 1, atk: 1, def: 1, spd: 100, behavior: 'melee', range: 1.1, element: 'physical', weak: [], resist: [], dodge: 0.02 }, o); }

  // ---- Crypte (étages 1-10) : morts-vivants, ombre ----
  def('skeleton', { name: 'Squelette', family: 'undead', weak: ['light', 'earth'], resist: ['shadow'],
    sprite: { tpl: 'skeleton', pal: { w: '#e8e2cf', e: '#c0392b' } } });
  def('zombie', { name: 'Goule', family: 'undead', hp: 1.5, atk: 1.1, spd: 80, weak: ['fire', 'light'], resist: ['shadow'],
    sprite: { tpl: 'zombie', pal: { s: '#7fa05a', e: '#ff4040', b: '#5a4a6a', c: '#3e3550' } } });
  def('bat', { name: 'Chauve-souris', family: 'beast', hp: 0.6, atk: 0.8, def: 0.5, spd: 140, dodge: 0.12, weak: ['lightning'],
    sprite: { tpl: 'bat', pal: { a: '#5b3f75', e: '#ffdd55' } } });
  def('ghost', { name: 'Spectre', family: 'undead', hp: 0.8, atk: 1.1, def: 0.5, behavior: 'ranged', range: 4, element: 'shadow', weak: ['light'], resist: ['physical', 'shadow'],
    projectile: 'orb', sprite: { tpl: 'ghost', pal: { a: '#b8c8e8', e: '#3a2a6a' } } });

  // ---- Forêt maudite (11-20) : bêtes, terre ----
  def('wolf', { name: 'Loup sombre', family: 'beast', hp: 0.9, atk: 1.1, spd: 125, weak: ['fire'],
    sprite: { tpl: 'wolf', pal: { a: '#6b6b78', b: '#3e3e48', e: '#ffdd55' } } });
  def('spider', { name: 'Araignée géante', family: 'beast', hp: 0.9, atk: 1.2, spd: 110, element: 'earth', weak: ['fire'], resist: ['earth'],
    sprite: { tpl: 'spider', pal: { a: '#3a3a30', e: '#ff3030' } } });
  def('slime_green', { name: 'Gelée acide', family: 'slime', hp: 1.3, atk: 0.9, def: 0.6, spd: 80, element: 'earth', weak: ['ice'], resist: ['physical'],
    sprite: { tpl: 'slime', pal: { a: '#5fc04a', b: '#3d8a30', w: '#c8f0b0', e: '#1a1020' } } });
  def('treant', { name: 'Sylvain corrompu', family: 'plant', hp: 2, atk: 1.2, def: 1.5, spd: 70, element: 'earth', weak: ['fire'], resist: ['earth', 'lightning'],
    sprite: { tpl: 'golem', pal: { a: '#6b4a2a', b: '#3f8f3a', e: '#ffdd55' } } });

  // ---- Cavernes (21-30) : foudre ----
  def('cave_bat', { name: 'Chiroptère', family: 'beast', hp: 0.6, atk: 0.9, def: 0.5, spd: 145, dodge: 0.12, element: 'lightning', weak: ['earth'],
    sprite: { tpl: 'bat', pal: { a: '#3f5a75', e: '#ffe14d' } } });
  def('goblin', { name: 'Gobelin mineur', family: 'humanoid', hp: 1, atk: 1.1, spd: 115, weak: ['light'],
    sprite: { tpl: 'imp', pal: { a: '#7aa04a', w: '#f0f0d0', e: '#ff3030' } } });
  def('spark_slime', { name: 'Gelée électrique', family: 'slime', hp: 1.2, atk: 1, def: 0.6, element: 'lightning', behavior: 'ranged', range: 3.5, projectile: 'spark', weak: ['earth'], resist: ['lightning'],
    sprite: { tpl: 'slime', pal: { a: '#e8d040', b: '#b09020', w: '#fff8c0', e: '#1a1020' } } });
  def('stone_golem', { name: 'Golem de pierre', family: 'construct', hp: 2.3, atk: 1.2, def: 2, spd: 65, element: 'earth', weak: ['lightning'], resist: ['physical', 'earth'],
    sprite: { tpl: 'golem', pal: { a: '#8a8a8a', b: '#5a5a62', e: '#5fd0ff' } } });

  // ---- Volcan (31-40) : feu ----
  def('fire_imp', { name: 'Diablotin', family: 'demon', hp: 0.8, atk: 1.1, spd: 125, element: 'fire', behavior: 'ranged', range: 4, projectile: 'fire', weak: ['ice'], resist: ['fire'],
    sprite: { tpl: 'imp', pal: { a: '#d04a2a', w: '#ffe080', e: '#ffe14d' } } });
  def('magma_slime', { name: 'Gelée de magma', family: 'slime', hp: 1.4, atk: 1.1, def: 0.8, spd: 80, element: 'fire', weak: ['ice'], resist: ['fire', 'physical'],
    sprite: { tpl: 'slime', pal: { a: '#e85a20', b: '#a03010', w: '#ffd080', e: '#1a1020' } } });
  def('hellhound', { name: 'Molosse infernal', family: 'beast', hp: 1, atk: 1.25, spd: 130, element: 'fire', weak: ['ice'], resist: ['fire'],
    sprite: { tpl: 'wolf', pal: { a: '#8a2a1a', b: '#4a1a10', e: '#ffcc00' } } });
  def('lava_golem', { name: 'Golem de lave', family: 'construct', hp: 2.4, atk: 1.3, def: 1.8, spd: 65, element: 'fire', weak: ['ice'], resist: ['fire', 'physical'],
    sprite: { tpl: 'golem', pal: { a: '#4a3030', b: '#ff6a20', e: '#ffe14d' } } });

  // ---- Glacier (41-50) : glace ----
  def('ice_wolf', { name: 'Loup des neiges', family: 'beast', hp: 1, atk: 1.15, spd: 130, element: 'ice', weak: ['fire'], resist: ['ice'],
    sprite: { tpl: 'wolf', pal: { a: '#d8e8f0', b: '#8aa8c0', e: '#3a7aff' } } });
  def('yeti', { name: 'Yéti', family: 'beast', hp: 2.2, atk: 1.35, def: 1.3, spd: 80, element: 'ice', weak: ['fire'], resist: ['ice'],
    sprite: { tpl: 'golem', pal: { a: '#f0f4f8', b: '#a8c0d8', e: '#3a7aff' } } });
  def('frost_ghost', { name: 'Âme gelée', family: 'undead', hp: 0.9, atk: 1.2, def: 0.5, behavior: 'ranged', range: 4, projectile: 'ice', element: 'ice', weak: ['fire', 'light'], resist: ['ice', 'physical'],
    sprite: { tpl: 'ghost', pal: { a: '#9fe0ff', e: '#1a3a6a' } } });
  def('ice_slime', { name: 'Gelée de givre', family: 'slime', hp: 1.3, atk: 1, def: 0.8, spd: 85, element: 'ice', weak: ['fire'], resist: ['ice', 'physical'],
    sprite: { tpl: 'slime', pal: { a: '#7fd8ff', b: '#3a90c0', w: '#f0ffff', e: '#1a1020' } } });

  // ---- Abysses (51-60) : ombre ----
  def('abyss_eye', { name: 'Œil abyssal', family: 'aberration', hp: 1, atk: 1.3, def: 0.7, behavior: 'ranged', range: 4.5, projectile: 'orb', element: 'shadow', weak: ['light'], resist: ['shadow'],
    sprite: { tpl: 'eye', pal: { w: '#d8c8f0', a: '#a020c0', e: '#1a0020' } } });
  def('void_spider', { name: 'Tisseuse du vide', family: 'aberration', hp: 1.1, atk: 1.3, spd: 120, element: 'shadow', weak: ['light'], resist: ['shadow'],
    sprite: { tpl: 'spider', pal: { a: '#2a1040', e: '#e040ff' } } });
  def('shadow_ghost', { name: 'Ombre rampante', family: 'undead', hp: 1, atk: 1.25, def: 0.6, spd: 110, element: 'shadow', weak: ['light'], resist: ['shadow', 'physical'],
    sprite: { tpl: 'ghost', pal: { a: '#3a2a5a', e: '#ff40a0' } } });
  def('demon', { name: 'Démon mineur', family: 'demon', hp: 1.6, atk: 1.4, def: 1.2, spd: 100, element: 'fire', weak: ['light', 'ice'], resist: ['fire', 'shadow'],
    sprite: { tpl: 'imp', pal: { a: '#6a1a3a', w: '#ffa0a0', e: '#ffe14d' } } });

  // ---- Sanctuaire céleste (61-70) : lumière ----
  def('seraph', { name: 'Séraphin déchu', family: 'celestial', hp: 1.1, atk: 1.3, def: 0.8, behavior: 'ranged', range: 4.5, projectile: 'holy', element: 'light', weak: ['shadow'], resist: ['light'],
    sprite: { tpl: 'ghost', pal: { a: '#fff3c0', e: '#c08020' } } });
  def('gold_golem', { name: 'Gardien doré', family: 'construct', hp: 2.5, atk: 1.3, def: 2.2, spd: 65, element: 'light', weak: ['shadow', 'lightning'], resist: ['light', 'physical'],
    sprite: { tpl: 'golem', pal: { a: '#e3b341', b: '#a07820', e: '#ffffff' } } });
  def('light_wisp', { name: 'Feu follet', family: 'celestial', hp: 0.7, atk: 1.1, def: 0.5, spd: 140, dodge: 0.15, element: 'light', weak: ['shadow'], resist: ['light'],
    sprite: { tpl: 'slime', pal: { a: '#fff8a0', b: '#e8c040', w: '#ffffff', e: '#c08020' } } });
  def('watcher_eye', { name: 'Œil vigilant', family: 'celestial', hp: 1.1, atk: 1.35, def: 0.8, behavior: 'ranged', range: 5, projectile: 'holy', element: 'light', weak: ['shadow'], resist: ['light'],
    sprite: { tpl: 'eye', pal: { w: '#fffbe8', a: '#e3b341', e: '#402000' } } });

  G.data.monsters = M;
})();
