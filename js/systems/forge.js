// =====================================================================
//  FORGE : améliorer un objet (+1, +2…) et relancer un bonus aléatoire.
//  Coûts en or et en matériaux (balance.forge).
// =====================================================================
(function () {
  const B = G.data.balance, IT = G.sys.items, H = G.sys.heroes;
  const F = {};
  const rng = G.core.rng;
  const fv = () => G.sys.town.val('forge');
  // réduction de la forge de la ville sur l'or (les matériaux restent les mêmes)
  const disc = (c) => Object.assign({}, c, { gold: Math.round((c.gold || 0) * (1 - fv().discount)) });
  F.maxUp = () => fv().maxUp;
  F.upCost = (item) => disc(B.forge.upCost(item, item.up || 0));
  F.upChance = (item) => Math.min(1, B.forge.upChance(item.up || 0) + fv().chance);
  F.costText = function (c) {
    const parts = [];
    if (c.gold) parts.push(G.core.U.fmt(c.gold) + ' or');
    for (const k in c.mats || {}) parts.push(c.mats[k] + ' ' + G.data.materials[k].icon);
    return parts.join(' · ');
  };
  function rename(item) {
    item.name = IT.makeName(item) + (item.up ? ' +' + item.up : '');
  }
  // 'ok' | 'fail' | 'max' | 'cost'
  F.upgrade = function (item) {
    if ((item.up || 0) >= F.maxUp()) return 'max';
    const c = F.upCost(item);
    if (!H.canAfford(c)) return 'cost';
    H.pay(c);
    if (!rng.chance(F.upChance(item))) { G.core.bus.emit('forge:fail', { item }); return 'fail'; }
    item.up = (item.up || 0) + 1;
    rename(item);
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    G.core.bus.emit('forge:upgrade', { item, up: item.up });
    return 'ok';
  };
  // relancer le bonus n°idx (les bonus spéciaux des uniques/mythiques ne se relancent pas)
  F.rerollCost = (item) => disc(B.forge.rerollCost(item));
  F.reroll = function (item, idx) {
    const a = item.affixes[idx];
    if (!a || a.special) return 'locked';
    const c = F.rerollCost(item);
    if (!H.canAfford(c)) return 'cost';
    H.pay(c);
    const slot = IT.base(item).slot, taken = new Set(item.affixes.map((x) => x.stat));
    const pool = G.data.affixes.filter((x) => (!taken.has(x.stat) || x.stat === a.stat) && (!x.slots || x.slots.indexOf(slot) >= 0));
    const n = rng.weighted(pool);
    item.affixes[idx] = { stat: n.stat, v: IT.scaleVal(n.stat, n.base * rng.float(0.7, 1.05), item.ilvl, IT.rarity(item.rarity).statMult) };
    rename(item);
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    return 'ok';
  };
  G.sys.forge = F;
})();
