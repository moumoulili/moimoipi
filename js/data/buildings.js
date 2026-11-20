// =====================================================================
//  BÂTIMENTS DE LA VILLE. cost(niveau actuel) = prix du niveau suivant.
//  Phase 1 : seul le Portail existe. Forge, taverne, temple, bibliothèque,
//  boutique et entrepôt seront ajoutés ici en phase 7.
// =====================================================================
G.data.buildings = {
  portal: {
    name: 'Portail des profondeurs', icon: '🌀',
    desc: 'Permet de commencer une expédition plus profond. Chaque niveau débloque un point de départ de plus (étage 6, 11, 16…), à condition d\'avoir déjà vaincu le gardien de l\'étage précédent.',
    maxLevel: 40,
    cost: (lvl) => Math.round(2500 * Math.pow(3, lvl)),
    effect: (lvl) => (lvl ? 'Départ jusqu\'à l\'étage ' + (lvl * 5 + 1) : 'Départ à l\'étage 1 uniquement'),
  },
};
