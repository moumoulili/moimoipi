// =====================================================================
//  TAVERNE : recrues à embaucher, renvoi, composition de l'équipe.
// =====================================================================
(function () {
  const B = G.data.balance;
  const T = {};
  const st = () => G.state;
  T.teamSize = () => B.teamSize;      // amélioration de la taverne en phase 7
  T.rosterMax = () => B.rosterMax;
  T.quality = (id) => G.data.recruitQualities.find((q) => q.id === id) || G.data.recruitQualities[0];
  T.avgLevel = () => { const t = G.sys.heroes.team(); return t.length ? Math.round(t.reduce((a, h) => a + h.level, 0) / t.length) : 1; };

  function makeRecruit(rng) {
    const q = rng.weighted(G.data.recruitQualities.map((x) => ({ id: x.id, w: x.w }))).id;
    const cls = 'adventurer'; // toutes les recrues commencent aventurier
    const [a, b] = B.tavern.levelBelowAvg;
    const level = Math.max(1, T.avgLevel() - rng.int(a, b));
    const used = new Set(st().heroes.map((h) => h.name).concat((st().tavern.recruits || []).map((r) => r.name)));
    const pool = G.data.heroNames.filter((n) => !used.has(n));
    return { rid: 'r' + st().nextId++, name: rng.pick(pool.length ? pool : G.data.heroNames), cls, level, quality: q };
  }
  T.price = (r) => B.recruitPrice(r.level, T.quality(r.quality).price);
  T.restock = function () {
    const rng = G.core.rng, tv = st().tavern;
    tv.recruits = [];
    for (let i = 0; i < B.tavern.recruits; i++) tv.recruits.push(makeRecruit(rng));
    tv.refreshAt = Date.now() + B.tavern.refreshMinutes * 60000;
  };
  T.recruits = function () {
    if (!st().tavern.refreshAt || Date.now() >= st().tavern.refreshAt) T.restock();
    return st().tavern.recruits;
  };
  T.refreshCost = () => Math.round(100 * Math.pow(1 + T.avgLevel(), 1.3));
  T.paidRefresh = function () { const c = T.refreshCost(); if (st().gold < c) return false; st().gold -= c; T.restock(); return true; };

  // embaucher : 'ok' | 'gold' | 'full'
  T.hire = function (rid) {
    const tv = st().tavern, r = tv.recruits.find((x) => x.rid === rid);
    if (!r) return 'gone';
    if (st().heroes.length >= T.rosterMax()) return 'full';
    const p = T.price(r);
    if (st().gold < p) return 'gold';
    st().gold -= p;
    tv.recruits.splice(tv.recruits.indexOf(r), 1);
    const h = G.sys.heroes.create(r.cls);
    h.name = r.name; h.level = r.level; h.quality = r.quality; h.sp = (r.level - 1) * B.skillPointsPerLevel;
    // place libre dans l'équipe ? il la rejoint directement (hors expédition)
    if (!G.sys.run.active && st().team.length < T.teamSize()) st().team.push(h.id);
    G.sys.synergy.invalidate();
    G.core.bus.emit('hero:hire', { hero: h.id });
    return 'ok';
  };
  // renvoyer : son équipement retourne au sac
  T.canDismiss = (h) => !G.sys.run.active && st().heroes.length > 1 && (Object.keys(h.equip).length + st().inventory.length <= G.sys.inventory.capacity());
  T.dismiss = function (id) {
    const h = G.sys.heroes.get(id);
    if (!h || !T.canDismiss(h)) return false;
    for (const s in h.equip) st().inventory.push(h.equip[s]);
    st().heroes.splice(st().heroes.indexOf(h), 1);
    st().team = st().team.filter((x) => x !== id);
    if (!st().team.length) st().team.push(st().heroes[0].id);
    G.sys.synergy.invalidate();
    return true;
  };

  // ---------- Composition ----------
  T.canEditTeam = () => !G.sys.run.active;
  T.toggle = function (id) {
    if (!T.canEditTeam()) return 'run';
    const t = st().team, k = t.indexOf(id);
    if (k >= 0) { if (t.length <= 1) return 'min'; t.splice(k, 1); }
    else { if (t.length >= T.teamSize()) return 'max'; t.push(id); }
    G.sys.synergy.invalidate();
    return 'ok';
  };
  T.moveUp = function (id) {
    if (!T.canEditTeam()) return;
    const t = st().team, k = t.indexOf(id);
    if (k > 0) { [t[k - 1], t[k]] = [t[k], t[k - 1]]; }
  };
  G.sys.tavern = T;
})();
