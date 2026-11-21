// =====================================================================
//  ÉCRAN VILLE : or, record, départ d'expédition, équipe.
//  + auto-farm, bâtiments améliorables, taverne, forge, boutique
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
        const fm = st.settings.farm;
        if (!fm.on) h += '<p class="muted">Point de départ (Portail niveau ' + G.sys.town.level('portal') + ') :</p><div class="choices">' +
          starts.map((f) => '<button class="pxbtn small ' + (f === cur ? 'sel' : '') + '" data-f="' + f + '">Ét. ' + f + '</button>').join('') + '</div>';
        h += '<label class="toggle"><span>🔁 <b>Auto-farm</b> : rejouer un étage déjà atteint en boucle</span><input type="checkbox" id="tw-farm"' + (fm.on ? ' checked' : '') + '></label>';
        if (fm.on) {
          const mx = Math.max(1, st.progress.maxFloor);
          h += '<div class="row"><button class="pxbtn small" id="tw-fmm">−</button><b style="flex:1;text-align:center">Étage ' + Math.min(fm.floor, mx) + ' / ' + mx + '</b><button class="pxbtn small" id="tw-fmp">+</button></div>' +
            '<p class="muted small">L\'équipe rejoue cet étage (nouvelle carte à chaque fois) jusqu\'à la défaite ou ta sortie. Avec « relancer après une défaite », elle farme sans fin.</p>';
        }
        h += '<button class="pxbtn wide primary" id="tw-go">' + (fm.on ? '🔁 Farmer l\'étage ' + cur : '⚔️ Partir à l\'étage ' + cur) + '</button>';
        const r = st.rate;
        if (r && r.samples) h += '<p class="muted small" style="margin-top:6px">Rendement mesuré (gains hors ligne) : ' + U.fmt(r.gold * 60) + ' or/min, ' + U.fmt(r.xp * 60) + ' XP/min par héros, ~étage ' + r.floor + '.</p>';
      }
      h += '</div>';

      h += '<div class="panel" id="tw-build"><h3>🏗️ Bâtiments</h3><p class="muted small">Matériaux : ' + Object.keys(G.data.materials).map((k) => G.data.materials[k].name + ' ' + U.fmt(st.materials[k] || 0)).join(' · ') + '</p>';
      for (const id of G.data.buildingOrder) {
        const bd = G.data.buildings[id], T = G.sys.town, lvl = T.level(id), max = T.isMax(id);
        h += '<div class="hero-line"><div class="bicon">' + bd.icon + '</div><div class="info"><b>' + bd.name + '</b> <span class="muted">niv. ' + lvl + ' / ' + bd.maxLevel + '</span>' +
          '<div class="muted" style="font-size:13px">' + bd.desc + '</div>' +
          '<div style="font-size:13px;margin:4px 0">Actuel : <b>' + bd.effect(lvl) + '</b>' + (max ? '' : '<br>Suivant : <b>' + bd.effect(lvl + 1) + '</b>') + '</div>' +
          (max ? '<span class="tag">Niveau max</span>' : '<button class="pxbtn small ' + (T.canBuy(id) ? 'gold' : '') + '" data-buy="' + id + '"' + (T.canBuy(id) ? '' : ' disabled') + '>Améliorer · ' + G.sys.forge.costText(T.cost(id)) + '</button>') +
          '</div></div>';
      }
      h += '</div>';
      // ---- Taverne ----
      h += '<div class="panel" id="tw-tavern"><h3>🍺 Taverne</h3>' + ui.tavernHtml() + '</div>';

      h += ui.fusionHtml();
      // ---- Boutique ----
      const SH = G.sys.shop;
      h += '<div class="panel" id="tw-shop"><h3>🛒 Boutique</h3><p class="muted small">Les prix suivent ton étage record.</p>';
      for (const id of G.data.potionOrder) {
        const p = G.data.potions[id], n = st.potions[id] || 0, price = SH.potionPrice(id), full = n >= SH.maxPotions();
        h += '<div class="potion-row"><img alt="" src="' + G.render.potionIconURL(id, 3) + '"><div class="info"><b>' + p.name + '</b> <span class="muted">×' + n + ' / ' + SH.maxPotions() + '</span><div class="muted small">' + p.desc + '</div></div>' +
          '<div class="buy"><button class="pxbtn small gold" data-pot="' + id + '" data-n="1"' + (full || st.gold < price ? ' disabled' : '') + '>' + U.fmt(price) + '</button>' +
          '<button class="pxbtn small" data-pot="' + id + '" data-n="5"' + (full || st.gold < price ? ' disabled' : '') + '>×5</button></div></div>';
      }
      const stock = SH.stock();
      const mins = Math.max(0, Math.ceil((st.shop.refreshAt - Date.now()) / 60000));
      h += '<p class="lbl">Objets en vente <span class="muted small">(nouveau stock dans ' + mins + ' min)</span></p><div class="igrid">' +
        (stock.length ? stock.map((it) => ui.itemCell(it, { up: !!G.sys.inventory.upgradeFor(it) })).join('') : '<p class="muted">Tout est vendu !</p>') + '</div>' +
        '<button class="pxbtn small wide" id="tw-restock"' + (st.gold < SH.refreshCost() ? ' disabled' : '') + '>Renouveler le stock · ' + U.fmt(SH.refreshCost()) + ' or</button></div>';

      h += '<div class="panel"><h3>Équipe</h3>' + ui.optimizeBtnHtml('tw-opt');
      for (const hero of G.sys.heroes.team()) {
        const c = G.data.classes[hero.cls], s = G.sys.stats.hero(hero), HH = G.sys.heroes;
        h += '<div class="hero-line"><img alt="" src="' + G.render.spriteURL(HH.sprite(hero), 4) + '"><div class="info">' +
          '<b>' + U.esc(hero.name) + '</b> <span class="tag">' + HH.className(hero) + '</span><span class="tag">' + G.data.roles[HH.role(hero)] + '</span>' + ui.qualityTag(hero) + ' <span class="muted">niv. ' + hero.level + '</span>' + ui.xpBarHtml(hero) +
          '<div class="stat-grid" style="margin-top:4px"><div>PV <b>' + s.maxHp + '</b></div><div>Attaque <b>' + Math.round(HH.attack(hero).dmgType === 'magic' ? s.matk : s.atk) + '</b></div>' +
          '<div>Défense <b>' + Math.round(s.def) + '</b></div><div>Vitesse <b>' + Math.round(s.spd) + '</b></div></div></div></div>';
      }
      h += '</div>';

      el.innerHTML = h; ui.fixTitles(el);
      el.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { st.settings.startFloor = +b.dataset.f; this.render(); }));
      el.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => {
        if (G.sys.town.buy(b.dataset.buy)) { ui.toast(G.data.buildings[b.dataset.buy].name + ' amélioré !', 'gold'); ui.invalidateHud(); this.render(); }
      }));
      const rer = () => this.render();
      ui.bindTavern(U.$('#tw-tavern'), rer);
      ui.bindFusion(U.$('#tw-forge'), rer);
      ui.bindOptimize('tw-opt', rer);
      el.querySelectorAll('[data-pot]').forEach((b) => (b.onclick = () => {
        const n = SH.buyPotion(b.dataset.pot, +b.dataset.n);
        if (n) ui.toast('+' + n + ' ' + G.data.potions[b.dataset.pot].name); rer();
      }));
      el.querySelectorAll('#tw-shop .icell').forEach((b) => (b.onclick = () => ui.itemDetail(stock.find((i) => i.uid === b.dataset.uid), { from: 'shop', onDone: rer })));
      U.$('#tw-restock').onclick = () => { if (SH.paidRefresh()) ui.toast('Nouveau stock !'); rer(); };
      const fmc = U.$('#tw-farm');
      if (fmc) fmc.onchange = () => { st.settings.farm.on = fmc.checked; if (fmc.checked) st.settings.farm.floor = Math.max(1, Math.min(st.settings.farm.floor, st.progress.maxFloor || 1)); G.core.save.save(); ui.invalidateHud(); this.render(); };
      const fd = (d) => () => { st.settings.farm.floor = Math.max(1, Math.min((st.progress.maxFloor || 1), st.settings.farm.floor + d)); this.render(); };
      if (U.$('#tw-fmm')) { U.$('#tw-fmm').onclick = fd(-1); U.$('#tw-fmp').onclick = fd(1); }
      const go = U.$('#tw-go'); if (go) go.onclick = () => ui.startRun();
      const view = U.$('#tw-view'); if (view) view.onclick = () => ui.show('dungeon');
    },
  };
})();
