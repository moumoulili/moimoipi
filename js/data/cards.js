// =====================================================================
//  CARTES DE MONSTRES (collection). Une carte par monstre et par boss.
//  Très rares ; chaque carte débloquée donne un léger bonus permanent à
//  tous les héros. Un doublon ajoute une étoile (max 5) : bonus x étoiles.
// =====================================================================
(function () {
  // bonus selon la famille du monstre
  const FAMILY = {
    undead: { defPct: 0.01 }, beast: { atkSpd: 0.01 }, slime: { hpPct: 0.01 }, plant: { healPower: 0.02 },
    humanoid: { goldFind: 0.03 }, construct: { defPct: 0.015 }, demon: { dmgPct: 0.01 }, aberration: { magicFind: 0.03 },
    celestial: { mpRegen: 0.02 },
  };
  const list = [];
  for (const b of G.data.biomes) {
    for (const id of b.monsters) {
      const m = G.data.monsters[id], bonus = Object.assign({}, FAMILY[m.family] || { hpPct: 0.01 });
      if (m.element && m.element !== 'physical') bonus['res_' + m.element] = 0.02;
      list.push({ id, kind: 'monster', biome: b.id, name: m.name, sprite: m.sprite, bonus });
    }
    for (const k of ['mini', 'boss']) {
      const bid = b.id + '_' + k, bd = G.data.bosses[bid];
      list.push({ id: bid, kind: k, biome: b.id, name: bd.name, sprite: bd.sprite, bonus: k === 'boss' ? { dmgPct: 0.02, hpPct: 0.02 } : { dmgPct: 0.01, hpPct: 0.01 } });
    }
  }
  G.data.cards = list;
  G.data.cardById = {};
  list.forEach((c) => (G.data.cardById[c.id] = c));
  G.data.cardDrop = { normal: 0.0015, elite: 0.001, mini: 0.0006, boss: 0.0003, maxStars: 5 };
})();
