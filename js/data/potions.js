// =====================================================================
//  POTIONS. Prix = base x (étage record ^ 1,2).
//  Règles d'utilisation automatique réglables dans le Sac.
//  buff : bonus temporaire pour toute l'équipe (durée en secondes de jeu)
// =====================================================================
G.data.potions = {
  heal:    { name: 'Potion de soin',        icon: '#e04040', price: 12,  desc: 'Rend 40 % des PV à un héros.', heal: 0.4 },
  mana:    { name: 'Potion de mana',        icon: '#4a7aff', price: 10,  desc: 'Rend 50 % de la mana à un héros.', mana: 0.5 },
  revive:  { name: 'Plume de résurrection', icon: '#ffd34d', price: 120, desc: 'Ramène un héros tombé avec 35 % de ses PV.', revive: 0.35 },
  might:   { name: 'Élixir de force',       icon: '#ff8a3b', price: 40,  desc: '+25 % de dégâts pour l\'équipe pendant 40 s.', buff: { dmgPct: 0.25 }, duration: 40 },
  stone:   { name: 'Élixir de pierre',      icon: '#8a9aa8', price: 40,  desc: '+40 % de défense pour l\'équipe pendant 40 s.', buff: { defPct: 0.4 }, duration: 40 },
  haste:   { name: 'Élixir de célérité',    icon: '#6ab8ff', price: 40,  desc: '+20 % de vitesse d\'attaque pour l\'équipe pendant 40 s.', buff: { atkSpd: 0.2 }, duration: 40 },
};
G.data.potionOrder = ['heal', 'mana', 'revive', 'might', 'stone', 'haste'];
