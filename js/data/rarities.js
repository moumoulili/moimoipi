// =====================================================================
//  RARETÉS : poids de tirage, nombre de bonus aléatoires, puissance.
//  statMult multiplie toutes les valeurs ; sellMult le prix de vente.
// =====================================================================
G.data.rarities = [
  { id: 'common',    name: 'Commun',     color: '#b8b8c0', weight: 60,  affixes: 0, statMult: 1.0,  sellMult: 1,  minFloor: 1 },
  { id: 'uncommon',  name: 'Peu commun', color: '#5ad65a', weight: 25,  affixes: 1, statMult: 1.12, sellMult: 2,  minFloor: 1 },
  { id: 'rare',      name: 'Rare',       color: '#4a9fff', weight: 10,  affixes: 2, statMult: 1.28, sellMult: 5,  minFloor: 1 },
  { id: 'epic',      name: 'Épique',     color: '#b45cff', weight: 4,   affixes: 3, statMult: 1.48, sellMult: 12, minFloor: 3 },
  { id: 'legendary', name: 'Légendaire', color: '#ff9a2e', weight: 0.9, affixes: 4, statMult: 1.72, sellMult: 30, minFloor: 8 },
  { id: 'mythic',    name: 'Mythique',   color: '#ff3b5c', weight: 0.1, affixes: 5, statMult: 2.0,  sellMult: 80, minFloor: 30 },
];
G.data.rarityIndex = {};
G.data.rarities.forEach((r, i) => (G.data.rarityIndex[r.id] = i));
