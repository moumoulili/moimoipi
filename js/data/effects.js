// =====================================================================
//  EFFETS DE STATUT (sur héros et monstres)
//  burn/poison : dégâts sur la durée ; slow : vitesse réduite ;
//  stun/freeze : ne peut plus agir ; weaken : dégâts infligés réduits ;
//  armorBreak : défense réduite ; taunt : force les monstres à viser le lanceur ;
//  buff : bonus temporaires ; shield : absorbe des dégâts.
//  Les éléments déclenchent aussi des effets à l'impact (onHit), avec
//  une chance réduite par les résistances de la cible.
// =====================================================================
G.data.effects = {
  burn:       { name: 'Brûlure', color: '#ff7a33', dot: true },
  poison:     { name: 'Poison', color: '#7ad04a', dot: true },
  slow:       { name: 'Ralenti', color: '#7fd8ff' },
  stun:       { name: 'Étourdi', color: '#ffe14d', control: true },
  freeze:     { name: 'Gelé', color: '#bfefff', control: true },
  weaken:     { name: 'Affaibli', color: '#a46bff' },
  armorBreak: { name: 'Armure brisée', color: '#b58a4c' },
  taunt:      { name: 'Provoqué', color: '#ff4040' },
  buff:       { name: 'Bonus', color: '#ffd34d' },
  shield:     { name: 'Bouclier', color: '#fff3a8' },
};
// effets déclenchés par les éléments (attaques élémentaires des héros et des monstres)
G.data.elementOnHit = {
  fire:      { id: 'burn', chance: 0.2, dur: 3, dotMult: 0.15 },          // 15 % des dégâts par seconde
  ice:       { id: 'slow', chance: 0.25, dur: 2, value: 0.3, freezeChance: 0.08 },
  lightning: { id: 'stun', chance: 0.1, dur: 0.6 },
  earth:     { id: 'armorBreak', chance: 0.15, dur: 4, value: 0.2 },
  shadow:    { id: 'weaken', chance: 0.2, dur: 4, value: 0.15 },
  light:     { bonusVs: ['undead', 'demon'], bonus: 0.3 },               // +30 % contre morts-vivants et démons
};
