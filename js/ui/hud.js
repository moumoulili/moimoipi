// =====================================================================
//  ÉCRAN DONJON : barre du haut, fiches des héros, boutons d'action,
//  choix au gardien, résumé de fin d'expédition.
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, B = G.data.balance;
  let partyKey = '', actionsKey = '', hudT = 0;


  // ---------- Barre du haut ----------
  function updateTop() {
    const st = G.state, run = G.sys.run.active;
    U.$('#tb-floor').innerHTML = run ? '<span class="tbf-n">' + (run.saved.farm ? '🔁 ' : '') + 'Étage ' + run.saved.floor + '</span><span class="tbf-b">' + run.map.biome.name + '</span>' : '<span class="tbf-n">Au camp</span><span class="tbf-b">Repos des héros</span>';
    U.$('#tb-gold').innerHTML = U.fmt(st.gold) + (st.run ? ' <span class="run-gold">+' + U.fmt(st.run.gold) + '</span>' : '');
    U.$('#tb-speed').textContent = 'x' + G.core.loop.speed;
  }

  // ---------- Fiches des héros ----------
  function buildParty() {
    const run = G.sys.run.active;
    const team = G.sys.heroes.team();
    const key = team.map((h) => h.id + (h.ult || h.adv || '')).join() + '|' + !!run;
    if (key === partyKey) return;
    partyKey = key;
    const el = U.$('#party');
    el.innerHTML = '';
    for (const h of team) {
      const card = U.el('div', 'hcard');
      card.dataset.id = h.id;
      card.innerHTML = '<span class="lvl-badge"></span><img alt="" src="' + G.render.spriteURL(G.sys.heroes.sprite(h), 3) + '"><div class="hn">' + U.esc(h.name) + '</div>' +
        '<div class="bar hp"><i></i></div><div class="bar mp thin"><i></i></div><div class="bar xp thin"><i></i></div><div class="hp-txt"></div>';
      el.appendChild(card);
    }
  }
  function updateParty() {
    buildParty();
    const run = G.sys.run.active;
    document.querySelectorAll('#party .hcard').forEach((card) => {
      const id = card.dataset.id;
      let hp, max, dead = false;
      const u = run && run.heroes.find((x) => x.id === id);
      if (u) { hp = u.hp; max = u.stats.maxHp; dead = u.dead; }
      else { const st = G.sys.stats.hero(G.sys.heroes.get(id)); hp = max = st.maxHp; }
      card.classList.toggle('dead', dead);
      card.classList.toggle('lvlup', !!(u && u.lvlFx > 0));
      card.querySelector('.bar.mp > i').style.width = (u ? Math.max(0, (u.mp / u.stats.maxMp) * 100) : 100) + '%';
      const hero = G.sys.heroes.get(id);
      card.querySelector('.lvl-badge').textContent = hero.level;
      card.querySelector('.bar.xp > i').style.width = Math.min(100, (hero.xp / G.sys.xp.toNext(hero)) * 100) + '%';
      card.querySelector('.bar.hp > i').style.width = Math.max(0, (hp / max) * 100) + '%';
      card.querySelector('.hp-txt').textContent = dead ? 'K.O.' : U.fmt(hp) + ' / ' + U.fmt(max);
    });
  }

  // ---------- Barre de vie du boss + bénédictions ----------
  let blessKey = '';
  function updateBoss() {
    const run = G.sys.run.active, bar = U.$('#boss-bar');
    const b = run && run.monsters.find((m) => m.guardian && m.aggro && !m.dead);
    if (!b) { bar.hidden = true; } else {
      bar.hidden = false;
      bar.classList.toggle('enraged', !!b.enraged);
      bar.querySelector('.bb-name').textContent = (b.guardian === 'boss' ? '☠ ' : '⚔ ') + b.name;
      bar.querySelector('i').style.width = Math.max(0, (b.hp / b.stats.maxHp) * 100) + '%';
      const sh = (b.effects || []).filter((e) => e.id === 'shield').reduce((a, e) => a + e.value, 0);
      bar.querySelector('b').style.width = Math.min(100, (sh / b.stats.maxHp) * 100) + '%';
    }
    const bl = (run && run.saved.blessings) || [];
    const key = bl.join();
    if (key !== blessKey) {
      blessKey = key;
      U.$('#bless-bar').innerHTML = bl.map((id) => '<span title="' + U.esc(G.data.blessings[id].name) + '">' + G.data.blessings[id].icon + '</span>').join('');
    }
  }

  // ---------- Marchand ambulant ----------
  ui.merchantPrompt = function (run, sp) {
    const render = () => {
      let h = '<p class="small" style="text-align:center">« Jetez un œil, aventuriers, prix d\'ami ! » <span class="muted">(or de la ville : ' + U.fmt(G.state.gold) + ')</span></p><div class="merchant">';
      sp.offers.forEach((o, i) => {
        if (o.kind === 'potion') h += '<div class="m-off"><img alt="" src="' + G.render.potionIconURL(o.id, 3) + '"><div class="info"><b>' + o.n + ' × ' + G.data.potions[o.id].name + '</b></div>';
        else { const r = G.sys.items.rarity(o.item.rarity); h += '<div class="m-off">' + ui.itemCell(o.item, { up: !!G.sys.inventory.upgradeFor(o.item) }) + '<div class="info"><b style="color:' + r.color + '">' + U.esc(o.item.name) + '</b><div class="muted small">' + r.name + ' · niv. ' + o.item.ilvl + '</div></div>'; }
        h += '<button class="pxbtn small gold" data-mo="' + i + '"' + (o.sold || G.state.gold < o.price ? ' disabled' : '') + '>' + (o.sold ? 'Vendu' : U.fmt(o.price)) + '</button></div>';
      });
      return h + '</div>';
    };
    const close = ui.modal({ title: '🧳 Marchand ambulant', html: '<div id="m-box">' + render() + '</div>', buttons: [{ label: 'Continuer l\'exploration', cls: 'primary', onClick: () => G.sys.rooms.leave() }],
      countdown: { seconds: 20, label: 'Le marchand repart dans {s} s…', onEnd: () => G.sys.rooms.leave() } });
    const box = close.box.querySelector('#m-box');
    const bind = () => {
      box.querySelectorAll('[data-mo]').forEach((b) => (b.onclick = () => {
        const o = sp.offers[+b.dataset.mo];
        if (G.sys.rooms.buy(o)) ui.toast('Acheté !'); else ui.toast(G.sys.inventory.full() ? 'Sac plein' : 'Pas assez d\'or', 'danger');
        box.innerHTML = render(); bind();
      }));
      box.querySelectorAll('.icell').forEach((c) => (c.onclick = () => { const o = sp.offers.find((x) => x.item && x.item.uid === c.dataset.uid); if (o) ui.itemDetail(o.item, { from: 'view' }); }));
    };
    bind();
  };

  // ---------- Événement à choix ----------
  ui.eventPrompt = function (run, ev) {
    const safe = ev.choices.findIndex((c) => c.safe);
    const btns = ev.choices.map((c, i) => ({
      label: c.label + (c.needPotion && !G.sys.rooms.choiceAvailable(c) ? ' (aucune potion)' : ''), cls: c.safe ? '' : 'gold',
      onClick: () => G.sys.rooms.resolveEvent(run, ev, i),
    }));
    ui.modal({ title: ev.icon + ' ' + ev.title, html: '<p>' + ev.text + '</p>', buttons: btns,
      countdown: { seconds: 15, label: 'Sans réponse dans {s} s : « ' + ev.choices[safe].label + ' »', onEnd: () => G.sys.rooms.resolveEvent(run, ev, safe) } });
  };

  // ---------- Potions (utilisation manuelle) ----------
  let potKey = '';
  function updatePotions() {
    const bar = U.$('#potion-bar'), run = G.sys.run.active;
    if (!run) { if (potKey !== 'none') { bar.innerHTML = ''; potKey = 'none'; } return; }
    const key = G.data.potionOrder.map((id) => G.state.potions[id] || 0).join() + Object.keys(run.buffs).map((k) => k + (run.buffs[k] > 0)).join();
    if (key === potKey) return;
    potKey = key;
    bar.innerHTML = G.data.potionOrder.map((id) => {
      const n = G.state.potions[id] || 0, active = run.buffs[id] > 0;
      return '<button class="pot ' + (active ? 'active' : '') + '" data-p="' + id + '"' + (n ? '' : ' disabled') + ' title="' + G.data.potions[id].name + '"><img alt="" src="' + G.render.potionIconURL(id, 3) + '"><b>' + n + '</b></button>';
    }).join('');
    bar.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { if (!G.sys.potions.manual(b.dataset.p)) ui.toast('Pas utile maintenant'); potKey = ''; }));
  }

  // ---------- Actions ----------
  function updateActions() {
    const run = G.sys.run.active;
    const can = G.sys.run.canRetreat();
    const key = (run ? run.saved.floor : 'x') + '|' + can;
    const ov = U.$('#idle-overlay');
    if (!run) {
      if (actionsKey !== 'idle') {
        actionsKey = 'idle';
        U.$('#map-actions').innerHTML = '';
        const f = G.ui.startFloor();
        ov.innerHTML = '<p>L\'équipe se repose au camp.</p>';
        const b = U.el('button', 'pxbtn primary wide', '⚔️ Partir en expédition (étage ' + f + ')');
        b.onclick = () => ui.startRun();
        ov.appendChild(b);
        ov.hidden = false;
      }
      return;
    }
    ov.hidden = true;
    if (key === actionsKey) return;
    actionsKey = key;
    // petites icônes dans le coin de la carte
    const box = U.$('#map-actions');
    box.innerHTML = '';
    if (can) {
      const exit = U.el('button', 'map-btn exit', '🚪');
      exit.title = 'Sortir du donjon (100 % du butin)';
      exit.onclick = () => ui.confirm('Sortir du donjon ?', '<p>L\'équipe rentre en ville avec <b>100 %</b> du butin.</p>', '🚪 Sortir', () => G.sys.run.retreat(), 'gold');
      box.appendChild(exit);
    }
    const flee = U.el('button', 'map-btn flee', '🏳️');
    flee.title = 'Fuir (garde ' + Math.round(G.sys.town.deathKeep() * 100) + ' % de l\'or)';
    flee.onclick = () => ui.confirm('Fuir le donjon ?', '<p>L\'équipe rentre en ville mais ne garde que <b>' + Math.round(G.sys.town.deathKeep() * 100) + ' %</b> de l\'or de cette expédition.</p>', 'Fuir', () => G.sys.run.active && G.sys.run.end('death'));
    box.appendChild(flee);
  }
  ui.invalidateHud = function () { partyKey = ''; actionsKey = ''; potKey = ''; blessKey = 'x'; };

  // Appelé à chaque image ; met l'interface à jour 5 fois par seconde
  ui.tick = function (dt) {
    hudT -= dt;
    if (hudT > 0) return;
    hudT = 0.2;
    updateTop();
    const tb = document.querySelector('#tabs [data-tab=team]');
    if (tb) tb.classList.toggle('notif', (G.state.heroes.some((h) => h.sp > 0) && !G.state.settings.autoSkills) || G.state.heroes.some((h) => G.sys.heroes.evoOptions(h).length));
    if (ui.current === 'mine' && ui.screens.mine.tick) ui.screens.mine.tick();
    // thème musical selon la situation
    const run = G.sys.run.active;
    G.sys.audio.play(!run ? 'camp' : run.monsters.some((m) => m.guardian && m.aggro && !m.dead) ? 'boss' : 'dungeon');
    if (ui.current === 'dungeon') { updateParty(); updatePotions(); updateActions(); updateBoss(); ui.renderLog(); }
  };

  // ---------- Démarrer une expédition ----------
  ui.startFloor = function () {
    const fm = G.state.settings.farm;
    if (fm && fm.on) return Math.max(1, Math.min(fm.floor, G.state.progress.maxFloor || 1));
    const f = G.state.settings.startFloor || 1;
    return G.sys.town.canStartAt(f) ? f : 1;
  };
  ui.startRun = function (floor) {
    if (G.sys.run.active) return;
    G.sys.run.start(floor || ui.startFloor());
    ui.invalidateHud();
    ui.show('dungeon');
  };

  // ---------- Choix après un gardien ----------
  ui.checkpointPrompt = function () {
    const run = G.sys.run.active;
    const f = run.saved.floor;
    ui.modal({
      title: '🏆 Gardien vaincu !',
      html: '<p>Butin de l\'expédition : <b class="gold">' + U.fmt(run.saved.gold) + '</b></p>' +
        '<p>Rentrer maintenant garde <b>100 %</b> du butin.<br>Prochaine sortie possible : <b>étage ' + (f + B.checkpointEvery) + '</b>.</p>' +
        '<p class="muted">' + (G.sys.town.canStartAt(f + 1) ? 'Tu peux repartir directement de l\'étage ' + (f + 1) + '.' : 'Améliore le Portail (en ville) pour pouvoir repartir de l\'étage ' + (f + 1) + '.') + '</p>',
      buttons: [
        { label: '⚔️ Continuer l\'exploration', cls: 'primary', onClick: () => G.sys.run.resolveCheckpoint(false) },
        { label: '🚪 Rentrer en ville', cls: 'gold', onClick: () => G.sys.run.resolveCheckpoint(true) },
      ],
      countdown: { seconds: B.checkpointCountdown, label: 'On continue automatiquement dans {s} s…', onEnd: () => G.sys.run.resolveCheckpoint(false) },
    });
  };

  // ---------- Fin d'expédition ----------
  ui.onRunEnd = function (lr) {
    ui.invalidateHud();
    const death = lr.reason === 'death';
    const team = G.sys.heroes.team();
    let rows = '';
    for (const h of team) {
      const s = lr.heroStats[h.id] || { dmg: 0, heal: 0, kills: 0 };
      rows += '<div>' + U.esc(h.name) + ' <span class="muted small">niv. ' + h.level + (s.levels ? ' <b class="pos">(+' + s.levels + ')</b>' : '') + ' · ' + U.fmt(s.dmg) + ' dégâts' + (s.heal ? ', ' + U.fmt(s.heal) + ' soins' : '') + ' · ' + U.fmt(s.xp || 0) + ' XP</span></div><div>' + s.kills + ' ☠</div>';
    }
    const m = Math.floor(lr.time / 60), sec = lr.time % 60;
    const html = '<div class="sum-grid">' +
      '<div>Étages</div><div><b>' + lr.startFloor + ' → ' + lr.floor + '</b></div>' +
      '<div>Monstres vaincus</div><div><b>' + lr.kills + '</b></div>' +
      '<div>Objets trouvés</div><div><b>' + (lr.items || 0) + '</b></div>' +
      (Object.keys(lr.mats || {}).length ? '<div>Matériaux</div><div class="small">' + G.sys.inventory.matsText(lr.mats) + '</div>' : '') +
      '<div>Durée</div><div>' + m + ' min ' + sec + ' s</div>' +
      '<div>Or ramassé</div><div class="gold">' + U.fmt(lr.gold) + '</div>' +
      '<div>Or conservé' + (death ? ' (' + Math.round(G.sys.town.deathKeep() * 100) + ' %)' : '') + '</div><div class="gold"><b>' + U.fmt(lr.kept) + '</b></div>' +
      (death ? '<div class="muted small" style="grid-column:1/3">Les objets trouvés sont tous conservés.</div>' : '') +
      (lr.optimized ? '<div class="small" style="grid-column:1/3;color:var(--gold)">✨ Équipement optimisé : ' + lr.optimized + ' changement(s)</div>' : '') +
      '</div><h3 style="margin:12px 0 4px;font-size:13px">Équipe</h3><div class="sum-grid">' + rows + '</div>';
    const again = { label: '⚔️ Repartir (étage ' + ui.startFloor() + ')', cls: 'primary', onClick: () => ui.startRun() };
    const town = { label: '🏰 Aller en ville', onClick: () => ui.show('town') };
    const optim = { label: '✨ Optimiser l\'équipement', cls: 'epic', onClick: () => { const r = G.sys.inventory.optimizeTeam(); ui.toast(r.changes ? '✨ ' + r.changes + ' changement(s) · puissance +' + Math.round(r.gain * 1000) / 10 + ' %' : 'Déjà optimal', 'gold'); } };
    const opts = { title: death ? '💀 Défaite' : '🏰 Retour en ville', html, buttons: lr.optimized ? [again, town] : [again, optim, town] };
    if (death && G.state.settings.autoRestart) {
      opts.countdown = { seconds: 8, label: 'Nouvelle expédition dans {s} s… (désactivable dans Options)', onEnd: () => ui.startRun() };
    }
    ui.modal(opts);
    if (death) U.vibrate(200);
  };

  // ---------- Résumé des gains hors ligne ----------
  ui.offlineSummary = function (g) {
    const O = G.sys.offline, camp = G.sys.town.val('camp');
    let lv = '';
    for (const h of G.sys.heroes.team()) if (g.levels[h.id]) lv += '<div>' + U.esc(h.name) + '</div><div class="pos">+' + g.levels[h.id] + ' niv. (' + h.level + ')</div>';
    const best = g.best ? '<div>Meilleur objet</div><div style="color:' + G.sys.items.rarity(g.best.rarity).color + '">' + U.esc(g.best.name) + '</div>' : '';
    const html = '<p class="small" style="text-align:center">Absent <b>' + O.durText(g.elapsed) + '</b>' + (g.capped ? ' — gains limités à <b>' + camp.hours + ' h</b> (améliore le Camp de base)' : '') +
      '<br>Efficacité : <b>' + Math.round(g.eff * 100) + ' %</b> du rendement mesuré (étage ~' + g.floor + ')</p>' +
      '<div class="sum-grid"><div>Or</div><div class="gold"><b>+' + U.fmt(g.gold + g.soldGold) + '</b></div>' +
      '<div>XP par héros</div><div><b>+' + U.fmt(g.xpReal != null ? g.xpReal : g.xp) + '</b></div>' + lv +
      '<div>Monstres vaincus</div><div>' + U.fmt(g.kills) + '</div>' +
      '<div>Objets</div><div>' + g.kept + ' gardés' + (g.sold ? ', ' + g.sold + ' vendus/recyclés' : '') + '</div>' + best +
      (Object.keys(g.mats).length ? '<div>Matériaux</div><div class="small">' + G.sys.inventory.matsText(g.mats) + '</div>' : '') +
      (g.mineOres ? '<div>⛏️ Mine</div><div>+' + U.fmt(g.mineOres) + ' ' + G.sys.mine.ore().name.toLowerCase() + '</div>' : '') + '</div>';
    ui.modal({ title: '🏕️ Pendant ton absence', html, buttons: [{ label: 'Super !', cls: 'primary' }] });
    G.core.U.vibrate(60);
  };

  // ---------- Initialisation ----------
  ui.initHud = function () {
    U.$('#tb-speed').onclick = () => {
      const sp = B.speeds;
      const i = (sp.indexOf(G.core.loop.speed) + 1) % sp.length;
      G.core.loop.setSpeed(sp[i]);
      updateTop();
    };
    U.$('#log').onclick = () => { U.$('#log').classList.toggle('expanded'); };
  };
})();
