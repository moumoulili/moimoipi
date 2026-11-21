// =====================================================================
//  DONJONS : plusieurs donjons de difficulté croissante.
//  offset : niveau ajouté à l'étage (étage 1 d'un donjon offset 30 = monstres niv. 31)
//  mult   : multiplicateur de PV / attaque / défense des monstres (en plus du niveau)
//  reward : multiplicateur d'or et d'XP ; mf : chance de butin en plus
//  lvl    : tranche de niveau conseillée (affichage) ; color : couleur du texte sur parchemin
//  shift  : décalage des biomes (le donjon ne commence pas à la Crypte)
//  tint   : teinte de l'écran ; wall/floor : nuance des murs et du sol (aspect propre au donjon)
//  unlock : record d'étage à atteindre dans un autre donjon pour l'ouvrir
// =====================================================================
G.data.dungeons = [
  { id: 'main', name: 'Donjon des Oubliés', icon: '🏰', lvl: [1, 40], offset: 0, mult: 1, reward: 1, mf: 0, shift: 0, color: '#7a4a08',
    desc: 'Le donjon historique sous la ville. Idéal pour débuter.', tint: null, unlock: null },
  { id: 'blood', name: 'Catacombes sanglantes', icon: '🩸', lvl: [30, 60], offset: 30, mult: 1.3, reward: 1.35, mf: 0.1, shift: 3, color: '#a01822',
    desc: 'Des galeries rougies où rôdent des monstres enragés.', tint: 'rgba(140,10,20,0.10)', accent: '#b0202a', unlock: { from: 'main', floor: 35 } },
  { id: 'chaos', name: 'Citadelle du Chaos', icon: '🌀', lvl: [55, 85], offset: 55, mult: 1.65, reward: 1.75, mf: 0.2, shift: 4, color: '#5a24b0',
    desc: 'Une forteresse tordue par la magie. Seules les équipes aguerries en reviennent.', tint: 'rgba(90,20,150,0.12)', accent: '#8a3cff', unlock: { from: 'blood', floor: 30 } },
  { id: 'void', name: 'Trône du Néant', icon: '🕳️', lvl: [80, 100], offset: 80, mult: 2.1, reward: 2.3, mf: 0.35, shift: 5, color: '#1e1636',
    desc: 'Le cœur du mal. Réservé aux héros renés.', tint: 'rgba(0,0,0,0.16)', accent: '#e8e0ff', unlock: { from: 'chaos', floor: 30 } },
];
G.data.dungeonById = {};
for (const d of G.data.dungeons) G.data.dungeonById[d.id] = d;
