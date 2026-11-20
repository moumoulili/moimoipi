// =====================================================================
//  INVENTAIRE ET ÉQUIPEMENT : ajout (avec tri/vente auto), vente,
//  recyclage, équiper/retirer, comparaison (score), équipement auto.
// =====================================================================
(function () {
  const B = G.data.balance, IT = G.sys.items, U = G.core.U, bus = G.core.bus;
  const I = {};
  const st = () => G.state;
  I.capacity = () => B.inventorySize; // l'entrepôt l'augmentera (phase 7)
  I.full = () => st().inventory.length >= I.capacity();
  I.find = (uid) => st().inventory.find((i) => i.uid === uid);

  // ---------- Score d'un héros (pour comparer les objets) ----------
  I.score = function (hero, equip) {
    const s = G.sys.stats.hero(hero, { equip });
    const c = G.data.classes[hero.cls];
    const f = Math.max(1, st().progress.maxFloor);
    const atk = c.attack.dmgType === 'magic' ? s.matk : s.atk;
    let elem = 0; for (const k in s.elemDmg) elem += s.elemDmg[k];
    const rate = (s.spd / 100) * s.wspd * (1 + s.atkSpd) / (c.attack.interval || 1);
    const off = (atk * s.dmgMult + elem) * (1 + s.crit * (s.critDmg - 1)) * rate * (1 + s.echo) * (1 + s.bossDmg * 0.3);
    const red = s.def / (s.def + B.defK + B.defPerLvl * f);
    const ehp = (s.maxHp / (1 - red) / (1 - s.dodge)) * (1 + s.thorns * 0.3 + s.lifesteal * 2 + s.onKillHeal);
    const util = (1 + s.goldFind * 0.15) * (1 + s.magicFind * 0.15);
    let sc;
    if (c.role === 'tank') sc = Math.pow(off, 0.35) * Math.pow(ehp, 0.65);
    else if (c.role === 'healer') sc = Math.pow(s.matk * s.healMult, 0.6) * Math.pow(ehp, 0.4);
    else sc = Math.pow(off, 0.65) * Math.pow(ehp, 0.35);
    return sc * util;
  };
  I.withItem = function (hero, item, slot) {
    const e = Object.assign({}, hero.equip);
    e[slot] = item;
    return e;
  };
  // gain relatif (0.1 = +10 %) si on équipe item à slot
  I.gain = function (hero, item, slot) {
    const a = I.score(hero, hero.equip), b = I.score(hero, I.withItem(hero, item, slot));
    return a > 0 ? b / a - 1 : 1;
  };
  // meilleur emplacement d'un objet pour un héros
  I.bestSlot = function (hero, item) {
    let best = null;
    for (const slot of IT.slotsFor(item)) {
      const g = I.gain(hero, item, slot);
      if (!best || g > best.gain) best = { slot, gain: g };
    }
    return best;
  };
  // l'objet améliore-t-il un membre de l'équipe ? -> {hero, slot, gain}
  I.upgradeFor = function (item) {
    let best = null;
    for (const h of G.sys.heroes.team()) {
      if (!IT.canUse(h, item)) continue;
      const b = I.bestSlot(h, item);
      if (b.gain > 0.005 && (!best || b.gain > best.gain)) best = { hero: h, slot: b.slot, gain: b.gain };
    }
    return best;
  };

  // ---------- Vente / recyclage ----------
  function removeInv(item) { const a = st().inventory, k = a.indexOf(item); if (k >= 0) a.splice(k, 1); }
  I.sell = function (item, silent) {
    removeInv(item);
    const g = IT.value(item);
    st().gold += g; st().stats.itemsSold = (st().stats.itemsSold || 0) + 1;
    if (!silent) bus.emit('item:sell', { item, gold: g });
    return g;
  };
  I.salvage = function (item) {
    removeInv(item);
    const mats = IT.salvageOf(item);
    for (const k in mats) st().materials[k] = (st().materials[k] || 0) + mats[k];
    bus.emit('item:salvage', { item });
    return mats;
  };
  I.matsText = function (mats) {
    return Object.keys(mats).map((k) => '+' + mats[k] + ' ' + G.data.materials[k].name).join(', ');
  };
  // vend ou recycle tous les objets <= rareté (hors verrouillés et améliorations)
  I.bulk = function (maxRarityIdx, action) {
    const list = st().inventory.filter((i) => !i.locked && IT.rIdx(i.rarity) <= maxRarityIdx && !I.upgradeFor(i));
    let gold = 0; const mats = {};
    for (const it of list) {
      if (action === 'salvage') { const m = I.salvage(it); for (const k in m) mats[k] = (mats[k] || 0) + m[k]; }
      else gold += I.sell(it, true);
    }
    return { n: list.length, gold, mats };
  };

  // ---------- Réception d'un objet (butin) ----------
  // renvoie ce qui s'est passé : 'kept' | 'sold' | 'salvaged'
  I.receive = function (item) {
    const S = st(), rule = S.settings.autoSell;
    const ri = IT.rIdx(item.rarity);
    const up = I.upgradeFor(item);
    let fate = 'kept';
    if (ri <= rule.maxRarity && !(rule.keepUpgrades && up)) fate = rule.action === 'salvage' ? 'salvaged' : 'sold';
    else if (I.full()) fate = 'sold';
    S.stats.itemsFound = (S.stats.itemsFound || 0) + 1;
    if (fate === 'sold') { S.inventory.push(item); const g = I.sell(item, true); return { fate, gold: g }; }
    if (fate === 'salvaged') { S.inventory.push(item); const m = I.salvage(item); return { fate, mats: m }; }
    item.isNew = true;
    S.inventory.push(item);
    if (up && S.settings.autoEquip) { I.equip(up.hero, item, up.slot); return { fate: 'equipped', up }; }
    return { fate, up };
  };

  // ---------- Équiper / retirer ----------
  I.equip = function (hero, item, slot) {
    if (!IT.canUse(hero, item)) return false;
    slot = slot || I.bestSlot(hero, item).slot;
    removeInv(item);
    // si l'objet était porté par un autre héros
    const old = hero.equip[slot];
    if (old) st().inventory.push(old);
    item.isNew = false;
    hero.equip[slot] = item;
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    bus.emit('item:equip', { hero: hero.id, item });
    return true;
  };
  I.unequip = function (hero, slot) {
    const it = hero.equip[slot];
    if (!it || I.full()) return false;
    delete hero.equip[slot];
    st().inventory.push(it);
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    return true;
  };
  // équipe automatiquement le meilleur de l'inventaire
  I.autoEquip = function (hero) {
    let changed = 0;
    for (const slot of G.data.slotOrder) {
      const accepts = G.data.slots[slot].accepts || slot;
      let best = null, bestScore = I.score(hero, hero.equip) * 1.001;
      for (const it of st().inventory) {
        if (IT.base(it).slot !== accepts || !IT.canUse(hero, it)) continue;
        const sc = I.score(hero, I.withItem(hero, it, slot));
        if (sc > bestScore) { bestScore = sc; best = it; }
      }
      if (best) { I.equip(hero, best, slot); changed++; }
    }
    return changed;
  };
  I.autoEquipTeam = function () { let n = 0; for (const h of G.sys.heroes.team()) n += I.autoEquip(h); return n; };
  G.sys.inventory = I;
})();
