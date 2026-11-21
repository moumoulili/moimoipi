// =====================================================================
//  OBJETS UNIQUES (légendaires nommés avec effet spécial).
//  Ils peuvent tomber à la place d'un objet légendaire du même type.
//  fixed : stats garanties (valeurs de base x puissance si stat plate)
// =====================================================================
G.data.uniques = [
  { id: 'phoenix_blade', name: 'Lame du Phénix', base: 'sword', fixed: { el_fire: 4, onKillHeal: 0.06, str: 3 }, desc: 'Chaque victime soigne son porteur.' },
  { id: 'skullcrusher', name: 'Broie-crânes', base: 'mace', fixed: { bossDmg: 0.35, str: 4, def: 2 }, desc: 'Écrase les élites et les gardiens.' },
  { id: 'zephyr_bow', name: 'Arc du Zéphyr', base: 'bow', fixed: { atkSpd: 0.25, echo: 0.2, agi: 3 }, desc: 'Tire souvent deux flèches.' },
  { id: 'abyss_staff', name: 'Bâton des Abysses', base: 'staff', fixed: { el_shadow: 5, lifesteal: 0.04, int: 3, mpRegen: 0.3 }, desc: 'Draine la vie des ennemis.' },
  { id: 'dawn_grimoire', name: 'Évangile de l\'Aube', base: 'holybook', fixed: { el_light: 4, healPower: 0.3, int: 3, mpRegen: 0.3 }, desc: 'Soins grandement renforcés.' },
  { id: 'warden_aegis', name: 'Égide du Gardien', base: 'shield', fixed: { thorns: 0.25, defPct: 0.15, hp: 20 }, desc: 'Renvoie les coups reçus.' },
  { id: 'shadow_cloak', name: 'Voile du Rôdeur', base: 'cape', fixed: { dodge: 0.08, crit: 0.05, agi: 3 }, desc: 'Insaisissable.' },
  { id: 'midas_ring', name: 'Anneau de Midas', base: 'ring', fixed: { goldFind: 0.5, magicFind: 0.15 }, desc: 'L\'or coule à flots.' },
  { id: 'dragon_eye', name: 'Œil du Dragon', base: 'amulet', fixed: { magicFind: 0.3, res_fire: 0.25, el_fire: 3 }, desc: 'Attire les trésors.' },
  { id: 'venom_fang', name: 'Croc venimeux', base: 'dagger', fixed: { el_earth: 4, echo: 0.15, crit: 0.05 }, desc: 'Frappe vite et deux fois.' },
];
