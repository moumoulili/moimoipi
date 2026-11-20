// =====================================================================
//  SAUVEGARDE dans le navigateur (localStorage) + export/import texte.
//  Chaque sauvegarde a un numéro de version : quand le jeu évolue,
//  les anciennes sauvegardes sont converties (migrations) au lieu
//  d'être perdues.
// =====================================================================
(function () {
  const KEY = 'moimoipi-save';
  const VERSION = 2;
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
      progress: { maxFloor: 0, maxCheckpoint: 0 },
      stats: { kills: 0, totalGold: 0, runs: 0, deaths: 0 },
      settings: { checkpointMode: 'ask', autoRestart: true, speed: 1, vibrate: true, flashes: true, startFloor: 1 },
      // réservé aux phases suivantes : inventory, equipment, town, quests, bestiary, prestige...
    };
  };

  // migrations[v] transforme une sauvegarde de version v en version v+1
  const migrations = {
    // v1 -> v2 : arrivée du Portail ; le départ libre n'est plus gratuit
    1: (st) => { st.town = { buildings: { portal: 0 } }; st.settings.startFloor = 1; },
  };
  function migrate(st) {
    while (st.v < VERSION) { migrations[st.v](st); st.v++; }
    // complète les champs manquants avec les valeurs par défaut
    const def = S.fresh();
    for (const k in def) if (st[k] === undefined) st[k] = def[k];
    for (const k in def.settings) if (st.settings[k] === undefined) st.settings[k] = def.settings[k];
    for (const k in def.stats) if (st.stats[k] === undefined) st.stats[k] = def.stats[k];
    if (!st.town.buildings) st.town.buildings = {};
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
  S.save = function () {
    if (!G.state) return;
    try {
      G.sys.run && G.sys.run.snapshot();
      G.state.lastSeen = Date.now();
      localStorage.setItem(KEY, JSON.stringify(G.state));
    } catch (e) { console.error('Échec de sauvegarde', e); }
  };
  S.reset = function () {
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
    localStorage.setItem(KEY, JSON.stringify(st));
    location.reload();
  };
  G.core.save = S;
})();
