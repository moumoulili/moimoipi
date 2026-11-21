// =====================================================================
//  CONTENU DES SALLES (poids relatifs) et SALLES SPÉCIALES.
//  Les salles spéciales contiennent un objet avec lequel l'équipe interagit.
// =====================================================================
G.data.roomContents = [
  { id: 'monsters', w: 58 },
  { id: 'empty', w: 12 },
  { id: 'chest', w: 10 },
  { id: 'monsters_chest', w: 9 },
  { id: 'fountain', w: 3 },   // fontaine : soigne l'équipe (une fois)
  { id: 'altar', w: 3 },      // autel : bénédiction pour l'expédition
  { id: 'treasure', w: 2 },   // salle au trésor : plusieurs coffres gardés par des élites
  { id: 'merchant', w: 2 },   // marchand ambulant
  { id: 'event', w: 4 },      // événement à choix
];
G.data.specialRooms = {
  fountain: { name: 'Fontaine de soin', icon: '⛲', heal: 0.5, mana: 0.5 },
  altar: { name: 'Autel de bénédiction', icon: '🕯️' },
  merchant: { name: 'Marchand ambulant', icon: '🧳', discount: 0.7, items: 2 },
  event: { name: 'Événement', icon: '❔' },
  treasure: { name: 'Salle au trésor', icon: '💎', chests: 3, elites: 2 },
};
