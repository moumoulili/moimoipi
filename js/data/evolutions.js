// =====================================================================
//  ÉVOLUTIONS DE CLASSE
//  tier 1 = spécialité (niveau 40) : 2 choix par classe de base ;
//  tier 2 = classe ultime (renaissance au niveau 100) : 2 choix par spécialité,
//  le héros repasse niveau 1 avec un bonus de stats. Le héros garde sa classe de base
//  (équipement autorisé), gagne des bonus permanents, un nouveau rôle,
//  une nouvelle apparence et une nouvelle branche de compétences
//  (branche C pour le tier 1, D pour le tier 2 ; voir data/skills_adv.js).
//  attack : modifie l'attaque de base (ex. élément).
// =====================================================================
G.data.evolutions = {
  // ---------- Guerrier ----------
  paladin: { base: 'warrior', tier: 1, name: 'Paladin', icon: '🛡️', role: 'tank', attack: { element: 'light' },
    desc: 'Chevalier sacré : protège et soigne ses alliés, frappe avec la lumière.',
    bonus: { defPct: 0.1, hpPct: 0.1, healPower: 0.2 }, pal: { a: '#e8e8f0', c: '#e3b341', m: '#ffffff' } },
  berserker: { base: 'warrior', tier: 1, name: 'Berserker', icon: '🪓', role: 'melee',
    desc: 'Guerrier enragé : renonce à la défense pour des dégâts dévastateurs.',
    bonus: { dmgPct: 0.15, atkSpd: 0.1, lifesteal: 0.03 }, pal: { a: '#a4343a', b: '#4a2a1a', c: '#c9d1dc' } },
  templar: { base: 'warrior', from: 'paladin', tier: 2, name: 'Templier sacré', icon: '⚜️', role: 'tank', attack: { element: 'light' },
    desc: 'Rempart béni : sa foi devient une forteresse.', bonus: { defPct: 0.15, hpPct: 0.15, healPower: 0.2 }, pal: { a: '#ffffff', c: '#ffd34d', m: '#fff3a8', b: '#b8862a' } },
  warlord: { base: 'warrior', from: 'berserker', tier: 2, name: 'Seigneur de guerre', icon: '👑', role: 'melee',
    desc: 'Chef de guerre : son cri galvanise toute l\'équipe.', bonus: { dmgPct: 0.2, critDmg: 0.2, hpPct: 0.1 }, pal: { a: '#6a1a1a', b: '#2a0a0a', c: '#e3b341', m: '#ffd34d' } },
  crusader: { base: 'warrior', from: 'paladin', tier: 2, name: 'Croisé de l\'Aube', icon: '🌅', role: 'melee', attack: { element: 'light' },
    desc: 'L\'épée de la lumière : une offensive sacrée.', bonus: { dmgPct: 0.2, elAmp_light: 0.25, lifesteal: 0.03 }, pal: { a: '#fff3c0', c: '#ff9a2e', m: '#ffffff', b: '#c08020' } },
  titan: { base: 'warrior', from: 'berserker', tier: 2, name: 'Titan', icon: '🗿', role: 'tank',
    desc: 'Une montagne de muscles que rien n\'arrête.', bonus: { hpPct: 0.3, defPct: 0.15, thorns: 0.15 }, pal: { a: '#6a6a78', b: '#3a3a44', c: '#ff7a33', m: '#c9d1dc' } },
  // ---------- Archer ----------
  sharpshooter: { base: 'archer', tier: 1, name: 'Tireur d\'élite', icon: '🎯', role: 'ranged',
    desc: 'Précision mortelle : chaque flèche vise un point vital.', bonus: { crit: 0.05, critDmg: 0.25 }, pal: { h: '#3a4a6a', a: '#4a6a9a', b: '#3a2a1a' } },
  ranger: { base: 'archer', tier: 1, name: 'Rôdeur', icon: '🌿', role: 'support',
    desc: 'Enfant des bois : pièges, instinct et soutien de l\'équipe.', bonus: { atkSpd: 0.1, dodge: 0.05, goldFind: 0.1 }, pal: { h: '#6a4a24', a: '#7a8a3a' } },
  hawkeye: { base: 'archer', from: 'sharpshooter', tier: 2, name: 'Œil-de-faucon', icon: '🦅', role: 'ranged',
    desc: 'Rien n\'échappe à son regard.', bonus: { crit: 0.08, critDmg: 0.35 }, pal: { h: '#1a2a4a', a: '#2a4a8a', c: '#ffd34d' } },
  beastmaster: { base: 'archer', from: 'ranger', tier: 2, name: 'Maître des bêtes', icon: '🐺', role: 'support',
    desc: 'La meute répond à son appel.', bonus: { atkSpd: 0.12, hpPct: 0.12, dodge: 0.05 }, pal: { h: '#4a2a10', a: '#5a6a20', c: '#e3b341' } },
  arcane_archer: { base: 'archer', from: 'sharpshooter', tier: 2, name: 'Archer arcanique', icon: '🔮', role: 'ranged', attack: { element: 'lightning' },
    desc: 'Ses flèches chargées de magie traversent tout.', bonus: { crit: 0.05, dmgPct: 0.2, elAmp_lightning: 0.25 }, pal: { h: '#5a2a8a', a: '#7a4ab0', c: '#7fd8ff' } },
  warden: { base: 'archer', from: 'ranger', tier: 2, name: 'Sentinelle sylvestre', icon: '🌳', role: 'control', attack: { element: 'earth' },
    desc: 'Gardienne des forêts : pièges et entraves.', bonus: { atkSpd: 0.1, bossDmg: 0.2, hpPct: 0.1 }, pal: { h: '#2a4a1a', a: '#3a6a2a', c: '#c8ff7a' } },
  // ---------- Mage ----------
  pyromancer: { base: 'mage', tier: 1, name: 'Pyromancien', icon: '🔥', role: 'ranged', attack: { element: 'fire', projectile: 'fire' },
    desc: 'Maître des flammes : tout ce qu\'il touche brûle.', bonus: { elAmp_fire: 0.2, burnPct: 0.3 }, pal: { h: '#c0391b', a: '#e85a20', c: '#ffd34d' } },
  necromancer: { base: 'mage', tier: 1, name: 'Nécromancien', icon: '💀', role: 'control', attack: { element: 'shadow' },
    desc: 'Malédictions et drain de vie : affaiblit les ennemis.', bonus: { matkPct: 0.1, lifesteal: 0.03 }, pal: { h: '#1a1a24', a: '#2a2a3a', c: '#7aff8a' } },
  archmage: { base: 'mage', from: 'pyromancer', tier: 2, name: 'Archimage', icon: '🌋', role: 'ranged', attack: { element: 'fire', projectile: 'fire' },
    desc: 'Le feu primordial à sa disposition.', bonus: { elAmp_fire: 0.3, matkPct: 0.15, mpRegen: 0.2 }, pal: { h: '#ffd34d', a: '#e8e8f0', c: '#ff7a33' } },
  lich: { base: 'mage', from: 'necromancer', tier: 2, name: 'Liche', icon: '☠️', role: 'control', attack: { element: 'shadow' },
    desc: 'La mort elle-même lui obéit.', bonus: { matkPct: 0.2, lifesteal: 0.05, hpPct: 0.1 }, pal: { h: '#2a0a3a', a: '#3a1a4a', c: '#c06aff', s: '#9aa8b0' } },
  phoenix: { base: 'mage', from: 'pyromancer', tier: 2, name: 'Phénix', icon: '🐦‍🔥', role: 'ranged', attack: { element: 'fire', projectile: 'fire' },
    desc: 'Renaît de ses cendres : le feu qui guérit et qui consume.', bonus: { elAmp_fire: 0.25, hpPct: 0.15, onKillHeal: 0.05 }, pal: { h: '#ff7a33', a: '#ffd34d', c: '#ff3b3b' } },
  shadowlord: { base: 'mage', from: 'necromancer', tier: 2, name: 'Prince des ombres', icon: '🌑', role: 'control', attack: { element: 'shadow' },
    desc: 'L\'obscurité dévore ses ennemis.', bonus: { matkPct: 0.2, elAmp_shadow: 0.3 }, pal: { h: '#0a0a14', a: '#1a1028', c: '#ff3bd0' } },
  // ---------- Prêtre ----------
  cleric: { base: 'priest', tier: 1, name: 'Clerc', icon: '💖', role: 'healer',
    desc: 'Guérisseur dévoué : des soins puissants et économes.', bonus: { healPower: 0.25, mpRegen: 0.2 }, pal: { h: '#e8f0ff', a: '#ffffff', c: '#7fd8ff' } },
  inquisitor: { base: 'priest', tier: 1, name: 'Inquisiteur', icon: '⚖️', role: 'support', attack: { mult: 1 },
    desc: 'Bras armé de la foi : la lumière comme arme.', bonus: { matkPct: 0.15, elAmp_light: 0.15 }, pal: { h: '#6a1a1a', a: '#e8e0d0', c: '#c0391b' } },
  saint: { base: 'priest', from: 'cleric', tier: 2, name: 'Saint', icon: '😇', role: 'healer',
    desc: 'Sa présence seule guérit.', bonus: { healPower: 0.35, mpRegen: 0.3, hpPct: 0.1 }, pal: { h: '#fff3a8', a: '#fffbe8', c: '#ffd34d' } },
  grand_inquisitor: { base: 'priest', from: 'inquisitor', tier: 2, name: 'Grand Inquisiteur', icon: '🔱', role: 'support', attack: { mult: 1.2 },
    desc: 'Le jugement divin s\'abat sur les impies.', bonus: { matkPct: 0.25, elAmp_light: 0.2 }, pal: { h: '#3a0a0a', a: '#a4343a', c: '#ffd34d' } },
  oracle: { base: 'priest', from: 'cleric', tier: 2, name: 'Oracle', icon: '🔮', role: 'support',
    desc: 'Voit l\'avenir : protège l\'équipe avant le coup.', bonus: { healPower: 0.2, mpRegen: 0.4, defPct: 0.15 }, pal: { h: '#3a6aa0', a: '#e8f0ff', c: '#b45cff' } },
  exalted: { base: 'priest', from: 'inquisitor', tier: 2, name: 'Exalté', icon: '🌟', role: 'support', attack: { mult: 1.3 },
    desc: 'Incarnation de la lumière vengeresse.', bonus: { matkPct: 0.2, crit: 0.06, elAmp_light: 0.25 }, pal: { h: '#ffd34d', a: '#fff8e0', c: '#ff9a2e' } },
  // ---------- Voleur ----------
  assassin: { base: 'rogue', tier: 1, name: 'Assassin', icon: '🗡️', role: 'melee',
    desc: 'Tueur silencieux : critiques dévastateurs.', bonus: { crit: 0.08, critDmg: 0.2 }, pal: { b: '#1a1a24', a: '#2a2a3a', c: '#c0391b' } },
  saboteur: { base: 'rogue', tier: 1, name: 'Saboteur', icon: '💣', role: 'control', attack: { element: 'earth' },
    desc: 'Bombes et fumigènes : contrôle le champ de bataille.', bonus: { dodge: 0.05, atkSpd: 0.05, dmgPct: 0.05 }, pal: { b: '#5a4a2a', a: '#6a5a3a', c: '#e3b341' } },
  reaper: { base: 'rogue', from: 'assassin', tier: 2, name: 'Faucheur', icon: '⚰️', role: 'melee',
    desc: 'Une ombre, puis plus rien.', bonus: { crit: 0.1, critDmg: 0.3, atkSpd: 0.08 }, pal: { b: '#0a0a10', a: '#1a1a20', c: '#a46bff' } },
  master_saboteur: { base: 'rogue', from: 'saboteur', tier: 2, name: 'Maître saboteur', icon: '🧨', role: 'control', attack: { element: 'fire' },
    desc: 'Rien ne résiste à ses explosifs.', bonus: { dmgPct: 0.15, dodge: 0.06, atkSpd: 0.08 }, pal: { b: '#3a2a1a', a: '#4a3a2a', c: '#ff7a33' } },
  phantom: { base: 'rogue', from: 'assassin', tier: 2, name: 'Lame fantôme', icon: '👻', role: 'melee', attack: { element: 'shadow' },
    desc: 'Insaisissable : frappe depuis l\'ombre et disparaît.', bonus: { dodge: 0.1, crit: 0.06, atkSpd: 0.1 }, pal: { b: '#3a3a5a', a: '#5a5a7a', c: '#bfefff' } },
  alchemist: { base: 'rogue', from: 'saboteur', tier: 2, name: 'Alchimiste', icon: '⚗️', role: 'support', attack: { element: 'earth' },
    desc: 'Poisons et élixirs : affaiblit les ennemis, soutient l\'équipe.', bonus: { healPower: 0.2, dmgPct: 0.1, hpPct: 0.1 }, pal: { b: '#2a5a3a', a: '#3a7a4a', c: '#c8ff7a' } },
};
