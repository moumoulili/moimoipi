// =====================================================================
//  GÉNÉRATION DES DONJONS
//  1. place des salles rectangulaires sans chevauchement
//  2. les relie par un arbre couvrant minimal (+ quelques boucles)
//  3. entrée au hasard, escalier dans la salle la plus éloignée
//  4. remplit les salles (monstres, coffres, pièges, décors)
//  5. étage multiple de 5 : un gardien (mini-boss / boss) garde l'escalier
// =====================================================================
(function () {
  const B = G.data.balance;
  const D = {};

  D.isCheckpoint = (f) => f % B.checkpointEvery === 0;
  D.guardianKind = (f) => (f % 10 === 0 ? 'boss' : f % 5 === 0 ? 'mini' : null);

  // ---------- Plusieurs donjons (data/dungeons.js) ----------
  D.def = (id) => G.data.dungeonById[id || D.curId()] || G.data.dungeons[0];
  D.curId = () => { const st = G.state, r = st.run; const id = (r && r.dungeon) || st.settings.dungeon || 'main'; return G.data.dungeonById[id] ? id : 'main'; };
  D.cur = () => D.def(D.curId());
  // record d'un donjon : le donjon principal garde progress.maxFloor / maxCheckpoint (anciennes sauvegardes)
  D.prog = function (id) {
    id = id || D.curId();
    const p = G.state.progress;
    if (id === 'main') return p;
    p.dg = p.dg || {};
    return (p.dg[id] = p.dg[id] || { maxFloor: 0, maxCheckpoint: 0 });
  };
  D.level = (floor, id) => floor + D.def(id).offset;               // niveau réel des monstres
  D.unlocked = (id) => { const u = D.def(id).unlock; return !u || D.prog(u.from).maxFloor >= u.floor; };
  // meilleur niveau atteint, tous donjons confondus (boutique, prix…)
  D.bestLevel = () => Math.max(0, ...G.data.dungeons.map((d) => (D.prog(d.id).maxFloor ? D.prog(d.id).maxFloor + d.offset : 0)));

  D.generate = function (floor, seed, dgId) {
    const rng = new G.core.RNG(seed);
    const C = B.dungeon, W = C.w, H = C.h;
    const dg = D.def(dgId);
    const { biome, cycle } = G.data.biomeFor(floor, dg.shift);
    const tiles = new Uint8Array(W * H);
    const rooms = [];
    const target = Math.min(C.roomsMax, Math.round(C.roomsMin + floor * C.roomsPerFloor) + rng.int(0, 2));

    // 1. salles
    for (let tries = 0; tries < 400 && rooms.length < target; tries++) {
      const w = rng.int(C.roomMin, C.roomMax), h = rng.int(C.roomMin, C.roomMax - 1);
      const x = rng.int(1, W - w - 2), y = rng.int(1, H - h - 2);
      let ok = true;
      for (const r of rooms) {
        if (x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y) { ok = false; break; }
      }
      if (!ok) continue;
      rooms.push({ id: rooms.length, x, y, w, h, cx: x + (w >> 1), cy: y + (h >> 1), visited: false, kind: 'normal' });
    }
    for (const r of rooms) for (let j = r.y; j < r.y + r.h; j++) for (let i = r.x; i < r.x + r.w; i++) tiles[j * W + i] = 1;

    // 2. couloirs : arbre couvrant minimal (Prim) + boucles
    const carve = (i, j) => { if (i > 0 && j > 0 && i < W - 1 && j < H - 1 && tiles[j * W + i] === 0) tiles[j * W + i] = 2; };
    const corridor = (a, b) => {
      let x = a.cx, y = a.cy;
      const horizFirst = rng.chance(0.5);
      const wide = rng.chance(0.3);
      const stepX = () => { while (x !== b.cx) { carve(x, y); if (wide) carve(x, y + 1); x += Math.sign(b.cx - x); } };
      const stepY = () => { while (y !== b.cy) { carve(x, y); if (wide) carve(x + 1, y); y += Math.sign(b.cy - y); } };
      if (horizFirst) { stepX(); stepY(); } else { stepY(); stepX(); }
      carve(x, y);
    };
    const d2 = (a, b) => (a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2;
    const inTree = [rooms[0]], rest = rooms.slice(1), edges = [];
    while (rest.length) {
      let best = null, bi = -1, bd = 1e9;
      for (const a of inTree) rest.forEach((b, i) => { const d = d2(a, b); if (d < bd) { bd = d; best = [a, b]; bi = i; } });
      edges.push(best); inTree.push(rest[bi]); rest.splice(bi, 1);
    }
    const extra = Math.round(rooms.length * C.extraCorridors);
    for (let k = 0; k < extra; k++) {
      const a = rng.pick(rooms);
      const others = rooms.filter((r) => r !== a).sort((p, q) => d2(a, p) - d2(a, q));
      if (others[1]) edges.push([a, others[1]]);
    }
    for (const [a, b] of edges) corridor(a, b);

    // 3. entrée / sortie
    const entrance = rng.pick(rooms);
    const dist = G.sys.path.bfs({ w: W, h: H, tiles }, entrance.cx, entrance.cy);
    let exit = entrance, far = -1;
    for (const r of rooms) { const d = dist[r.cy * W + r.cx]; if (d > far) { far = d; exit = r; } }
    entrance.kind = 'entrance'; entrance.visited = true;
    exit.kind = 'exit';
    const stairs = { x: exit.cx, y: exit.cy };

    // 4. contenu
    const spawns = [], chests = [], traps = [], decor = [];
    const freeSpot = (r, used) => {
      for (let t = 0; t < 30; t++) {
        const i = rng.int(r.x + 1, r.x + r.w - 2), j = rng.int(r.y + 1, r.y + r.h - 2);
        const k = i + ',' + j;
        if (used.has(k) || (i === stairs.x && j === stairs.y)) continue;
        used.add(k); return { x: i, y: j };
      }
      return { x: r.cx, y: r.cy };
    };
    const nMon = () => Math.min(C.monstersCap, rng.int(C.monstersMin, C.monstersMax) + Math.floor(floor * C.monstersPerFloor));
    const gk = D.guardianKind(floor);
    const specials = [];
    let nSpecial = 0, merchant = false;
    for (const r of rooms) {
      const used = new Set();
      if (r === entrance) continue;
      let content = r === exit ? 'monsters' : rng.weighted(G.data.roomContents).id;
      // salles spéciales : 2 max par étage, 1 seul marchand
      const SR = G.data.specialRooms;
      if (SR[content] && (nSpecial >= 2 || (content === 'merchant' && merchant))) content = 'monsters';
      if (SR[content]) {
        nSpecial++; if (content === 'merchant') merchant = true;
        if (content === 'treasure') {
          for (let k = 0; k < SR.treasure.chests; k++) { const p = freeSpot(r, used); chests.push({ x: p.x, y: p.y, room: r.id, opened: false, treasure: true }); }
          for (let k = 0; k < SR.treasure.elites; k++) { const p = freeSpot(r, used); spawns.push({ id: rng.pick(biome.monsters), x: p.x, y: p.y, room: r.id, elite: true }); }
        } else {
          used.add(r.cx + ',' + r.cy);
          specials.push({ kind: content, x: r.cx, y: r.cy, room: r.id, used: false, event: content === 'event' ? rng.pick(G.data.events).id : null });
        }
      }
      if (content.startsWith('monsters')) {
        const n = r === exit && gk ? Math.max(1, nMon() - 2) : nMon();
        for (let k = 0; k < n; k++) {
          const p = freeSpot(r, used);
          spawns.push({ id: rng.pick(biome.monsters), x: p.x, y: p.y, room: r.id, elite: rng.chance(B.eliteChance) });
        }
      }
      if (r === exit && gk) {
        const bossId = biome.id + '_' + gk, bd = G.data.bosses[bossId];
        spawns.push({ id: bd.monster, x: stairs.x + 1 < r.x + r.w - 1 ? stairs.x + 1 : stairs.x - 1, y: stairs.y, room: r.id, guardian: gk, bossId, name: bd.name });
      }
      if (content === 'chest' || content === 'monsters_chest') { const p = freeSpot(r, used); chests.push({ x: p.x, y: p.y, room: r.id, opened: false }); }
      r.content = content;
      // décors
      const nd = rng.int(0, 3);
      for (let k = 0; k < nd; k++) { const p = freeSpot(r, used); decor.push({ x: p.x, y: p.y, kind: rng.pick(biome.decor), ox: rng.int(0, 8), oy: rng.int(0, 8) }); }
    }
    // pièges (cachés) sur les couloirs et dans les salles
    const floorCells = [];
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (tiles[j * W + i]) floorCells.push([i, j]);
    const nTraps = B.dungeon.trapsPerFloor + Math.floor(floor / 10);
    for (let k = 0; k < nTraps; k++) {
      const [i, j] = rng.pick(floorCells);
      const inEntrance = i >= entrance.x && i < entrance.x + entrance.w && j >= entrance.y && j < entrance.y + entrance.h;
      if (inEntrance || (i === stairs.x && j === stairs.y)) continue;
      traps.push({ x: i, y: j, triggered: false });
    }
    // variante de texture par case + torches sur les murs
    const variant = new Uint8Array(W * H);
    for (let k = 0; k < W * H; k++) { const r = rng.next(); variant[k] = r < 0.55 ? 0 : r < 0.8 ? 1 : r < 0.95 ? 2 : 3; }
    const torches = [];
    for (let j = 1; j < H - 1; j++) for (let i = 0; i < W; i++) {
      if (tiles[j * W + i] === 0 && tiles[(j + 1) * W + i] === 1 && rng.chance(0.12)) torches.push({ x: i, y: j, phase: rng.next() * 6 });
    }
    // index salle par case (pour savoir dans quelle salle on est)
    const roomAt = new Int16Array(W * H).fill(-1);
    for (const r of rooms) for (let j = r.y; j < r.y + r.h; j++) for (let i = r.x; i < r.x + r.w; i++) roomAt[j * W + i] = r.id;

    return {
      floor, seed, biome, cycle, dungeon: dg, w: W, h: H, tiles, variant, rooms, roomAt, entrance, exit, stairs,
      spawns, chests, traps, decor, torches, specials, seen: new Uint8Array(W * H), guardianKind: gk,
    };
  };
  G.sys.dungeon = D;
})();
