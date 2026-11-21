// =====================================================================
//  SAUVEGARDE dans le navigateur (localStorage) + export/import texte.
//  Chaque sauvegarde a un numéro de version : quand le jeu évolue,
//  les anciennes sauvegardes sont converties (migrations) au lieu
//  d'être perdues.
// =====================================================================
(function () {
  const KEY = 'moimoipi-save';
  const VERSION = 11;
  const S = {};

  S.fresh = function () {
    return {
      v: VERSION,
      seed: Math.floor(Math.random() * 1e9),
      createdAt: Date.now(), lastSeen: Date.now(),
      nextId: 1,
      gold: 0,
      heroes: [], team: [],
      run: null, lastRun: null,
      town: { buildings: { portal: 0 } },
      inventory: [], materials: { scrap: 0, dust: 0, ether: 0 },
      potions: Object.assign({}, G.data.balance.startPotions),
      potionRules: { heal: 0.3, mana: 0.15, revive: true, buffs: { might: 'boss', stone: 'boss', haste: 'never' } },
      shop: { items: [], refreshAt: 0 },
      tavern: { recruits: [], refreshAt: 0 },
      rate: null, // rendement mesuré (gains hors ligne)
      cards: {}, // collection de cartes de monstres { id: étoiles }
      mine: { ores: {}, sel: 'copper', hp: 12, power: 0, auto: 0, crit: 0, depth: 1, broken: 0 },
      progress: { maxFloor: 0, maxCheckpoint: 0 },
      stats: { kills: 0, totalGold: 0, runs: 0, deaths: 0 },
      settings: { checkpointMode: 'ask', autoRestart: true, speed: 1, vibrate: true, flashes: true, startFloor: 1,
        autoSell: { maxRarity: -1, action: 'sell', keepUpgrades: true }, autoEquip: false, autoOptimize: false, autoSkills: false, eventMode: 'ask', merchantMode: 'ask', farm: { on: false, floor: 1 }, music: true, musicVol: 0.5, sfx: true },
      // réservé aux phases suivantes : inventory, equipment, town, quests, bestiary, prestige...
    };
  };

  // migrations[v] transforme une sauvegarde de version v en version v+1
  const migrations = {
    // v1 -> v2 : arrivée du Portail ; le départ libre n'est plus gratuit
    1: (st) => { st.town = { buildings: { portal: 0 } }; st.settings.startFloor = 1; },
    // v2 -> v3 : équipement, inventaire, potions, boutique (champs ajoutés par défaut ci-dessous)
    2: (st) => { for (const h of st.heroes) h.equip = h.equip || {}; },
    // v3 -> v4 : niveaux/XP, qualité des recrues, taverne
    3: (st) => { for (const h of st.heroes) { h.quality = h.quality || 'common'; h.sp = (h.sp || 0) + (h.level - 1); } },
    // v4 -> v5 : compétences (les points déjà gagnés sont conservés)
    4: (st) => { for (const h of st.heroes) { h.skills = h.skills || {}; h.skillOrder = h.skillOrder || []; h.skillRules = h.skillRules || {}; } },
    // v5 -> v6 : « Soin majeur » devient une compétence de départ (rang 1 offert) : on rend le point déjà payé
    5: (st) => { for (const h of st.heroes) if (h.cls === 'priest' && h.skills && h.skills.p_heal >= 1) h.sp = (h.sp || 0) + 1; },
    // v6 -> v7 : classe de départ « Aventurier » ; les héros existants ont déjà une classe => 1 Héritage
    6: (st) => { for (const h of st.heroes) if (h.cls !== 'adventurer') h.legacy = (h.legacy || 0) + 1 + (h.adv ? 1 : 0) + (h.ult ? 1 : 0); },
    // v7 -> v8 : seule la renaissance (niv. 100) compte désormais ; l'ancien « héritage » est retiré
    7: (st) => { for (const h of st.heroes) h.legacy = h.ult ? 1 : 0; },
    // v8 -> v9 : bâtiments de la ville, gains hors ligne, auto-farm (valeurs par défaut ajoutées automatiquement)
    8: () => {},
    // v9 -> v10 : mine, atelier, musique (valeurs par défaut ajoutées automatiquement)
    9: () => {},
    // v10 -> v11 : collection de cartes (valeur par défaut ajoutée automatiquement)
    10: () => {},
  };
  function migrate(st) {
    while (st.v < VERSION) { migrations[st.v](st); st.v++; }
    // complète les champs manquants avec les valeurs par défaut
    const def = S.fresh();
    for (const k in def) if (st[k] === undefined) st[k] = def[k];
    for (const k in def.settings) if (st.settings[k] === undefined) st.settings[k] = def.settings[k];
    for (const k in def.stats) if (st.stats[k] === undefined) st.stats[k] = def.stats[k];
    if (!st.town.buildings) st.town.buildings = {};
    for (const k in def.mine) if (st.mine[k] === undefined) st.mine[k] = def.mine[k];
    for (const h of st.heroes) { h.skills = h.skills || {}; h.skillOrder = h.skillOrder || []; h.skillRules = h.skillRules || {}; if (!h.equip) h.equip = {}; if (!h.quality) h.quality = 'common'; if (h.sp == null) h.sp = 0; if (h.xp == null) h.xp = 0; }
    for (const k in def.settings.autoSell) if (st.settings.autoSell[k] === undefined) st.settings.autoSell[k] = def.settings.autoSell[k];
    for (const k in def.potionRules) if (st.potionRules[k] === undefined) st.potionRules[k] = def.potionRules[k];
    for (const k in def.progress) if (st.progress[k] === undefined) st.progress[k] = def.progress[k];
    return st;
  }

  S.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { G.state = migrate(JSON.parse(raw)); return true; }
    } catch (e) { console.error('Sauvegarde illisible', e); }
    G.state = S.fresh();
    return false;
  };
  // verrou : empêche la sauvegarde automatique (fermeture de page) d'écraser une réinitialisation ou un import
  let locked = false;
  S.save = function () {
    if (!G.state || locked) return;
    try {
      G.sys.run && G.sys.run.snapshot();
      G.state.lastSeen = Date.now();
      localStorage.setItem(KEY, JSON.stringify(G.state));
    } catch (e) { console.error('Échec de sauvegarde', e); }
  };
  S.reset = function () {
    locked = true;
    localStorage.removeItem(KEY);
    location.reload();
  };

  // ---- Export / import : texte "MMP1:<données>:<contrôle>" ----
  function b64enc(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64dec(str) { return decodeURIComponent(escape(atob(str))); }
  S.exportText = function () {
    S.save();
    const data = b64enc(JSON.stringify(G.state));
    return 'MMP1:' + data + ':' + G.core.hashStr(data).toString(36);
  };
  S.importText = function (txt) {
    txt = (txt || '').trim().replace(/\s+/g, '');
    const parts = txt.split(':');
    if (parts.length !== 3 || parts[0] !== 'MMP1') throw new Error('Format inconnu');
    if (G.core.hashStr(parts[1]).toString(36) !== parts[2]) throw new Error('Texte incomplet ou modifié');
    const st = migrate(JSON.parse(b64dec(parts[1])));
    locked = true;
    localStorage.setItem(KEY, JSON.stringify(st));
    location.reload();
  };
  G.core.save = S;
})();
