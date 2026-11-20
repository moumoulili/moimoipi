// Espace de noms global du jeu. Tous les modules s'y rangent :
//   G.core  : outils de base (hasard, événements, sauvegarde, boucle)
//   G.data  : données de configuration (classes, monstres, biomes...)
//   G.sys   : systèmes de jeu (donjon, combat, expédition...)
//   G.render: affichage canvas (pixel art, effets)
//   G.ui    : interface (écrans, boutons, notifications)
window.G = { core: {}, data: {}, sys: {}, render: {}, ui: {}, state: null };
