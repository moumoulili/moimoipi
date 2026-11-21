// =====================================================================
//  COMPÉTENCES ET ARBRES DE COMPÉTENCES
//  Chaque classe a 2 branches (A, B) de 4 rangées. Une rangée r demande
//  r x 3 points dans la branche et le nœud de la rangée précédente.
//  Les classes avancées (phase 6) ajouteront de nouvelles branches.
//
//  type 'passive' : passive(rang) = stats ajoutées au héros
//  type 'active'  : lancée automatiquement selon une règle (rule) :
//    kind : damage | heal | buff | shield | taunt | revive
//    mult(rang) : multiplicateur de l'attaque (ou de la puissance magique)
//    target : 'target' (cible actuelle) | 'weakest' | 'self' | 'allyLow' | 'team' | 'dead'
//    aoe : rayon autour de la cible ; aoeSelf : rayon autour du lanceur
//    chain : nombre de rebonds ; waves : nombre de vagues ; delay : temps avant impact
//    status : effet appliqué (voir data/effects.js)
//    rule : règle par défaut { mode, value } (modifiable par le joueur)
// =====================================================================
(function () {
  const P = (v) => Math.round(v * 100) + ' %';
  const S = {};
  function sk(id, o) { o.id = id; S[id] = o; }

  // ---------------------------- GUERRIER ----------------------------
  sk('w_iron', { cls: 'warrior', branch: 'A', row: 0, maxRank: 5, type: 'passive', name: 'Peau de fer', icon: '🛡️',
    passive: (r) => ({ defPct: 0.06 * r }), desc: (r) => '+' + P(0.06 * r) + ' de défense' });
  sk('w_taunt', { cls: 'warrior', branch: 'A', row: 1, maxRank: 3, type: 'active', name: 'Provocation', icon: '📢',
    kind: 'taunt', cd: 12, mp: 10, aoeSelf: 4, dur: 4, buff: (r) => ({ defPct: 0.2 + 0.1 * r }), rule: { mode: 'enemies', value: 2 },
    desc: (r) => 'Les ennemis proches attaquent le guerrier pendant 4 s ; +' + P(0.2 + 0.1 * r) + ' de défense' });
  sk('w_bastion', { cls: 'warrior', branch: 'A', row: 2, maxRank: 5, type: 'passive', name: 'Bastion', icon: '🏰',
    passive: (r) => ({ hpPct: 0.05 * r }), desc: (r) => '+' + P(0.05 * r) + ' de PV' });
  sk('w_wall', { cls: 'warrior', branch: 'A', row: 3, maxRank: 3, type: 'active', ult: true, name: 'Mur inébranlable', icon: '🧱',
    kind: 'buff', target: 'team', cd: 50, mp: 30, dur: 6, buff: (r) => ({ dmgTaken: -(0.35 + 0.05 * r) }), rule: { mode: 'boss' },
    desc: (r) => 'Ultime : l\'équipe subit ' + P(0.35 + 0.05 * r) + ' de dégâts en moins pendant 6 s' });
  sk('w_bash', { cls: 'warrior', branch: 'B', row: 0, maxRank: 5, type: 'active', name: 'Coup puissant', icon: '🔨',
    kind: 'damage', cd: 8, mp: 8, target: 'target', range: 1.3, dmgType: 'phys', element: 'physical', mult: (r) => 1.4 + 0.12 * r,
    status: { id: 'stun', chance: 0.25, dur: 1 }, vfx: 'smash', rule: { mode: 'always' },
    desc: (r) => P(1.4 + 0.12 * r) + ' de dégâts, 25 % de chance d\'étourdir 1 s' });
  sk('w_mastery', { cls: 'warrior', branch: 'B', row: 1, maxRank: 5, type: 'passive', name: 'Maîtrise des armes', icon: '⚔️',
    passive: (r) => ({ dmgPct: 0.04 * r }), desc: (r) => '+' + P(0.04 * r) + ' de dégâts' });
  sk('w_whirl', { cls: 'warrior', branch: 'B', row: 2, maxRank: 3, type: 'active', name: 'Tourbillon', icon: '🌀',
    kind: 'damage', cd: 12, mp: 15, target: 'self', aoeSelf: 1.9, dmgType: 'phys', element: 'physical', mult: (r) => 0.8 + 0.1 * r,
    vfx: 'whirl', rule: { mode: 'enemies', value: 2 }, desc: (r) => P(0.8 + 0.1 * r) + ' de dégâts à tous les ennemis autour' });
  sk('w_blood', { cls: 'warrior', branch: 'B', row: 3, maxRank: 3, type: 'passive', name: 'Soif de sang', icon: '🩸',
    passive: (r) => ({ lifesteal: 0.03 * r }), desc: (r) => 'Vol de vie +' + P(0.03 * r) });

  // ---------------------------- ARCHER ----------------------------
  sk('a_aim', { cls: 'archer', branch: 'A', row: 0, maxRank: 5, type: 'passive', name: 'Œil vif', icon: '👁️',
    passive: (r) => ({ crit: 0.025 * r }), desc: (r) => '+' + P(0.025 * r) + ' de critique' });
  sk('a_snipe', { cls: 'archer', branch: 'A', row: 1, maxRank: 5, type: 'active', name: 'Tir perçant', icon: '🎯',
    kind: 'damage', cd: 9, mp: 10, target: 'weakest', range: 6.5, dmgType: 'phys', element: 'physical', mult: (r) => 1.7 + 0.15 * r,
    proj: 'arrow', rule: { mode: 'always' }, desc: (r) => P(1.7 + 0.15 * r) + ' de dégâts sur l\'ennemi le plus faible' });
  sk('a_eagle', { cls: 'archer', branch: 'A', row: 2, maxRank: 5, type: 'passive', name: 'Œil d\'aigle', icon: '🦅',
    passive: (r) => ({ critDmg: 0.1 * r }), desc: (r) => '+' + P(0.1 * r) + ' de dégâts critiques' });
  sk('a_rain', { cls: 'archer', branch: 'A', row: 3, maxRank: 3, type: 'active', ult: true, name: 'Pluie de flèches', icon: '🌧️',
    kind: 'damage', cd: 50, mp: 30, target: 'target', range: 6, aoe: 2.2, waves: 5, dmgType: 'phys', element: 'physical', mult: (r) => 0.35 + 0.07 * r,
    vfx: 'rain', rule: { mode: 'enemies', value: 3 }, desc: (r) => 'Ultime : 5 vagues de ' + P(0.35 + 0.07 * r) + ' sur une large zone' });
  sk('a_quick', { cls: 'archer', branch: 'B', row: 0, maxRank: 5, type: 'passive', name: 'Main rapide', icon: '💨',
    passive: (r) => ({ atkSpd: 0.04 * r }), desc: (r) => '+' + P(0.04 * r) + ' de vitesse d\'attaque' });
  sk('a_multi', { cls: 'archer', branch: 'B', row: 1, maxRank: 5, type: 'active', name: 'Tir multiple', icon: '🏹',
    kind: 'damage', cd: 10, mp: 12, target: 'multi', count: (r) => (r >= 4 ? 4 : 3), range: 6, dmgType: 'phys', element: 'physical', mult: (r) => 0.65 + 0.08 * r,
    proj: 'arrow', rule: { mode: 'enemies', value: 2 }, desc: (r) => (r >= 4 ? 4 : 3) + ' flèches sur des cibles différentes, ' + P(0.65 + 0.08 * r) + ' chacune' });
  sk('a_frost', { cls: 'archer', branch: 'B', row: 2, maxRank: 3, type: 'active', name: 'Flèche de givre', icon: '❄️',
    kind: 'damage', cd: 12, mp: 12, target: 'target', range: 6, dmgType: 'phys', element: 'ice', mult: (r) => 1.1 + 0.15 * r,
    proj: 'ice', status: { id: 'slow', chance: 1, dur: 3, value: 0.4 }, rule: { mode: 'always' }, desc: (r) => P(1.1 + 0.15 * r) + ' de dégâts de glace, ralentit de 40 % pendant 3 s' });
  sk('a_hunter', { cls: 'archer', branch: 'B', row: 3, maxRank: 3, type: 'passive', name: 'Instinct du chasseur', icon: '🐺',
    passive: (r) => ({ bossDmg: 0.12 * r }), desc: (r) => '+' + P(0.12 * r) + ' de dégâts contre élites et gardiens' });

  // ---------------------------- MAGE ----------------------------
  sk('m_fireball', { cls: 'mage', branch: 'A', row: 0, maxRank: 5, type: 'active', name: 'Boule de feu', icon: '🔥',
    kind: 'damage', cd: 7, mp: 12, target: 'target', range: 5, aoe: 1.1, dmgType: 'magic', element: 'fire', mult: (r) => 1.2 + 0.12 * r,
    proj: 'fire', status: { id: 'burn', chance: 0.5, dur: 3 }, rule: { mode: 'always' }, desc: (r) => P(1.2 + 0.12 * r) + ' de dégâts de feu en zone, peut brûler' });
  sk('m_pyro', { cls: 'mage', branch: 'A', row: 1, maxRank: 5, type: 'passive', name: 'Pyromanie', icon: '♨️',
    passive: (r) => ({ elAmp_fire: 0.07 * r }), desc: (r) => '+' + P(0.07 * r) + ' de dégâts de feu' });
  sk('m_ignite', { cls: 'mage', branch: 'A', row: 2, maxRank: 3, type: 'passive', name: 'Brasier', icon: '🕯️',
    passive: (r) => ({ burnPct: 0.3 * r }), desc: (r) => 'Brûlures +' + P(0.3 * r) + ' plus fortes' });
  sk('m_meteor', { cls: 'mage', branch: 'A', row: 3, maxRank: 3, type: 'active', ult: true, name: 'Météore', icon: '☄️',
    kind: 'damage', cd: 60, mp: 40, target: 'target', range: 6, aoe: 2, delay: 1, dmgType: 'magic', element: 'fire', mult: (r) => 2.2 + 0.4 * r,
    vfx: 'meteor', status: { id: 'burn', chance: 1, dur: 4 }, rule: { mode: 'boss' }, desc: (r) => 'Ultime : ' + P(2.2 + 0.4 * r) + ' de dégâts de feu dans une grande zone' });
  sk('m_mind', { cls: 'mage', branch: 'B', row: 0, maxRank: 5, type: 'passive', name: 'Esprit vif', icon: '🧠',
    passive: (r) => ({ matkPct: 0.03 * r }), desc: (r) => '+' + P(0.03 * r) + ' de puissance magique' });
  sk('m_chain', { cls: 'mage', branch: 'B', row: 1, maxRank: 5, type: 'active', name: 'Chaîne d\'éclairs', icon: '⚡',
    kind: 'damage', cd: 9, mp: 15, target: 'target', range: 5, chain: (r) => 2 + Math.floor(r / 2), dmgType: 'magic', element: 'lightning', mult: (r) => 0.95 + 0.1 * r,
    vfx: 'chain', rule: { mode: 'enemies', value: 2 }, desc: (r) => P(0.95 + 0.1 * r) + ' de foudre, rebondit sur ' + (2 + Math.floor(r / 2)) + ' ennemis' });
  sk('m_blizzard', { cls: 'mage', branch: 'B', row: 2, maxRank: 3, type: 'active', name: 'Blizzard', icon: '🌨️',
    kind: 'damage', cd: 20, mp: 25, target: 'target', range: 5, aoe: 2, waves: 4, dmgType: 'magic', element: 'ice', mult: (r) => 0.35 + 0.08 * r,
    vfx: 'blizzard', status: { id: 'slow', chance: 1, dur: 2, value: 0.35 }, rule: { mode: 'enemies', value: 3 }, desc: (r) => '4 vagues de ' + P(0.35 + 0.08 * r) + ' de glace en zone, ralentit' });
  sk('m_arcane', { cls: 'mage', branch: 'B', row: 3, maxRank: 3, type: 'passive', name: 'Flux arcanique', icon: '🔮',
    passive: (r) => ({ manaCost: -0.1 * r, atkSpd: 0.05 * r }), desc: (r) => 'Compétences ' + P(0.1 * r) + ' moins chères, +' + P(0.05 * r) + ' de vitesse d\'attaque' });

  // ---------------------------- PRÊTRE ----------------------------
  sk('p_heal', { cls: 'priest', branch: 'A', row: 0, maxRank: 5, type: 'active', name: 'Soin majeur', icon: '💚',
    kind: 'heal', cd: 6, mp: 15, target: 'allyLow', range: 6, mult: (r) => 2 + 0.25 * r, rule: { mode: 'allyHp', value: 0.5 },
    desc: (r) => 'Soigne l\'allié le plus blessé de ' + P(2 + 0.25 * r) + ' de la puissance magique' });
  sk('p_grace', { cls: 'priest', branch: 'A', row: 1, maxRank: 5, type: 'passive', name: 'Grâce', icon: '🙏',
    passive: (r) => ({ healPower: 0.06 * r }), desc: (r) => '+' + P(0.06 * r) + ' de soins' });
  sk('p_circle', { cls: 'priest', branch: 'A', row: 2, maxRank: 3, type: 'active', name: 'Cercle de soins', icon: '⭕',
    kind: 'heal', cd: 14, mp: 30, target: 'team', mult: (r) => 0.8 + 0.15 * r, rule: { mode: 'teamHp', value: 0.7 },
    desc: (r) => 'Soigne toute l\'équipe de ' + P(0.8 + 0.15 * r) + ' de la puissance magique' });
  sk('p_miracle', { cls: 'priest', branch: 'A', row: 3, maxRank: 3, type: 'active', ult: true, name: 'Miracle', icon: '👼',
    kind: 'revive', cd: 90, mp: 50, target: 'dead', value: (r) => 0.25 + 0.15 * r, rule: { mode: 'allyDead' },
    desc: (r) => 'Ultime : ressuscite un allié tombé avec ' + P(0.25 + 0.15 * r) + ' de ses PV' });
  sk('p_smite', { cls: 'priest', branch: 'B', row: 0, maxRank: 5, type: 'active', name: 'Châtiment', icon: '✝️',
    kind: 'damage', cd: 7, mp: 10, target: 'target', range: 5, dmgType: 'magic', element: 'light', mult: (r) => 1.3 + 0.12 * r,
    vfx: 'smite', rule: { mode: 'always' }, desc: (r) => P(1.3 + 0.12 * r) + ' de dégâts de lumière' });
  sk('p_bless', { cls: 'priest', branch: 'B', row: 1, maxRank: 3, type: 'active', name: 'Bénédiction', icon: '🌟',
    kind: 'buff', target: 'team', cd: 30, mp: 20, dur: 8, buff: (r) => ({ dmgPct: 0.08 + 0.04 * r }), rule: { mode: 'always' },
    desc: (r) => 'L\'équipe gagne +' + P(0.08 + 0.04 * r) + ' de dégâts pendant 8 s' });
  sk('p_shield', { cls: 'priest', branch: 'B', row: 2, maxRank: 3, type: 'active', name: 'Bouclier sacré', icon: '🔆',
    kind: 'shield', cd: 10, mp: 15, target: 'allyLow', range: 6, dur: 8, mult: (r) => 1.2 + 0.4 * r, rule: { mode: 'allyHp', value: 0.7 },
    desc: (r) => 'Bouclier absorbant ' + P(1.2 + 0.4 * r) + ' de la puissance magique pendant 8 s' });
  sk('p_fervor', { cls: 'priest', branch: 'B', row: 3, maxRank: 3, type: 'passive', name: 'Ferveur', icon: '🔥',
    passive: (r) => ({ matkPct: 0.07 * r }), desc: (r) => '+' + P(0.07 * r) + ' de puissance magique' });

  // ---------------------------- VOLEUR ----------------------------
  sk('r_backstab', { cls: 'rogue', branch: 'A', row: 0, maxRank: 5, type: 'active', name: 'Attaque sournoise', icon: '🗡️',
    kind: 'damage', cd: 7, mp: 10, target: 'target', range: 1.3, dmgType: 'phys', element: 'physical', mult: (r) => 1.5 + 0.15 * r, critBonus: 0.3,
    vfx: 'stab', rule: { mode: 'always' }, desc: (r) => P(1.5 + 0.15 * r) + ' de dégâts, +30 % de chance de critique' });
  sk('r_lethal', { cls: 'rogue', branch: 'A', row: 1, maxRank: 5, type: 'passive', name: 'Létalité', icon: '💀',
    passive: (r) => ({ crit: 0.04 * r }), desc: (r) => '+' + P(0.04 * r) + ' de critique' });
  sk('r_deadly', { cls: 'rogue', branch: 'A', row: 2, maxRank: 5, type: 'passive', name: 'Coups mortels', icon: '☠️',
    passive: (r) => ({ critDmg: 0.1 * r }), desc: (r) => '+' + P(0.1 * r) + ' de dégâts critiques' });
  sk('r_execute', { cls: 'rogue', branch: 'A', row: 3, maxRank: 3, type: 'active', ult: true, name: 'Exécution', icon: '⚰️',
    kind: 'damage', cd: 35, mp: 30, target: 'target', range: 1.4, dmgType: 'phys', element: 'shadow', mult: (r) => 3 + 0.5 * r, executeBelow: 0.3,
    vfx: 'execute', rule: { mode: 'targetHp', value: 0.5 }, desc: (r) => 'Ultime : ' + P(3 + 0.5 * r) + ' de dégâts d\'ombre, doublés si la cible a moins de 30 % de PV' });
  sk('r_poison', { cls: 'rogue', branch: 'B', row: 0, maxRank: 5, type: 'active', name: 'Lame empoisonnée', icon: '🧪',
    kind: 'damage', cd: 7, mp: 8, target: 'target', range: 1.3, dmgType: 'phys', element: 'earth', mult: (r) => 0.8 + 0.1 * r,
    status: { id: 'poison', chance: 1, dur: 5, valueMult: (r) => 0.3 + 0.08 * r }, vfx: 'stab', rule: { mode: 'always' },
    desc: (r) => P(0.8 + 0.1 * r) + ' de dégâts + poison (' + P(0.3 + 0.08 * r) + ' de l\'attaque par seconde, 5 s)' });
  sk('r_evasion', { cls: 'rogue', branch: 'B', row: 1, maxRank: 5, type: 'passive', name: 'Évasion', icon: '🌫️',
    passive: (r) => ({ dodge: 0.02 * r }), desc: (r) => '+' + P(0.02 * r) + ' d\'esquive' });
  sk('r_fan', { cls: 'rogue', branch: 'B', row: 2, maxRank: 3, type: 'active', name: 'Éventail de lames', icon: '✴️',
    kind: 'damage', cd: 12, mp: 15, target: 'self', aoeSelf: 2.2, dmgType: 'phys', element: 'physical', mult: (r) => 0.75 + 0.12 * r,
    vfx: 'fan', rule: { mode: 'enemies', value: 2 }, desc: (r) => P(0.75 + 0.12 * r) + ' de dégâts à tous les ennemis proches' });
  sk('r_shadow', { cls: 'rogue', branch: 'B', row: 3, maxRank: 3, type: 'passive', name: 'Pas de l\'ombre', icon: '👤',
    passive: (r) => ({ atkSpd: 0.06 * r, spd: 4 * r }), desc: (r) => '+' + P(0.06 * r) + ' de vitesse d\'attaque, +' + 4 * r + ' de vitesse' });

  G.data.skills = S;
  G.data.skillBranches = {
    warrior: { A: { name: 'Rempart', icon: '🛡️' }, B: { name: 'Carnage', icon: '⚔️' } },
    archer: { A: { name: 'Précision', icon: '🎯' }, B: { name: 'Chasse', icon: '🏹' } },
    mage: { A: { name: 'Feu', icon: '🔥' }, B: { name: 'Tempête', icon: '⚡' } },
    priest: { A: { name: 'Soins', icon: '💚' }, B: { name: 'Lumière', icon: '✝️' } },
    rogue: { A: { name: 'Assassinat', icon: '🗡️' }, B: { name: 'Ruse', icon: '🌫️' } },
  };
  G.data.skillRowCost = 3; // points dans la branche requis par rangée
})();
