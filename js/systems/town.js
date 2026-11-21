// =====================================================================
//  VILLE : niveaux des bâtiments, achats d'améliorations, et points de
//  départ autorisés pour les expéditions.
// =====================================================================
(function () {
  const T = {};
  const B = G.data.balance;
  T.level = (id) => (G.state.town.buildings[id] || 0);
  T.cost = (id) => G.data.buildings[id].cost(T.level(id));
  T.isMax = (id) => T.level(id) >= G.data.buildings[id].maxLevel;
  T.canBuy = (id) => !T.isMax(id) && G.sys.heroes.canAfford(T.cost(id));
  // valeurs actuelles d'un bâtiment (ex. T.val('warehouse').inv)
  T.val = (id) => G.data.buildings[id].val(T.level(id));
  T.buy = function (id) {
    if (!T.canBuy(id)) return false;
    G.sys.heroes.pay(T.cost(id));
    G.state.town.buildings[id] = T.level(id) + 1;
    if (id === 'library') T.syncLibrary();
    G.sys.synergy && G.sys.synergy.invalidate();
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    G.core.bus.emit('building:upgrade', { id, level: T.level(id) });
    if (id === 'portal') { const s = T.startFloors(); G.state.settings.startFloor = s[s.length - 1]; }
    G.core.save.save();
    return true;
  };
  // départs possibles : étage 1 + (5k+1) si portail niveau >= k ET gardien 5k vaincu
  T.startFloors = function () {
    const out = [1], lvl = T.level('portal'), maxCp = G.state.progress.maxCheckpoint;
    for (let k = 1; k <= lvl; k++) {
      const f = k * B.checkpointEvery;
      if (f > maxCp) break;
      out.push(f + 1);
    }
    return out;
  };
  T.canStartAt = (f) => T.startFloors().indexOf(f) >= 0;
  // bibliothèque : chaque niveau offre 1 point de compétence à chaque héros (y compris les futures recrues)
  T.syncLibrary = function () {
    const l = T.level('library');
    for (const h of G.state.heroes) { const d = l - (h.libSp || 0); if (d > 0) { h.sp = (h.sp || 0) + d; h.libSp = l; } }
  };
  // bonus de la ville appliqués aux stats des héros
  T.deathKeep = () => Math.min(1, B.deathKeep + T.val('temple').deathKeep);
  T.heroBonus = () => ({ healPower: T.val('temple').healPower });
  G.sys.town = T;
})();
