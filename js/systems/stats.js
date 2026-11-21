// =====================================================================
//  STATS : calcule les stats finales d'un héros ou d'un monstre.
//  Héros = classe + niveau + équipement + élixirs actifs.
//  À venir : compétences passives (phase 4), sets (phase 6),
//  ville et rebirth (phases 7-8), synergies (phase 3).
// =====================================================================
(function () {
  const B = G.data.balance;
  const S = {};
  const ELS = ['fire', 'ice', 'lightning', 'earth', 'shadow', 'light'];

  // opts : { equip (remplace l'équipement porté), buffs {dmgPct, defPct, atkSpd} }
  S.hero = function (hero, opts) {
    opts = opts || {};
    const c = G.data.classes[hero.cls];
    const L = hero.level;
    const qg = G.sys.tavern ? G.sys.tavern.quality(hero.quality).growth : 1; // potentiel de la recrue
    const g = (k) => c.base[k] + c.growth[k] * (L - 1) * qg;
    const eq = opts.equip || hero.equip || {};
    const buffs = opts.buffs || {};
    const add = {};
    let wdmg = 0, wtype = null, wspd = 1;
    for (const slot in eq) {
      const it = eq[slot];
      if (!it) continue;
      const s = G.sys.items.stats(it);
      for (const k in s) add[k] = (add[k] || 0) + s[k];
      if (slot === 'weapon') { const b = G.data.itemBases[it.base]; wdmg = it.dmg || 0; wtype = b.dmgType; wspd = b.spd || 1; }
    }
    // bonus hors équipement : synergies (et plus tard passifs, ville, rebirth)
    if (G.sys.synergy) { const gb = G.sys.synergy.bonusesFor(hero); for (const k in gb) add[k] = (add[k] || 0) + gb[k]; }
    const A = (k) => add[k] || 0;
    const st = {
      str: g('str') + A('str'), agi: g('agi') + A('agi'), int: g('int') + A('int'),
      spd: g('spd') + A('spd'),
    };
    st.maxHp = Math.round((g('hp') + A('hp')) * (1 + A('hpPct')));
    st.maxMp = Math.round(g('mp'));
    st.def = (g('def') + A('def')) * (1 + A('defPct') + (buffs.defPct || 0));
    st.atk = B.statToAtk * st[c.attack.stat] + B.unarmedDmg + (wtype === 'phys' ? wdmg : 0) + A('atk');
    st.matk = B.statToAtk * st.int + B.unarmedDmg + (wtype === 'magic' ? wdmg : 0) + A('matk');
    st.crit = Math.min(B.critCap, g('crit') + st.agi * B.critPerAgi + A('crit'));
    st.critDmg = B.critDmg + A('critDmg');
    st.dodge = Math.min(B.dodgeCap, st.agi * B.dodgePerAgi + A('dodge'));
    st.dmgMult = 1 + A('dmgPct') + (buffs.dmgPct || 0);
    st.healMult = 1 + A('healPower');
    st.wspd = wspd;
    st.atkSpd = A('atkSpd') + (buffs.atkSpd || 0);
    st.res = {}; st.elemDmg = {};
    let mainEl = null, mainV = 0;
    for (const el of ELS) {
      if (A('res_' + el)) st.res[el] = A('res_' + el);
      if (A('el_' + el)) { st.elemDmg[el] = A('el_' + el); if (A('el_' + el) > mainV) { mainV = A('el_' + el); mainEl = el; } }
    }
    st.mainEl = mainEl;
    st.lifesteal = A('lifesteal'); st.thorns = A('thorns'); st.echo = Math.min(0.75, A('echo'));
    st.bossDmg = A('bossDmg'); st.onKillHeal = A('onKillHeal');
    st.goldFind = A('goldFind'); st.magicFind = A('magicFind');
    return st;
  };

  // mods : { hp, atk, def, spd } multiplicateurs (élite, gardien...)
  S.monster = function (mdef, floor, mods) {
    mods = mods || {};
    const m = B.floorMult(floor), b = B.monsterBase;
    const st = {
      maxHp: Math.round(b.hp * mdef.hp * m * (mods.hp || 1)),
      atk: b.atk * mdef.atk * m * (mods.atk || 1),
      def: b.def * mdef.def * m * (mods.def || 1),
      spd: b.spd * (mdef.spd / 100) * (mods.spd || 1),
      crit: 0.05, critDmg: 1.5, dodge: mdef.dodge || 0, res: {}, elemDmg: {}, dmgMult: 1,
      wspd: 1, atkSpd: 0, lifesteal: 0, thorns: 0, echo: 0, bossDmg: 0, onKillHeal: 0,
    };
    st.matk = st.atk;
    return st;
  };
  G.sys.stats = S;
})();
