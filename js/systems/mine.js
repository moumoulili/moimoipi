// =====================================================================
//  MINE (jeu de toucher) + ATELIER (fabrication d'équipement)
//  state.mine = { ores{id:n}, sel, hp, power, auto, crit, depth, broken }
// =====================================================================
(function () {
  const B = G.data.balance, M = {};
  const rng = G.core.rng;
  const st = () => G.state.mine;
  M.ore = (id) => G.data.oreById[id || st().sel];
  M.unlocked = () => G.data.ores.filter((o) => o.tier <= st().depth);
  M.topOre = () => M.unlocked()[M.unlocked().length - 1];
  M.maxHp = (id) => B.mine.oreHp(M.ore(id).tier);
  M.power = () => B.mine.power(st().power);
  M.dps = () => B.mine.autoDps(st().auto, M.power());
  M.critChance = () => B.mine.crit(st().crit);

  M.select = function (id) {
    if (!M.unlocked().some((o) => o.id === id)) return;
    st().sel = id; st().hp = M.maxHp(id);
  };
  // inflige des dégâts au rocher ; renvoie le nombre de minerais obtenus
  function hit(dmg) {
    const s = st();
    s.hp -= dmg;
    let got = 0;
    while (s.hp <= 0) { got++; s.hp += M.maxHp(); }
    if (got) { s.ores[s.sel] = (s.ores[s.sel] || 0) + got; s.broken = (s.broken || 0) + got; G.core.bus.emit('mine:ore', { id: s.sel, n: got }); }
    return got;
  }
  // un toucher du joueur
  M.tap = function () {
    const crit = rng.chance(M.critChance());
    const dmg = M.power() * (crit ? B.mine.critMult : 1);
    return { dmg, crit, got: hit(dmg) };
  };
  // auto-minage (appelé par la boucle de jeu, en temps réel)
  M.update = function (dt) { if (st().auto > 0) return hit(M.dps() * dt); return 0; };

  // ---------- Améliorations ----------
  M.upCost = function (k) {
    const c = B.mine.up[k](st()[k]);
    return { gold: c.gold, ore: { id: M.topOre().id, n: c.ore } };
  };
  M.depthCost = function () {
    if (st().depth >= G.data.ores.length) return null;
    const c = B.mine.depth(st().depth);
    return { gold: c.gold, ore: { id: M.topOre().id, n: c.ore } };
  };
  M.afford = (c) => c && G.state.gold >= c.gold && (st().ores[c.ore.id] || 0) >= c.ore.n;
  function pay(c) { G.state.gold -= c.gold; st().ores[c.ore.id] -= c.ore.n; }
  M.upgrade = function (k) {
    if (st()[k] >= B.mine.maxLevel[k]) return 'max';
    const c = M.upCost(k);
    if (!M.afford(c)) return 'cost';
    pay(c); st()[k]++;
    return 'ok';
  };
  M.dig = function () {
    const c = M.depthCost();
    if (!c) return 'max';
    if (!M.afford(c)) return 'cost';
    pay(c); st().depth++;
    M.select(M.topOre().id);
    return 'ok';
  };
  M.costText = (c) => G.core.U.fmt(c.gold) + ' or · ' + c.ore.n + ' ' + M.ore(c.ore.id).name.toLowerCase();

  // ---------- Atelier ----------
  M.craftCost = function (base, oreId) {
    const b = G.data.itemBases[base], o = M.ore(oreId), ilvl = B.craft.ilvl(o.tier);
    return { gold: B.craft.gold(ilvl), ore: { id: oreId, n: B.craft.ore[b.cat] || 8 }, ilvl };
  };
  M.canCraft = (base, oreId) => !G.sys.inventory.full() && M.afford(M.craftCost(base, oreId));
  M.craft = function (base, oreId) {
    const c = M.craftCost(base, oreId), o = M.ore(oreId);
    if (G.sys.inventory.full()) return 'full';
    if (!M.afford(c)) return 'cost';
    pay(c);
    const it = G.sys.items.create(rng, { base, ilvl: c.ilvl, rarity: G.sys.items.rollRarity(rng, c.ilvl, B.craft.mf(o.tier), B.craft.minRarity(o.tier)) });
    it.crafted = oreId; it.isNew = true;
    G.state.inventory.push(it);
    G.core.bus.emit('mine:craft', { item: it });
    return it;
  };
  G.sys.mine = M;
})();
