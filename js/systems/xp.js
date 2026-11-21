// =====================================================================
//  EXPÉRIENCE ET NIVEAUX
//  - chaque monstre tué donne de l'XP à chaque héros vivant de l'équipe
//    (élites x3, mini-boss x12, boss x30), ajustée selon l'écart de niveau
//  - les héros en réserve reçoivent une part (balance.benchXp)
//  - montée de niveau : stats en hausse, point de compétence (phase 4)
// =====================================================================
(function () {
  const B = G.data.balance, U = G.core.U;
  const X = {};
  X.toNext = (h) => B.xpToNext(h.level);
  // multiplicateur selon l'écart de niveau
  X.gapMult = function (heroLvl, monLvl) {
    const g = B.xpLevelGap, d = heroLvl - monLvl;
    if (d > g.free) return Math.max(g.minMult, 1 - (d - g.free) * g.penalty);
    if (d < 0) return 1 + Math.min(g.maxCatchup, -d * g.catchup);
    return 1;
  };
  X.bonus = () => G.sys.town.val('library').xp; // bibliothèque (+ rebirth en phase 8)

  // ajoute de l'XP ; renvoie le nombre de niveaux gagnés
  X.add = function (hero, amount) {
    if (hero.level >= B.levelCap) return 0;
    hero.xp += amount;
    let ups = 0;
    while (hero.level < B.levelCap && hero.xp >= X.toNext(hero)) {
      hero.xp -= X.toNext(hero);
      hero.level++;
      hero.sp = (hero.sp || 0) + B.skillPointsPerLevel;
      ups++;
    }
    if (hero.level >= B.levelCap) hero.xp = 0;
    return ups;
  };

  X.onKill = function (run, m) {
    const mult = m.guardian ? B.xpMult[m.guardian] : m.elite ? B.xpMult.elite : 1;
    const base = B.monsterXp(m.level) * mult * (m.summoned ? 0.3 : 1) * (1 + X.bonus());
    const leveled = [];
    for (const u of run.heroes) {
      if (u.dead) continue;
      const h = G.sys.heroes.get(u.id);
      const gain = base * X.gapMult(h.level, m.level) * (1 + (u.stats.xpPct || 0));
      run.track(h.id, 'xp', gain);
      const ups = X.add(h, gain);
      if (ups) { leveled.push(h); if (G.state.settings.autoSkills) G.sys.skills.autoSpend(h); onLevelUp(run, u, h, ups); }
    }
    // réserve
    const bench = G.state.heroes.filter((h) => G.state.team.indexOf(h.id) < 0);
    for (const h of bench) X.add(h, base * B.benchXp * X.gapMult(h.level, m.level));
    if (leveled.length) {
      G.sys.run.refreshStats();
      // une seule notification pour tous les héros qui montent en même temps
      G.ui.toast('⭐ Niveau ' + leveled.map((h) => U.esc(h.name) + ' ' + h.level).join(' · '), 'gold');
    }
  };

  function onLevelUp(run, u, h, ups) {
    run.track(h.id, 'levels', ups);
    const fx = G.render.fx;
    // petit soin à la montée de niveau
    u.levelHeal = true;
    fx.beam(u.x, u.y - 3.5, u.x, u.y, '#ffe14d', 0.7);
    fx.ring(u.x, u.y, '#ffe14d', 1.3, 0.6);
    fx.ring(u.x, u.y, '#ffffff', 0.8, 0.45);
    fx.sparkle(u.x, u.y, '#fff3a8', 18);
    fx.text(u.x, u.y - 1.1, 'NIV ' + h.level, '#ffe14d', 1);
    G.ui.log('⭐ ' + h.name + ' passe niveau ' + h.level + ' !', 'gold');
    G.core.bus.emit('hero:levelup', { hero: h.id, level: h.level });
  }
  G.sys.xp = X;
})();
