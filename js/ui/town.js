// =====================================================================
//  ÉCRAN VILLE : or, record, départ d'expédition, équipe.
//  (Bâtiments améliorables en phase 7.)
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, B = G.data.balance;
  ui.screens.town = {
    render() {
      const st = G.state, el = U.$('#screen-town');
      const run = G.sys.run.active;
      // points de départ : étage 1 + après chaque gardien vaincu
      const starts = G.sys.town.startFloors();
      const cur = ui.startFloor();
      let h = '<div class="panel"><h2>🏰 Ville</h2>' +
        '<div class="stat-grid"><div>Or</div><div class="gold"><b>' + U.fmt(st.gold) + '</b></div>' +
        '<div>Record</div><div><b>Étage ' + st.progress.maxFloor + '</b></div>' +
        '<div>Monstres vaincus</div><div><b>' + U.fmt(st.stats.kills) + '</b></div>' +
        '<div>Expéditions</div><div><b>' + st.stats.runs + '</b></div></div></div>';

      h += '<div class="panel"><h3>Expédition</h3>';
      if (run) {
        h += '<p>Ton équipe explore l\'<b>étage ' + run.saved.floor + '</b>.</p><button class="pxbtn wide primary" id="tw-view">Voir le donjon</button>';
      } else {
        h += '<p class="muted">Point de départ (Portail niveau ' + G.sys.town.level('portal') + ') :</p><div class="choices">' +
          starts.map((f) => '<button class="pxbtn small ' + (f === cur ? 'sel' : '') + '" data-f="' + f + '">Ét. ' + f + '</button>').join('') +
          '</div><button class="pxbtn wide primary" id="tw-go">⚔️ Partir à l\'étage ' + cur + '</button>';
      }
      h += '</div>';

      h += '<div class="panel"><h3>Équipe</h3>';
      for (const hero of G.sys.heroes.team()) {
        const c = G.data.classes[hero.cls], s = G.sys.stats.hero(hero);
        h += '<div class="hero-line"><img alt="" src="' + G.render.spriteURL(c.sprite, 4) + '"><div class="info">' +
          '<b>' + U.esc(hero.name) + '</b> <span class="tag">' + c.name + '</span><span class="tag">' + G.data.roles[c.role] + '</span> <span class="muted">niv. ' + hero.level + '</span>' +
          '<div class="stat-grid" style="margin-top:4px"><div>PV <b>' + s.maxHp + '</b></div><div>Attaque <b>' + Math.round(c.attack.dmgType === 'magic' ? s.matk : s.atk) + '</b></div>' +
          '<div>Défense <b>' + Math.round(s.def) + '</b></div><div>Vitesse <b>' + Math.round(s.spd) + '</b></div></div></div></div>';
      }
      h += '</div>';

      h += '<div class="panel"><h3>Bâtiments</h3>';
      for (const id in G.data.buildings) {
        const bd = G.data.buildings[id], T = G.sys.town, lvl = T.level(id), max = T.isMax(id);
        h += '<div class="hero-line"><div class="bicon">' + bd.icon + '</div><div class="info"><b>' + bd.name + '</b> <span class="muted">niv. ' + lvl + '</span>' +
          '<div class="muted" style="font-size:13px">' + bd.desc + '</div>' +
          '<div style="font-size:13px;margin:4px 0">Actuel : <b>' + bd.effect(lvl) + '</b>' + (max ? '' : '<br>Suivant : <b>' + bd.effect(lvl + 1) + '</b>') + '</div>' +
          (max ? '<span class="tag">Niveau max</span>' : '<button class="pxbtn small ' + (T.canBuy(id) ? 'gold' : '') + '" data-buy="' + id + '"' + (T.canBuy(id) ? '' : ' disabled') + '>Améliorer · ' + U.fmt(T.cost(id)) + ' or</button>') +
          '</div></div>';
      }
      h += '<p class="muted" style="margin:8px 0 0">Forge, taverne, temple, bibliothèque, boutique, entrepôt : phase 7.</p></div>';
      el.innerHTML = h;
      el.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { st.settings.startFloor = +b.dataset.f; this.render(); }));
      el.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => {
        if (G.sys.town.buy(b.dataset.buy)) { ui.toast(G.data.buildings[b.dataset.buy].name + ' amélioré !', 'gold'); ui.invalidateHud(); this.render(); }
      }));
      const go = U.$('#tw-go'); if (go) go.onclick = () => ui.startRun();
      const view = U.$('#tw-view'); if (view) view.onclick = () => ui.show('dungeon');
    },
  };
})();
