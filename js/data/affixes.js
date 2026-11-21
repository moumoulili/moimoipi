// =====================================================================
//  BONUS ALÉATOIRES (affixes) et EFFETS SPÉCIAUX.
//  scale: 'power' = grandit avec le niveau de l'objet (stats plates)
//         'pct'   = pourcentage, grandit très peu
//  slots: emplacements possibles (absent = partout)
//  suffix : utilisé pour nommer l'objet (« Épée de l'ours »)
// =====================================================================
G.data.statNames = {
  hp: 'PV', str: 'Force', agi: 'Agilité', int: 'Intelligence', def: 'Défense', spd: 'Vitesse',
  atk: 'Attaque', matk: 'Puissance magique', crit: 'Critique', critDmg: 'Dégâts critiques', dodge: 'Esquive',
  dmgPct: 'Dégâts', hpPct: 'PV', defPct: 'Défense', atkSpd: 'Vitesse d\'attaque', goldFind: 'Or trouvé',
  magicFind: 'Chance de butin', lifesteal: 'Vol de vie', thorns: 'Épines', healPower: 'Soins', mpRegen: 'mana par seconde', mp: 'Mana max',
  bossDmg: 'Dégâts contre élites et gardiens', onKillHeal: 'Soin à chaque victime', echo: 'Chance de frapper deux fois',
  res_fire: 'Résistance au feu', res_ice: 'Résistance à la glace', res_lightning: 'Résistance à la foudre',
  res_earth: 'Résistance à la terre', res_shadow: 'Résistance à l\'ombre', res_light: 'Résistance à la lumière',
  el_fire: 'Dégâts de feu', el_ice: 'Dégâts de glace', el_lightning: 'Dégâts de foudre',
  el_earth: 'Dégâts de terre', el_shadow: 'Dégâts d\'ombre', el_light: 'Dégâts de lumière',
};
// stats affichées en pourcentage
G.data.pctStats = { crit: 1, critDmg: 1, dodge: 1, dmgPct: 1, hpPct: 1, defPct: 1, atkSpd: 1, goldFind: 1, magicFind: 1, lifesteal: 1, thorns: 1, healPower: 1, bossDmg: 1, onKillHeal: 1, echo: 1, res_fire: 1, res_ice: 1, res_lightning: 1, res_earth: 1, res_shadow: 1, res_light: 1 };

(function () {
  const W = ['weapon'], OFF = ['offhand'], JEWEL = ['amulet', 'ring'], ARM = ['head', 'chest', 'hands', 'feet', 'belt', 'cape'];
  const A = [
    { stat: 'str', base: 2, scale: 'power', w: 10, suffix: 'de l\'ours' },
    { stat: 'agi', base: 2, scale: 'power', w: 10, suffix: 'du faucon' },
    { stat: 'int', base: 2, scale: 'power', w: 10, suffix: 'du sage' },
    { stat: 'hp', base: 12, scale: 'power', w: 10, suffix: 'du colosse' },
    { stat: 'def', base: 2, scale: 'power', w: 8, suffix: 'du rempart', slots: ARM.concat(OFF) },
    { stat: 'atk', base: 3, scale: 'power', w: 7, suffix: 'du carnage', slots: W.concat(JEWEL, ['hands']) },
    { stat: 'matk', base: 3, scale: 'power', w: 7, suffix: 'des arcanes', slots: W.concat(JEWEL, OFF) },
    { stat: 'spd', base: 3, scale: 'flat', w: 5, suffix: 'du vent', slots: ['feet', 'cape', 'amulet', 'ring'] },
    { stat: 'crit', base: 0.025, scale: 'pct', w: 6, suffix: 'de précision' },
    { stat: 'critDmg', base: 0.1, scale: 'pct', w: 4, suffix: 'de la brute', slots: W.concat(JEWEL, ['hands']) },
    { stat: 'dodge', base: 0.02, scale: 'pct', w: 4, suffix: 'de l\'ombre', slots: ['feet', 'cape', 'chest', 'ring'] },
    { stat: 'dmgPct', base: 0.06, scale: 'pct', w: 5, suffix: 'de puissance', slots: W.concat(JEWEL, OFF) },
    { stat: 'hpPct', base: 0.06, scale: 'pct', w: 4, suffix: 'de vitalité', slots: ['chest', 'belt', 'amulet', 'head'] },
    { stat: 'defPct', base: 0.07, scale: 'pct', w: 3, suffix: 'de la tortue', slots: ['chest', 'head', 'offhand'] },
    { stat: 'atkSpd', base: 0.05, scale: 'pct', w: 4, suffix: 'de rapidité', slots: ['weapon', 'hands', 'ring'] },
    { stat: 'goldFind', base: 0.1, scale: 'pct', w: 4, suffix: 'du marchand', slots: JEWEL.concat(['belt', 'hands']) },
    { stat: 'magicFind', base: 0.08, scale: 'pct', w: 3, suffix: 'du chanceux', slots: JEWEL.concat(['head', 'cape']) },
    { stat: 'lifesteal', base: 0.02, scale: 'pct', w: 2, suffix: 'du vampire', slots: W.concat(['ring', 'amulet']) },
    { stat: 'thorns', base: 0.08, scale: 'pct', w: 2, suffix: 'des ronces', slots: ['chest', 'offhand', 'belt'] },
    { stat: 'healPower', base: 0.07, scale: 'pct', w: 3, suffix: 'de la grâce', slots: W.concat(OFF, JEWEL) },
    { stat: 'mpRegen', base: 0.15, scale: 'flat', w: 6, suffix: 'de la source', slots: W.concat(OFF, JEWEL, ['head']) },
  ];
  for (const el of ['fire', 'ice', 'lightning', 'earth', 'shadow', 'light']) {
    const nm = { fire: 'des flammes', ice: 'du givre', lightning: 'de l\'orage', earth: 'de la roche', shadow: 'des ténèbres', light: 'de l\'aube' }[el];
    const rs = { fire: 'de la salamandre', ice: 'du yéti', lightning: 'du paratonnerre', earth: 'de la montagne', shadow: 'du veilleur', light: 'de l\'éclipse' }[el];
    A.push({ stat: 'res_' + el, base: 0.08, scale: 'pct', w: 2, suffix: rs, slots: ARM.concat(JEWEL, OFF) });
    A.push({ stat: 'el_' + el, base: 2.5, scale: 'power', w: 2, suffix: nm, slots: W.concat(['ring', 'amulet', 'hands']) });
  }
  G.data.affixes = A;
})();

// Pouvoirs des objets mythiques (un au hasard)
G.data.mythicPowers = [
  { stat: 'echo', value: 0.15, desc: '15 % de chance de frapper deux fois' },
  { stat: 'lifesteal', value: 0.05, desc: 'Vol de vie +5 %' },
  { stat: 'bossDmg', value: 0.4, desc: '+40 % de dégâts contre élites et gardiens' },
  { stat: 'onKillHeal', value: 0.08, desc: 'Soigne 8 % des PV à chaque victime' },
  { stat: 'thorns', value: 0.3, desc: 'Renvoie 30 % des dégâts de mêlée' },
];
