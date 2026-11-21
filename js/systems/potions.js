// =====================================================================
//  POTIONS : utilisation automatique selon les règles du joueur,
//  ou manuelle (bouton dans l'écran donjon). Les élixirs donnent un
//  bonus temporaire à toute l'équipe (run.buffs).
// =====================================================================
(function () {
  const B = G.data.balance, U = G.core.U;
  const P = {};
  const has = (id) => (G.state.potions[id] || 0) > 0;
  const take = (id) => { G.state.potions[id]--; G.core.bus.emit('potion:use', { id }); };

  P.drinkHeal = function (run, h) {
    if (!has('heal') || h.dead) return false;
    take('heal');
    const amt = Math.round(h.stats.maxHp * G.data.potions.heal.heal);
    h.hp = Math.min(h.stats.maxHp, h.hp + amt);
    h.potCd = B.potionCooldown;
    const fx = G.render.fx;
    fx.text(h.x, h.y - 0.6, '+' + amt, '#ff7a9a', 1);
    fx.ring(h.x, h.y, '#ff5a7a', 0.7, 0.35);
    fx.sparkle(h.x, h.y, '#ff7a9a', 10);
    G.ui.log('🧪 ' + h.name + ' boit une potion de soin.', 'info');
    return true;
  };
  P.drinkMana = function (run, h) {
    if (!has('mana') || h.dead) return false;
    take('mana');
    const amt = Math.round(h.stats.maxMp * G.data.potions.mana.mana);
    h.mp = Math.min(h.stats.maxMp, h.mp + amt);
    h.potCd = B.potionCooldown;
    G.render.fx.ring(h.x, h.y, '#4a7aff', 0.7, 0.35);
    G.render.fx.sparkle(h.x, h.y, '#7aa8ff', 10);
    G.ui.log('🧪 ' + h.name + ' boit une potion de mana.', 'info');
    return true;
  };
  P.revive = function (run, h) {
    if (!has('revive') || !h.dead || run.heroes.every((x) => x.dead)) return false;
    take('revive');
    h.dead = false;
    h.hp = Math.round(h.stats.maxHp * G.data.potions.revive.revive);
    h.deadFor = 0; h.potCd = B.potionCooldown;
    const fx = G.render.fx;
    fx.beam(h.x, h.y - 3, h.x, h.y, '#ffd34d', 0.6);
    fx.ring(h.x, h.y, '#ffd34d', 1.4, 0.6);
    fx.sparkle(h.x, h.y, '#fff3a8', 20);
    fx.flash('#fff3a8', 0.15);
    G.ui.log('🪶 ' + h.name + ' revient à la vie !', 'gold');
    return true;
  };
  P.buff = function (run, id) {
    if (!has(id) || run.buffs[id] > 0) return false;
    take(id);
    run.buffs[id] = G.data.potions[id].duration;
    G.sys.run.refreshStats();
    const col = G.data.potions[id].icon;
    for (const h of run.heroes) if (!h.dead) { G.render.fx.ring(h.x, h.y, col, 0.8, 0.4); G.render.fx.sparkle(h.x, h.y, col, 6); }
    G.ui.log('⚗ ' + G.data.potions[id].name + ' : bonus pour l\'équipe !', 'info');
    return true;
  };
  // bonus des élixirs actifs { dmgPct, defPct, atkSpd }
  P.buffStats = function (run) {
    const out = {};
    if (!run) return out;
    for (const id in run.buffs) {
      if (run.buffs[id] <= 0) continue;
      const b = G.data.potions[id].buff;
      for (const k in b) out[k] = (out[k] || 0) + b[k];
    }
    return out;
  };

  // appelé à chaque pas de jeu pendant l'expédition
  P.update = function (run, dt) {
    const R = G.state.potionRules;
    if (G.state.run && G.state.run.noPotions) return;
    // fin des élixirs
    let refresh = false;
    for (const id in run.buffs) if (run.buffs[id] > 0) { run.buffs[id] -= dt; if (run.buffs[id] <= 0) refresh = true; }
    if (refresh) G.sys.run.refreshStats();
    for (const h of run.heroes) {
      if (h.potCd > 0) h.potCd -= dt;
      if (h.dead) {
        h.deadFor = (h.deadFor || 0) + dt;
        if (R.revive && h.deadFor > 1.5) P.revive(run, h);
        continue;
      }
      if (R.heal > 0 && h.potCd <= 0 && h.hp / h.stats.maxHp < R.heal) P.drinkHeal(run, h);
      else if (R.mana > 0 && h.potCd <= 0 && run.inCombat && h.mp / h.stats.maxMp < R.mana && h.skillList && h.skillList.length) P.drinkMana(run, h);
    }
    // élixirs : au début des combats ou contre les gardiens
    if (run.inCombat) {
      const guardian = run.monsters.some((m) => m.guardian && m.aggro && !m.dead);
      for (const id of ['might', 'stone', 'haste']) {
        const rule = R.buffs[id];
        if (rule === 'combat' || (rule === 'boss' && guardian)) P.buff(run, id);
      }
    }
  };

  // utilisation manuelle depuis l'écran donjon
  P.manual = function (id) {
    const run = G.sys.run.active;
    if (!run || !has(id)) return false;
    if (id === 'heal') {
      const h = run.heroes.filter((x) => !x.dead).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
      return h ? P.drinkHeal(run, h) : false;
    }
    if (id === 'mana') {
      const h = run.heroes.filter((x) => !x.dead).sort((a, b) => a.mp / a.stats.maxMp - b.mp / b.stats.maxMp)[0];
      return h ? P.drinkMana(run, h) : false;
    }
    if (id === 'revive') { const h = run.heroes.find((x) => x.dead); return h ? P.revive(run, h) : false; }
    return P.buff(run, id);
  };
  G.sys.potions = P;
})();
