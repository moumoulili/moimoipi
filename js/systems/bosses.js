// =====================================================================
//  MÉCANIQUES DES BOSS (voir data/bosses.js)
//  Les attaques de zone sont annoncées au sol (run.telegraphs) : les héros
//  sortent de la zone avant l'impact s'ils en ont le temps.
// =====================================================================
(function () {
  const Bo = {};
  const rng = G.core.rng;
  const fx = () => G.render.fx;
  const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  Bo.init = function (u) {
    const def = G.data.bosses[u.bossId];
    if (!def) return;
    u.mech = def.mechs.map((m) => Object.assign({}, m, { t: m.every ? m.every * 0.6 : 0, done: [], fired: false }));
    u.fightT = 0;
  };

  // zone de danger : impact après `warn` secondes
  Bo.telegraph = function (run, x, y, r, warn, color, onHit) {
    run.telegraphs.push({ x, y, r, t: warn, warn, color, onHit });
  };
  function zoneHit(run, u, m, x, y, r) {
    for (const h of run.heroes) {
      if (h.dead || Math.hypot(h.x - x, h.y - y) > r + h.r) continue;
      G.sys.combat.damage(run, u, h, { mult: m.mult, dmgType: 'magic', element: m.element, ranged: true, noExtra: true });
      if (m.status && !h.dead) G.sys.effects.add(h, { id: m.status.id, t: m.status.dur, src: u, value: m.status.value, dps: m.status.id === 'burn' ? u.stats.atk * 0.25 : undefined });
    }
    fx().impact(x, y, m.element || 'physical', true);
    fx().ring(x, y, fx().colorOf(m.element), r, 0.35);
    fx().shake(0.15);
  }

  function summon(run, u, id, count) {
    const alive = run.monsters.filter((m) => m.summoned && !m.dead).length;
    const n = Math.min(count, 6 - alive);
    for (let k = 0; k < n; k++) {
      let px = u.x, py = u.y;
      for (let t = 0; t < 12; t++) {
        const a = rng.next() * Math.PI * 2, d = rng.float(1, 2.2);
        const x = u.x + Math.cos(a) * d, y = u.y + Math.sin(a) * d;
        if (G.sys.path.free(run.map, x, y)) { px = x; py = y; break; }
      }
      const m = G.sys.combat.monsterUnit({ id, x: Math.floor(px), y: Math.floor(py), room: u.room, summoned: true }, run.saved.floor);
      m.x = px; m.y = py; m.aggro = true; m.goldMult = 0.25;
      run.monsters.push(m); run.units.push(m);
      fx().ring(px, py, '#a46bff', 0.8, 0.4); fx().burst(px, py, '#a46bff', 10, -1, true);
    }
    if (n > 0) G.ui.log('☠ ' + u.name + ' appelle des renforts !', 'boss');
  }

  Bo.update = function (run, u, dt) {
    if (!u.mech || u.dead || !u.aggro) return;
    if (!u.introduced) {
      u.introduced = true;
      G.ui.banner && G.ui.banner('⚠ ' + u.name, u.guardian === 'boss' ? 'Boss de l\'étage' : 'Gardien', 'boss');
      fx().shake(0.35); G.core.U.vibrate(80);
    }
    u.fightT += dt;
    const ratio = u.hp / u.stats.maxHp;
    const alive = run.heroes.filter((h) => !h.dead);
    if (!alive.length) return;
    // charge en cours
    if (u.dash) {
      const d = u.dash;
      d.t -= dt;
      if (d.t <= 0 && !d.go) { d.go = true; d.t = 0.5; }
      else if (d.go) {
        G.sys.combat.moveTo(run, u, d.tgt.x, d.tgt.y, dt, 13);
        fx().trail(u.x, u.y, '#ff6040', 2);
        if (near(u, d.tgt) < 1 || d.t <= 0) {
          if (!d.tgt.dead && near(u, d.tgt) < 1.6) {
            G.sys.combat.damage(run, u, d.tgt, { mult: d.m.mult, dmgType: 'phys', element: u.attack.element });
            if (!d.tgt.dead) G.sys.effects.add(d.tgt, { id: 'stun', t: d.m.stun || 1, src: u });
          }
          fx().ring(u.x, u.y, '#ff6040', 1.2, 0.3); fx().shake(0.2);
          u.dash = null;
        }
      }
      return;
    }
    const stunned = G.sys.effects.stunned(u);
    for (const m of u.mech) {
      if (m.every) { m.t -= dt; if (m.t > 0 || stunned) continue; m.t = m.every; }
      switch (m.type) {
        case 'summon': summon(run, u, m.monster, m.count); break;
        case 'aoe': {
          const tg = alive.slice().sort(() => rng.next() - 0.5).slice(0, m.targets || 1);
          for (const h of tg) { const x = h.x, y = h.y; Bo.telegraph(run, x, y, m.radius, m.warn, fx().colorOf(m.element), () => zoneHit(run, u, m, x, y, m.radius)); }
          break;
        }
        case 'slam': { const x = u.x, y = u.y; Bo.telegraph(run, x, y, m.radius, m.warn, fx().colorOf(m.element), () => zoneHit(run, u, m, x, y, m.radius)); break; }
        case 'charge': {
          const tgt = alive.slice().sort((a, b) => near(b, u) - near(a, u))[0];
          if (tgt && near(tgt, u) > 2) { u.dash = { tgt, m, t: 0.6 }; fx().beam(u.x, u.y, tgt.x, tgt.y, '#ff4040', 0.6); fx().text(u.x, u.y - 1.2, '!', '#ff4040', 2); }
          break;
        }
        case 'barrage':
          for (const h of alive) run.projectiles.push({ x: u.x, y: u.y - 0.4, src: u, tgt: h, kind: m.proj || 'orb', opts: { mult: m.mult, dmgType: 'magic', element: m.element, ranged: true }, el: m.element, life: 3, age: 0, big: true });
          fx().ring(u.x, u.y, fx().colorOf(m.element), 1.2, 0.3);
          break;
        case 'shield':
          if (!m.fired && ratio < m.below) {
            m.fired = true;
            G.sys.effects.add(u, { id: 'shield', t: 9999, src: u, value: u.stats.maxHp * m.value });
            fx().ring(u.x, u.y, '#fff3a8', 1.6, 0.6); G.ui.log('🛡 ' + u.name + ' se protège d\'un bouclier !', 'boss');
          }
          break;
        case 'phaseSummon':
          for (const th of m.at) if (ratio < th && m.done.indexOf(th) < 0) { m.done.push(th); summon(run, u, m.monster, m.count); }
          break;
        case 'enrage':
          if (!m.fired && ((m.below && ratio < m.below) || (m.after && u.fightT > m.after))) {
            m.fired = true; u.enraged = true;
            G.sys.effects.add(u, { id: 'buff', key: 'enrage', t: 9999, src: u, mods: { dmgPct: m.dmg, atkSpd: m.spd } });
            fx().ring(u.x, u.y, '#ff2020', 2, 0.6); fx().flash('#ff2020', 0.15); fx().shake(0.3);
            G.ui.banner && G.ui.banner(u.name + ' enrage !', '', 'boss'); G.ui.log('😡 ' + u.name + ' entre dans une rage folle !', 'boss');
          }
          break;
        case 'regen':
          if (u.hp < u.stats.maxHp) { u.hp = Math.min(u.stats.maxHp, u.hp + u.stats.maxHp * m.pct * dt); if (Math.random() < dt * 2) fx().sparkle(u.x, u.y, '#6dff8a', 2); }
          break;
      }
    }
  };

  Bo.updateTelegraphs = function (run, dt) {
    if (!run.telegraphs.length) return;
    const due = [];
    for (const t of run.telegraphs) { t.t -= dt; if (t.t <= 0) due.push(t); }
    if (due.length) { run.telegraphs = run.telegraphs.filter((t) => t.t > 0); for (const t of due) t.onHit(); }
  };
  // zone de danger où se trouve un héros (pour l'esquive)
  Bo.dangerAt = function (run, u) {
    for (const t of run.telegraphs) if (Math.hypot(u.x - t.x, u.y - t.y) < t.r + u.r + 0.15) return t;
    return null;
  };
  G.sys.bosses = Bo;
})();
