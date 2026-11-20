// =====================================================================
//  COMBAT EN TEMPS RÉEL SUR LA CARTE
//  - unités (héros / monstres) avec position, PV, stats, temps de recharge
//  - IA : choix de cible, déplacement, attaque, soin
//  - formule de dégâts (défense, éléments, critique, esquive)
//  - projectiles
// =====================================================================
(function () {
  const B = G.data.balance;
  const P = G.sys.path;
  const rng = G.core.rng;
  const C = {};
  let uidSeq = 1;

  // ---------- Création des unités ----------
  C.heroUnit = function (h, hp) {
    const c = G.data.classes[h.cls];
    const st = G.sys.stats.hero(h);
    return {
      uid: uidSeq++, id: h.id, side: 'hero', name: h.name, cls: h.cls, level: h.level,
      x: 0, y: 0, r: 0.3, hp: hp != null ? Math.min(hp, st.maxHp) : st.maxHp, stats: st,
      attack: c.attack, heal: c.heal, threat: c.threat || 1,
      cd: rng.float(0, 0.6), healCd: 0, facing: 1, scale: 1,
      sprite: Object.assign({ id: h.cls }, c.sprite),
      anim: { hit: 0, atk: 0, bob: rng.next() * 6, lx: 0, ly: 0 },
      path: null, pathKey: '', repath: 0, dead: false, target: null, retarget: 0,
    };
  };
  const MAGIC_PROJ = { orb: 1, holy: 1, fire: 1, ice: 1, spark: 1 };
  C.monsterUnit = function (sp, floor) {
    const md = G.data.monsters[sp.id];
    let mods = {}, scale = 1, outline = null, goldMult = 1, name = md.name;
    if (sp.guardian) {
      const g = B.guardian[sp.guardian];
      mods = g; scale = g.scale; outline = sp.guardian === 'boss' ? '#ff3b3b' : '#ff9a3b'; goldMult = g.gold; name = sp.name;
    } else if (sp.elite) {
      mods = B.elite; outline = '#ffd34d'; goldMult = B.elite.gold; name = md.name + ' élite';
    }
    const st = G.sys.stats.monster(md, floor, mods);
    return {
      uid: uidSeq++, id: md.id, side: 'monster', name, level: floor, family: md.family,
      x: sp.x + 0.5, y: sp.y + 0.5, r: 0.3 * Math.min(scale, 1.4), hp: st.maxHp, stats: st,
      attack: { type: md.behavior, range: md.range, dmgType: MAGIC_PROJ[md.projectile] ? 'magic' : 'phys', element: md.element, projectile: md.projectile },
      weak: md.weak, resist: md.resist, threat: 1,
      cd: rng.float(0.3, 1), facing: -1, scale, outline,
      sprite: Object.assign({ id: md.id }, md.sprite),
      anim: { hit: 0, atk: 0, bob: rng.next() * 6, lx: 0, ly: 0 },
      path: null, pathKey: '', repath: 0, dead: false, target: null, retarget: 0,
      aggro: false, room: sp.room, elite: !!sp.elite, guardian: sp.guardian || null, goldMult, deadT: 0,
    };
  };

  C.attackInterval = (u) => B.baseAttackTime * (u.attack.interval || 1) * 100 / Math.max(20, u.stats.spd);
  C.moveSpeed = (u) => B.moveSpeed * Math.max(0.6, Math.min(1.6, u.stats.spd / 100));

  // ---------- Dégâts ----------
  // opts : { mult, dmgType: 'phys'|'magic', element }
  C.damage = function (run, src, tgt, opts) {
    if (!tgt || tgt.dead) return 0;
    const fx = G.render.fx;
    if (rng.chance(tgt.stats.dodge)) { fx.text(tgt.x, tgt.y - 0.5, 'esquive', '#9cd8ff', 0); return 0; }
    const magic = opts.dmgType === 'magic';
    const atk = magic ? src.stats.matk : src.stats.atk;
    let dmg = atk * (opts.mult || 1) * (src.stats.dmgMult || 1) * (1 + rng.float(-B.variance, B.variance));
    const def = tgt.stats.def * (magic ? B.magicDefFactor : 1);
    const red = Math.min(B.defCap, def / (def + B.defK + B.defPerLvl * src.level));
    dmg *= 1 - red;
    const el = opts.element || 'physical';
    let em = 1;
    if (tgt.weak && tgt.weak.indexOf(el) >= 0) em = B.weakMult;
    else if (tgt.resist && tgt.resist.indexOf(el) >= 0) em = B.resistMult;
    if (tgt.stats.res[el]) em *= 1 - Math.min(B.resCap, tgt.stats.res[el]);
    dmg *= em;
    const crit = rng.chance(src.stats.crit);
    if (crit) dmg *= src.stats.critDmg;
    dmg = Math.max(1, Math.round(dmg));
    tgt.hp -= dmg;
    tgt.anim.hit = 0.12;
    // statistiques
    if (src.side === 'hero') run.track(src.id, 'dmg', dmg);
    if (tgt.side === 'hero') run.track(tgt.id, 'taken', dmg);
    const col = tgt.side === 'hero' ? '#ff5a5a' : em > 1 ? '#ffb347' : em < 1 ? '#a0a0a0' : '#ffffff';
    fx.text(tgt.x, tgt.y - 0.55 * tgt.scale, String(dmg), crit ? '#ffe14d' : col, crit ? 2 : 1);
    if (el !== 'physical') fx.burst(tgt.x, tgt.y, G.data.elements[el].color, 4);
    if (tgt.side === 'monster' && !tgt.aggro) run.aggroRoom(tgt);
    if (tgt.hp <= 0) { tgt.hp = 0; run.onDeath(tgt, src); }
    return dmg;
  };
  C.heal = function (run, src, tgt, amount) {
    if (tgt.dead) return;
    amount = Math.round(amount * (src.stats.healMult || 1));
    const real = Math.min(amount, tgt.stats.maxHp - tgt.hp);
    tgt.hp += real;
    run.track(src.id, 'heal', real);
    G.render.fx.text(tgt.x, tgt.y - 0.55, '+' + amount, '#6dff8a', 1);
    G.render.fx.burst(tgt.x, tgt.y, '#6dff8a', 6, -1.5);
  };

  // ---------- Déplacement ----------
  function step(run, u, dx, dy, maxd) {
    const len = Math.hypot(dx, dy);
    if (len < 1e-4) return false;
    const s = Math.min(maxd, len);
    const nx = u.x + (dx / len) * s, ny = u.y + (dy / len) * s;
    const map = run.map;
    let moved = false;
    if (P.free(map, nx, ny)) { u.x = nx; u.y = ny; moved = true; }
    else if (P.free(map, nx, u.y)) { u.x = nx; moved = true; }
    else if (P.free(map, u.x, ny)) { u.y = ny; moved = true; }
    if (Math.abs(dx) > 0.02) u.facing = dx > 0 ? 1 : -1;
    u.moving = moved;
    return moved;
  }
  // va vers (tx, ty) : en ligne droite si la vue est dégagée, sinon via A*
  C.moveTo = function (run, u, tx, ty, dt, speed) {
    const d = speed * dt;
    const map = run.map;
    if (P.los(map, u.x, u.y, tx, ty, 0.22)) {
      u.path = null;
      return step(run, u, tx - u.x, ty - u.y, d);
    }
    const key = (tx | 0) + ',' + (ty | 0);
    u.repath -= dt;
    if (!u.path || u.pathKey !== key || u.repath <= 0) {
      u.path = P.astar(map, Math.floor(u.x), Math.floor(u.y), Math.floor(tx), Math.floor(ty));
      u.pathKey = key; u.repath = 0.6;
      if (!u.path) return step(run, u, tx - u.x, ty - u.y, d);
    }
    // raccourci : sauter les étapes déjà visibles
    while (u.path.length > 1 && P.los(map, u.x, u.y, u.path[1].x + 0.5, u.path[1].y + 0.5, 0.22)) u.path.shift();
    const wp = u.path[0];
    if (!wp) return step(run, u, tx - u.x, ty - u.y, d);
    const wx = wp.x + 0.5, wy = wp.y + 0.5;
    if (Math.hypot(wx - u.x, wy - u.y) < 0.12) { u.path.shift(); return true; }
    return step(run, u, wx - u.x, wy - u.y, d);
  };

  // ---------- Attaque ----------
  function attack(run, u, t) {
    u.anim.atk = 0.18;
    const dx = t.x - u.x, dy = t.y - u.y, l = Math.hypot(dx, dy) || 1;
    u.anim.lx = dx / l; u.anim.ly = dy / l;
    u.facing = dx >= 0 ? 1 : -1;
    const opts = { mult: u.attack.mult || 1, dmgType: u.attack.dmgType, element: u.attack.element };
    if (u.attack.type === 'melee') {
      C.damage(run, u, t, opts);
      G.render.fx.slash(t.x, t.y, u.facing);
    } else {
      run.projectiles.push({ x: u.x + u.facing * 0.2, y: u.y - 0.15, src: u, tgt: t, kind: u.attack.projectile || 'arrow', opts, life: 3 });
    }
  }
  C.updateProjectiles = function (run, dt) {
    const sp = B.projectileSpeed * dt;
    for (const p of run.projectiles) {
      p.life -= dt;
      if (p.tgt.dead) { p.life = 0; continue; }
      const dx = p.tgt.x - p.x, dy = p.tgt.y - p.y, l = Math.hypot(dx, dy);
      p.ang = Math.atan2(dy, dx);
      if (l <= sp + 0.15) { p.life = 0; if (!p.src.dead || p.src.side === 'hero') C.damage(run, p.src, p.tgt, p.opts); }
      else { p.x += (dx / l) * sp; p.y += (dy / l) * sp; }
    }
    run.projectiles = run.projectiles.filter((p) => p.life > 0);
  };

  // engage : s'approche à portée puis attaque
  function engage(run, u, t, dt) {
    const d = Math.hypot(t.x - u.x, t.y - u.y);
    const inRange = d <= u.attack.range + t.r;
    const los = inRange && (u.attack.type === 'melee' || P.los(run.map, u.x, u.y, t.x, t.y));
    if (inRange && los) {
      u.moving = false;
      u.facing = t.x >= u.x ? 1 : -1;
      if (u.cd <= 0) { attack(run, u, t); u.cd = C.attackInterval(u); }
      // les tireurs reculent un peu si un monstre les colle
      if (u.attack.type === 'ranged' && d < 1 && u.side === 'hero') step(run, u, u.x - t.x, u.y - t.y, C.moveSpeed(u) * dt * 0.6);
    } else {
      C.moveTo(run, u, t.x, t.y, dt, C.moveSpeed(u));
    }
  }

  // ---------- IA des héros ----------
  C.heroAI = function (run, u, dt, enemies) {
    // soin prioritaire
    if (u.heal && u.healCd <= 0) {
      let best = null, br = u.heal.threshold;
      for (const a of run.heroes) if (!a.dead && a.hp / a.stats.maxHp < br) { br = a.hp / a.stats.maxHp; best = a; }
      if (best) {
        const d = Math.hypot(best.x - u.x, best.y - u.y);
        if (d <= u.heal.range) {
          C.heal(run, u, best, u.stats.matk * u.heal.mult);
          u.healCd = u.heal.cooldown * 100 / u.stats.spd;
          u.anim.atk = 0.2; u.anim.lx = 0; u.anim.ly = -1;
          return true;
        }
        C.moveTo(run, u, best.x, best.y, dt, C.moveSpeed(u));
        return true;
      }
    }
    if (!enemies.length) return false;
    u.retarget -= dt;
    if (!u.target || u.target.dead || u.retarget <= 0) {
      let best = null, bd = 1e9;
      for (const m of enemies) {
        let d = Math.hypot(m.x - u.x, m.y - u.y);
        if (u.attack.type === 'ranged') d += (m.hp / m.stats.maxHp) * 1.5; // les tireurs finissent les blessés
        if (m.guardian && u.threat >= 3) d -= 2; // le tank va au gardien
        if (d < bd) { bd = d; best = m; }
      }
      u.target = best; u.retarget = 1;
    }
    engage(run, u, u.target, dt);
    return true;
  };

  // ---------- IA des monstres ----------
  C.monsterAI = function (run, u, dt) {
    if (!u.aggro) {
      for (const h of run.heroes) {
        if (h.dead) continue;
        if (Math.hypot(h.x - u.x, h.y - u.y) < B.aggroRadius && P.los(run.map, u.x, u.y, h.x, h.y)) { run.aggroRoom(u); break; }
      }
      if (!u.aggro) return;
    }
    u.retarget -= dt;
    if (!u.target || u.target.dead || u.retarget <= 0) {
      let best = null, bd = 1e9;
      for (const h of run.heroes) {
        if (h.dead) continue;
        const d = Math.hypot(h.x - u.x, h.y - u.y) - (h.threat - 1) * 1.2;
        if (d < bd) { bd = d; best = h; }
      }
      u.target = best; u.retarget = 1.2;
    }
    if (u.target) engage(run, u, u.target, dt);
  };

  // évite que les unités se superposent
  C.separate = function (run) {
    const all = run.units.filter((u) => !u.dead);
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], b = all[j];
      // les héros peuvent se croiser hors combat (couloirs étroits), et se gênent peu en combat
      let k = 0.35;
      if (a.side === 'hero' && b.side === 'hero') { if (!run.inCombat) continue; k = 0.12; }
      if (a.ghostT > 0 || b.ghostT > 0) continue;
      const dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, d = Math.hypot(dx, dy);
      if (d >= min || d < 1e-4) continue;
      const push = (min - d) * k, nx = dx / d, ny = dy / d;
      if (P.free(run.map, a.x - nx * push, a.y - ny * push)) { a.x -= nx * push; a.y -= ny * push; }
      if (P.free(run.map, b.x + nx * push, b.y + ny * push)) { b.x += nx * push; b.y += ny * push; }
    }
  };
  G.sys.combat = C;
})();
