// =====================================================================
//  ÉCRAN SAC : inventaire, matériaux, vente groupée, tri automatique,
//  potions et leurs règles d'utilisation automatique.
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, IT = G.sys.items, INV = G.sys.inventory;
  let filter = 'all', sort = 'rarity';
  const FILTERS = [['all', 'Tout'], ['weapon', 'Armes'], ['offhand', 'Main sec.'], ['armor', 'Armures'], ['jewel', 'Accessoires']];
  const SORTS = { rarity: 'Rareté', ilvl: 'Niveau', slot: 'Type', recent: 'Récent' };
  const RAR_OPTS = () => '<option value="-1">Rien</option>' + G.data.rarities.slice(0, 5).map((r, i) => '<option value="' + i + '">' + (i ? 'Jusqu\'à ' + r.name.toLowerCase() : 'Communs') + '</option>').join('');

  ui.screens.bag = {
    render() {
      const st = G.state, el = U.$('#screen-bag'), s = st.settings.autoSell;
      let list = st.inventory.slice();
      if (filter !== 'all') list = list.filter((i) => IT.base(i).cat === filter);
      const order = G.data.slotOrder;
      if (sort === 'rarity') list.sort((a, b) => IT.rIdx(b.rarity) - IT.rIdx(a.rarity) || b.ilvl - a.ilvl);
      else if (sort === 'ilvl') list.sort((a, b) => b.ilvl - a.ilvl || IT.rIdx(b.rarity) - IT.rIdx(a.rarity));
      else if (sort === 'slot') list.sort((a, b) => order.indexOf(IT.base(a).slot) - order.indexOf(IT.base(b).slot));
      else list.reverse();
      const mats = Object.keys(G.data.materials).map((k) => '<span class="mat"><i style="background:' + G.data.materials[k].color + '"></i>' + G.data.materials[k].name + ' <b>' + U.fmt(st.materials[k] || 0) + '</b></span>').join('');

      let h = ui.optimizeBtnHtml('bg-opt') + '<div class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">🎒 Sac</h2><b>' + st.inventory.length + ' / ' + INV.capacity() + '</b></div>' +
        '<div class="mats">' + mats + '</div>' +
        '<div class="choices small">' + FILTERS.map(([k, n]) => '<button class="pxbtn small ' + (k === filter ? 'sel' : '') + '" data-f="' + k + '">' + n + '</button>').join('') +
        '<button class="pxbtn small" id="bg-sort">Tri : ' + SORTS[sort] + '</button></div>' +
        '<div class="igrid">' + (list.length ? list.map((it) => ui.itemCell(it, { up: !!INV.upgradeFor(it) })).join('') : '<p class="muted">Aucun objet.</p>') + '</div>' +
        '<p class="muted small">▲ = meilleur que l\'équipement actuel d\'un héros. Touche un objet pour le comparer.</p></div>';

      h += '<div class="panel"><h3>Vente groupée</h3><p class="muted small">Ne touche pas aux objets verrouillés ni aux améliorations ▲.</p>' +
        '<select id="bg-bulkr">' + G.data.rarities.slice(0, 5).map((r, i) => '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + (i ? 'Jusqu\'à ' + r.name.toLowerCase() : 'Communs') + '</option>').join('') + '</select>' +
        '<div class="row" style="margin-top:6px"><button class="pxbtn gold" style="flex:1" id="bg-sell">Vendre</button><button class="pxbtn" style="flex:1" id="bg-salv">Recycler</button></div></div>';

      h += '<div class="panel"><h3>Tri automatique du butin</h3>' +
        '<p class="muted small">Ce qui est trouvé en dessous du seuil est vendu ou recyclé automatiquement.</p>' +
        '<label class="lbl">Traiter automatiquement</label><select id="bg-ar">' + RAR_OPTS() + '</select>' +
        '<label class="lbl">Action</label><select id="bg-aa"><option value="sell">Vendre (or)</option><option value="salvage">Recycler (matériaux)</option></select>' +
        '<label class="toggle"><span>Garder quand même les objets meilleurs ▲</span><input type="checkbox" id="bg-ak"></label>' +
        '<label class="toggle"><span>Équiper automatiquement les objets meilleurs</span><input type="checkbox" id="bg-ae"></label>' +
        '<label class="toggle"><span>Optimiser toute l\'équipe à chaque retour en ville</span><input type="checkbox" id="bg-ao"></label></div>';

      const R = st.potionRules;
      h += '<div class="panel"><h3>Potions</h3>';
      for (const id of G.data.potionOrder) {
        const p = G.data.potions[id];
        let rule = '';
        if (id === 'heal') rule = '<select data-rule="heal">' + [0, 0.2, 0.3, 0.4, 0.5, 0.6].map((v) => '<option value="' + v + '"' + (Math.abs(R.heal - v) < 0.001 ? ' selected' : '') + '>' + (v ? 'Sous ' + v * 100 + ' % de PV' : 'Jamais (manuel)') + '</option>').join('') + '</select>';
        else if (id === 'mana') rule = '<select data-rule="mana">' + [0, 0.15, 0.25, 0.35].map((v) => '<option value="' + v + '"' + (Math.abs(R.mana - v) < 0.001 ? ' selected' : '') + '>' + (v ? 'Sous ' + v * 100 + ' % de mana (en combat)' : 'Jamais (manuel)') + '</option>').join('') + '</select>';
        else if (id === 'revive') rule = '<select data-rule="revive"><option value="1"' + (R.revive ? ' selected' : '') + '>Automatique</option><option value="0"' + (R.revive ? '' : ' selected') + '>Manuel</option></select>';
        else rule = '<select data-rule="' + id + '">' + [['never', 'Jamais (manuel)'], ['boss', 'Contre les gardiens'], ['combat', 'À chaque combat']].map(([v, n]) => '<option value="' + v + '"' + (R.buffs[id] === v ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>';
        h += '<div class="potion-row"><img alt="" src="' + G.render.potionIconURL(id, 3) + '"><div class="info"><b>' + p.name + '</b> <span class="muted">×' + (st.potions[id] || 0) + ' / ' + G.sys.shop.maxPotions() + '</span><div class="muted small">' + p.desc + '</div>' + rule + '</div></div>';
      }
      h += '<button class="pxbtn wide" id="bg-shop">Acheter des potions (Ville › Boutique)</button></div>';
      el.innerHTML = h; ui.fixTitles(el);

      const rer = () => this.render();
      ui.bindOptimize('bg-opt', rer);
      el.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { filter = b.dataset.f; rer(); }));
      U.$('#bg-sort').onclick = () => { const k = Object.keys(SORTS); sort = k[(k.indexOf(sort) + 1) % k.length]; rer(); };
      el.querySelectorAll('.igrid .icell').forEach((b) => (b.onclick = () => ui.itemDetail(INV.find(b.dataset.uid), { from: 'bag', onDone: rer })));
      const bulk = (action) => {
        const r = INV.bulk(+U.$('#bg-bulkr').value, action);
        ui.toast(r.n ? r.n + ' objet(s) ' + (action === 'salvage' ? 'recyclé(s) : ' + INV.matsText(r.mats) : 'vendu(s) : +' + U.fmt(r.gold) + ' or') : 'Rien à traiter');
        rer();
      };
      U.$('#bg-sell').onclick = () => bulk('sell');
      U.$('#bg-salv').onclick = () => bulk('salvage');
      const ar = U.$('#bg-ar'); ar.value = String(s.maxRarity); ar.onchange = () => { s.maxRarity = +ar.value; G.core.save.save(); };
      const aa = U.$('#bg-aa'); aa.value = s.action; aa.onchange = () => { s.action = aa.value; G.core.save.save(); };
      const ak = U.$('#bg-ak'); ak.checked = s.keepUpgrades; ak.onchange = () => { s.keepUpgrades = ak.checked; G.core.save.save(); };
      const ae = U.$('#bg-ae'); ae.checked = st.settings.autoEquip; ae.onchange = () => { st.settings.autoEquip = ae.checked; G.core.save.save(); };
      const ao = U.$('#bg-ao'); ao.checked = st.settings.autoOptimize; ao.onchange = () => { st.settings.autoOptimize = ao.checked; G.core.save.save(); };
      el.querySelectorAll('[data-rule]').forEach((sel) => (sel.onchange = () => {
        const k = sel.dataset.rule;
        if (k === 'heal') R.heal = +sel.value; else if (k === 'mana') R.mana = +sel.value; else if (k === 'revive') R.revive = sel.value === '1'; else R.buffs[k] = sel.value;
        G.core.save.save();
      }));
      U.$('#bg-shop').onclick = () => { ui.show('town'); setTimeout(() => { const s2 = U.$('#tw-shop'); s2 && s2.scrollIntoView({ behavior: 'smooth' }); }, 50); };
    },
  };
})();
