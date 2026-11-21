// =====================================================================
//  ÉCRAN VILLE : une carte en pixel art ; toucher un bâtiment ouvre sa
//  fenêtre (amélioration + fonction : expédition, recrutement, boutique…)
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui;
  const T = () => G.sys.town;
  const SPECIAL = { mine: { name: 'Entrée de la mine', icon: '⛏️' }, trophy: { name: 'Salle des trophées', icon: '🃏' } };

  // ---------- Contenus des bâtiments ----------
  function upgradeHtml(id) {
    const bd = G.data.buildings[id];
    if (!bd) return '';
    const lvl = T().level(id), max = T().isMax(id);
    return '<div class="bupg"><p class="small">' + bd.desc + '</p>' +
      '<p class="small">Actuel : <b>' + bd.effect(lvl) + '</b>' + (max ? '' : '<br>Niveau ' + (lvl + 1) + ' : <b>' + bd.effect(lvl + 1) + '</b>') + '</p>' +
      (max ? '<span class="tag">Niveau max</span>' : '<button class="pxbtn gold wide" data-buy="' + id + '"' + (T().canBuy(id) ? '' : ' disabled') + '>⬆ Améliorer · ' + G.sys.forge.costText(T().cost(id)) + '</button>') + '</div>';
  }
  function expeditionHtml() {
    const st = G.state, run = G.sys.run.active, starts = T().startFloors(), cur = ui.startFloor();
    let h = '<h3 class="cmp-title">⚔️ Expédition</h3>';
    if (run) return h + '<p class="small">Ton équipe explore l\'<b>étage ' + run.saved.floor + '</b>.</p><button class="pxbtn wide primary" id="tw-view">Voir le donjon</button>';
    const fm = st.settings.farm, DG = G.sys.dungeon;
    h += dungeonsHtml();
    if (!fm.on) h += '<p class="muted small">Point de départ :</p><div class="choices small">' + starts.map((f) => '<button class="pxbtn small ' + (f === cur ? 'sel' : '') + '" data-f="' + f + '">Ét. ' + f + '</button>').join('') + '</div>';
    h += '<label class="toggle"><span>🔁 <b>Auto-farm</b> : rejouer un étage déjà atteint en boucle</span><input type="checkbox" id="tw-farm"' + (fm.on ? ' checked' : '') + '></label>';
    if (fm.on) {
      const mx = Math.max(1, DG.prog().maxFloor);
      h += '<div class="row"><button class="pxbtn small" id="tw-fmm">−</button><b style="flex:1;text-align:center">Étage ' + Math.min(fm.floor, mx) + ' / ' + mx + '</b><button class="pxbtn small" id="tw-fmp">+</button></div>';
    }
    return h + '<button class="pxbtn wide primary" id="tw-go">' + (fm.on ? '🔁 Farmer l\'étage ' + cur : '⚔️ Partir à l\'étage ' + cur) + '</button>';
  }
  // liste des donjons : tranche de niveau conseillée, difficulté, récompenses, condition d'ouverture
  function dungeonsHtml() {
    const DG = G.sys.dungeon, cur = DG.curId(), team = G.sys.heroes.team();
    const avg = Math.round(team.reduce((a, h) => a + h.level, 0) / Math.max(1, team.length));
    const pct = (x) => '×' + String(Math.round(x * 100) / 100).replace('.', ',');
    let h = '<p class="muted small">Donjon (niveau moyen de l\'équipe : <b>' + avg + '</b>) :</p><div class="dg-list">';
    for (const d of G.data.dungeons) {
      const open = DG.unlocked(d.id), pr = DG.prog(d.id), u = d.unlock;
      const warn = open && avg < d.lvl[0] ? '<span class="dg-warn">⚠ Trop dangereux pour ton équipe</span>' : '';
      h += '<button class="dg-card' + (d.id === cur ? ' sel' : '') + (open ? '' : ' locked') + '" data-dg="' + d.id + '"' + (open ? '' : ' disabled') + ' style="--dga:' + d.color + '">' +
        '<span class="dg-ico">' + (open ? d.icon : '🔒') + '</span><span class="dg-txt"><b>' + d.name + '</b>' +
        '<span class="dg-lvl">Niv. conseillé ' + d.lvl[0] + '–' + d.lvl[1] + '</span>' +
        (open ? '<span class="dg-info">' + (d.mult > 1 ? 'Monstres ' + pct(d.mult) + ' · Or/XP ' + pct(d.reward) + ' · Butin +' + Math.round(d.mf * 100) + ' %' : d.desc) + '</span>' +
          '<span class="dg-info">Record : ét. ' + pr.maxFloor + (pr.maxFloor ? ' (monstres niv. ' + (pr.maxFloor + d.offset) + ')' : '') + '</span>' + warn
          : '<span class="dg-info">Atteindre l\'étage ' + u.floor + ' : ' + DG.def(u.from).name + ' (record ' + DG.prog(u.from).maxFloor + ')</span>') +
        '</span></button>';
    }
    return h + '</div>';
  }
  function shopHtml() {
    const st = G.state, SH = G.sys.shop;
    let h = '<h3 class="cmp-title">🧪 Potions</h3>';
    for (const id of G.data.potionOrder) {
      const p = G.data.potions[id], n = st.potions[id] || 0, price = SH.potionPrice(id), full = n >= SH.maxPotions();
      h += '<div class="potion-row"><img alt="" src="' + G.render.potionIconURL(id, 3) + '"><div class="info"><b>' + p.name + '</b> <span class="muted">×' + n + ' / ' + SH.maxPotions() + '</span><div class="muted small">' + p.desc + '</div></div>' +
        '<div class="buy"><button class="pxbtn small gold" data-pot="' + id + '" data-n="1"' + (full || st.gold < price ? ' disabled' : '') + '>' + U.fmt(price) + '</button>' +
        '<button class="pxbtn small" data-pot="' + id + '" data-n="5"' + (full || st.gold < price ? ' disabled' : '') + '>×5</button></div></div>';
    }
    const stock = SH.stock(), mins = Math.max(0, Math.ceil((st.shop.refreshAt - Date.now()) / 60000));
    return h + '<h3 class="cmp-title">🛡 Objets <span class="muted small">(nouveau stock dans ' + mins + ' min)</span></h3><div class="igrid">' +
      (stock.length ? stock.map((it) => ui.itemCell(it, { up: !!G.sys.inventory.upgradeFor(it) })).join('') : '<p class="muted">Tout est vendu !</p>') + '</div>' +
      '<button class="pxbtn small wide" id="tw-restock"' + (st.gold < SH.refreshCost() ? ' disabled' : '') + '>Renouveler le stock · ' + U.fmt(SH.refreshCost()) + ' or</button>';
  }
  const CONTENT = {
    portal: expeditionHtml,
    tavern: () => '<h3 class="cmp-title">🍺 Recrues</h3>' + ui.tavernHtml(),
    shop: shopHtml,
    forge: () => '<h3 class="cmp-title">⚒ Forger</h3><p class="small">Pour améliorer un objet ou relancer ses bonus : touche-le dans le <b>Sac</b> ou l\'<b>Équipe</b>, puis « ⚒ Forge ».</p><button class="pxbtn wide" id="tw-bag">🎒 Ouvrir le sac</button>',
    camp: () => { const r = G.state.rate; return '<h3 class="cmp-title">🏕️ Rendement mesuré</h3><p class="small">' + (r && r.samples ? U.fmt(r.gold * 60) + ' or/min · ' + U.fmt(r.xp * 60) + ' XP/min par héros · ~étage ' + r.floor : 'Fais une expédition d\'au moins 1 minute pour mesurer ton rendement.') + '</p>'; },
    trophy: () => ui.cardsHtml(),
    mine: () => '<p class="small">Tape sur les rochers pour récolter des minerais, puis fabrique de l\'équipement à l\'atelier.</p><button class="pxbtn wide primary" id="tw-mine">⛏️ Descendre à la mine</button>',
  };

  // ---------- Fenêtre d'un bâtiment ----------
  ui.buildingModal = function (id) {
    const bd = G.data.buildings[id] || SPECIAL[id];
    const lvl = G.data.buildings[id] ? T().level(id) : null;
    const render = () => (CONTENT[id] ? CONTENT[id]() : '') + upgradeHtml(id) +
      '<p class="muted small" style="margin-top:8px">Or : ' + U.fmt(G.state.gold) + ' · ' + Object.keys(G.data.materials).map((k) => G.data.materials[k].icon + ' ' + U.fmt(G.state.materials[k] || 0)).join(' · ') + '</p>';
    const close = ui.modal({ title: bd.icon + ' ' + bd.name + (lvl != null ? ' <span class="muted small">niv. ' + lvl + '</span>' : ''), html: '<div id="bm-box">' + render() + '</div>',
      buttons: [{ label: 'Fermer', onClick: () => ui.refresh() }], dismissable: true });
    const box = close.box.querySelector('#bm-box');
    const re = () => { box.innerHTML = render(); bind(); const t = close.box.querySelector('h2'); if (t && G.data.buildings[id]) t.innerHTML = '<span class="ico">' + bd.icon + '</span>' + bd.name + ' <span class="muted small">niv. ' + T().level(id) + '</span>'; };
    const done = (fn) => () => { close(); ui.refresh(); fn(); };
    function bind() {
      const st = G.state;
      box.querySelectorAll('[data-buy]').forEach((b) => (b.onclick = () => {
        if (T().buy(b.dataset.buy)) { ui.toast(bd.name + ' : niveau ' + T().level(id) + ' !', 'gold'); G.sys.audio && G.sys.audio.sfx('up'); ui.invalidateHud(); }
        re();
      }));
      box.querySelectorAll('[data-dg]').forEach((b) => (b.onclick = () => {
        if (!G.sys.dungeon.unlocked(b.dataset.dg)) return;
        st.settings.dungeon = b.dataset.dg; st.settings.startFloor = 1;
        st.settings.farm.floor = Math.max(1, Math.min(st.settings.farm.floor, G.sys.dungeon.prog().maxFloor || 1));
        G.core.save.save(); re();
      }));
      box.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { st.settings.startFloor = +b.dataset.f; re(); }));
      const fmc = box.querySelector('#tw-farm');
      if (fmc) fmc.onchange = () => { st.settings.farm.on = fmc.checked; st.settings.farm.floor = Math.max(1, Math.min(st.settings.farm.floor, G.sys.dungeon.prog().maxFloor || 1)); G.core.save.save(); ui.invalidateHud(); re(); };
      const fd = (d) => () => { st.settings.farm.floor = Math.max(1, Math.min(G.sys.dungeon.prog().maxFloor || 1, st.settings.farm.floor + d)); re(); };
      if (box.querySelector('#tw-fmm')) { box.querySelector('#tw-fmm').onclick = fd(-1); box.querySelector('#tw-fmp').onclick = fd(1); }
      const go = box.querySelector('#tw-go'); if (go) go.onclick = done(() => ui.startRun());
      const view = box.querySelector('#tw-view'); if (view) view.onclick = done(() => ui.show('dungeon'));
      const bag = box.querySelector('#tw-bag'); if (bag) bag.onclick = done(() => ui.show('bag'));
      const mn = box.querySelector('#tw-mine'); if (mn) mn.onclick = done(() => ui.show('mine'));
      if (id === 'tavern') ui.bindTavern(box, re);
      if (id === 'shop') {
        box.querySelectorAll('[data-pot]').forEach((b) => (b.onclick = () => { const n = G.sys.shop.buyPotion(b.dataset.pot, +b.dataset.n); if (n) ui.toast('+' + n + ' ' + G.data.potions[b.dataset.pot].name); re(); }));
        const stock = G.sys.shop.stock();
        box.querySelectorAll('.icell').forEach((b) => (b.onclick = () => ui.itemDetail(stock.find((i) => i.uid === b.dataset.uid), { from: 'shop', onDone: re })));
        const rs = box.querySelector('#tw-restock'); if (rs) rs.onclick = () => { if (G.sys.shop.paidRefresh()) ui.toast('Nouveau stock !'); re(); };
      }
    }
    bind();
    return close;
  };

  // ---------- La carte de la ville ----------
  ui.screens.town = {
    render() {
      const st = G.state, el = U.$('#screen-town'), L = G.render.townLayout, S = G.render.townScene;
      let h = '<div class="panel town-head"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:4px"><h2 style="margin:0">🏰 Ville</h2>' +
        '<span class="small">' + G.sys.dungeon.cur().icon + ' Record <b>ét. ' + G.sys.dungeon.prog().maxFloor + '</b> · ' + st.stats.runs + ' expéditions</span></div>' +
        '<div class="small muted">' + Object.keys(G.data.materials).map((k) => G.data.materials[k].icon + ' ' + G.data.materials[k].name + ' <b>' + U.fmt(st.materials[k] || 0) + '</b>').join(' · ') + '</div></div>';
      h += '<div class="town-scene" style="background-image:url(' + G.render.townSceneURL() + ')">';
      for (const id in L) {
        const bd = G.data.buildings[id] || SPECIAL[id], [x, y] = L[id];
        const lvl = G.data.buildings[id] ? T().level(id) : null, can = G.data.buildings[id] && T().canBuy(id);
        h += '<button class="tbuild b-' + id + '" data-b="' + id + '" style="left:' + (x / S.W) * 100 + '%;top:' + (y / S.H) * 100 + '%;width:' + (32 / S.W) * 100 + '%">' +
          '<img alt="" src="' + G.render.buildingURL(id) + '">' +
          '<span class="tb-name">' + bd.name.replace('des profondeurs', '').replace('Entrée de la mine', 'Mine').replace('Salle des trophées', 'Trophées') + (id === 'trophy' ? ' <b>' + G.sys.cards.owned() + '</b>' : '') + (lvl != null ? ' <b>' + lvl + '</b>' : '') + '</span>' +
          (can ? '<span class="tb-up">▲</span>' : '') + '</button>';
      }
      h += '</div><p class="muted small" style="text-align:center">Touche un bâtiment pour y entrer. ▲ = amélioration possible.</p>';
      el.innerHTML = h; ui.fixTitles(el);
      el.querySelectorAll('[data-b]').forEach((b) => (b.onclick = () => ui.buildingModal(b.dataset.b)));
    },
  };
})();
