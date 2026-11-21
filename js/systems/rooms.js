// =====================================================================
//  SALLES SPÉCIALES ET BÉNÉDICTIONS
//  fontaine (soin), autel (bénédiction), marchand, événements à choix.
//  Les bénédictions durent jusqu'à la fin de l'expédition (run.saved.blessings).
// =====================================================================
(function () {
  const B = G.data.balance, U = G.core.U;
  const Rm = {};
  const rng = G.core.rng;
  const fx = () => G.render.fx;

  // bonus des bénédictions actives
  Rm.blessingStats = function (run) {
    const out = {};
    for (const id of (run && run.saved.blessings) || []) {
      const b = G.data.blessings[id].bonus;
      for (const k in b) out[k] = (out[k] || 0) + b[k];
    }
    return out;
  };
  Rm.bless = function (run, id) {
    const all = Object.keys(G.data.blessings), have = run.saved.blessings = run.saved.blessings || [];
    if (id === 'random' || !id) { const pool = all.filter((x) => have.indexOf(x) < 0); id = rng.pick(pool.length ? pool : all); }
    have.push(id);
    G.sys.run.refreshStats();
    const bl = G.data.blessings[id];
    for (const h of run.heroes) if (!h.dead) { fx().beam(h.x, h.y - 3, h.x, h.y, '#ffd34d', 0.5); fx().sparkle(h.x, h.y, '#ffd34d', 8); }
    G.ui.log(bl.icon + ' ' + bl.name + ' : ' + bl.desc + ' jusqu\'à la fin de l\'expédition.', 'gold');
    G.ui.toast(bl.icon + ' ' + bl.name, 'gold');
    return id;
  };

  Rm.interact = function (run, sp) {
    sp.used = true;
    const S = G.state;
    if (sp.kind === 'fountain') {
      const f = G.data.specialRooms.fountain;
      for (const h of run.heroes) if (!h.dead) {
        h.hp = Math.min(h.stats.maxHp, h.hp + h.stats.maxHp * f.heal); h.mp = Math.min(h.stats.maxMp, h.mp + h.stats.maxMp * f.mana);
        fx().ring(h.x, h.y, '#7fd8ff', 0.8, 0.5); fx().sparkle(h.x, h.y, '#9af0ff', 10);
      }
      fx().ring(sp.x + 0.5, sp.y + 0.5, '#7fd8ff', 3, 0.7);
      G.ui.log('⛲ La fontaine soigne l\'équipe (+50 % PV et mana).', 'info');
    } else if (sp.kind === 'altar') {
      Rm.bless(run, 'random');
      fx().ring(sp.x + 0.5, sp.y + 0.5, '#ffd34d', 2.5, 0.7); fx().flash('#fff3c0', 0.12);
    } else if (sp.kind === 'merchant') {
      if (S.settings.merchantMode === 'skip') { G.ui.log('🧳 Vous ignorez le marchand ambulant.', 'muted'); return; }
      sp.offers = Rm.merchantOffers(run);
      run.state = 'merchant';
      G.ui.merchantPrompt && G.ui.merchantPrompt(run, sp);
    } else if (sp.kind === 'event') {
      const ev = G.data.events.find((e) => e.id === sp.event) || G.data.events[0];
      if (S.settings.eventMode === 'auto') { Rm.resolveEvent(run, ev, ev.choices.findIndex((c) => c.safe)); return; }
      run.state = 'event';
      G.ui.eventPrompt && G.ui.eventPrompt(run, ev);
    }
    G.core.bus.emit('room:special', { kind: sp.kind, floor: run.saved.floor });
  };

  // ---------- Marchand ----------
  Rm.merchantOffers = function (run) {
    const f = run.saved.floor, d = G.data.specialRooms.merchant.discount, IT = G.sys.items;
    const offers = [
      { kind: 'potion', id: 'heal', n: 3, price: Math.round(G.sys.shop.potionPrice('heal') * 3 * d) },
      { kind: 'potion', id: 'mana', n: 3, price: Math.round(G.sys.shop.potionPrice('mana') * 3 * d) },
    ];
    for (let i = 0; i < G.data.specialRooms.merchant.items; i++) {
      const it = IT.create(rng, { rarity: IT.rollRarity(rng, f, 0.5, 'rare'), ilvl: f + 1 });
      offers.push({ kind: 'item', item: it, price: Math.round(IT.value(it) * 3) });
    }
    return offers;
  };
  Rm.buy = function (offer) {
    const S = G.state;
    if (offer.sold || S.gold < offer.price) return false;
    if (offer.kind === 'item') { if (G.sys.inventory.full()) return false; S.gold -= offer.price; offer.item.isNew = true; S.inventory.push(offer.item); }
    else { S.gold -= offer.price; S.potions[offer.id] = Math.min(G.sys.shop.maxPotions() + offer.n, (S.potions[offer.id] || 0) + offer.n); }
    offer.sold = true;
    return true;
  };
  Rm.leave = function () { const run = G.sys.run.active; if (run && (run.state === 'merchant' || run.state === 'event')) run.state = 'explore'; };

  // ---------- Événements ----------
  Rm.choiceAvailable = (c) => !c.needPotion || (G.state.potions[c.needPotion] || 0) > 0;
  Rm.resolveEvent = function (run, ev, ci) {
    let c = ev.choices[ci];
    if (!c || !Rm.choiceAvailable(c)) c = ev.choices.find((x) => x.safe);
    const o = rng.weighted(c.outcomes);
    const f = run.saved.floor, L = run.heroes.find((h) => !h.dead) || run.heroes[0];
    if (o.gold) { const g = Math.round(B.goldPerMonster(f) * o.gold * rng.float(0.8, 1.2)); run.saved.gold += g; fx().coins(L.x, L.y, g); }
    if (o.betWin) { const g = Math.round(run.saved.gold * o.betWin); run.saved.gold += g; fx().coins(L.x, L.y, g); }
    if (o.betLose) run.saved.gold = Math.round(run.saved.gold * (1 - o.betLose));
    if (o.potionCost) G.state.potions[o.potionCost] = Math.max(0, (G.state.potions[o.potionCost] || 0) - 1);
    if (o.bless) Rm.bless(run, o.bless);
    if (o.hurt) for (const h of run.heroes) if (!h.dead) { h.hp = Math.max(1, h.hp - h.stats.maxHp * o.hurt); fx().burst(h.x, h.y, '#a46bff', 8); }
    if (o.mana) for (const h of run.heroes) if (!h.dead) { h.mp = Math.min(h.stats.maxMp, h.mp + h.stats.maxMp * o.mana); fx().sparkle(h.x, h.y, '#7aa8ff', 8); }
    if (o.item) G.sys.loot.giveItem(run, G.sys.items.create(rng, { rarity: G.sys.items.rollRarity(rng, f, 0.3, o.item), ilvl: f + 1 }), L.x, L.y);
    if (o.fight) {
      const biome = run.map.biome;
      for (let k = 0; k < o.fight; k++) {
        let px = L.x, py = L.y;
        for (let t = 0; t < 15; t++) { const a = rng.next() * 6.28, d = rng.float(1.5, 3); const x = L.x + Math.cos(a) * d, y = L.y + Math.sin(a) * d; if (G.sys.path.free(run.map, x, y)) { px = x; py = y; break; } }
        const m = G.sys.combat.monsterUnit({ id: rng.pick(biome.monsters), x: Math.floor(px), y: Math.floor(py), room: -1, elite: true }, f);
        m.x = px; m.y = py; m.aggro = true;
        run.monsters.push(m); run.units.push(m);
        fx().ring(px, py, '#ff4040', 0.9, 0.4);
      }
    }
    G.ui.log(ev.icon + ' ' + ev.title + ' — ' + c.label + ' : ' + o.text, o.hurt || o.fight || o.betLose ? 'danger' : 'info');
    G.ui.toast(ev.icon + ' ' + G.core.U.esc(o.text));
    if (run.state === 'event') run.state = 'explore';
  };
  G.sys.rooms = Rm;
})();
