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
  // évolutions proposées maintenant (niveau atteint)
  H.evoOptions = function (h) {
    const E = G.data.evolutions, B = G.data.balance.evolution;
    if (!h.adv) return h.level >= B[1].level ? Object.keys(E).filter((k) => E[k].tier === 1 && E[k].base === h.cls) : [];
    if (!h.ult) return h.level >= B[2].level ? Object.keys(E).filter((k) => E[k].tier === 2 && E[k].from === h.adv) : [];
    return [];
  };
  H.nextEvoLevel = (h) => (!h.adv ? G.data.balance.evolution[1].level : !h.ult ? G.data.balance.evolution[2].level : null);
  H.evoCost = (id) => G.data.balance.evolution[G.data.evolutions[id].tier];
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
    if (G.data.evolutions[id].tier === 1) h.adv = id; else h.ult = id;
    G.sys.synergy && G.sys.synergy.invalidate();
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    G.core.bus.emit('hero:evolve', { hero: h.id, evo: id });
    return 'ok';
  };
  H.bench = () => G.state.heroes.filter((h) => G.state.team.indexOf(h.id) < 0);
  G.sys.heroes = H;
})();
