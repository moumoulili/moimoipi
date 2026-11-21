// =====================================================================
//  COMPÉTENCES : arbre (apprendre, réinitialiser, répartition auto),
//  bonus passifs, règles de priorité et lancement en combat.
//  Héros sauvegardé : skills {id: rang}, skillOrder [ids], skillRules {id: {mode, value}}
// =====================================================================
(function () {
  const B = G.data.balance, U = G.core.U;
  const K = {};
  const rng = G.core.rng;
  const SK = () => G.data.skills;

  // ---------- Arbre ----------
  K.forClass = (cls) => Object.values(SK()).filter((s) => s.cls === cls && !s.evo);
  // compétences du héros : classe de base + branches débloquées par ses évolutions
  // (+ branches des classes précédentes : un ancien aventurier garde sa branche « Aventurier »)
  K.forHero = (h) => Object.values(SK()).filter((s) => (s.cls === h.cls || (h.pastCls || []).indexOf(s.cls) >= 0) && (!s.evo || s.evo === h.adv || s.evo === h.ult));
  K.branches = (h) => (h.cls === 'adventurer' ? [] : ['A', 'B']).concat((h.pastCls || []).indexOf('adventurer') >= 0 || h.cls === 'adventurer' ? ['V'] : [], h.adv ? ['C'] : [], h.ult ? ['D'] : []);
  K.branchInfo = function (h, b) {
    if (b === 'C' || b === 'D') { const e = G.data.evolutions[b === 'C' ? h.adv : h.ult]; return { name: e.name, icon: e.icon }; }
    if (b === 'V') return G.data.skillBranches.adventurer.V;
    return G.data.skillBranches[h.cls][b];
  };
  // rang 1 offert pour les compétences de départ (innate)
  K.freeRank = (id) => (SK()[id] && SK()[id].innate ? 1 : 0);
  K.rank = (h, id) => Math.max((h.skills && h.skills[id]) || 0, K.freeRank(id));
  K.pointsIn = (h, branch) => K.forHero(h).filter((s) => s.branch === branch).reduce((a, s) => a + K.rank(h, s.id), 0);
  K.spent = (h) => K.forHero(h).reduce((a, s) => a + K.rank(h, s.id) - K.freeRank(s.id), 0);
  // raison du blocage, ou '' si on peut apprendre
  K.lockReason = function (h, id) {
    const s = SK()[id];
    if (K.rank(h, id) >= s.maxRank) return 'Rang maximum';
    const need = s.row * G.data.skillRowCost;
    if (K.pointsIn(h, s.branch) < need) return need + ' points requis dans la branche ' + K.branchInfo(h, s.branch).name;
    if (s.row > 0) {
      const prev = K.forHero(h).find((x) => x.branch === s.branch && x.row === s.row - 1);
      if (prev && K.rank(h, prev.id) < 1) return 'Requiert « ' + prev.name + ' »';
    }
    return '';
  };
  K.canLearn = (h, id) => (h.sp || 0) > 0 && !K.lockReason(h, id);
  K.learn = function (h, id) {
    if (!K.canLearn(h, id)) return false;
    h.skills = h.skills || {};
    h.skills[id] = K.rank(h, id) + 1;
    h.sp--;
    if (SK()[id].type === 'active') { h.skillOrder = h.skillOrder || []; if (h.skillOrder.indexOf(id) < 0) h.skillOrder.push(id); }
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    G.core.bus.emit('skill:learn', { hero: h.id, skill: id });
    return true;
  };
  K.respecCost = (h) => B.respecPrice(h.level);
  K.respec = function (h) {
    const c = K.respecCost(h);
    if (G.state.gold < c || !K.spent(h)) return false;
    G.state.gold -= c;
    h.sp = (h.sp || 0) + K.spent(h);
    h.skills = {}; h.skillOrder = [];
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    return true;
  };
  // répartition automatique : débloque d'abord les compétences actives, puis monte les rangs
  K.autoSpend = function (h) {
    let n = 0;
    while ((h.sp || 0) > 0 && n < 200) {
      const avail = K.forHero(h).filter((s) => !K.lockReason(h, s.id));
      if (!avail.length) break;
      avail.sort((a, b) => {
        const ra = K.rank(h, a.id), rb = K.rank(h, b.id);
        if ((ra === 0) !== (rb === 0)) return ra === 0 ? -1 : 1;               // nouveaux nœuds d'abord
        if ((a.type === 'active') !== (b.type === 'active')) return a.type === 'active' ? -1 : 1;
        return ra - rb || b.row - a.row;
      });
      K.learn(h, avail[0].id); n++;
    }
    return n;
  };

  // ---------- Bonus passifs ----------
  K.passiveBonuses = function (h) {
    const out = {};
    for (const s of K.forHero(h)) {
      if (s.type !== 'passive') continue;
      const r = K.rank(h, s.id);
      if (!r) continue;
      const b = s.passive(r);
      for (const k in b) out[k] = (out[k] || 0) + b[k];
    }
    return out;
  };

  // ---------- Règles de priorité ----------
  K.MODES = {
    always: 'Dès que possible', never: 'Jamais', boss: 'Contre élites et gardiens',
    enemies: 'Si au moins N ennemis', allyHp: 'Si un allié est sous X % de PV', teamHp: 'Si l\'équipe est sous X % de PV (moyenne)',
    selfHp: 'Si le lanceur est sous X % de PV', targetHp: 'Si la cible est sous X % de PV', allyDead: 'Si un allié est tombé',
  };
  K.modesFor = function (s) {
    if (s.kind === 'heal' || s.kind === 'shield') return ['allyHp', 'teamHp', 'always', 'boss', 'never'];
    if (s.kind === 'revive') return ['allyDead', 'never'];
    if (s.kind === 'buff' || s.kind === 'taunt') return ['always', 'boss', 'enemies', 'selfHp', 'teamHp', 'never'];
    return ['always', 'boss', 'enemies', 'targetHp', 'never'];
  };
  K.ruleOf = (h, id) => (h.skillRules && h.skillRules[id]) || SK()[id].rule;
  // compétences actives apprises, dans l'ordre de priorité du joueur
  K.activeList = function (h) {
    const learned = K.forHero(h).filter((s) => s.type === 'active' && K.rank(h, s.id) > 0).map((s) => s.id);
    const order = (h.skillOrder || []).filter((id) => learned.indexOf(id) >= 0);
    for (const id of learned) if (order.indexOf(id) < 0) order.push(id);
    h.skillOrder = order;
    return order;
  };
  K.moveUp = function (h, id) { const o = K.activeList(h), k = o.indexOf(id); if (k > 0) [o[k - 1], o[k]] = [o[k], o[k - 1]]; };

  // ---------- Combat ----------
  K.manaCost = (u, s) => Math.max(0, Math.round(s.mp * (1 + B.manaCostPerLvl * ((u.level || 1) - 1)) * (1 + (u.stats.manaCost || 0))));
  const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function ruleOk(run, u, s, rule, enemies) {
    const alive = run.heroes.filter((h) => !h.dead);
    switch (rule.mode) {
      case 'never': return false;
      case 'always': return true;
      case 'boss': return enemies.some((m) => m.guardian || m.elite);
      case 'enemies': return enemies.filter((m) => near(m, u) < 5).length >= (rule.value || 2);
      case 'allyHp': return alive.some((h) => h.hp / h.stats.maxHp < (rule.value || 0.5));
      case 'teamHp': return alive.reduce((a, h) => a + h.hp / h.stats.maxHp, 0) / Math.max(1, alive.length) < (rule.value || 0.7);
      case 'selfHp': return u.hp / u.stats.maxHp < (rule.value || 0.5);
      case 'targetHp': return !!(u.target && !u.target.dead && u.target.hp / u.target.stats.maxHp < (rule.value || 0.5));
      case 'allyDead': return run.heroes.some((h) => h.dead);
    }
    return true;
  }

  // choisit les cibles ; renvoie null si la compétence n'a rien à viser
  function pickTargets(run, u, s, r, enemies) {
    const range = s.range || 6;
    const inRange = enemies.filter((m) => near(m, u) <= range + m.r);
    switch (s.target) {
      case 'target': {
        let t = u.target && !u.target.dead && near(u.target, u) <= range + u.target.r ? u.target : inRange.sort((a, b) => near(a, u) - near(b, u))[0];
        return t ? [t] : null;
      }
      case 'weakest': { const t = inRange.sort((a, b) => a.hp - b.hp)[0]; return t ? [t] : null; }
      case 'multi': { const n = s.count(r); const l = inRange.sort((a, b) => near(a, u) - near(b, u)).slice(0, n); return l.length ? l : null; }
      case 'self': {
        if (s.kind === 'damage') { const l = enemies.filter((m) => near(m, u) <= s.aoeSelf + m.r); return l.length ? [u] : null; }
        return [u];
      }
      case 'allyLow': {
        const l = run.heroes.filter((h) => !h.dead && near(h, u) <= range && (s.kind !== 'heal' || h.hp < h.stats.maxHp)).sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp);
        return l.length ? [l[0]] : null;
      }
      case 'team': return run.heroes.filter((h) => !h.dead);
      case 'dead': { const d = run.heroes.find((h) => h.dead); return d ? [d] : null; }
    }
    return s.kind === 'taunt' ? [u] : null;
  }

  // une compétence peut-elle être lancée maintenant ? Lance la première valable.
  K.tryCast = function (run, u, enemies) {
    if (!u.skillList || !u.skillList.length) return false;
    for (const it of u.skillList) {
      const s = it.s;
      if ((u.skillCd[s.id] || 0) > 0) continue;
      const cost = K.manaCost(u, s);
      if (u.mp < cost) continue;
      const offensive = s.kind === 'damage' || s.kind === 'taunt' || s.kind === 'buff';
      if (offensive && !enemies.length) continue;
      if (!ruleOk(run, u, s, it.rule, enemies)) continue;
      const tg = pickTargets(run, u, s, it.r, enemies);
      if (!tg) continue;
      u.mp -= cost;
      u.skillCd[s.id] = s.cd;
      u.skillLock = B.skillLock;
      cast(run, u, s, it.r, tg, enemies);
      return true;
    }
    return false;
  };

  // ---------- Effets des compétences ----------
  const fx = () => G.render.fx;
  function applyStatus(run, u, s, r, t, dmg) {
    const st = s.status;
    if (!st || t.dead || !rng.chance(st.chance)) return;
    const eff = { id: st.id, t: st.dur, src: u, value: st.value };
    if (st.id === 'burn') eff.dps = Math.max(1, dmg * 0.25 * (1 + (u.stats.burnPct || 0)));
    if (st.id === 'poison') eff.dps = Math.max(1, u.stats.atk * st.valueMult(r));
    G.sys.effects.add(t, eff);
  }
  function hit(run, u, s, r, t, multScale) {
    if (t.dead) return 0;
    const melee = (s.range || 0) <= 1.5 && !s.aoe;
    let mult = s.mult(r) * (multScale || 1);
    if (s.executeBelow && t.hp / t.stats.maxHp < s.executeBelow) mult *= 2;
    const dmg = G.sys.combat.damage(run, u, t, { mult, dmgType: s.dmgType, element: s.element, ranged: !melee, skill: true, critBonus: s.critBonus || 0, noExtra: !!s.aoe });
    applyStatus(run, u, s, r, t, dmg);
    return dmg;
  }
  function aoeAt(run, u, s, r, x, y, radius, multScale) {
    for (const m of run.monsters) if (!m.dead && m.aggro && Math.hypot(m.x - x, m.y - y) <= radius + m.r) hit(run, u, s, r, m, multScale);
    fx().ring(x, y, fx().colorOf(s.element === 'physical' ? 'physical' : s.element), radius, 0.35);
  }

  function cast(run, u, s, r, tg, enemies) {
    const F = fx();
    const col = s.element ? F.colorOf(s.element) : '#ffd34d';
    u.anim.atk = 0.25;
    const t0 = tg[0];
    if (t0 && t0 !== u) { u.facing = t0.x >= u.x ? 1 : -1; const l = near(t0, u) || 1; u.anim.lx = (t0.x - u.x) / l; u.anim.ly = (t0.y - u.y) / l; }
    if (s.ult) { F.text(u.x, u.y - 1.2, s.name, '#ffe14d', 1); F.flash('#fff3c0', 0.08); G.ui.log(s.icon + ' ' + u.name + ' : ' + s.name + ' !', 'gold'); }
    G.core.bus.emit('skill:cast', { hero: u.id, skill: s.id });

    if (s.kind === 'damage') {
      if (s.target === 'self') { // autour du lanceur
        aoeAt(run, u, s, r, u.x, u.y, s.aoeSelf);
        if (s.vfx === 'whirl') for (let k = 0; k < 4; k++) F.slash(u.x, u.y - 0.2, k % 2 ? 1 : -1, '#ffffff', true);
        if (s.vfx === 'fan') for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; F.parts.push({ x: u.x, y: u.y - 0.2, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, color: '#e8e8f0', t: 0, life: 0.3, g: 0, glow: true, size: 1 }); }
        F.shake(0.08);
        return;
      }
      if (s.chain) { // rebonds
        let cur = t0, prev = u; const done = new Set();
        const n = 1 + s.chain(r);
        for (let k = 0; k < n && cur; k++) {
          F.beam(prev.x, prev.y - 0.3, cur.x, cur.y - 0.2, col, 0.3, true);
          hit(run, u, s, r, cur, k === 0 ? 1 : 0.8);
          done.add(cur); prev = cur;
          cur = run.monsters.filter((m) => !m.dead && m.aggro && !done.has(m) && near(m, prev) < 3.5).sort((a, b) => near(a, prev) - near(b, prev))[0];
        }
        F.flash('#fff8c0', 0.05);
        return;
      }
      if (s.waves) { // vagues sur une zone (pluie de flèches, blizzard)
        const cx = t0.x, cy = t0.y;
        for (let w = 0; w < s.waves; w++) {
          run.pending.push({ t: 0.25 + w * 0.45, fn: () => {
            for (let k = 0; k < 8; k++) {
              const px = cx + (Math.random() - 0.5) * s.aoe * 2, py = cy + (Math.random() - 0.5) * s.aoe * 2;
              if (s.vfx === 'rain') F.beam(px + 0.3, py - 1.6, px, py, '#e8e0c8', 0.12);
              else if (s.vfx === 'firerain') { F.beam(px + 0.6, py - 2.2, px, py, '#ff7a33', 0.16); if (k < 2) F.burst(px, py, '#ff7a33', 3, 0, true); }
              else F.parts.push({ x: px, y: py - 1.2, vx: 0, vy: 3, color: '#e8ffff', t: 0, life: 0.4, g: 0, glow: true, size: 1 });
            }
            aoeAt(run, u, s, r, cx, cy, s.aoe);
          } });
        }
        return;
      }
      if (s.delay) { // météore
        const cx = t0.x, cy = t0.y;
        F.ring(cx, cy, '#ff7a33', s.aoe, s.delay, true);
        run.pending.push({ t: s.delay, fn: () => {
          F.beam(cx + 1.2, cy - 5, cx, cy, '#ff7a33', 0.35);
          F.beam(cx + 1.1, cy - 5, cx - 0.1, cy, '#ffe14d', 0.25);
          aoeAt(run, u, s, r, cx, cy, s.aoe);
          F.impact(cx, cy, 'fire', true); F.burst(cx, cy, '#ff7a33', 30, 0, true);
          F.shake(0.45); F.flash('#ff9a40', 0.15);
        } });
        return;
      }
      // projectile ou coup direct, éventuellement avec zone
      for (const t of tg) {
        const onHit = (tt) => {
          if (s.aoe) aoeAt(run, u, s, r, tt.x, tt.y, s.aoe);
          else for (let k = 0; k < (s.hits || 1); k++) { hit(run, u, s, r, tt); if (k) F.slash(tt.x, tt.y - 0.2 - k * 0.1, k % 2 ? 1 : -1, '#ffffff', false); }
          if (s.vfx === 'smite') F.beam(tt.x, tt.y - 4, tt.x, tt.y, '#fff3a8', 0.35);
        };
        if (s.proj) {
          run.projectiles.push({ x: u.x + u.facing * 0.3, y: u.y - 0.3, src: u, tgt: t, kind: s.proj, opts: { element: s.element }, el: s.element === 'physical' ? 'physical' : s.element, life: 3, age: 0, big: true, onHit });
          F.muzzle(u.x + u.facing * 0.3, u.y - 0.3, s.element === 'physical' ? 'physical' : s.element);
        } else {
          onHit(t);
          if (s.vfx === 'smash') { F.slash(t.x, t.y - 0.25, u.facing, '#ffffff', true); F.ring(t.x, t.y, '#ffffff', 0.9, 0.25); F.shake(0.12); }
          else if (s.vfx === 'stab' || s.vfx === 'execute') { F.slash(t.x, t.y - 0.25, u.facing, s.vfx === 'execute' ? '#a46bff' : '#c8ff8a', true); if (s.vfx === 'execute') { F.ring(t.x, t.y, '#a46bff', 1.2, 0.4, true); F.shake(0.2); } }
        }
      }
      return;
    }
    if (s.kind === 'heal') {
      for (const t of tg) G.sys.combat.heal(run, u, t, (s.healStat === 'atk' ? u.stats.atk : u.stats.matk) * s.mult(r));
      if (s.target === 'team') F.ring(u.x, u.y, '#6dff8a', 3, 0.5);
      return;
    }
    if (s.kind === 'shield') {
      const t = tg[0];
      G.sys.effects.add(t, { id: 'shield', t: s.dur, src: u, value: u.stats.matk * s.mult(r) * (u.stats.healMult || 1) });
      F.ring(t.x, t.y - 0.2, '#fff3a8', 0.7, 0.5); F.beam(u.x, u.y - 0.3, t.x, t.y - 0.2, '#fff3a8', 0.25);
      return;
    }
    if (s.kind === 'buff') {
      for (const t of tg) { G.sys.effects.add(t, { id: 'buff', key: s.id, t: s.dur, src: u, mods: s.buff(r) }); F.ring(t.x, t.y, '#ffd34d', 0.8, 0.45); F.sparkle(t.x, t.y, '#ffd34d', 6); }
      return;
    }
    if (s.kind === 'taunt') {
      for (const m of run.monsters) if (!m.dead && m.aggro && near(m, u) <= s.aoeSelf) { G.sys.effects.add(m, { id: 'taunt', t: s.dur, src: u }); m.target = u; }
      G.sys.effects.add(u, { id: 'buff', key: s.id, t: s.dur, src: u, mods: s.buff(r) });
      F.ring(u.x, u.y, '#ff4040', s.aoeSelf, 0.4); F.ring(u.x, u.y, '#ffffff', s.aoeSelf * 0.6, 0.3);
      F.text(u.x, u.y - 1, '!', '#ff4040', 2);
      return;
    }
    if (s.kind === 'revive') {
      const t = tg[0];
      t.dead = false; t.hp = Math.round(t.stats.maxHp * s.value(r)); t.deadFor = 0; t.effects = [];
      F.beam(t.x, t.y - 4, t.x, t.y, '#ffffff', 0.7); F.ring(t.x, t.y, '#fff3a8', 1.6, 0.7); F.sparkle(t.x, t.y, '#ffffff', 24); F.flash('#ffffff', 0.2);
      G.ui.log('👼 ' + t.name + ' est ressuscité !', 'gold');
    }
  }
  // construit la liste des compétences d'une unité héros (après apprentissage / règles)
  K.buildUnit = function (u, h) {
    u.skillList = K.activeList(h).map((id) => ({ s: SK()[id], r: K.rank(h, id), rule: K.ruleOf(h, id) }));
    u.skillCd = u.skillCd || {};
  };
  G.sys.skills = K;
})();
