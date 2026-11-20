// =====================================================================
//  STATS : calcule les stats finales d'un héros ou d'un monstre.
//  Plus tard s'y ajouteront : équipement (phase 2), compétences passives
//  (phase 4), sets (phase 6), ville et rebirth (phases 7-8), synergies.
// =====================================================================
(function () {
  const B = G.data.balance;
  const S = {};

  S.hero = function (hero) {
    const c = G.data.classes[hero.cls];
    const L = hero.level;
    const g = (k) => c.base[k] + c.growth[k] * (L - 1);
    const st = {
      maxHp: Math.round(g('hp')), maxMp: Math.round(g('mp')),
      str: g('str'), agi: g('agi'), int: g('int'), def: g('def'), spd: g('spd'),
    };
    const atkStat = st[c.attack.stat];
    st.atk = B.statToAtk * atkStat + B.unarmedDmg;
    st.matk = B.statToAtk * st.int + B.unarmedDmg;
    st.crit = Math.min(B.critCap, g('crit') + st.agi * B.critPerAgi);
    st.critDmg = B.critDmg;
    st.dodge = Math.min(B.dodgeCap, st.agi * B.dodgePerAgi);
    st.res = {};       // résistances élémentaires (équipement plus tard)
    st.dmgMult = 1;    // multiplicateur global de dégâts
    st.healMult = 1;
    return st;
  };

  // mods : { hp, atk, def } multiplicateurs (élite, gardien...)
  S.monster = function (mdef, floor, mods) {
    mods = mods || {};
    const m = B.floorMult(floor), b = B.monsterBase;
    const st = {
      maxHp: Math.round(b.hp * mdef.hp * m * (mods.hp || 1)),
      atk: b.atk * mdef.atk * m * (mods.atk || 1),
      def: b.def * mdef.def * m * (mods.def || 1),
      spd: b.spd * (mdef.spd / 100) * (mods.spd || 1),
      crit: 0.05, critDmg: 1.5, dodge: mdef.dodge || 0, res: {}, dmgMult: 1,
    };
    st.matk = st.atk;
    return st;
  };
  G.sys.stats = S;
})();
