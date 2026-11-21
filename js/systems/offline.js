// =====================================================================
//  GAINS HORS LIGNE
//  On mesure le rendement réel des expéditions (or, XP, objets, matériaux
//  par seconde, moyenne glissante), puis on l'applique au temps passé
//  hors de l'appli, limité par le Camp de base (durée max et efficacité).
// =====================================================================
(function () {
  const O = {};
  const U = G.core.U, rng = G.core.rng;
  const st = () => G.state;

  // à la fin de chaque expédition
  O.record = function (lr) {
    if (!lr || lr.time < 60) return;
    const t = lr.time, team = G.sys.heroes.team();
    let xp = 0; for (const h of team) xp += (lr.heroStats[h.id] && lr.heroStats[h.id].xp) || 0;
    const m = {};
    for (const k in lr.mats || {}) m[k] = lr.mats[k] / t;
    const lvl = team.reduce((a, h) => a + h.level, 0) / Math.max(1, team.length);
    const sample = { lvl, gold: lr.kept / t, xp: xp / Math.max(1, team.length) / t, items: (lr.items || 0) / t, kills: lr.kills / t, mats: m, floor: Math.round((lr.startFloor + lr.floor) / 2) };
    const r = st().rate;
    if (!r || !r.samples) { st().rate = Object.assign(sample, { samples: 1 }); return; }
    const a = 0.35, mix = (x, y) => x * (1 - a) + y * a;
    r.gold = mix(r.gold, sample.gold); r.xp = mix(r.xp, sample.xp); r.items = mix(r.items, sample.items); r.kills = mix(r.kills, sample.kills);
    r.floor = Math.round(mix(r.floor, sample.floor)); r.lvl = mix(r.lvl || sample.lvl, sample.lvl);
    for (const k of new Set(Object.keys(r.mats).concat(Object.keys(m)))) r.mats[k] = mix(r.mats[k] || 0, m[k] || 0);
    r.samples++;
  };

  O.compute = function (elapsed) {
    const r = st().rate, camp = G.sys.town.val('camp');
    if (!r || !r.samples) return null;
    const cap = camp.hours * 3600, t = Math.min(elapsed, cap), eff = camp.eff;
    const g = { elapsed, t, capped: elapsed > cap, eff, gold: Math.round(r.gold * t * eff), xp: r.xp * t * eff, kills: Math.round(r.kills * t * eff),
      items: Math.min(150, Math.floor(r.items * t * eff)), mats: {}, floor: r.floor };
    for (const k in r.mats) { const n = Math.floor(r.mats[k] * t * eff); if (n > 0) g.mats[k] = n; }
    return g;
  };

  O.apply = function (g) {
    const S = st();
    S.gold += g.gold; S.stats.totalGold += g.gold; S.stats.kills += g.kills;
    for (const k in g.mats) S.materials[k] = (S.materials[k] || 0) + g.mats[k];
    g.levels = {};
    // l'XP est donnée par tranches : si le héros dépasse le niveau des monstres, elle diminue comme en jeu
    const X = G.sys.xp, ref = X.gapMult(Math.round(S.rate.lvl || 1), g.floor) || 1;
    g.xpReal = 0;
    for (const h of G.sys.heroes.team()) {
      let ups = 0;
      for (let k = 0; k < 20; k++) { const part = (g.xp / 20) * X.gapMult(h.level, g.floor) / ref; g.xpReal += part / G.sys.heroes.team().length; ups += X.add(h, part); }
      if (ups) g.levels[h.id] = ups;
      if (ups && S.settings.autoSkills) G.sys.skills.autoSpend(h);
    }
    const bench = G.sys.heroes.bench();
    for (const h of bench) G.sys.xp.add(h, g.xp * G.data.balance.benchXp);
    g.kept = 0; g.sold = 0; g.soldGold = 0; g.best = null;
    for (let i = 0; i < g.items; i++) {
      const it = G.sys.items.create(rng, { rarity: G.sys.items.rollRarity(rng, g.floor, 0.1), ilvl: Math.max(1, g.floor + rng.int(-1, 1)) });
      const res = G.sys.inventory.receive(it);
      if (res.fate === 'kept' || res.fate === 'equipped') { g.kept++; if (!g.best || G.sys.items.rIdx(it.rarity) > G.sys.items.rIdx(g.best.rarity)) g.best = it; }
      else { g.sold++; g.soldGold += res.gold || 0; }
    }
    G.core.bus.emit('offline:gains', g);
    return g;
  };

  // au chargement ou au retour sur l'appli
  O.check = function () {
    const S = st();
    if (!S || !S.lastSeen) return;
    const elapsed = (Date.now() - S.lastSeen) / 1000;
    S.lastSeen = Date.now();
    if (elapsed < 120) return;
    const g = O.compute(elapsed);
    if (!g || (g.gold <= 0 && g.xp <= 0)) return;
    O.apply(g);
    G.core.save.save();
    G.ui.offlineSummary && G.ui.offlineSummary(g);
  };
  O.durText = function (s) {
    s = Math.floor(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + ' h ' : '') + m + ' min';
  };
  G.sys.offline = O;
})();
