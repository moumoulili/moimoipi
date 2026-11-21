// =====================================================================
//  COMPÉTENCES DES CLASSES AVANCÉES (branche C) ET ULTIMES (branche D)
//  Les descriptions sont générées automatiquement à partir des valeurs.
//  evo : l'évolution qui débloque la compétence.
// =====================================================================
(function () {
  const S = G.data.skills;
  const P = (v) => Math.round(v * 100) + ' %';
  const elTxt = (e) => (e && e !== 'physical' ? ' de ' + G.data.elements[e].name.toLowerCase() : '');
  const ST = { stun: 'étourdit', slow: 'ralentit', weaken: 'affaiblit', burn: 'brûle', freeze: 'gèle', poison: 'empoisonne', armorBreak: 'brise l\'armure' };
  function bonusTxt(b) {
    return Object.keys(b).map((k) => {
      const v = b[k], n = (G.data.statNames[k] || k).toLowerCase();
      if (k === 'dmgTaken') return P(-v) + ' de dégâts subis en moins';
      if (k === 'mpRegen') return '+' + String(Math.round(v * 10) / 10).replace('.', ',') + ' mana/s';
      if (k === 'manaCost') return 'compétences ' + P(-v) + ' moins chères';
      if (k.startsWith('elAmp_')) return '+' + P(v) + ' de dégâts' + elTxt(k.slice(6));
      if (k === 'matkPct') return '+' + P(v) + ' de puissance magique';
      if (k === 'burnPct') return 'brûlures +' + P(v);
      return '+' + P(v) + ' ' + n;
    }).join(', ');
  }
  function autoDesc(o) {
    return (r) => {
      const m = o.mult ? P(o.mult(r)) : '';
      switch (o.kind) {
        case 'damage': return (o.hits ? o.hits + ' coups de ' + m : m) + ' de dégâts' + elTxt(o.element) +
          (o.aoe ? ' en zone' : o.aoeSelf ? ' autour du héros' : o.target === 'multi' ? ' sur ' + o.count(r) + ' cibles' : '') +
          (o.waves ? ' (' + o.waves + ' vagues)' : '') + (o.critBonus ? ', +' + P(o.critBonus) + ' de critique' : '') +
          (o.executeBelow ? ', double sous ' + P(o.executeBelow) + ' de PV' : '') +
          (o.status ? ', ' + (o.status.chance < 1 ? P(o.status.chance) + ' de chance : ' : '') + ST[o.status.id] : '');
        case 'heal': return 'Soigne ' + (o.target === 'team' ? 'toute l\'équipe' : 'l\'allié le plus blessé') + ' de ' + m + ' de ' + (o.healStat === 'atk' ? 'l\'attaque' : 'la puissance magique');
        case 'buff': return (o.target === 'team' ? 'L\'équipe' : 'Le héros') + ' : ' + bonusTxt(o.buff(r)) + ' pendant ' + o.dur + ' s';
      }
      return '';
    };
  }
  function act(id, evo, branch, row, name, icon, o) {
    const base = G.data.evolutions[evo].base;
    const mk = o.mult;
    Object.assign(o, { id, cls: base, evo, branch, row, name, icon, type: 'active', maxRank: o.maxRank || 3 });
    if (mk) o.mult = (r) => mk[0] + mk[1] * r;
    if (o.buffPer) { const bp = o.buffPer; o.buff = (r) => { const b = {}; for (const k in bp) b[k] = bp[k][0] + bp[k][1] * r; return b; }; }
    if (o.countPer) { const c = o.countPer; o.count = (r) => c[0] + Math.floor(c[1] * r); }
    o.rule = o.rule || { mode: 'always' };
    o.desc = autoDesc(o);
    S[id] = o;
  }
  function pas(id, evo, branch, row, name, icon, per, maxRank) {
    const base = G.data.evolutions[evo].base;
    S[id] = { id, cls: base, evo, branch, row, name, icon, type: 'passive', maxRank: maxRank || 3,
      passive: (r) => { const b = {}; for (const k in per) b[k] = per[k] * r; return b; },
      desc: (r) => { const b = {}; for (const k in per) b[k] = per[k] * r; return bonusTxt(b); } };
  }

  // ---------------- GUERRIER ----------------
  pas('pal_aura', 'paladin', 'C', 0, 'Aura de dévotion', '✨', { defPct: 0.04, hpPct: 0.03 });
  act('pal_lay', 'paladin', 'C', 1, 'Imposition des mains', '🤲', { kind: 'heal', target: 'allyLow', range: 5, healStat: 'atk', cd: 12, mp: 15, mult: [1.3, 0.3], rule: { mode: 'allyHp', value: 0.4 } });
  pas('pal_holy', 'paladin', 'C', 2, 'Lumière sacrée', '☀️', { healPower: 0.08, elAmp_light: 0.06 });
  act('pal_judgment', 'paladin', 'C', 3, 'Jugement', '⚡', { kind: 'damage', target: 'target', range: 2, aoe: 1.5, dmgType: 'phys', element: 'light', cd: 14, mp: 20, mult: [1.4, 0.3], vfx: 'smite', status: { id: 'stun', chance: 0.3, dur: 1 } });
  pas('tem_zeal', 'templar', 'D', 0, 'Zèle', '🔥', { dmgPct: 0.05, defPct: 0.05 });
  act('tem_consecrate', 'templar', 'D', 1, 'Consécration', '⚜️', { ult: true, kind: 'damage', target: 'self', aoeSelf: 2.6, dmgType: 'phys', element: 'light', cd: 55, mp: 35, mult: [2.2, 0.5], vfx: 'whirl', status: { id: 'weaken', chance: 1, dur: 6, value: 0.25 }, rule: { mode: 'boss' } });
  pas('tem_bulwark', 'templar', 'D', 2, 'Rempart divin', '🏯', { hpPct: 0.08 });

  act('ber_cleave', 'berserker', 'C', 1, 'Fendoir', '🪓', { kind: 'damage', target: 'self', aoeSelf: 1.8, dmgType: 'phys', element: 'physical', cd: 8, mp: 12, mult: [1, 0.2], vfx: 'whirl', rule: { mode: 'enemies', value: 2 } });
  pas('ber_rage', 'berserker', 'C', 0, 'Rage', '😤', { dmgPct: 0.05 });
  pas('ber_blood', 'berserker', 'C', 2, 'Sang bouillant', '🩸', { lifesteal: 0.02 });
  act('ber_frenzy', 'berserker', 'C', 3, 'Frénésie', '🌪️', { kind: 'buff', target: 'self', cd: 25, mp: 15, dur: 8, buffPer: { atkSpd: [0.25, 0.08], dmgPct: [0.1, 0.03] }, rule: { mode: 'boss' } });
  pas('wl_might', 'warlord', 'D', 0, 'Force brute', '💪', { critDmg: 0.1 });
  act('wl_warcry', 'warlord', 'D', 1, 'Cri de guerre', '📯', { ult: true, kind: 'buff', target: 'team', cd: 60, mp: 30, dur: 10, buffPer: { dmgPct: [0.15, 0.05], atkSpd: [0.08, 0.03] }, rule: { mode: 'boss' } });
  pas('wl_iron', 'warlord', 'D', 2, 'Volonté de fer', '🛡️', { hpPct: 0.06 });

  pas('cr_dawn', 'crusader', 'D', 0, 'Éclat de l\'aube', '🌅', { elAmp_light: 0.06 });
  act('cr_smite', 'crusader', 'D', 1, 'Frappe solaire', '☀️', { ult: true, kind: 'damage', target: 'target', range: 2, aoe: 2.2, dmgType: 'phys', element: 'light', cd: 45, mp: 30, mult: [3, 0.6], vfx: 'smite', status: { id: 'stun', chance: 1, dur: 1.5 }, rule: { mode: 'boss' } });
  pas('cr_fervor', 'crusader', 'D', 2, 'Ardeur', '🔥', { dmgPct: 0.05 });
  pas('ti_rock', 'titan', 'D', 0, 'Roc', '🪨', { defPct: 0.06 });
  act('ti_quake', 'titan', 'D', 1, 'Séisme', '🌋', { ult: true, kind: 'damage', target: 'self', aoeSelf: 3, dmgType: 'phys', element: 'earth', cd: 50, mp: 30, mult: [2, 0.4], vfx: 'whirl', status: { id: 'stun', chance: 1, dur: 1.5 }, rule: { mode: 'enemies', value: 3 } });
  pas('ti_giant', 'titan', 'D', 2, 'Gigantisme', '🦣', { hpPct: 0.08 });

  // ---------------- ARCHER ----------------
  pas('ss_steady', 'sharpshooter', 'C', 0, 'Main sûre', '✋', { crit: 0.03 });
  act('ss_headshot', 'sharpshooter', 'C', 1, 'Tir en pleine tête', '🎯', { kind: 'damage', target: 'weakest', range: 7, dmgType: 'phys', element: 'physical', cd: 12, mp: 14, mult: [2.2, 0.4], critBonus: 0.5, proj: 'arrow' });
  pas('ss_focus', 'sharpshooter', 'C', 2, 'Concentration', '🧘', { critDmg: 0.1 });
  act('ss_pierce', 'sharpshooter', 'C', 3, 'Flèches perforantes', '➶', { kind: 'damage', target: 'multi', countPer: [4, 0.5], range: 7, dmgType: 'phys', element: 'physical', cd: 14, mp: 18, mult: [0.9, 0.2], proj: 'arrow', rule: { mode: 'enemies', value: 2 } });
  pas('hk_eye', 'hawkeye', 'D', 0, 'Œil perçant', '👁️', { crit: 0.04 });
  act('hk_deadeye', 'hawkeye', 'D', 1, 'Tir fatal', '💥', { ult: true, kind: 'damage', target: 'target', range: 8, dmgType: 'phys', element: 'physical', cd: 45, mp: 30, mult: [4.5, 1], critBonus: 1, proj: 'arrow', rule: { mode: 'boss' } });
  pas('hk_wind', 'hawkeye', 'D', 2, 'Vent favorable', '🍃', { atkSpd: 0.06 });

  pas('rg_nature', 'ranger', 'C', 0, 'Endurance sauvage', '🌲', { hpPct: 0.05 });
  act('rg_trap', 'ranger', 'C', 1, 'Piège à mâchoires', '🪤', { kind: 'damage', target: 'target', range: 6, aoe: 1.5, dmgType: 'phys', element: 'earth', cd: 12, mp: 14, mult: [1, 0.2], status: { id: 'stun', chance: 1, dur: 1.2 } });
  pas('rg_mark', 'ranger', 'C', 2, 'Marque du chasseur', '🏹', { bossDmg: 0.08 });
  act('rg_spirit', 'ranger', 'C', 3, 'Esprit de la meute', '🐾', { kind: 'buff', target: 'team', cd: 30, mp: 20, dur: 10, buffPer: { atkSpd: [0.1, 0.04] } });
  pas('bm_bond', 'beastmaster', 'D', 0, 'Lien sauvage', '🤝', { dmgPct: 0.05 });
  act('bm_stampede', 'beastmaster', 'D', 1, 'Ruée sauvage', '🐗', { ult: true, kind: 'damage', target: 'target', range: 6, aoe: 2.3, waves: 4, dmgType: 'phys', element: 'earth', cd: 50, mp: 30, mult: [0.6, 0.15], vfx: 'rain', rule: { mode: 'enemies', value: 3 } });
  pas('bm_hide', 'beastmaster', 'D', 2, 'Cuir épais', '🦬', { defPct: 0.07 });

  pas('aa_charge', 'arcane_archer', 'D', 0, 'Flèches chargées', '⚡', { elAmp_lightning: 0.07 });
  act('aa_storm', 'arcane_archer', 'D', 1, 'Tempête de flèches', '🌩️', { ult: true, kind: 'damage', target: 'target', range: 7, chain: (r) => 4 + r, dmgType: 'phys', element: 'lightning', cd: 45, mp: 30, mult: [2, 0.4], vfx: 'chain', rule: { mode: 'enemies', value: 2 } });
  pas('aa_focus', 'arcane_archer', 'D', 2, 'Focalisation', '🎯', { critDmg: 0.12 });
  pas('wd_roots', 'warden', 'D', 0, 'Racines profondes', '🌱', { hpPct: 0.06 });
  act('wd_grasp', 'warden', 'D', 1, 'Étreinte de la forêt', '🌿', { ult: true, kind: 'damage', target: 'target', range: 6, aoe: 2.8, dmgType: 'phys', element: 'earth', cd: 50, mp: 30, mult: [1.6, 0.3], status: { id: 'stun', chance: 1, dur: 2.5 }, rule: { mode: 'enemies', value: 3 } });
  pas('wd_hunt', 'warden', 'D', 2, 'Traque', '🐾', { bossDmg: 0.1 });

  // ---------------- MAGE ----------------
  pas('py_heat', 'pyromancer', 'C', 0, 'Chaleur intense', '🌡️', { elAmp_fire: 0.06 });
  act('py_wave', 'pyromancer', 'C', 1, 'Vague de flammes', '🌊', { kind: 'damage', target: 'target', range: 5, aoe: 2, dmgType: 'magic', element: 'fire', cd: 10, mp: 18, mult: [1, 0.22], proj: 'fire', status: { id: 'burn', chance: 0.6, dur: 3 }, rule: { mode: 'enemies', value: 2 } });
  pas('py_inferno', 'pyromancer', 'C', 2, 'Enfer', '🔥', { burnPct: 0.2 });
  act('py_pillar', 'pyromancer', 'C', 3, 'Colonne de feu', '🗼', { kind: 'damage', target: 'target', range: 6, aoe: 1.4, delay: 0.8, dmgType: 'magic', element: 'fire', cd: 16, mp: 22, mult: [2, 0.4], vfx: 'meteor', status: { id: 'burn', chance: 1, dur: 4 } });
  pas('am_mastery', 'archmage', 'D', 0, 'Maîtrise élémentaire', '📜', { matkPct: 0.06 });
  act('am_armageddon', 'archmage', 'D', 1, 'Armageddon', '☄️', { ult: true, kind: 'damage', target: 'target', range: 6, aoe: 2.6, waves: 5, dmgType: 'magic', element: 'fire', cd: 60, mp: 45, mult: [0.7, 0.18], vfx: 'firerain', status: { id: 'burn', chance: 0.5, dur: 3 }, rule: { mode: 'boss' } });
  pas('am_flow', 'archmage', 'D', 2, 'Flux de mana', '💧', { mpRegen: 0.1, manaCost: -0.05 });

  pas('nc_dark', 'necromancer', 'C', 0, 'Arts sombres', '🌑', { elAmp_shadow: 0.08 });
  act('nc_curse', 'necromancer', 'C', 1, 'Malédiction', '🕸️', { kind: 'damage', target: 'target', range: 5, dmgType: 'magic', element: 'shadow', cd: 9, mp: 12, mult: [0.6, 0.1], status: { id: 'weaken', chance: 1, dur: 6, value: 0.25 }, proj: 'orb' });
  pas('nc_drain', 'necromancer', 'C', 2, 'Drain vital', '🧛', { lifesteal: 0.02 });
  act('nc_bones', 'necromancer', 'C', 3, 'Tempête d\'os', '🦴', { kind: 'damage', target: 'target', range: 5, aoe: 2, waves: 3, dmgType: 'magic', element: 'shadow', cd: 20, mp: 25, mult: [0.8, 0.2], vfx: 'blizzard', rule: { mode: 'enemies', value: 2 } });
  pas('li_phylactery', 'lich', 'D', 0, 'Phylactère', '⚱️', { hpPct: 0.08 });
  act('li_nova', 'lich', 'D', 1, 'Nova mortelle', '💀', { ult: true, kind: 'damage', target: 'target', range: 6, aoe: 3, dmgType: 'magic', element: 'shadow', cd: 60, mp: 45, mult: [2.6, 0.5], vfx: 'execute', status: { id: 'weaken', chance: 1, dur: 8, value: 0.3 }, rule: { mode: 'boss' } });
  pas('li_will', 'lich', 'D', 2, 'Volonté éternelle', '🔮', { matkPct: 0.05 });

  pas('ph_ash', 'phoenix', 'D', 0, 'Cendres ardentes', '🔥', { burnPct: 0.25 });
  act('ph_rebirth', 'phoenix', 'D', 1, 'Flammes de la renaissance', '🐦‍🔥', { ult: true, kind: 'heal', target: 'team', cd: 60, mp: 40, mult: [1.8, 0.4], rule: { mode: 'teamHp', value: 0.4 } });
  pas('ph_wings', 'phoenix', 'D', 2, 'Ailes de feu', '🪶', { elAmp_fire: 0.07 });
  pas('sl_void', 'shadowlord', 'D', 0, 'Néant', '🕳️', { elAmp_shadow: 0.08 });
  act('sl_eclipse', 'shadowlord', 'D', 1, 'Éclipse', '🌑', { ult: true, kind: 'damage', target: 'target', range: 6, aoe: 2.6, waves: 4, dmgType: 'magic', element: 'shadow', cd: 55, mp: 40, mult: [0.9, 0.2], vfx: 'blizzard', status: { id: 'weaken', chance: 1, dur: 6, value: 0.3 }, rule: { mode: 'boss' } });
  pas('sl_dread', 'shadowlord', 'D', 2, 'Effroi', '😱', { matkPct: 0.05 });

  // ---------------- PRÊTRE ----------------
  pas('cl_devotion', 'cleric', 'C', 0, 'Dévotion', '🙏', { healPower: 0.06 });
  act('cl_renew', 'cleric', 'C', 1, 'Renouveau', '🌱', { kind: 'heal', target: 'team', cd: 10, mp: 18, mult: [0.5, 0.1], rule: { mode: 'teamHp', value: 0.8 } });
  pas('cl_serenity', 'cleric', 'C', 2, 'Sérénité', '🕊️', { manaCost: -0.05 });
  act('cl_sanctuary', 'cleric', 'C', 3, 'Sanctuaire', '⛪', { kind: 'buff', target: 'team', cd: 30, mp: 25, dur: 8, buffPer: { dmgTaken: [-0.15, -0.05] }, rule: { mode: 'teamHp', value: 0.6 } });
  pas('sa_halo', 'saint', 'D', 0, 'Auréole', '😇', { healPower: 0.08 });
  act('sa_divine', 'saint', 'D', 1, 'Intervention divine', '🌅', { ult: true, kind: 'heal', target: 'team', cd: 60, mp: 40, mult: [2, 0.5], rule: { mode: 'teamHp', value: 0.4 } });
  pas('sa_grace', 'saint', 'D', 2, 'Grâce infinie', '💧', { mpRegen: 0.1 });

  pas('iq_zeal', 'inquisitor', 'C', 0, 'Ferveur ardente', '🔥', { elAmp_light: 0.06 });
  act('iq_verdict', 'inquisitor', 'C', 1, 'Verdict', '⚖️', { kind: 'damage', target: 'target', range: 5, dmgType: 'magic', element: 'light', cd: 9, mp: 14, mult: [1.6, 0.3], vfx: 'smite', status: { id: 'stun', chance: 0.5, dur: 0.8 } });
  pas('iq_conviction', 'inquisitor', 'C', 2, 'Conviction', '✊', { crit: 0.03 });
  act('iq_purge', 'inquisitor', 'C', 3, 'Purge', '🔆', { kind: 'damage', target: 'target', range: 5, aoe: 1.8, dmgType: 'magic', element: 'light', cd: 14, mp: 20, mult: [1.1, 0.25], vfx: 'smite', rule: { mode: 'enemies', value: 2 } });
  pas('gi_wrath', 'grand_inquisitor', 'D', 0, 'Courroux', '😠', { matkPct: 0.06 });
  act('gi_judgment', 'grand_inquisitor', 'D', 1, 'Jugement dernier', '🔱', { ult: true, kind: 'damage', target: 'target', range: 6, aoe: 2.4, waves: 3, dmgType: 'magic', element: 'light', cd: 55, mp: 40, mult: [1, 0.25], vfx: 'rain', rule: { mode: 'boss' } });
  pas('gi_faith', 'grand_inquisitor', 'D', 2, 'Foi inébranlable', '📿', { dmgPct: 0.05 });

  pas('or_sight', 'oracle', 'D', 0, 'Prescience', '👁️', { defPct: 0.05 });
  act('or_aegis', 'oracle', 'D', 1, 'Égide prophétique', '🛡️', { ult: true, kind: 'buff', target: 'team', cd: 55, mp: 40, dur: 10, buffPer: { dmgTaken: [-0.3, -0.05], defPct: [0.2, 0.05] }, rule: { mode: 'boss' } });
  pas('or_flow', 'oracle', 'D', 2, 'Source de vie', '💧', { mpRegen: 0.1 });
  pas('ex_radiance', 'exalted', 'D', 0, 'Rayonnement', '✨', { elAmp_light: 0.07 });
  act('ex_nova', 'exalted', 'D', 1, 'Nova sacrée', '🌟', { ult: true, kind: 'damage', target: 'target', range: 6, aoe: 3, dmgType: 'magic', element: 'light', cd: 50, mp: 40, mult: [3, 0.6], vfx: 'smite', rule: { mode: 'enemies', value: 2 } });
  pas('ex_halo', 'exalted', 'D', 2, 'Halo vengeur', '😇', { crit: 0.03 });

  // ---------------- VOLEUR ----------------
  pas('as_shadow', 'assassin', 'C', 0, 'Lame de l\'ombre', '🌒', { critDmg: 0.08 });
  act('as_ambush', 'assassin', 'C', 1, 'Embuscade', '🥷', { kind: 'damage', target: 'target', range: 1.4, dmgType: 'phys', element: 'shadow', cd: 10, mp: 14, mult: [2, 0.4], critBonus: 0.5, vfx: 'execute' });
  pas('as_vital', 'assassin', 'C', 2, 'Points vitaux', '❤️‍🩹', { bossDmg: 0.08 });
  act('as_flurry', 'assassin', 'C', 3, 'Rafale de lames', '⚔️', { kind: 'damage', target: 'target', range: 1.4, hits: 4, dmgType: 'phys', element: 'physical', cd: 12, mp: 18, mult: [0.55, 0.1], vfx: 'stab' });
  pas('rp_dance', 'reaper', 'D', 0, 'Danse macabre', '💃', { atkSpd: 0.06 });
  act('rp_reap', 'reaper', 'D', 1, 'Moisson', '⚰️', { ult: true, kind: 'damage', target: 'self', aoeSelf: 2.5, dmgType: 'phys', element: 'shadow', cd: 45, mp: 30, mult: [2.2, 0.5], executeBelow: 0.3, vfx: 'fan', rule: { mode: 'enemies', value: 2 } });
  pas('rp_death', 'reaper', 'D', 2, 'Baiser de la mort', '💋', { critDmg: 0.12 });

  pas('sb_tools', 'saboteur', 'C', 0, 'Outils affûtés', '🔧', { dmgPct: 0.04 });
  act('sb_bomb', 'saboteur', 'C', 1, 'Bombe', '💣', { kind: 'damage', target: 'target', range: 5, aoe: 1.8, dmgType: 'phys', element: 'fire', cd: 10, mp: 14, mult: [1, 0.25], proj: 'fire', status: { id: 'burn', chance: 0.5, dur: 3 } });
  pas('sb_traps', 'saboteur', 'C', 2, 'Chausse-trappes', '📌', { bossDmg: 0.06 });
  act('sb_smoke', 'saboteur', 'C', 3, 'Fumigène', '🌫️', { kind: 'damage', target: 'self', aoeSelf: 2.6, dmgType: 'phys', element: 'physical', cd: 18, mp: 18, mult: [0.3, 0.1], vfx: 'fan', status: { id: 'slow', chance: 1, dur: 4, value: 0.5 }, rule: { mode: 'enemies', value: 2 } });
  pas('ms_engineer', 'master_saboteur', 'D', 0, 'Ingénierie', '⚙️', { dmgPct: 0.05 });
  act('ms_barrage', 'master_saboteur', 'D', 1, 'Tapis de bombes', '🧨', { ult: true, kind: 'damage', target: 'target', range: 6, aoe: 2.5, waves: 5, dmgType: 'phys', element: 'fire', cd: 50, mp: 30, mult: [0.55, 0.15], vfx: 'firerain', status: { id: 'burn', chance: 0.4, dur: 3 }, rule: { mode: 'enemies', value: 3 } });
  pas('ms_escape', 'master_saboteur', 'D', 2, 'Échappatoire', '🏃', { dodge: 0.03 });
  pas('pt_mist', 'phantom', 'D', 0, 'Brume', '🌫️', { dodge: 0.03 });
  act('pt_thousand', 'phantom', 'D', 1, 'Mille lames', '🗡️', { ult: true, kind: 'damage', target: 'target', range: 1.4, hits: 8, dmgType: 'phys', element: 'shadow', cd: 40, mp: 30, mult: [0.6, 0.12], vfx: 'stab', rule: { mode: 'boss' } });
  pas('pt_edge', 'phantom', 'D', 2, 'Fil du rasoir', '🔪', { critDmg: 0.1 });
  pas('al_brew', 'alchemist', 'D', 0, 'Breuvages', '🧪', { healPower: 0.06 });
  act('al_elixir', 'alchemist', 'D', 1, 'Grand élixir', '⚗️', { ult: true, kind: 'buff', target: 'team', cd: 50, mp: 30, dur: 12, buffPer: { dmgPct: [0.15, 0.05], atkSpd: [0.1, 0.03], defPct: [0.1, 0.03] }, rule: { mode: 'boss' } });
  pas('al_toxin', 'alchemist', 'D', 2, 'Toxines', '☠️', { dmgPct: 0.05 });
})();
