// =====================================================================
//  HÉROS : création et données persistantes (sauvegardées).
//  Un héros sauvegardé = { id, name, cls, level, xp }. Ses stats sont
//  recalculées à la volée (G.sys.stats.hero).
// =====================================================================
(function () {
  const H = {};
  H.create = function (cls, rng) {
    rng = rng || G.core.rng;
    const st = G.state;
    const used = new Set(st.heroes.map((h) => h.name));
    const pool = G.data.heroNames.filter((n) => !used.has(n));
    const name = rng.pick(pool.length ? pool : G.data.heroNames);
    const h = { id: 'h' + (st.nextId++), name, cls, level: 1, xp: 0, sp: 0, quality: 'common', equip: {}, skills: {}, skillOrder: [], skillRules: {} };
    st.heroes.push(h);
    return h;
  };
  H.createStarting = function () {
    G.state.team = G.data.startingTeam.map((cls) => H.create(cls).id);
  };
  H.get = (id) => G.state.heroes.find((h) => h.id === id);
  H.team = () => G.state.team.map(H.get).filter(Boolean);
  // ---------- Évolutions de classe ----------
  H.evo = (h) => (h && (G.data.evolutions[h.ult] || G.data.evolutions[h.adv])) || null;
  H.className = (h) => (H.evo(h) || G.data.classes[h.cls]).name;
  H.role = (h) => (H.evo(h) || G.data.classes[h.cls]).role;
  H.sprite = function (h) {
    const c = G.data.classes[h.cls], e = H.evo(h);
    return e ? { tpl: c.sprite.tpl, pal: Object.assign({}, c.sprite.pal, e.pal), id: h.ult || h.adv } : Object.assign({ id: h.cls }, c.sprite);
  };
  H.attack = function (h) {
    let a = G.data.classes[h.cls].attack;
    for (const id of [h.adv, h.ult]) { const e = G.data.evolutions[id]; if (e && e.attack) a = Object.assign({}, a, e.attack); }
    return a;
  };
  H.evoBonus = function (h) {
    const out = {};
    for (const id of [h.adv, h.ult]) { const e = G.data.evolutions[id]; if (e) for (const k in e.bonus) out[k] = (out[k] || 0) + e.bonus[k]; }
    return out;
  };
  // prochain palier de changement de classe (0, 1, 2) ou null
  H.nextTier = (h) => (h.cls === 'adventurer' ? 0 : !h.adv ? 1 : !h.ult ? 2 : null);
  // choix proposés maintenant (niveau atteint) : ids de classes (palier 0) ou d'évolutions
  H.evoOptions = function (h) {
    const E = G.data.evolutions, B = G.data.balance.evolution, t = H.nextTier(h);
    if (t == null || h.level < B[t].level) return [];
    if (t === 0) return G.data.baseClasses.slice();
    if (t === 1) return Object.keys(E).filter((k) => E[k].tier === 1 && E[k].base === h.cls);
    return Object.keys(E).filter((k) => E[k].tier === 2 && E[k].from === h.adv);
  };
  H.nextEvoLevel = (h) => { const t = H.nextTier(h); return t == null ? null : G.data.balance.evolution[t].level; };
  H.evoTier = (id) => (G.data.evolutions[id] ? G.data.evolutions[id].tier : 0);
  H.evoCost = (id) => G.data.balance.evolution[H.evoTier(id)];
  H.optionInfo = (id) => G.data.evolutions[id] || G.data.classes[id];
  H.canAfford = function (c) {
    if (G.state.gold < (c.gold || 0)) return false;
    for (const k in c.mats || {}) if ((G.state.materials[k] || 0) < c.mats[k]) return false;
    return true;
  };
  H.pay = function (c) { G.state.gold -= c.gold || 0; for (const k in c.mats || {}) G.state.materials[k] -= c.mats[k]; };
  H.evolve = function (h, id) {
    if (H.evoOptions(h).indexOf(id) < 0) return 'locked';
    const c = H.evoCost(id);
    if (!H.canAfford(c)) return 'cost';
    H.pay(c);
    const tier = H.evoTier(id);
    if (tier === 0) { h.pastCls = (h.pastCls || []).concat([h.cls]); h.cls = id; }
    else if (tier === 1) h.adv = id; else h.ult = id;
    // renaissance (classe ultime) : retour au niveau 1, +1 renaissance ; compétences et points conservés
    if (c.rebirth) { h.level = 1; h.xp = 0; h.legacy = (h.legacy || 0) + 1; }
    // l'équipement que la nouvelle classe ne peut pas porter retourne au sac
    for (const slot in h.equip) if (h.equip[slot] && !G.sys.items.canUse(h, h.equip[slot])) { G.state.inventory.push(h.equip[slot]); delete h.equip[slot]; }
    G.sys.synergy && G.sys.synergy.invalidate();
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    G.core.bus.emit('hero:evolve', { hero: h.id, evo: id });
    return 'ok';
  };
  H.bench = () => G.state.heroes.filter((h) => G.state.team.indexOf(h.id) < 0);
  G.sys.heroes = H;
})();
