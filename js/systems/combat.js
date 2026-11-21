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
  C.heroUnit = function (h, hp, buffs) {
    const c = G.data.classes[h.cls];
    const st = G.sys.stats.hero(h, { buffs });
    const u0 = {
      uid: uidSeq++, id: h.id, side: 'hero', name: h.name, cls: h.cls, level: h.level,
      x: 0, y: 0, r: 0.3, hp: hp != null ? Math.min(hp, st.maxHp) : st.maxHp, stats: st,
      attack: G.sys.heroes.attack(h), threat: c.threat || 1,
      cd: rng.float(0, 0.6), healCd: 0, potCd: 0, facing: 1, scale: 1,
      sprite: G.sys.heroes.sprite(h),
      anim: { hit: 0, atk: 0, bob: rng.next() * 6, lx: 0, ly: 0 },
      path: null, pathKey: '', repath: 0, dead: false, target: null, retarget: 0,
      mp: st.maxMp, skillCd: {}, skillLock: 0, effects: [],
    };
    G.sys.skills.buildUnit(u0, h);
    return u0;
  };
  const MAGIC_PROJ = { orb: 1, holy: 1, fire: 1, ice: 1, spark: 1 };
  // floor = niveau réel des monstres ; dg = donjon (multiplicateurs de difficulté / récompense)
  C.monsterUnit = function (sp, floor, dg) {
    const md = G.data.monsters[sp.id];
    let mods = {}, scale = 1, outline = null, goldMult = 1, name = md.name;
    let bossDef = null;
    if (sp.guardian) {
      const g = B.guardian[sp.guardian];
      bossDef = sp.bossId ? G.data.bosses[sp.bossId] : null;
      mods = Object.assign({}, g);
      if (bossDef && bossDef.mods) for (const k in bossDef.mods) mods[k] = (mods[k] || 1) * bossDef.mods[k];
      scale = (bossDef && bossDef.scale) || g.scale; outline = sp.guardian === 'boss' ? '#ff3b3b' : '#ff9a3b'; goldMult = g.gold; name = sp.name;
    } else if (sp.elite) {
      mods = B.elite; outline = '#ffd34d'; goldMult = B.elite.gold; name = md.name + ' élite';
    }
    const st = G.sys.stats.monster(md, floor, mods);
    const dm = dg ? dg.mult : 1;
    if (dm !== 1) { st.maxHp = Math.round(st.maxHp * dm); st.atk *= dm; st.matk = st.atk; st.def *= dm; }
    if (dg && dg.reward) goldMult *= dg.reward;
    return {
      xpMult: (dg && dg.reward) || 1,
      uid: uidSeq++, id: md.id, side: 'monster', name, level: floor, family: md.family,
      x: sp.x + 0.5, y: sp.y + 0.5, r: 0.3 * Math.min(scale, 1.4), hp: st.maxHp, stats: st,
      attack: { type: md.behavior, range: md.range, dmgType: MAGIC_PROJ[md.projectile] ? 'magic' : 'phys', element: md.element, projectile: md.projectile },
      weak: md.weak, resist: md.resist, threat: 1, dive: !!md.dive,
      cd: rng.float(0.3, 1), facing: -1, scale, outline,
      sprite: bossDef && bossDef.sprite ? Object.assign({ id: sp.bossId }, bossDef.sprite) : Object.assign({ id: md.id }, md.sprite),
      anim: { hit: 0, atk: 0, bob: rng.next() * 6, lx: 0, ly: 0 },
      path: null, pathKey: '', repath: 0, dead: false, target: null, retarget: 0,
      bossId: sp.bossId || null, summoned: !!sp.summoned,
      aggro: false, room: sp.room, elite: !!sp.elite, guardian: sp.guardian || null, goldMult, deadT: 0, effects: [],
    };
  };

  // élément utilisé pour l'effet visuel (la magie neutre est violette : « arcane »)
  C.vfxEl = (opts) => (opts.vfx ? opts.vfx : opts.element && opts.element !== 'physical' ? opts.element : opts.dmgType === 'magic' ? 'arcane' : 'physical');

  C.attackInterval = function (u) {
    const m = G.sys.effects.mods(u);
    return B.baseAttackTime * (u.attack.interval || 1) * 100 / Math.max(20, u.stats.spd) / ((u.stats.wspd || 1) * (1 + (u.stats.atkSpd || 0) + m.atkSpd)) / m.spd;
  };
  C.moveSpeed = (u) => B.moveSpeed * Math.max(0.6, Math.min(1.6, u.stats.spd / 100)) * G.sys.effects.mods(u).spd;

  // ---------- Dégâts ----------
  // opts : { mult, dmgType: 'phys'|'magic', element }
  C.damage = function (run, src, tgt, opts) {
    if (!tgt || tgt.dead) return 0;
    const fx = G.render.fx;
    if (rng.chance(tgt.stats.dodge)) { fx.text(tgt.x, tgt.y - 0.5, 'esquive', '#9cd8ff', 0); return 0; }
    const magic = opts.dmgType === 'magic';
    const atk = magic ? src.stats.matk : src.stats.atk;
    const E = G.sys.effects, sm = E.mods(src), tm = E.mods(tgt);
    let dmg = atk * (opts.mult || 1) * (src.stats.dmgMult || 1) * sm.dmg * (1 + rng.float(-B.variance, B.variance));
    const def = tgt.stats.def * tm.def * (magic ? B.magicDefFactor : 1);
    const red = Math.min(B.defCap, def / (def + B.defK + B.defPerLvl * src.level));
    dmg *= 1 - red;
    const el = opts.element || 'physical';
    let em = 1;
    if (tgt.weak && tgt.weak.indexOf(el) >= 0) em = B.weakMult;
    else if (tgt.resist && tgt.resist.indexOf(el) >= 0) em = B.resistMult;
    if (tgt.stats.res[el]) em *= 1 - Math.min(B.resCap, tgt.stats.res[el]);
    dmg *= em;
    if (src.stats.elAmp && src.stats.elAmp[el]) dmg *= 1 + src.stats.elAmp[el];
    const lb = G.data.elementOnHit.light;
    if (el === 'light' && tgt.family && lb.bonusVs.indexOf(tgt.family) >= 0) dmg *= 1 + lb.bonus;
    // dégâts élémentaires de l'équipement (chaque élément subit faiblesses/résistances)
    const ed = src.stats.elemDmg;
    if (ed && !opts.noExtra) for (const e in ed) {
      let m2 = 1;
      if (tgt.weak && tgt.weak.indexOf(e) >= 0) m2 = B.weakMult; else if (tgt.resist && tgt.resist.indexOf(e) >= 0) m2 = B.resistMult;
      if (tgt.stats.res[e]) m2 *= 1 - Math.min(B.resCap, tgt.stats.res[e]);
      dmg += ed[e] * (opts.mult || 1) * m2 * (1 - red * 0.5);
      if (m2 > em) em = m2;
    }
    if (src.stats.bossDmg && (tgt.guardian || tgt.elite)) dmg *= 1 + src.stats.bossDmg;
    const crit = rng.chance(src.stats.crit + (opts.critBonus || 0));
    if (crit) dmg *= src.stats.critDmg;
    dmg *= tm.taken;
    dmg = Math.max(1, Math.round(dmg));
    const raw = dmg;
    dmg = Math.round(E.absorb(tgt, dmg)); // boucliers
    if (dmg <= 0) { fx.text(tgt.x, tgt.y - 0.5, 'absorbé', '#fff3a8', 0); return 0; }
    tgt.hp -= dmg;
    tgt.anim.hit = 0.12;
    // statistiques
    if (src.side === 'hero') run.track(src.id, 'dmg', dmg);
    if (tgt.side === 'hero') run.track(tgt.id, 'taken', dmg);
    const col = tgt.side === 'hero' ? '#ff5a5a' : em > 1 ? '#ffb347' : em < 1 ? '#a0a0a0' : '#ffffff';
    fx.text(tgt.x, tgt.y - 0.55 * tgt.scale, String(dmg), crit ? '#ffe14d' : col, crit ? 2 : 1);
    if (opts.ranged) fx.impact(tgt.x, tgt.y - 0.2, C.vfxEl(opts), crit);
    else fx.burst(tgt.x, tgt.y - 0.2, tgt.side === 'hero' ? '#ff6060' : '#ffffff', crit ? 10 : 4);
    if (crit) {
      fx.shake(src.side === 'hero' ? 0.12 : 0.18);
      fx.ring(tgt.x, tgt.y - 0.2, '#ffe14d', 0.9, 0.25);
    }
    // petit recul sur les coups au corps à corps
    if (!opts.ranged && !tgt.guardian) {
      const kx = tgt.x - src.x, ky = tgt.y - src.y, kl = Math.hypot(kx, ky) || 1, kb = crit ? 0.18 : 0.08;
      if (P.free(run.map, tgt.x + (kx / kl) * kb, tgt.y + (ky / kl) * kb)) { tgt.x += (kx / kl) * kb; tgt.y += (ky / kl) * kb; }
    }
    if (tgt.side === 'hero' && dmg > tgt.stats.maxHp * 0.2) fx.flash('#ff2020', 0.08);
    if (tgt.side === 'monster' && !tgt.aggro) run.aggroRoom(tgt);
    // vol de vie et épines
    if (src.stats.lifesteal && !src.dead) src.hp = Math.min(src.stats.maxHp, src.hp + dmg * src.stats.lifesteal);
    if (tgt.stats.thorns && !opts.ranged && !opts.noExtra && !src.dead) {
      const back = Math.max(1, Math.round(dmg * tgt.stats.thorns));
      src.hp -= back; src.anim.hit = 0.1;
      fx.text(src.x, src.y - 0.5, String(back), '#c8ff8a', 1);
      if (src.hp <= 0) { src.hp = 0; run.onDeath(src, tgt); }
    }
    if (el !== 'physical' && tgt.hp > 0) E.onElementHit(run, src, tgt, el, raw);
    if (tgt.hp <= 0) { tgt.hp = 0; run.onDeath(tgt, src); }
    return dmg;
  };
  C.heal = function (run, src, tgt, amount) {
    if (tgt.dead) return;
    amount = Math.round(amount * (src.stats.healMult || 1));
    const real = Math.min(amount, tgt.stats.maxHp - tgt.hp);
    tgt.hp += real;
    run.track(src.id, 'heal', real);
    const fx = G.render.fx;
    fx.text(tgt.x, tgt.y - 0.55, '+' + amount, '#6dff8a', 1);
    fx.beam(src.x, src.y - 0.35, tgt.x, tgt.y - 0.2, '#6dff8a', 0.3);
    fx.ring(tgt.x, tgt.y, '#6dff8a', 0.7, 0.4);
    fx.ring(tgt.x, tgt.y, '#d8ffe0', 0.45, 0.3);
    fx.sparkle(tgt.x, tgt.y, '#6dff8a', 10);
    fx.sparkle(src.x, src.y - 0.4, '#fff3a8', 4);
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
    if (u.stats.mainEl && (!opts.element || opts.element === 'physical')) opts.vfx = u.stats.mainEl;
    const fx = G.render.fx;
    const times = u.stats.echo && rng.chance(u.stats.echo) ? 2 : 1;
    for (let k = 0; k < times; k++) {
      if (t.dead) break;
      if (u.attack.type === 'melee') {
        const big = u.guardian || u.cls === 'warrior';
        fx.slash(t.x, t.y - 0.25 - k * 0.2, u.facing, opts.vfx ? fx.colorOf(opts.vfx) : u.side === 'hero' ? '#ffffff' : '#ff7070', big);
        if (opts.vfx) fx.impact(t.x, t.y - 0.2, opts.vfx, false);
        C.damage(run, u, t, opts);
      } else {
        const o = Object.assign({}, opts, { ranged: true });
        const sx = u.x + u.facing * 0.3, sy = u.y - 0.3;
        if (k === 0 && ((u.attack.projectile || 'arrow') !== 'arrow' || o.vfx)) fx.muzzle(sx, sy, C.vfxEl(o));
        run.projectiles.push({ x: sx, y: sy, src: u, tgt: t, kind: u.attack.projectile || 'arrow', opts: o, el: C.vfxEl(o), life: 3, age: 0, wait: k * 0.15 });
      }
    }
    if (times > 1) fx.text(u.x, u.y - 0.9, 'x2', '#ffe14d', 1);
  }
  C.updateProjectiles = function (run, dt) {
    const sp = B.projectileSpeed * dt;
    for (const p of run.projectiles) {
      if (p.wait > 0) { p.wait -= dt; continue; }
      p.life -= dt; p.age += dt;
      if (p.tgt.dead) { p.life = 0; continue; }
      G.render.fx.trail(p.x, p.y, p.kind === 'arrow' ? 'rgba(232,224,200,0.6)' : G.render.fx.colorOf(p.el), p.kind === 'arrow' ? 1 : 2);
      const dx = p.tgt.x - p.x, dy = p.tgt.y - p.y, l = Math.hypot(dx, dy);
      p.ang = Math.atan2(dy, dx);
      if (l <= sp + 0.15) { p.life = 0; if (p.onHit) p.onHit(p.tgt); else if (!p.src.dead || p.src.side === 'hero') C.damage(run, p.src, p.tgt, p.opts); }
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
    if (G.sys.effects.stunned(u)) { u.moving = false; return true; }
    // esquive des zones de danger annoncées
    const danger = G.sys.bosses.dangerAt(run, u);
    if (danger) {
      let dx = u.x - danger.x, dy = u.y - danger.y, l = Math.hypot(dx, dy);
      if (l < 0.05) { const a = u.uid * 2.39; dx = Math.cos(a); dy = Math.sin(a); l = 1; } // centrée sur le héros : direction de repli
      const ex = danger.x + (dx / l) * (danger.r + 0.8), ey = danger.y + (dy / l) * (danger.r + 0.8);
      C.moveTo(run, u, ex, ey, dt, C.moveSpeed(u) * 1.2);
      return true;
    }
    if (u.skillLock > 0) return true;
    // compétences (selon les priorités réglées par le joueur)
    if (G.sys.skills.tryCast(run, u, enemies)) return true;
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
    if (G.sys.effects.stunned(u)) { u.moving = false; return; }
    const tauntBy = G.sys.effects.taunter(u);
    if (tauntBy && u.aggro) { u.target = tauntBy; engage(run, u, tauntBy, dt); return; }
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
        const d = Math.hypot(h.x - u.x, h.y - u.y) + (u.dive ? (h.threat - 1) * B.diveAvoidTank - (1 - h.hp / h.stats.maxHp) * 2 : -(h.threat - 1) * 1.2);
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
