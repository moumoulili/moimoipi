// =====================================================================
//  SYNERGIES D'ÉQUIPE : bonus actifs selon la composition.
//  need.classes = { classe: nombre minimum }, need.roles = { rôle: nombre }
//  bonus = stats ajoutées ; target = qui en profite :
//    'all' (toute l'équipe) ou { classes: [...] } ou { roles: [...] }
// =====================================================================
G.data.synergies = [
  { id: 'bulwark', name: 'Rempart sacré', icon: '🛡️', need: { roles: { tank: 1, healer: 1 } }, bonus: { defPct: 0.15 }, target: 'all',
    desc: '1 tank + 1 soigneur : +15 % de défense pour toute l\'équipe.' },
  { id: 'arcane', name: 'Cercle arcanique', icon: '🔮', need: { classes: { mage: 2 } }, bonus: { dmgPct: 0.12 }, target: { classes: ['mage'] },
    desc: '2 mages : +12 % de dégâts pour les mages.' },
  { id: 'volley', name: 'Pluie de flèches', icon: '🏹', need: { classes: { archer: 2 } }, bonus: { atkSpd: 0.12 }, target: { classes: ['archer'] },
    desc: '2 archers : +12 % de vitesse d\'attaque pour les archers.' },
  { id: 'brothers', name: 'Frères d\'armes', icon: '⚔️', need: { classes: { warrior: 2 } }, bonus: { hpPct: 0.15 }, target: { classes: ['warrior'] },
    desc: '2 guerriers : +15 % de PV pour les guerriers.' },
  { id: 'twinblades', name: 'Lames jumelles', icon: '🗡️', need: { classes: { rogue: 2 } }, bonus: { crit: 0.08 }, target: { classes: ['rogue'] },
    desc: '2 voleurs : +8 % de critique pour les voleurs.' },
  { id: 'choir', name: 'Chœur divin', icon: '✨', need: { classes: { priest: 2 } }, bonus: { healPower: 0.2 }, target: 'all',
    desc: '2 prêtres : +20 % de soins.' },
  { id: 'ambush', name: 'Embuscade', icon: '🎯', need: { classes: { rogue: 1, archer: 1 } }, bonus: { critDmg: 0.15 }, target: 'all',
    desc: '1 voleur + 1 archer : +15 % de dégâts critiques pour toute l\'équipe.' },
  { id: 'vanguard', name: 'Avant-garde', icon: '🔥', need: { roles: { tank: 1, melee: 1 } }, bonus: { dmgPct: 0.08 }, target: { roles: ['tank', 'melee'] },
    desc: '1 tank + 1 combattant au corps à corps : +8 % de dégâts en mêlée.' },
  { id: 'battlemage', name: 'Feu croisé', icon: '💥', need: { classes: { mage: 1, archer: 1 } }, bonus: { dmgPct: 0.06 }, target: { roles: ['ranged'] },
    desc: '1 mage + 1 archer : +6 % de dégâts à distance.' },
  { id: 'balanced', name: 'Compagnie équilibrée', icon: '⚖️', need: { distinctRoles: 4 }, bonus: { hpPct: 0.05, dmgPct: 0.05 }, target: 'all',
    desc: '4 rôles différents : +5 % de PV et de dégâts pour toute l\'équipe.' },
];
