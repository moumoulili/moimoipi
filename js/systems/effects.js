// =====================================================================
//  EFFETS DE STATUT : application, durée, dégâts sur la durée, et
//  modificateurs qu'ils donnent aux unités (vitesse, dégâts, défense...).
//  Un effet : { id, t (durée restante), src (unité), value, dps, mods, acc }
// =====================================================================
(function () {
  const B = G.data.balance;
  const E = {};
  const rng = G.core.rng;

  E.add = function (u, eff) {
    if (!u || u.dead) return;
    u.effects = u.effects || [];
    const def = G.data.effects[eff.id] || {};
    if (u.guardian && (def.control || eff.id === 'slow')) eff.t *= B.ccResistBoss;
    // un même effet du même lanceur est rafraîchi plutôt qu'empilé
    const same = u.effects.find((e) => e.id === eff.id && e.src === eff.src && e.id !== 'buff');
    if (same) { same.t = Math.max(same.t, eff.t); if (eff.dps) same.dps = Math.max(same.dps || 0, eff.dps); if (eff.value) same.value = Math.max(same.value || 0, eff.value); return; }
    if (eff.id === 'buff' && eff.key) {
      const k = u.effects.find((e) => e.id === 'buff' && e.key === eff.key);
      if (k) { k.t = eff.t; k.mods = eff.mods; return; }
    }
    eff.acc = 0;
    u.effects.push(eff);
  };
  E.has = (u, id) => !!(u.effects && u.effects.some((e) => e.id === id));
  E.stunned = (u) => !!(u.effects && u.effects.some((e) => e.id === 'stun' || e.id === 'freeze'));

  // modificateurs combinés des effets actifs
  E.mods = function (u) {
    const m = { spd: 1, dmg: 1, def: 1, atkSpd: 0, taken: 1 };
    if (!u.effects || !u.effects.length) return m;
    for (const e of u.effects) {
      if (e.id === 'slow') m.spd *= 1 - e.value;
      else if (e.id === 'weaken') m.dmg *= 1 - e.value;
      else if (e.id === 'armorBreak') m.def *= 1 - e.value;
      else if (e.id === 'buff' && e.mods) {
        if (e.mods.dmgPct) m.dmg *= 1 + e.mods.dmgPct;
        if (e.mods.defPct) m.def *= 1 + e.mods.defPct;
        if (e.mods.atkSpd) m.atkSpd += e.mods.atkSpd;
        if (e.mods.dmgTaken) m.taken *= 1 + e.mods.dmgTaken;
      }
    }
    return m;
  };
  // absorbe des dégâts avec les boucliers ; renvoie le reste
  E.absorb = function (u, dmg) {
    if (!u.effects) return dmg;
    for (const e of u.effects) {
      if (e.id !== 'shield' || dmg <= 0) continue;
      const a = Math.min(e.value, dmg);
      e.value -= a; dmg -= a;
      if (e.value <= 0) e.t = 0;
    }
    return dmg;
  };
  E.taunter = function (u) {
    if (!u.effects) return null;
    const e = u.effects.find((x) => x.id === 'taunt' && x.src && !x.src.dead);
    return e ? e.src : null;
  };

  // effet déclenché par un élément à l'impact
  E.onElementHit = function (run, src, tgt, el, dmg) {
    const oh = G.data.elementOnHit[el];
    if (!oh || !oh.id || tgt.dead) return;
    const res = Math.min(B.resCap, (tgt.stats.res && tgt.stats.res[el]) || 0);
    if (!rng.chance(oh.chance * (1 - res))) return;
    if (el === 'ice' && rng.chance(oh.freezeChance * (1 - res))) { E.add(tgt, { id: 'freeze', t: 1.2, src }); return; }
    const eff = { id: oh.id, t: oh.dur, src, value: oh.value };
    if (oh.dotMult) eff.dps = dmg * oh.dotMult * (1 + ((src.stats && src.stats.burnPct) || 0));
    E.add(tgt, eff);
  };

  // dégâts directs d'un effet (pas de défense, pas d'esquive)
  function dot(run, u, e, amt) {
    amt = Math.max(1, Math.round(amt));
    amt = Math.round(E.absorb(u, amt));
    if (amt <= 0) return;
    u.hp -= amt;
    if (e.src && e.src.side === 'hero') run.track(e.src.id, 'dmg', amt);
    if (u.side === 'hero') run.track(u.id, 'taken', amt);
    G.render.fx.text(u.x, u.y - 0.5, String(amt), G.data.effects[e.id].color, 1);
    if (u.hp <= 0) { u.hp = 0; run.onDeath(u, e.src); }
  }

  E.update = function (run, dt) {
    for (const u of run.units) {
      if (!u.effects || !u.effects.length) continue;
      if (u.dead) { u.effects.length = 0; continue; }
      for (const e of u.effects) {
        e.t -= dt;
        if (e.dps) {
          e.acc += dt;
          while (e.acc >= B.dotTick && !u.dead) { e.acc -= B.dotTick; dot(run, u, e, e.dps * B.dotTick); }
        }
        // petites particules selon l'effet
        if (Math.random() < dt * 6) {
          const col = G.data.effects[e.id] && G.data.effects[e.id].color;
          if (e.id === 'burn') G.render.fx.trail(u.x + (Math.random() - 0.5) * 0.4, u.y - 0.3, col, 1);
          else if (e.id === 'poison') G.render.fx.trail(u.x + (Math.random() - 0.5) * 0.4, u.y - 0.2, col, 1);
          else if (e.id === 'slow' || e.id === 'freeze') G.render.fx.trail(u.x + (Math.random() - 0.5) * 0.4, u.y - 0.4, '#bfefff', 1);
        }
      }
      u.effects = u.effects.filter((e) => e.t > 0);
    }
  };
  G.sys.effects = E;
})();
