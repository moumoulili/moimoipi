// =====================================================================
//  SETS D'ÉQUIPEMENT : bonus quand on porte 2, 4 ou 6 pièces du même set.
//  pieces : bases d'objets qui composent le set (« ring » compte deux fois
//  si on porte deux anneaux du set). Un objet rare ou mieux a
//  balance.setChance de chance d'être une pièce de set.
// =====================================================================
G.data.setColor = '#2fd6b0';
G.data.sets = {
  guardian: { name: 'Égide du Gardien', icon: '🛡️', pieces: ['helm', 'plate', 'gauntlets', 'sabatons', 'shield', 'belt'],
    bonus: { 2: { defPct: 0.15 }, 4: { hpPct: 0.2 }, 6: { thorns: 0.2, defPct: 0.2 } } },
  hunter: { name: 'Traque du Chasseur', icon: '🏹', pieces: ['hood', 'leather', 'gloves', 'boots', 'quiver', 'cape'],
    bonus: { 2: { crit: 0.06 }, 4: { atkSpd: 0.15 }, 6: { echo: 0.2, critDmg: 0.2 } } },
  archmage: { name: 'Atours de l\'Archimage', icon: '🔮', pieces: ['hat', 'robe', 'mitts', 'slippers', 'tome', 'amulet'],
    bonus: { 2: { mpRegen: 0.3 }, 4: { matkPct: 0.15 }, 6: { dmgPct: 0.2, manaCost: -0.2 } } },
  pilgrim: { name: 'Habits du Pèlerin', icon: '🙏', pieces: ['hat', 'robe', 'mitts', 'slippers', 'relic', 'belt'],
    bonus: { 2: { healPower: 0.15 }, 4: { mpRegen: 0.4 }, 6: { healPower: 0.25, hpPct: 0.15 } } },
  shadow: { name: 'Voiles de l\'Ombre', icon: '🌑', pieces: ['hood', 'leather', 'gloves', 'boots', 'parry', 'cape'],
    bonus: { 2: { dodge: 0.06 }, 4: { critDmg: 0.3 }, 6: { echo: 0.25, crit: 0.08 } } },
  fortune: { name: 'Parure de la Fortune', icon: '💰', pieces: ['belt', 'cape', 'amulet', 'ring', 'ring'],
    bonus: { 2: { goldFind: 0.2 }, 4: { magicFind: 0.25, goldFind: 0.2 } } },
};
