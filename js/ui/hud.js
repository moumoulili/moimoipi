// =====================================================================
//  ÉCRAN DONJON : barre du haut, fiches des héros, boutons d'action,
//  choix au gardien, résumé de fin d'expédition.
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, B = G.data.balance;
  let partyKey = '', actionsKey = '', hudT = 0;

  function nextCheckpoint(f) { return Math.ceil(f / B.checkpointEvery) * B.checkpointEvery; }

  // ---------- Barre du haut ----------
  function updateTop() {
    const st = G.state, run = G.sys.run.active;
    U.$('#tb-floor').textContent = run ? 'Étage ' + run.saved.floor + ' · ' + run.map.biome.name : 'Au camp';
    U.$('#tb-gold').innerHTML = U.fmt(st.gold) + (st.run ? ' <span class="run-gold">+' + U.fmt(st.run.gold) + '</span>' : '');
    U.$('#tb-speed').textContent = 'x' + G.core.loop.speed;
  }

  // ---------- Fiches des héros ----------
  function buildParty() {
    const run = G.sys.run.active;
    const team = G.sys.heroes.team();
    const key = team.map((h) => h.id).join() + '|' + !!run;
    if (key === partyKey) return;
    partyKey = key;
    const el = U.$('#party');
    el.innerHTML = '';
    for (const h of team) {
      const c = G.data.classes[h.cls];
      const card = U.el('div', 'hcard');
      card.dataset.id = h.id;
      card.innerHTML = '<img alt="" src="' + G.render.spriteURL(c.sprite, 3) + '"><div class="hn">' + U.esc(h.name) + '</div>' +
        '<div class="bar hp"><i></i></div><div class="hp-txt"></div>';
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
      card.querySelector('.bar.hp > i').style.width = Math.max(0, (hp / max) * 100) + '%';
      card.querySelector('.hp-txt').textContent = dead ? 'K.O.' : U.fmt(hp) + ' / ' + U.fmt(max);
    });
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
        U.$('#dungeon-actions').innerHTML = '';
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
    const box = U.$('#dungeon-actions');
    box.innerHTML = '';
    const exit = U.el('button', 'pxbtn ' + (can ? 'gold pulse' : ''), can ? '🚪 Sortir (100 % du butin)' : '🔒 Sortie après le gardien (ét. ' + nextCheckpoint(run.saved.floor) + ')');
    exit.disabled = !can;
    exit.onclick = () => G.sys.run.retreat();
    const flee = U.el('button', 'pxbtn small danger', 'Fuir');
    flee.style.flex = '0 0 auto';
    flee.onclick = () => ui.confirm('Fuir le donjon ?', '<p>L\'équipe rentre en ville mais ne garde que <b>' + Math.round(B.deathKeep * 100) + ' %</b> de l\'or de cette expédition.</p>', 'Fuir', () => G.sys.run.active && G.sys.run.end('death'));
    box.appendChild(exit);
    box.appendChild(flee);
  }
  ui.invalidateHud = function () { partyKey = ''; actionsKey = ''; };

  // Appelé à chaque image ; met l'interface à jour 5 fois par seconde
  ui.tick = function (dt) {
    hudT -= dt;
    if (hudT > 0) return;
    hudT = 0.2;
    updateTop();
    if (ui.current === 'dungeon') { updateParty(); updateActions(); ui.renderLog(); }
  };

  // ---------- Démarrer une expédition ----------
  ui.startFloor = function () {
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
      rows += '<div>' + U.esc(h.name) + ' <span class="muted">' + U.fmt(s.dmg) + ' dégâts' + (s.heal ? ', ' + U.fmt(s.heal) + ' soins' : '') + '</span></div><div>' + s.kills + ' ☠</div>';
    }
    const m = Math.floor(lr.time / 60), sec = lr.time % 60;
    const html = '<div class="sum-grid">' +
      '<div>Étages</div><div><b>' + lr.startFloor + ' → ' + lr.floor + '</b></div>' +
      '<div>Monstres vaincus</div><div><b>' + lr.kills + '</b></div>' +
      '<div>Durée</div><div>' + m + ' min ' + sec + ' s</div>' +
      '<div>Or ramassé</div><div class="gold">' + U.fmt(lr.gold) + '</div>' +
      '<div>Or conservé' + (death ? ' (' + Math.round(B.deathKeep * 100) + ' %)' : '') + '</div><div class="gold"><b>' + U.fmt(lr.kept) + '</b></div>' +
      '</div><h3 style="margin:12px 0 4px;font-size:13px">Équipe</h3><div class="sum-grid">' + rows + '</div>';
    const again = { label: '⚔️ Repartir (étage ' + ui.startFloor() + ')', cls: 'primary', onClick: () => ui.startRun() };
    const town = { label: '🏰 Aller en ville', onClick: () => ui.show('town') };
    const opts = { title: death ? '💀 Défaite' : '🏰 Retour en ville', html, buttons: [again, town] };
    if (death && G.state.settings.autoRestart) {
      opts.countdown = { seconds: 8, label: 'Nouvelle expédition dans {s} s… (désactivable dans Options)', onEnd: () => ui.startRun() };
    }
    ui.modal(opts);
    if (death) U.vibrate(200);
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
