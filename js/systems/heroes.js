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
    const h = { id: 'h' + (st.nextId++), name, cls, level: 1, xp: 0, equip: {} };
    st.heroes.push(h);
    return h;
  };
  H.createStarting = function () {
    G.state.team = G.data.startingTeam.map((cls) => H.create(cls).id);
  };
  H.get = (id) => G.state.heroes.find((h) => h.id === id);
  H.team = () => G.state.team.map(H.get).filter(Boolean);
  G.sys.heroes = H;
})();
