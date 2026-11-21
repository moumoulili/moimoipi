// =====================================================================
//  ÉQUILIBRAGE : toutes les constantes et formules du jeu sont ici.
//  Modifier un chiffre ici change le jeu sans toucher au moteur.
// =====================================================================
G.data.balance = {
  // --- Simulation ---
  tickRate: 30,            // calculs par seconde de jeu
  speeds: [1, 2, 4],       // vitesses disponibles

  // --- Puissance des monstres selon l'étage f ---
  // étage 1 = x1, étage 10 ≈ x3,8, étage 30 ≈ x22, étage 50 ≈ x150
  floorMult: (f) => (1 + 0.12 * (f - 1)) * Math.pow(1.065, f - 1),
  monsterBase: { hp: 46, atk: 10, def: 4, spd: 100 },
  eliteChance: 0.16,
  elite: { hp: 3, atk: 1.4, gold: 3 },
  guardian: {               // mini-boss (tous les 5 étages) et boss (tous les 10)
    mini: { hp: 8, atk: 1.5, def: 1.3, spd: 1.1, gold: 12, scale: 1.4 },
    boss: { hp: 18, atk: 1.8, def: 1.5, spd: 1.15, gold: 30, scale: 1.8 },
  },

  // --- Combat ---
  baseAttackTime: 1.2,     // secondes entre deux attaques à vitesse 100
  unarmedDmg: 5,           // dégâts de base sans arme
  statToAtk: 2,            // 1 point de FOR/AGI/INT = 2 d'attaque
  defK: 50, defPerLvl: 10, defCap: 0.75, // réduction = DEF / (DEF + 50 + 10 x niveau attaquant)
  magicDefFactor: 0.5,     // la magie ignore la moitié de la défense
  critPerAgi: 0.001, critCap: 0.75, critDmg: 1.5,
  dodgePerAgi: 0.0005, dodgeCap: 0.3,
  variance: 0.1,           // dégâts +/- 10 %
  weakMult: 1.5, resistMult: 0.5, resCap: 0.75,
  moveSpeed: 3.2,          // cases par seconde (à vitesse 100)
  exploreSpeed: 3.4,
  aggroRadius: 5,
  diveAvoidTank: 2.5,      // les monstres « plongeurs » évitent le tank
  projectileSpeed: 11,

  // --- Exploration ---
  vision: 6.5,             // rayon de vision en cases
  floorRegen: 0,           // % de PV rendus en prenant l'escalier (aucun : seul le prêtre soigne)
  trapDmg: 0.15,           // % des PV max infligés par un piège
  checkpointEvery: 5,      // un gardien tous les 5 étages
  checkpointCountdown: 10, // secondes avant de continuer automatiquement

  // --- Donjon ---
  dungeon: {
    w: 44, h: 56,
    roomsMin: 8, roomsMax: 14, roomsPerFloor: 0.12,
    roomMin: 5, roomMax: 9,
    extraCorridors: 0.18,
    monstersMin: 2, monstersMax: 4, monstersPerFloor: 1 / 6, monstersCap: 7,
    trapsPerFloor: 4,
  },

  // --- Économie ---
  goldPerMonster: (lvl) => 2 * Math.pow(lvl, 1.2),
  chestGold: 5,            // un coffre = 5 monstres en or
  deathKeep: 0.5,          // part de l'or gardée en cas de défaite

  // --- Butin (phase 2) ---
  itemPower: (ilvl) => (1 + 0.1 * (ilvl - 1)) * Math.pow(1.05, ilvl - 1),
  dropChance: { normal: 0.08, elite: 0.35 },
  guardianDrops: { mini: { n: 2, minRarity: 'rare' }, boss: { n: 3, minRarity: 'rare', bonus: 'epic' } },
  chestItems: 1,
  uniqueChance: 0.25,          // un légendaire a 25 % de chance d'être un unique
  materialDrops: { scrap: 0.12, eliteScrap: 2, miniDust: 3, bossEther: 1 },
  salvage: [                   // matériaux obtenus en recyclant, par rareté
    { scrap: 1 }, { scrap: 2 }, { scrap: 2, dust: 1 }, { scrap: 3, dust: 2 }, { dust: 4, ether: 1 }, { dust: 6, ether: 3 },
  ],
  itemSellBase: 3,             // prix de vente = or d'un monstre du niveau de l'objet x 3 x rareté
  inventorySize: 40,
  potionStack: 10,             // potions max par type (l'entrepôt augmentera ça en phase 7)
  potionCooldown: 6,           // secondes entre deux potions pour un même héros
  startPotions: { heal: 3 },
  shop: { items: 4, refreshMinutes: 15, priceMult: 5, minRarity: 'uncommon' },

  // --- Évolutions, sets, forge (phase 6) ---
  // progression de classe : 0 = aventurier → classe (niv. 10), 1 = classe → spécialité (niv. 40),
  // 2 = RENAISSANCE au niv. 100 : classe ultime, retour au niveau 1, +1 renaissance (+50 % de stats de base).
  evolution: { 0: { level: 10, gold: 500 }, 1: { level: 40, gold: 3000, mats: { dust: 10 } }, 2: { level: 100, gold: 60000, mats: { ether: 5 }, rebirth: true } },
  legacyBonus: 0.5,
  setChance: 0.12,               // un objet rare ou mieux a 12 % de chance d'être une pièce de set
  forge: {
    maxUp: 10,                   // amélioration max (+10) ; la forge de la ville l'augmentera (phase 7)
    upFlat: 0.1,                 // +10 % des stats plates et des dégâts par +1
    upPct: 0.05,                 // +5 % des stats en pourcentage par +1
    upCost: (item, up) => ({ gold: Math.round(G.sys.items.value(item) * 1.5 * Math.pow(up + 1, 1.6)),
      mats: Object.assign({ scrap: 2 * (up + 1) }, up >= 3 ? { dust: up - 2 } : {}, up >= 6 ? { ether: up - 5 } : {}) }),
    upChance: (up) => (up < 5 ? 1 : Math.max(0.3, 1 - (up - 4) * 0.12)), // +6 : 88 %, +10 : 40 %… ; un échec ne perd que le coût
    rerollCost: (item) => ({ gold: Math.round(G.sys.items.value(item) * 0.8), mats: { dust: 1 + G.sys.items.rIdx(item.rarity) } }),
    fuseCost: (rIdx) => ({ gold: Math.round(200 * Math.pow(3, rIdx) * Math.pow(Math.max(1, G.state.progress.maxFloor), 0.8)),
      mats: rIdx >= 3 ? { ether: rIdx - 2 } : { dust: rIdx + 1 } }),
  },

  // --- Mine et atelier ---
  mine: {
    oreHp: (tier) => Math.round(12 * Math.pow(3.4, tier - 1)),      // solidité d'un rocher
    power: (lvl) => Math.round(Math.pow(1.6, lvl) * 10) / 10,         // dégâts par toucher
    autoDps: (lvl, power) => lvl * 0.5 * power,                         // dégâts par seconde des mineurs
    crit: (lvl) => Math.min(0.5, 0.05 * lvl), critMult: 4,
    // coûts : or + minerais du palier le plus profond débloqué
    up: {
      power: (l) => ({ gold: Math.round(40 * Math.pow(1.9, l)), ore: 3 + 2 * l }),
      auto: (l) => ({ gold: Math.round(120 * Math.pow(2.1, l)), ore: 5 + 3 * l }),
      crit: (l) => ({ gold: Math.round(200 * Math.pow(2.3, l)), ore: 4 + 2 * l }),
    },
    maxLevel: { power: 40, auto: 30, crit: 10 },
    depth: (tier) => ({ gold: Math.round(800 * Math.pow(5, tier - 1)), ore: 25 + 15 * tier }), // débloquer le palier suivant
  },
  craft: {
    ilvl: (tier) => 5 + (tier - 1) * 10,           // cuivre 5, fer 15, … étoilite 65
    ore: { weapon: 12, offhand: 8, armor: 8, jewel: 6 },
    gold: (ilvl) => Math.round(2 * Math.pow(ilvl, 1.2) * 15),
    minRarity: (tier) => (tier >= 5 ? 'rare' : 'uncommon'),
    mf: (tier) => 0.3 + 0.15 * tier,               // chance d'une bonne rareté
  },

  // --- Expérience et niveaux (phase 3) ---
  xpToNext: (L) => Math.round(100 * Math.pow(L, 2.3)),
  monsterXp: (lvl) => 4 * Math.pow(lvl, 1.3),
  xpMult: { elite: 2.5, mini: 6, boss: 12 },
  // écart de niveau héros - monstre : au-dessus du niveau du monstre l'XP baisse de 12 %/niveau (min 5 %),
  // en dessous l'XP augmente de 6 %/niveau (max +60 %) pour que les recrues rattrapent
  xpLevelGap: { free: 0, penalty: 0.12, minMult: 0.05, catchup: 0.05, maxCatchup: 0.5 },
  levelCap: 100,
  levelUpHeal: 0.25,       // % de PV rendus en montant de niveau pendant une expédition
  skillPointsPerLevel: 1,  // utilisés en phase 4 (arbres de compétences)
  benchXp: 0.25,           // les héros en réserve reçoivent 25 % de l'XP

  // --- Compétences et mana (phase 4) ---
  // Pas de régénération de mana de base : seulement l'équipement (bonus « mpRegen », min +0,1/s) et les potions.
  mpRegenMin: 0.1,
  manaCostPerLvl: 0.05,                        // coût des compétences +5 % par niveau du héros
  mpPerInt: 2,                                 // 1 point d'intelligence = +2 mana max
  skillLock: 0.35,                             // délai après une compétence (animation)
  respecPrice: (lvl) => Math.round(80 * Math.pow(lvl, 1.5)),
  dotTick: 0.5,                                // les dégâts sur la durée tombent toutes les 0,5 s
  ccResistBoss: 0.5,                           // les gardiens subissent les contrôles 2x moins longtemps

  // --- Taverne (phase 3) ---
  teamSize: 4,             // la taverne améliorée passera à 5 puis 6 (phase 7)
  rosterMax: 8,            // nombre max d'aventuriers (équipe + réserve)
  tavern: { recruits: 3, refreshMinutes: 30, levelBelowAvg: [0, 3] },
  recruitPrice: (lvl, q) => Math.round(150 * Math.pow(1 + lvl, 1.6) * q),

  // --- Sauvegarde ---
  autosaveEvery: 30,       // secondes
};
