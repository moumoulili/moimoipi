// =====================================================================
//  OBJETS : emplacements, types d'armes/armures et ce que chaque classe
//  peut porter. "icon" = modèle pixel art (js/render/pixelart.js).
//  dmg : dégâts de base de l'arme (x puissance de l'objet)
//  spd : vitesse d'attaque (1 = normale, 1.2 = 20 % plus rapide)
//  implicit : stats de base toujours présentes (x puissance)
// =====================================================================
G.data.slots = {
  weapon:  { name: 'Arme',             short: 'Arme' },
  offhand: { name: 'Main secondaire',  short: 'Main sec.' },
  head:    { name: 'Tête',             short: 'Tête' },
  chest:   { name: 'Armure',           short: 'Armure' },
  hands:   { name: 'Gants',            short: 'Gants' },
  feet:    { name: 'Bottes',           short: 'Bottes' },
  belt:    { name: 'Ceinture',         short: 'Ceinture' },
  cape:    { name: 'Cape',             short: 'Cape' },
  amulet:  { name: 'Amulette',         short: 'Amulette' },
  ring1:   { name: 'Anneau',           short: 'Anneau 1', accepts: 'ring' },
  ring2:   { name: 'Anneau',           short: 'Anneau 2', accepts: 'ring' },
};
G.data.slotOrder = ['weapon', 'offhand', 'head', 'chest', 'hands', 'feet', 'belt', 'cape', 'amulet', 'ring1', 'ring2'];

// Bases d'objets. slot = type d'emplacement ('ring' va dans ring1 ou ring2)
G.data.itemBases = {
  // ---- Armes ----
  sword:    { name: 'Épée',            slot: 'weapon', cat: 'weapon', icon: 'i_sword',    dmgType: 'phys',  dmg: 6,   spd: 1.0 },
  axe:      { name: 'Hache',           slot: 'weapon', cat: 'weapon', icon: 'i_axe',      dmgType: 'phys',  dmg: 8,   spd: 0.85 },
  mace:     { name: 'Masse',           slot: 'weapon', cat: 'weapon', icon: 'i_mace',     dmgType: 'phys',  dmg: 7,   spd: 0.92, implicit: { def: 1 } },
  spear:    { name: 'Lance',           slot: 'weapon', cat: 'weapon', icon: 'i_spear',    dmgType: 'phys',  dmg: 7,   spd: 0.95, implicit: { crit: 0.02 } },
  bow:      { name: 'Arc',             slot: 'weapon', cat: 'weapon', icon: 'i_bow',      dmgType: 'phys',  dmg: 6,   spd: 1.0 },
  crossbow: { name: 'Arbalète',        slot: 'weapon', cat: 'weapon', icon: 'i_crossbow', dmgType: 'phys',  dmg: 9,   spd: 0.8 },
  dagger:   { name: 'Dague',           slot: 'weapon', cat: 'weapon', icon: 'i_dagger',   dmgType: 'phys',  dmg: 4.5, spd: 1.25, implicit: { crit: 0.03 } },
  staff:    { name: 'Bâton',           slot: 'weapon', cat: 'weapon', icon: 'i_staff',    dmgType: 'magic', dmg: 8,   spd: 0.9 },
  wand:     { name: 'Baguette',        slot: 'weapon', cat: 'weapon', icon: 'i_wand',     dmgType: 'magic', dmg: 5.5, spd: 1.15 },
  holybook: { name: 'Livre sacré',     slot: 'weapon', cat: 'weapon', icon: 'i_holybook', dmgType: 'magic', dmg: 6,   spd: 1.0, implicit: { healPower: 0.08 } },
  // ---- Main secondaire ----
  shield:   { name: 'Bouclier',        slot: 'offhand', cat: 'offhand', icon: 'i_shield', implicit: { def: 4, hp: 10 } },
  tome:     { name: 'Grimoire',        slot: 'offhand', cat: 'offhand', icon: 'i_tome',   implicit: { matk: 3, int: 1 } },
  quiver:   { name: 'Carquois',        slot: 'offhand', cat: 'offhand', icon: 'i_quiver', implicit: { atk: 3, agi: 1 } },
  relic:    { name: 'Relique',         slot: 'offhand', cat: 'offhand', icon: 'i_relic',  implicit: { healPower: 0.1, int: 1 } },
  parry:    { name: 'Main-gauche',     slot: 'offhand', cat: 'offhand', icon: 'i_dagger', implicit: { atk: 2, crit: 0.02 } },
  // ---- Armures (lourde / moyenne / légère) ----
  helm:     { name: 'Heaume',          slot: 'head',  cat: 'armor', weight: 'heavy',  icon: 'i_helm',   implicit: { def: 4, hp: 8 } },
  hood:     { name: 'Capuche',         slot: 'head',  cat: 'armor', weight: 'medium', icon: 'i_hood',   implicit: { def: 2.5, dodge: 0.01 } },
  hat:      { name: 'Chapeau',         slot: 'head',  cat: 'armor', weight: 'light',  icon: 'i_hat',    implicit: { def: 1.5, int: 1 } },
  plate:    { name: 'Cuirasse',        slot: 'chest', cat: 'armor', weight: 'heavy',  icon: 'i_plate',  implicit: { def: 8, hp: 16 } },
  leather:  { name: 'Armure de cuir',  slot: 'chest', cat: 'armor', weight: 'medium', icon: 'i_leather', implicit: { def: 5, dodge: 0.015 } },
  robe:     { name: 'Robe',            slot: 'chest', cat: 'armor', weight: 'light',  icon: 'i_robe',   implicit: { def: 3, int: 2 } },
  gauntlets:{ name: 'Gantelets',       slot: 'hands', cat: 'armor', weight: 'heavy',  icon: 'i_gloves', implicit: { def: 3, hp: 4 } },
  gloves:   { name: 'Gants de cuir',   slot: 'hands', cat: 'armor', weight: 'medium', icon: 'i_gloves', implicit: { def: 2, crit: 0.01 } },
  mitts:    { name: 'Mitaines',        slot: 'hands', cat: 'armor', weight: 'light',  icon: 'i_gloves', implicit: { def: 1, matk: 1.5 } },
  sabatons: { name: 'Solerets',        slot: 'feet',  cat: 'armor', weight: 'heavy',  icon: 'i_boots',  implicit: { def: 3, hp: 4 } },
  boots:    { name: 'Bottes de cuir',  slot: 'feet',  cat: 'armor', weight: 'medium', icon: 'i_boots',  implicit: { def: 2, spd: 2 } },
  slippers: { name: 'Sandales',        slot: 'feet',  cat: 'armor', weight: 'light',  icon: 'i_boots',  implicit: { def: 1, spd: 3 } },
  // ---- Accessoires (tout le monde) ----
  belt:     { name: 'Ceinture',        slot: 'belt',   cat: 'jewel', icon: 'i_belt',   implicit: { hp: 10 } },
  cape:     { name: 'Cape',            slot: 'cape',   cat: 'jewel', icon: 'i_cape',   implicit: { def: 1.5, dodge: 0.01 } },
  amulet:   { name: 'Amulette',        slot: 'amulet', cat: 'jewel', icon: 'i_amulet', implicit: { str: 1, agi: 1, int: 1 } },
  ring:     { name: 'Anneau',          slot: 'ring',   cat: 'jewel', icon: 'i_ring',   implicit: { crit: 0.01 } },
};

// Ce que chaque classe peut utiliser
G.data.classGear = {
  adventurer: { weapons: ['sword', 'dagger', 'mace', 'bow', 'staff', 'wand'], offhand: ['shield', 'tome', 'quiver', 'parry', 'relic'], armor: ['medium', 'light'] },
  warrior: { weapons: ['sword', 'axe', 'mace', 'spear'], offhand: ['shield'], armor: ['heavy', 'medium'] },
  archer:  { weapons: ['bow', 'crossbow'], offhand: ['quiver'], armor: ['medium', 'light'] },
  mage:    { weapons: ['staff', 'wand'], offhand: ['tome'], armor: ['light'] },
  priest:  { weapons: ['holybook', 'staff'], offhand: ['relic', 'shield'], armor: ['light', 'medium'] },
  rogue:   { weapons: ['dagger', 'sword'], offhand: ['parry'], armor: ['medium', 'light'] },
};
