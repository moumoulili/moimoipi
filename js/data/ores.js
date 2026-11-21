// =====================================================================
//  MINE : minerais (un par palier de profondeur). On les obtient en
//  cassant des rochers (au toucher ou avec l'auto-minage) et on s'en
//  sert pour fabriquer de l'équipement à l'atelier.
// =====================================================================
G.data.ores = [
  { id: 'copper', name: 'Cuivre', tier: 1, a: '#d8803a', b: '#8a4a1a', w: '#ffc890' },
  { id: 'iron', name: 'Fer', tier: 2, a: '#a8adb8', b: '#5a5e6a', w: '#eef0f4' },
  { id: 'silver', name: 'Argent', tier: 3, a: '#d8e4f0', b: '#8a9ab0', w: '#ffffff' },
  { id: 'mithril', name: 'Mithril', tier: 4, a: '#5ad0e0', b: '#2a7a9a', w: '#d0ffff' },
  { id: 'adamantite', name: 'Adamantite', tier: 5, a: '#d04aa8', b: '#7a1a5a', w: '#ffb0e8' },
  { id: 'orichalcum', name: 'Orichalque', tier: 6, a: '#ffb020', b: '#a05a00', w: '#fff0a0' },
  { id: 'starmetal', name: 'Étoilite', tier: 7, a: '#9a7aff', b: '#4a2aa0', w: '#ffffff' },
];
G.data.oreById = {};
G.data.ores.forEach((o) => (G.data.oreById[o.id] = o));
