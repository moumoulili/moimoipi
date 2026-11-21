// =====================================================================
//  COLLECTION DE CARTES : tirage au moment d'une victoire, étoiles,
//  bonus permanents pour tous les héros (mis en cache).
//  state.cards = { idCarte: étoiles }
// =====================================================================
(function () {
  const C = {};
  const rng = G.core.rng;
  let cache = null;
  const st = () => G.state.cards;
  C.stars = (id) => st()[id] || 0;
  C.owned = () => Object.keys(st()).filter((k) => st()[k] > 0).length;
  C.total = () => G.data.cards.length;
  C.bonusOf = (card, stars) => { const b = {}; for (const k in card.bonus) b[k] = card.bonus[k] * stars; return b; };
  // bonus de toute la collection (ajouté aux stats de chaque héros)
  C.bonus = function () {
    if (cache) return cache;
    const out = {};
    for (const c of G.data.cards) { const s = C.stars(c.id); if (!s) continue; for (const k in c.bonus) out[k] = (out[k] || 0) + c.bonus[k] * s; }
    return (cache = out);
  };
  C.invalidate = () => { cache = null; };

  // appelé à la mort d'un monstre
  C.onKill = function (run, m) {
    if (m.summoned) return null;
    const D = G.data.cardDrop;
    const id = m.guardian ? m.bossId : m.id;
    const card = id && G.data.cardById[id];
    if (!card) return null;
    const chance = (m.guardian ? D[m.guardian] : m.elite ? D.elite : D.normal) * (1 + Math.min(1, (run.magicFind || 0) * 0.5));
    if (!rng.chance(chance)) return null;
    return C.give(card.id, m.x, m.y);
  };
  C.give = function (id, x, y) {
    const card = G.data.cardById[id], before = C.stars(id), max = G.data.cardDrop.maxStars;
    const res = { card, isNew: before === 0, stars: Math.min(max, before + 1), maxed: before >= max };
    if (res.maxed) { const g = Math.round(G.data.balance.goldPerMonster(Math.max(1, G.sys.dungeon.bestLevel())) * 50); G.state.gold += g; res.gold = g; }
    else st()[id] = res.stars;
    C.invalidate();
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    if (x != null) { const fx = G.render.fx; fx.beam(x, y - 4, x, y, '#c78bff', 0.8); fx.ring(x, y, '#c78bff', 1.6, 0.7); fx.sparkle(x, y, '#e0c8ff', 24); fx.flash('#e0c8ff', 0.15); }
    G.ui.log({ html: '🃏 <b>Carte ' + (res.isNew ? 'obtenue' : res.maxed ? 'en double (max)' : '★' + res.stars) + ' : ' + G.core.U.esc(card.name) + '</b>' }, 'gold');
    G.ui.cardPop && G.ui.cardPop(res);
    G.sys.audio && G.sys.audio.sfx('loot');
    G.core.U.vibrate([80, 60, 80, 60, 200]);
    G.core.bus.emit('card:drop', res);
    G.core.save.save();
    return res;
  };
  C.bonusText = function (b) { return Object.keys(b).map((k) => G.sys.items.fmtStat(k, b[k])).join(', '); };
  G.sys.cards = C;
})();
