// =====================================================================
//  EXPÉDITION : la partie en cours dans le donjon.
//  - entrée dans un étage, exploration automatique salle par salle
//  - coffres, pièges, escalier
//  - gardiens (tous les 5 étages) => possibilité de sortir du donjon
//  - défaite (toute l'équipe morte) => retour en ville avec 50 % de l'or
//  Ce qui est sauvegardé : G.state.run (étage, or gagné, PV des héros).
//  L'étage lui-même est régénéré à partir de sa graine au chargement.
// =====================================================================
(function () {
  const B = G.data.balance;
  const C = G.sys.combat, P = G.sys.path, U = G.core.U, bus = G.core.bus;
  const rng = G.core.rng;
  const R = { active: null };

  const log = (t, cls) => G.ui.log && G.ui.log(t, cls);

  // ---------- Démarrage / reprise ----------
  R.start = function (startFloor) {
    const st = G.state;
    if (!G.sys.town.canStartAt(startFloor)) startFloor = 1;
    st.stats.runs++;
    st.run = {
      floor: startFloor, startFloor, gold: 0, kills: 0, hp: {}, exitAvailable: false,
      seedBase: st.seed + ':' + st.stats.runs, time: 0,
    };
    build(st.run);
    log('L\'équipe entre dans le donjon.', 'info');
    G.core.save.save();
  };
  R.resume = function () { if (G.state.run) build(G.state.run); };

  function build(saved) {
    const run = {
      saved, heroes: [], monsters: [], units: [], projectiles: [], trail: [],
      goal: null, goalT: 0, state: 'explore', stats: saved.heroStats || {}, t: 0, revealT: 0, inCombat: false, buffs: {},
    };
    saved.heroStats = run.stats;
    run.track = function (id, k, v) {
      const s = (run.stats[id] = run.stats[id] || { dmg: 0, taken: 0, heal: 0, kills: 0 });
      s[k] += v;
    };
    run.aggroRoom = (m) => aggroRoom(run, m);
    run.onDeath = (u, killer) => onDeath(run, u, killer);
    R.active = run;
    enterFloor(run, saved.floor);
  }

  function enterFloor(run, floor) {
    const st = G.state, saved = run.saved;
    saved.floor = floor;
    saved.exitAvailable = false;
    const map = G.sys.dungeon.generate(floor, G.core.hashStr(saved.seedBase + ':' + floor));
    map.trapAt = new Map(map.traps.map((t) => [t.x + ',' + t.y, t]));
    run.map = map;
    // héros
    const e = map.entrance;
    const spots = [[0, 0], [-1, 0], [0, 1], [-1, 1], [1, 0], [1, 1]];
    run.heroes = G.sys.heroes.team().map((h, i) => {
      const hp = saved.hp[h.id];
      const u = C.heroUnit(h, hp == null ? null : hp, G.sys.potions.buffStats(run));
      const [ox, oy] = spots[i % spots.length];
      u.x = e.cx + ox + 0.5; u.y = e.cy + oy + 0.5;
      if (hp === 0) { u.dead = true; u.hp = 0; }
      return u;
    });
    run.monsters = map.spawns.map((sp) => C.monsterUnit(sp, floor));
    run.units = run.heroes.concat(run.monsters);
    teamBonuses(run);
    run.projectiles = []; run.trail = []; run.goal = null; run.state = 'explore';
    revealRoom(map, e);
    reveal(run);
    G.render.onFloor && G.render.onFloor(run);
    if (floor > st.progress.maxFloor) st.progress.maxFloor = floor;
    const cyc = map.cycle ? ' (Cauchemar ' + map.cycle + ')' : '';
    G.ui.banner && G.ui.banner('Étage ' + floor, map.biome.name + cyc + (map.guardianKind === 'boss' ? ' · BOSS' : map.guardianKind === 'mini' ? ' · Gardien' : ''), map.guardianKind ? 'boss' : '');
    if (map.guardianKind) log((map.guardianKind === 'boss' ? 'Un boss' : 'Un gardien') + ' garde l\'escalier de cet étage…', 'boss');
    bus.emit('floor:enter', { floor });
  }

  // bonus d'équipe : or trouvé et chance de butin (somme des héros)
  function teamBonuses(run) {
    run.goldFind = 0; run.magicFind = 0;
    for (const h of run.heroes) { run.goldFind += h.stats.goldFind || 0; run.magicFind += h.stats.magicFind || 0; }
  }
  // recalcule les stats des héros (équipement changé, élixir...) en gardant le % de PV
  R.refreshStats = function () {
    const run = R.active;
    if (!run) return;
    const buffs = G.sys.potions.buffStats(run);
    for (const u of run.heroes) {
      const h = G.sys.heroes.get(u.id);
      if (!h) continue;
      const ratio = u.hp / u.stats.maxHp;
      u.stats = G.sys.stats.hero(h, { buffs });
      if (!u.dead) u.hp = Math.max(1, Math.round(ratio * u.stats.maxHp));
    }
    teamBonuses(run);
  };

  // ---------- Vision ----------
  function revealRoom(map, r) {
    for (let j = r.y - 1; j <= r.y + r.h; j++) for (let i = r.x - 1; i <= r.x + r.w; i++) {
      if (i >= 0 && j >= 0 && i < map.w && j < map.h) map.seen[j * map.w + i] = 1;
    }
  }
  function losTile(map, x0, y0, ti, tj) {
    const x1 = ti + 0.5, y1 = tj + 0.5, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    const steps = Math.ceil(len / 0.3);
    for (let s = 1; s < steps; s++) {
      const px = Math.floor(x0 + (dx * s) / steps), py = Math.floor(y0 + (dy * s) / steps);
      if (px === ti && py === tj) return true;
      if (!P.walk(map, px, py)) return false;
    }
    return true;
  }
  function reveal(run) {
    const map = run.map, R2 = B.vision;
    for (const h of run.heroes) {
      if (h.dead) continue;
      const x0 = Math.floor(h.x - R2), x1 = Math.ceil(h.x + R2), y0 = Math.floor(h.y - R2), y1 = Math.ceil(h.y + R2);
      for (let j = Math.max(0, y0); j <= Math.min(map.h - 1, y1); j++) for (let i = Math.max(0, x0); i <= Math.min(map.w - 1, x1); i++) {
        const k = j * map.w + i;
        if (map.seen[k]) continue;
        if ((i + 0.5 - h.x) ** 2 + (j + 0.5 - h.y) ** 2 > R2 * R2) continue;
        if (losTile(map, h.x, h.y, i, j)) map.seen[k] = 1;
      }
    }
  }

  // ---------- Combat : réveil des monstres ----------
  function aggroRoom(run, m) {
    for (const o of run.monsters) {
      if (o.dead || o.aggro) continue;
      if (o === m || (m.room >= 0 && o.room === m.room) || Math.hypot(o.x - m.x, o.y - m.y) < 3) o.aggro = true;
    }
  }

  // ---------- Morts ----------
  function onDeath(run, u, killer) {
    if (u.dead) return;
    u.dead = true;
    const st = G.state, saved = run.saved, fx = G.render.fx;
    if (u.side === 'monster') {
      u.deadT = 0;
      const spr = G.render.getSprite(u.sprite, u.outline);
      fx.shatter(u.x, u.y, spr.img, u.scale, u.facing < 0);
      if (u.guardian || u.elite) { fx.ring(u.x, u.y - 0.3, u.guardian ? '#ff8a3b' : '#ffd34d', u.guardian ? 2.5 : 1.2, 0.5); }
      saved.kills++; st.stats.kills++;
      const gold = Math.max(1, Math.round(B.goldPerMonster(u.level) * u.goldMult * (1 + (run.goldFind || 0)) * rng.float(0.8, 1.2)));
      saved.gold += gold;
      fx.coins(u.x, u.y, gold);
      if (killer && killer.side === 'hero') {
        run.track(killer.id, 'kills', 1);
        if (killer.stats.onKillHeal && !killer.dead) {
          const amt = Math.round(killer.stats.maxHp * killer.stats.onKillHeal);
          killer.hp = Math.min(killer.stats.maxHp, killer.hp + amt);
          fx.text(killer.x, killer.y - 0.6, '+' + amt, '#6dff8a', 1);
        }
      }
      G.sys.loot.onMonsterKill(run, u);
      bus.emit('monster:kill', { id: u.id, family: u.family, elite: u.elite, guardian: u.guardian, floor: u.level });
      if (u.guardian) onGuardianKilled(run, u);
    } else {
      fx.burst(u.x, u.y, '#ff4040', 14);
      fx.ring(u.x, u.y, '#ff4040', 1.2, 0.5);
      fx.flash('#ff0000', 0.15);
      fx.shake(0.25);
      log(u.name + ' est tombé au combat !', 'danger');
      if (run.heroes.every((h) => h.dead)) {
        run.state = 'defeat';
        run.endT = 1.2; run.endReason = 'death';
      }
    }
  }

  function onGuardianKilled(run, u) {
    const st = G.state, saved = run.saved;
    saved.exitAvailable = true;
    if (saved.floor > st.progress.maxCheckpoint) {
      st.progress.maxCheckpoint = saved.floor;
      if (!G.sys.town.canStartAt(saved.floor + 1)) G.ui.toast && G.ui.toast('Améliore le Portail pour repartir de l\'étage ' + (saved.floor + 1), 'gold');
    }
    log(u.name + ' est vaincu ! La sortie est accessible.', 'boss');
    G.ui.banner && G.ui.banner('Victoire !', u.name + ' est vaincu', 'gold');
    G.render.fx.shake(0.4);
    G.render.fx.burst(u.x, u.y, '#ffd34d', 30, 0, true);
    G.render.fx.ring(u.x, u.y, '#ffffff', 3.5, 0.7);
    G.render.fx.flash('#ffffff', 0.25);
    U.vibrate([60, 40, 120]);
    bus.emit('boss:kill', { id: u.id, kind: u.guardian, floor: saved.floor });
    const mode = st.settings.checkpointMode;
    if (mode === 'retreat') { run.state = 'leaving'; run.endT = 1.5; run.endReason = 'retreat'; return; }
    if (mode === 'continue') return;
    run.state = 'checkpoint';
    G.core.save.save();
    G.ui.checkpointPrompt && G.ui.checkpointPrompt();
  }
  R.resolveCheckpoint = function (retreat) {
    const run = R.active;
    if (!run) return;
    if (retreat) R.end('retreat');
    else if (run.state === 'checkpoint') run.state = 'explore';
  };
  R.canRetreat = () => !!(R.active && R.active.saved.exitAvailable && R.active.state !== 'defeat' && R.active.state !== 'leaving');
  R.retreat = function () { if (R.canRetreat()) R.end('retreat'); };

  // ---------- Fin d'expédition ----------
  R.end = function (reason) {
    const st = G.state, run = R.active;
    if (!run || !st.run) return;
    const s = st.run;
    const kept = reason === 'death' ? Math.floor(s.gold * B.deathKeep) : s.gold;
    st.gold += kept;
    st.stats.totalGold += kept;
    if (reason === 'death') st.stats.deaths++;
    st.lastRun = { reason, floor: s.floor, startFloor: s.startFloor, gold: s.gold, kept, kills: s.kills, items: s.items || 0, mats: s.mats || {}, time: Math.round(run.t + (s.time || 0)), heroStats: run.stats };
    st.run = null;
    R.active = null;
    if (st.settings.autoOptimize) { const o = G.sys.inventory.optimizeTeam(); st.lastRun.optimized = o.changes; }
    G.core.save.save();
    bus.emit('run:end', st.lastRun);
    G.ui.onRunEnd && G.ui.onRunEnd(st.lastRun);
  };

  // pour la sauvegarde
  R.snapshot = function () {
    const run = R.active;
    if (!run) return;
    for (const h of run.heroes) run.saved.hp[h.id] = h.dead ? 0 : Math.round(h.hp);
    run.saved.time = (run.saved.time || 0) + run.t; run.t = 0;
  };

  // ---------- Exploration ----------
  function leader(run) { return run.heroes.find((h) => !h.dead); }

  function chooseGoal(run, L) {
    const map = run.map, W = map.w;
    const d = P.bfs(map, Math.floor(L.x), Math.floor(L.y));
    let best = null, bd = 1e9;
    for (const c of map.chests) {
      if (c.opened || !map.seen[c.y * W + c.x]) continue;
      const dd = d[c.y * W + c.x];
      if (dd >= 0 && dd < bd) { bd = dd; best = { type: 'chest', x: c.x, y: c.y, ref: c }; }
    }
    for (const r of map.rooms) {
      if (r.visited) continue;
      let dd = d[r.cy * W + r.cx];
      if (dd < 0) continue;
      if (r === map.exit) dd += 1000; // la salle de l'escalier en dernier
      if (dd < bd) { bd = dd; best = { type: 'room', x: r.cx, y: r.cy, ref: r }; }
    }
    run.goal = best || { type: 'stairs', x: map.stairs.x, y: map.stairs.y };
    run.goalT = 0;
  }

  function explore(run, dt, busy) {
    const L = leader(run);
    if (!L) return;
    const map = run.map;
    if (!busy.has(L)) {
      if (!run.goal) chooseGoal(run, L);
      const g = run.goal;
      run.goalT += dt;
      C.moveTo(run, L, g.x + 0.5, g.y + 0.5, dt, B.exploreSpeed);
      const d = Math.hypot(L.x - g.x - 0.5, L.y - g.y - 0.5);
      if (g.type === 'room' && g.ref.visited) run.goal = null;
      else if (g.type === 'chest' && d < 0.9) { openChest(run, g.ref); run.goal = null; }
      else if (g.type === 'stairs' && d < 0.45) { descend(run); return; }
      // sécurité anti-blocage : si le chef n'avance plus, il traverse les autres un moment
      run.progT = (run.progT || 0) + dt;
      if (run.progT > 2) {
        if (run.progPos && Math.hypot(L.x - run.progPos.x, L.y - run.progPos.y) < 0.5) {
          run.stuck = (run.stuck || 0) + 1;
          for (const u of run.units) u.ghostT = 2;
          L.path = null;
        } else run.stuck = 0;
        run.progPos = { x: L.x, y: L.y }; run.progT = 0;
      }
      if (run.goal && (run.goalT > 45 || run.stuck >= 6)) {
        if (g.type === 'stairs') { L.x = g.x + 0.5; L.y = g.y + 0.5; } // dernier recours
        else if (g.ref) { g.ref.visited = true; g.ref.opened = true; }
        run.goal = null; run.stuck = 0;
      }
    }
    // file indienne : chaque suiveur vise un point du chemin du chef
    const last = run.trail[0];
    if (!last || Math.hypot(last.x - L.x, last.y - L.y) > 0.25) { run.trail.unshift({ x: L.x, y: L.y }); if (run.trail.length > 40) run.trail.pop(); }
    let k = 0;
    for (const h of run.heroes) {
      if (h === L || h.dead) continue;
      k++;
      if (busy.has(h)) continue;
      const p = run.trail[Math.min(run.trail.length - 1, k * 3)] || L;
      const d = Math.hypot(p.x - h.x, p.y - h.y);
      if (d > 0.3) C.moveTo(run, h, p.x, p.y, dt, B.exploreSpeed * (d > 2 ? 1.3 : 1.05));
      else h.moving = false;
    }
  }

  function openChest(run, c) {
    c.opened = true;
    const gold = Math.round(B.goldPerMonster(run.saved.floor) * B.chestGold * (1 + (run.goldFind || 0)) * rng.float(0.8, 1.3));
    run.saved.gold += gold;
    G.render.fx.coins(c.x + 0.5, c.y + 0.5, gold);
    G.render.fx.sparkle(c.x + 0.5, c.y + 0.5, '#ffd34d', 12);
    G.render.fx.ring(c.x + 0.5, c.y + 0.5, '#ffd34d', 1, 0.4);
    log('Coffre ouvert : +' + U.fmt(gold) + ' or', 'gold');
    G.sys.loot.onChest(run, c);
    bus.emit('chest:open', { floor: run.saved.floor });
  }

  function descend(run) {
    run.state = 'transition';
    run.transT = 0.7;
    G.render.fx.fade && G.render.fx.fade(0.7);
  }
  function nextFloor(run) {
    for (const h of run.heroes) if (!h.dead) h.hp = Math.min(h.stats.maxHp, h.hp + h.stats.maxHp * B.floorRegen);
    R.snapshot();
    enterFloor(run, run.saved.floor + 1);
    G.core.save.save();
  }

  // ---------- Pièges ----------
  function checkTraps(run) {
    for (const h of run.heroes) {
      if (h.dead) continue;
      const t = run.map.trapAt.get(Math.floor(h.x) + ',' + Math.floor(h.y));
      if (!t || t.triggered) continue;
      t.triggered = true;
      const dmg = Math.max(1, Math.round(h.stats.maxHp * B.trapDmg));
      h.hp -= dmg; h.anim.hit = 0.2;
      run.track(h.id, 'taken', dmg);
      G.render.fx.text(h.x, h.y - 0.6, String(dmg), '#ff5a5a', 1);
      G.render.fx.burst(h.x, h.y, '#c8c8c8', 10);
      G.render.fx.ring(h.x, h.y, '#ff6060', 0.6, 0.25);
      G.render.fx.shake(0.1);
      log('Piège ! ' + h.name + ' perd ' + dmg + ' PV.', 'danger');
      if (h.hp <= 0) { h.hp = 0; onDeath(run, h, null); }
    }
  }
  function checkRooms(run) {
    const map = run.map;
    for (const h of run.heroes) {
      if (h.dead) continue;
      const id = map.roomAt[Math.floor(h.y) * map.w + Math.floor(h.x)];
      if (id < 0) continue;
      const r = map.rooms[id];
      if (r.visited) continue;
      r.visited = true;
      revealRoom(map, r);
      for (const m of run.monsters) if (!m.dead && m.room === id) m.aggro = true;
    }
  }

  // ---------- Mise à jour (appelée 30 fois par seconde de jeu) ----------
  R.update = function (dt) {
    const run = R.active;
    if (!run) return;
    if (run.state === 'checkpoint') return; // en pause pendant le choix
    if (run.state === 'transition') {
      run.transT -= dt;
      if (run.transT <= 0) nextFloor(run);
      return;
    }
    run.t += dt;
    for (const u of run.units) {
      u.cd -= dt; if (u.healCd > 0) u.healCd -= dt; if (u.ghostT > 0) u.ghostT -= dt;
      u.anim.hit -= dt; u.anim.atk -= dt;
      u.anim.bob += dt * (u.moving ? 12 : 3);
      if (u.dead && u.deadT > 0) u.deadT -= dt;
      u.moving = false;
    }
    if (run.state === 'defeat' || run.state === 'leaving') {
      G.render.fx.update(dt);
      run.endT -= dt;
      if (run.endT <= 0) R.end(run.endReason);
      return;
    }
    const enemies = run.monsters.filter((m) => !m.dead && m.aggro);
    const wasCombat = run.inCombat;
    run.inCombat = enemies.length > 0;
    if (run.inCombat && !wasCombat) { run.goal = null; run.trail = []; }
    const busy = new Set();
    for (const h of run.heroes) {
      if (h.dead) continue;
      if (C.heroAI(run, h, dt, enemies)) busy.add(h);
    }
    if (!run.inCombat) explore(run, dt, busy);
    if (run.state !== 'explore') return;
    for (const m of run.monsters) if (!m.dead) C.monsterAI(run, m, dt);
    C.updateProjectiles(run, dt);
    G.sys.potions.update(run, dt);
    C.separate(run);
    checkTraps(run);
    checkRooms(run);
    run.revealT -= dt;
    if (run.revealT <= 0) { reveal(run); run.revealT = 0.15; }
    G.render.fx.update(dt);
  };

  G.sys.run = R;
})();
