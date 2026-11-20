// =====================================================================
//  ÉQUILIBRAGE : toutes les constantes et formules du jeu sont ici.
//  Modifier un chiffre ici change le jeu sans toucher au moteur.
// =====================================================================
G.data.balance = {
  // --- Simulation ---
  tickRate: 30,            // calculs par seconde de jeu
  speeds: [1, 2, 4],       // vitesses disponibles

  // --- Puissance des monstres selon l'étage f ---
  // étage 1 = x1, étage 10 ≈ x2,95, étage 50 ≈ x63, étage 100 ≈ x1300
  floorMult: (f) => (1 + 0.1 * (f - 1)) * Math.pow(1.05, f - 1),
  monsterBase: { hp: 30, atk: 7, def: 3, spd: 100 },
  eliteChance: 0.1,
  elite: { hp: 2.5, atk: 1.3, gold: 3 },
  guardian: {               // mini-boss (tous les 5 étages) et boss (tous les 10)
    mini: { hp: 5, atk: 1.3, def: 1.2, gold: 10, scale: 1.4 },
    boss: { hp: 12, atk: 1.5, def: 1.4, gold: 25, scale: 1.8 },
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
  aggroRadius: 4.5,
  projectileSpeed: 11,

  // --- Exploration ---
  vision: 6.5,             // rayon de vision en cases
  floorRegen: 0.25,        // % de PV rendus en prenant l'escalier
  trapDmg: 0.12,           // % des PV max infligés par un piège
  checkpointEvery: 5,      // un gardien tous les 5 étages
  checkpointCountdown: 10, // secondes avant de continuer automatiquement

  // --- Donjon ---
  dungeon: {
    w: 44, h: 56,
    roomsMin: 8, roomsMax: 14, roomsPerFloor: 0.12,
    roomMin: 5, roomMax: 9,
    extraCorridors: 0.18,
    monstersMin: 2, monstersMax: 3, monstersPerFloor: 1 / 8, monstersCap: 6,
    trapsPerFloor: 3,
  },

  // --- Économie ---
  goldPerMonster: (lvl) => 2 * Math.pow(lvl, 1.2),
  chestGold: 5,            // un coffre = 5 monstres en or
  deathKeep: 0.5,          // part de l'or gardée en cas de défaite

  // --- Expérience (phase 3) ---
  xpToNext: (L) => Math.round(50 * Math.pow(L, 1.6)),
  monsterXp: (lvl) => 5 * Math.pow(lvl, 1.3),

  // --- Sauvegarde ---
  autosaveEvery: 30,       // secondes
};
