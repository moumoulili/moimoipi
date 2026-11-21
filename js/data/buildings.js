// =====================================================================
//  BÂTIMENTS DE LA VILLE
//  cost(niveau actuel) = prix du niveau suivant { gold, mats }
//  val(niveau) = valeurs utilisées par le jeu ; effect(niveau) = texte.
// =====================================================================
(function () {
  // coût générique : or x croissance^niveau + ferraille, puis poussière (niv. 3+), puis éther (niv. 6+)
  const cost = (base, growth) => (lvl) => ({
    gold: Math.round(base * Math.pow(growth, lvl)),
    mats: Object.assign({ scrap: 10 * (lvl + 1) }, lvl >= 3 ? { dust: 3 * (lvl - 2) } : {}, lvl >= 6 ? { ether: lvl - 5 } : {}),
  });
  const P = (v) => Math.round(v * 100) + ' %';
  G.data.buildings = {
    portal: {
      name: 'Portail des profondeurs', icon: '🌀', maxLevel: 40,
      desc: 'Permet de commencer une expédition plus profond : chaque niveau débloque un point de départ de plus (étage 6, 11, 16…), si le gardien de l\'étage précédent a été vaincu.',
      cost: (lvl) => ({ gold: Math.round(2500 * Math.pow(3, lvl)) }),
      effect: (lvl) => (lvl ? 'Départ jusqu\'à l\'étage ' + (lvl * 5 + 1) : 'Départ à l\'étage 1 uniquement'),
    },
    forge: {
      name: 'Forge', icon: '⚒️', maxLevel: 10, cost: cost(3000, 2.2),
      desc: 'Améliorations plus poussées, plus sûres et moins chères.',
      val: (l) => ({ maxUp: 10 + l, chance: 0.04 * l, discount: Math.min(0.4, 0.04 * l) }),
      effect: (l) => 'Max +' + (10 + l) + ' · réussite +' + P(0.04 * l) + ' · coûts −' + P(Math.min(0.4, 0.04 * l)),
    },
    tavern: {
      name: 'Taverne', icon: '🍺', maxLevel: 8, cost: cost(4000, 2.4),
      desc: 'Plus de place dans l\'équipe et la compagnie, et de meilleures recrues.',
      val: (l) => ({ team: 4 + (l >= 3 ? 1 : 0) + (l >= 6 ? 1 : 0), roster: 8 + 2 * l, recruits: 3 + (l >= 2 ? 1 : 0) + (l >= 5 ? 1 : 0), quality: 0.35 * l }),
      effect: (l) => { const v = G.data.buildings.tavern.val(l); return 'Équipe ' + v.team + ' · compagnie ' + v.roster + ' · ' + v.recruits + ' recrues · recrues rares +' + P(v.quality); },
    },
    temple: {
      name: 'Temple', icon: '⛪', maxLevel: 10, cost: cost(3000, 2.2),
      desc: 'Bénédictions de soin, résurrections moins chères, et plus d\'or gardé en cas de défaite.',
      val: (l) => ({ healPower: 0.04 * l, revive: Math.min(0.6, 0.06 * l), deathKeep: 0.04 * l }),
      effect: (l) => 'Soins +' + P(0.04 * l) + ' · plumes −' + P(Math.min(0.6, 0.06 * l)) + ' · or gardé si défaite ' + P(0.5 + 0.04 * l),
    },
    library: {
      name: 'Bibliothèque', icon: '📚', maxLevel: 10, cost: cost(5000, 2.3),
      desc: 'Plus d\'XP pour toute la compagnie, et un point de compétence offert à chaque héros par niveau.',
      val: (l) => ({ xp: 0.08 * l, sp: l }),
      effect: (l) => 'XP +' + P(0.08 * l) + ' · +' + l + ' point(s) de compétence par héros',
    },
    shop: {
      name: 'Boutique', icon: '🛒', maxLevel: 10, cost: cost(2500, 2.1),
      desc: 'Prix réduits, plus d\'objets en vente, et de meilleure qualité.',
      val: (l) => ({ discount: Math.min(0.4, 0.04 * l), items: 4 + Math.floor(l / 2), mf: 0.1 * l }),
      effect: (l) => { const v = G.data.buildings.shop.val(l); return 'Prix −' + P(v.discount) + ' · ' + v.items + ' objets · qualité +' + P(v.mf); },
    },
    warehouse: {
      name: 'Entrepôt', icon: '📦', maxLevel: 10, cost: cost(2000, 2.0),
      desc: 'Un sac plus grand et plus de potions transportables.',
      val: (l) => ({ inv: 40 + 10 * l, potions: 10 + 5 * l }),
      effect: (l) => 'Sac ' + (40 + 10 * l) + ' places · ' + (10 + 5 * l) + ' potions par type',
    },
    camp: {
      name: 'Camp de base', icon: '🏕️', maxLevel: 10, cost: cost(3000, 2.2),
      desc: 'L\'équipe continue d\'explorer quand l\'appli est fermée : durée et efficacité des gains hors ligne.',
      val: (l) => ({ hours: 2 + 2 * l, eff: Math.min(1, 0.5 + 0.05 * l) }),
      effect: (l) => 'Hors ligne : ' + (2 + 2 * l) + ' h max · efficacité ' + P(Math.min(1, 0.5 + 0.05 * l)),
    },
  };
  G.data.buildingOrder = ['camp', 'warehouse', 'shop', 'forge', 'tavern', 'temple', 'library', 'portal'];
})();
