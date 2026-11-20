// =====================================================================
//  OBJETS : création (rareté, bonus aléatoires, uniques, mythiques),
//  nom, stats, prix de vente, recyclage, et qui peut les porter.
//  Un objet sauvegardé : { uid, base, rarity, ilvl, dmg?, implicit{},
//  affixes:[{stat, v, special?}], unique?, name, locked?, isNew? }
// =====================================================================
(function () {
  const B = G.data.balance;
  const IT = {};
  const D = () => G.data;
  IT.rarity = (id) => D().rarities[D().rarityIndex[id]];
  IT.rIdx = (id) => D().rarityIndex[id];
  IT.base = (item) => D().itemBases[item.base];

  // valeur d'une stat selon son type, le niveau de l'objet et la rareté
  IT.scaleVal = function (stat, base, ilvl, rmult) {
    let v;
    if (D().pctStats[stat]) v = base * rmult * (1 + 0.004 * ilvl);
    else if (stat === 'spd') v = base * rmult * (1 + 0.01 * ilvl);
    else v = base * B.itemPower(ilvl) * rmult;
    return D().pctStats[stat] ? Math.round(v * 1000) / 1000 : v >= 10 ? Math.round(v) : Math.round(v * 10) / 10;
  };

  // tirage de la rareté ; mf = chance de butin ; minId = rareté minimale
  IT.rollRarity = function (rng, floor, mf, minId) {
    const minI = minId ? IT.rIdx(minId) : 0;
    const list = [];
    D().rarities.forEach((r, i) => {
      if (i < minI || floor < r.minFloor) return;
      const w = r.weight * (i > 0 ? Math.pow(1 + (mf || 0), i) * Math.pow(1 + floor * 0.01, i) : 1);
      list.push({ id: r.id, w });
    });
    if (!list.length) return D().rarities[minI].id;
    return rng.weighted(list).id;
  };

  IT.randomBase = function (rng) {
    const ids = Object.keys(D().itemBases);
    return rng.pick(ids);
  };

  function pickAffixes(rng, item, n, exclude) {
    const slot = IT.base(item).slot;
    const taken = new Set(exclude || []);
    const out = [];
    for (let k = 0; k < n; k++) {
      const pool = D().affixes.filter((a) => !taken.has(a.stat) && (!a.slots || a.slots.indexOf(slot) >= 0));
      if (!pool.length) break;
      const a = rng.weighted(pool);
      taken.add(a.stat);
      const r = IT.rarity(item.rarity);
      out.push({ stat: a.stat, v: IT.scaleVal(a.stat, a.base * rng.float(0.7, 1.05), item.ilvl, r.statMult) });
    }
    return out;
  }

  // opts : { base, rarity, ilvl, uniqueId }
  IT.create = function (rng, opts) {
    const st = G.state;
    let base = opts.base || IT.randomBase(rng);
    let unique = null;
    if (opts.uniqueId) unique = D().uniques.find((u) => u.id === opts.uniqueId);
    else if (opts.rarity === 'legendary' && rng.chance(B.uniqueChance)) {
      const pool = D().uniques.filter((u) => !opts.base || u.base === opts.base);
      if (pool.length) unique = rng.pick(pool);
    }
    if (unique) base = unique.base;
    const rarity = unique ? 'legendary' : opts.rarity || 'common';
    const ilvl = Math.max(1, opts.ilvl || 1);
    const b = D().itemBases[base], r = IT.rarity(rarity);
    const item = { uid: 'i' + st.nextId++, base, rarity, ilvl, implicit: {}, affixes: [] };
    if (b.dmg) item.dmg = Math.round(b.dmg * B.itemPower(ilvl) * r.statMult * rng.float(0.9, 1.1) * 10) / 10;
    for (const k in b.implicit || {}) item.implicit[k] = IT.scaleVal(k, b.implicit[k], ilvl, r.statMult);
    if (unique) {
      item.unique = unique.id;
      for (const k in unique.fixed) item.affixes.push({ stat: k, v: IT.scaleVal(k, unique.fixed[k], ilvl, 1.3), special: true });
      item.affixes = item.affixes.concat(pickAffixes(rng, item, 1, Object.keys(unique.fixed)));
    } else {
      item.affixes = pickAffixes(rng, item, r.affixes);
      if (rarity === 'mythic') {
        const p = rng.pick(D().mythicPowers);
        const ex = item.affixes.find((a) => a.stat === p.stat);
        if (ex) ex.v += p.value, ex.special = true; else item.affixes.push({ stat: p.stat, v: p.value, special: true });
      }
    }
    item.name = IT.makeName(item);
    return item;
  };

  IT.makeName = function (item) {
    if (item.unique) return D().uniques.find((u) => u.id === item.unique).name;
    const b = IT.base(item);
    const main = item.affixes.find((a) => !a.special) || null;
    const af = main && D().affixes.find((a) => a.stat === main.stat);
    let n = b.name + (af ? ' ' + af.suffix : '');
    if (item.rarity === 'mythic') n += ' mythique';
    return n;
  };

  // toutes les stats d'un objet additionnées { stat: valeur }
  IT.stats = function (item) {
    const s = {};
    for (const k in item.implicit) s[k] = (s[k] || 0) + item.implicit[k];
    for (const a of item.affixes) s[a.stat] = (s[a.stat] || 0) + a.v;
    return s;
  };
  IT.fmtStat = function (stat, v) {
    const name = D().statNames[stat] || stat;
    if (D().pctStats[stat]) return '+' + Math.round(v * 1000) / 10 + ' % ' + name;
    return '+' + (v >= 100 ? G.core.U.fmt(v) : Math.round(v * 10) / 10) + ' ' + name;
  };
  IT.lines = function (item) {
    const out = [];
    const b = IT.base(item);
    if (item.dmg) out.push({ t: (b.dmgType === 'magic' ? 'Puissance magique ' : 'Dégâts ') + Math.round(item.dmg * 10) / 10 + (b.spd !== 1 ? ' · vitesse ' + (b.spd > 1 ? '+' : '') + Math.round((b.spd - 1) * 100) + ' %' : ''), cls: 'main' });
    for (const k in item.implicit) out.push({ t: IT.fmtStat(k, item.implicit[k]), cls: 'implicit' });
    for (const a of item.affixes) out.push({ t: IT.fmtStat(a.stat, a.v), cls: a.special ? 'special' : '' });
    if (item.unique) out.push({ t: D().uniques.find((u) => u.id === item.unique).desc, cls: 'desc' });
    return out;
  };
  IT.value = (item) => Math.max(1, Math.round(B.goldPerMonster(item.ilvl) * B.itemSellBase * IT.rarity(item.rarity).sellMult));
  IT.salvageOf = (item) => B.salvage[IT.rIdx(item.rarity)];

  IT.slotsFor = (item) => (IT.base(item).slot === 'ring' ? ['ring1', 'ring2'] : [IT.base(item).slot]);
  IT.canUse = function (hero, item) {
    const b = IT.base(item), cg = D().classGear[hero.cls];
    if (!cg) return true;
    if (b.cat === 'weapon') return cg.weapons.indexOf(item.base) >= 0;
    if (b.cat === 'offhand') return cg.offhand.indexOf(item.base) >= 0;
    if (b.cat === 'armor') return cg.armor.indexOf(b.weight) >= 0;
    return true;
  };
  IT.usersText = function (item) {
    const names = Object.keys(D().classGear).filter((c) => IT.canUse({ cls: c }, item)).map((c) => D().classes[c].name);
    return names.length === Object.keys(D().classGear).length ? 'Toutes les classes' : names.join(', ');
  };
  G.sys.items = IT;
})();
