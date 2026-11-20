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
  T.canBuy = (id) => !T.isMax(id) && G.state.gold >= T.cost(id);
  T.buy = function (id) {
    if (!T.canBuy(id)) return false;
    G.state.gold -= T.cost(id);
    G.state.town.buildings[id] = T.level(id) + 1;
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
  G.sys.town = T;
})();
