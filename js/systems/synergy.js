// =====================================================================
//  SYNERGIES + BONUS GLOBAUX des héros.
//  bonusesFor(hero) rassemble tous les bonus qui ne viennent pas de
//  l'équipement : synergies (phase 3) ; plus tard compétences passives,
//  ville et rebirth s'ajouteront ici.
// =====================================================================
(function () {
  const Y = {};
  let cacheKey = '', cacheActive = [];

  function matches(syn, team) {
    const n = syn.need;
    const cls = {}, roles = {};
    for (const h of team) { cls[h.cls] = (cls[h.cls] || 0) + 1; const r = G.data.classes[h.cls].role; roles[r] = (roles[r] || 0) + 1; }
    for (const c in n.classes || {}) if ((cls[c] || 0) < n.classes[c]) return false;
    for (const r in n.roles || {}) if ((roles[r] || 0) < n.roles[r]) return false;
    if (n.distinctRoles && Object.keys(roles).length < n.distinctRoles) return false;
    return true;
  }
  // synergies actives pour l'équipe actuelle
  Y.active = function () {
    const team = G.sys.heroes.team();
    const key = team.map((h) => h.cls).join();
    if (key !== cacheKey) { cacheKey = key; cacheActive = G.data.synergies.filter((s) => matches(s, team)); }
    return cacheActive;
  };
  Y.isActive = (id) => Y.active().some((s) => s.id === id);
  function concerns(syn, hero) {
    const t = syn.target;
    if (t === 'all') return true;
    if (t.classes && t.classes.indexOf(hero.cls) >= 0) return true;
    if (t.roles && t.roles.indexOf(G.data.classes[hero.cls].role) >= 0) return true;
    return false;
  }
  // { stat: valeur } pour un héros (seulement s'il fait partie de l'équipe)
  Y.bonusesFor = function (hero) {
    const out = {};
    if (!G.state || G.state.team.indexOf(hero.id) < 0) return out;
    for (const s of Y.active()) {
      if (!concerns(s, hero)) continue;
      for (const k in s.bonus) out[k] = (out[k] || 0) + s.bonus[k];
    }
    return out;
  };
  Y.invalidate = () => { cacheKey = ''; };
  G.sys.synergy = Y;
})();
