// =====================================================================
//  ÉVÉNEMENTS À CHOIX (salles « ? »). Chaque choix a des issues tirées
//  au hasard selon leur poids. Le choix « safe » est pris si le joueur
//  ne répond pas (ou si l'option « choisir automatiquement » est active).
//  Effets possibles : gold (x or d'un monstre de l'étage), heal / mana (% max),
//  hurt (% PV), bless (bénédiction pour l'expédition), item (rareté min),
//  fight (élites qui apparaissent), potion (id, nombre), cost (or payé)
// =====================================================================
G.data.events = [
  { id: 'chest', icon: '🎁', title: 'Coffre mystérieux', text: 'Un coffre richement orné trône au milieu de la salle. Il semble… respirer ?',
    choices: [
      { label: 'L\'ouvrir', outcomes: [{ w: 60, text: 'Il regorge d\'or !', gold: 12 }, { w: 40, text: 'C\'est un mimique ! Il attaque avec ses complices !', fight: 2 }] },
      { label: 'Passer son chemin', safe: true, outcomes: [{ w: 1, text: 'Prudence est mère de sûreté.' }] },
    ] },
  { id: 'pilgrim', icon: '🧙', title: 'Pèlerin blessé', text: 'Un vieux pèlerin gît contre le mur. « Une potion… par pitié… »',
    choices: [
      { label: 'Lui donner une potion de soin', needPotion: 'heal', outcomes: [{ w: 1, text: 'Il vous bénit avant de disparaître dans un éclat de lumière.', potionCost: 'heal', bless: 'xp' }] },
      { label: 'L\'ignorer', safe: true, outcomes: [{ w: 1, text: 'Ses gémissements vous suivent dans le couloir.' }] },
    ] },
  { id: 'statue', icon: '🗿', title: 'Statue ancienne', text: 'Une statue aux yeux de rubis semble vous fixer. Une inscription : « Touche, et sois jugé ».',
    choices: [
      { label: 'Toucher la statue', outcomes: [{ w: 50, text: 'Une force ancienne vous envahit !', bless: 'random' }, { w: 50, text: 'Une malédiction vous brûle !', hurt: 0.25 }] },
      { label: 'Ne pas y toucher', safe: true, outcomes: [{ w: 1, text: 'Les yeux de rubis s\'éteignent.' }] },
    ] },
  { id: 'gambler', icon: '🎲', title: 'Gobelin joueur', text: '« Pile ou face, l\'ami ? Je double ta mise… ou je la garde ! »',
    choices: [
      { label: 'Parier (20 % de l\'or de l\'expédition)', outcomes: [{ w: 48, text: 'Gagné ! Le gobelin peste en payant.', betWin: 0.2 }, { w: 52, text: 'Perdu ! Le gobelin s\'enfuit en ricanant.', betLose: 0.2 }] },
      { label: 'Refuser', safe: true, outcomes: [{ w: 1, text: '« Trouillard ! »' }] },
    ] },
  { id: 'spring', icon: '⛲', title: 'Source étrange', text: 'Une eau scintillante jaillit de la roche. Elle sent la menthe… et le soufre.',
    choices: [
      { label: 'En boire', outcomes: [{ w: 65, text: 'Votre esprit s\'éclaircit : mana restaurée !', mana: 1 }, { w: 35, text: 'Pouah ! L\'eau était empoisonnée.', hurt: 0.15 }] },
      { label: 'Ne pas boire', safe: true, outcomes: [{ w: 1, text: 'Vous remplissez une gourde… par précaution.' }] },
    ] },
  { id: 'armory', icon: '⚔️', title: 'Armurerie oubliée', text: 'Des râteliers d\'armes poussiéreux. L\'un d\'eux est protégé par des gardes squelettes.',
    choices: [
      { label: 'Affronter les gardes', outcomes: [{ w: 1, text: 'Les gardes se réveillent ! L\'arme sera à vous si vous survivez.', fight: 2, item: 'rare' }] },
      { label: 'Fouiller les râteliers', safe: true, outcomes: [{ w: 70, text: 'Quelques pièces traînaient.', gold: 3 }, { w: 30, text: 'Une vieille arme encore utilisable !', item: 'uncommon' }] },
    ] },
];
// Bénédictions (autel, événements) : bonus pour le reste de l'expédition
G.data.blessings = {
  might: { name: 'Bénédiction de force', icon: '⚔️', desc: '+15 % de dégâts', bonus: { dmgPct: 0.15 } },
  ward: { name: 'Bénédiction de protection', icon: '🛡️', desc: '+20 % de défense', bonus: { defPct: 0.2 } },
  swift: { name: 'Bénédiction de célérité', icon: '💨', desc: '+12 % de vitesse d\'attaque', bonus: { atkSpd: 0.12 } },
  vigor: { name: 'Bénédiction de vigueur', icon: '❤️', desc: '+15 % de PV', bonus: { hpPct: 0.15 } },
  fortune: { name: 'Bénédiction de fortune', icon: '💰', desc: '+30 % d\'or trouvé', bonus: { goldFind: 0.3 } },
  xp: { name: 'Bénédiction du savoir', icon: '📖', desc: '+25 % d\'XP', bonus: { xpPct: 0.25 } },
  arcane: { name: 'Bénédiction arcanique', icon: '🔮', desc: '+0,3 mana par seconde', bonus: { mpRegen: 0.3 } },
};
