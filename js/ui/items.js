// =====================================================================
//  INTERFACE DES OBJETS : icône, fiche détaillée, comparaison avec
//  l'équipement actuel d'un héros, et actions (équiper, vendre...).
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, IT = G.sys.items, INV = G.sys.inventory;

  // petite case d'objet (icône + bordure de rareté)
  ui.itemCell = function (item, opts) {
    opts = opts || {};
    const r = IT.rarity(item.rarity);
    return '<button class="icell r-' + item.rarity + '" data-uid="' + item.uid + '" style="--rc:' + r.color + '">' +
      '<img alt="" src="' + G.render.itemIconURL(item, 3) + '">' +
      '<span class="ilvl">' + item.ilvl + '</span>' +
      (opts.up ? '<span class="iup">▲</span>' : '') + (item.locked ? '<span class="ilock">🔒</span>' : '') +
      (item.isNew && !opts.up ? '<span class="inew"></span>' : '') + '</button>';
  };

  // lignes de comparaison des stats d'un héros avec/sans l'objet
  const CMP = [
    ['maxHp', 'PV'], ['atk', 'Attaque'], ['matk', 'Puissance mag.'], ['def', 'Défense'], ['spd', 'Vitesse'],
    ['crit', 'Critique', 1], ['critDmg', 'Dégâts crit.', 1], ['dodge', 'Esquive', 1], ['atkSpd', 'Vit. d\'attaque', 1], ['dmgMult', 'Dégâts', 1],
    ['mpRegen', 'Mana/s'], ['healMult', 'Soins', 1], ['lifesteal', 'Vol de vie', 1], ['thorns', 'Épines', 1], ['echo', 'Double frappe', 1], ['goldFind', 'Or trouvé', 1], ['magicFind', 'Chance de butin', 1],
  ];
  ui.compareHtml = function (hero, newEquip) {
    const a = G.sys.stats.hero(hero), b = G.sys.stats.hero(hero, { equip: newEquip });
    const cls = G.data.classes[hero.cls];
    const rows = [];
    for (const [k, name, pct] of CMP) {
      if (k === 'atk' && cls.attack.dmgType === 'magic') continue;
      if (k === 'matk' && cls.attack.dmgType !== 'magic' && cls.role !== 'healer') continue;
      const d = (b[k] || 0) - (a[k] || 0);
      if (Math.abs(d) < (pct ? 0.0005 : 0.05)) continue;
      const txt = pct ? (d > 0 ? '+' : '') + Math.round(d * 1000) / 10 + ' %' : (d > 0 ? '+' : '') + (Math.abs(d) >= 10 ? Math.round(d) : String(Math.round(d * 10) / 10).replace('.', ','));
      rows.push('<div>' + name + '</div><div class="' + (d > 0 ? 'pos' : 'neg') + '">' + txt + '</div>');
    }
    let el = 0, el2 = 0;
    for (const e in a.elemDmg) el += a.elemDmg[e];
    for (const e in b.elemDmg) el2 += b.elemDmg[e];
    if (Math.abs(el2 - el) > 0.05) rows.push('<div>Dégâts élémentaires</div><div class="' + (el2 > el ? 'pos' : 'neg') + '">' + (el2 > el ? '+' : '') + Math.round((el2 - el) * 10) / 10 + '</div>');
    const g = INV.score(hero, newEquip) / INV.score(hero, hero.equip) - 1;
    return '<div class="sum-grid cmp">' + (rows.join('') || '<div class="muted">Aucun changement</div><div></div>') + '</div>' +
      '<div class="gain ' + (g > 0.001 ? 'pos' : g < -0.001 ? 'neg' : '') + '">Puissance estimée : ' + (g >= 0 ? '+' : '') + Math.round(g * 1000) / 10 + ' %</div>';
  };

  function itemHead(item) {
    const r = IT.rarity(item.rarity), b = IT.base(item);
    const lines = IT.lines(item).map((l) => '<div class="il ' + l.cls + '">' + U.esc(l.t) + '</div>').join('');
    return '<div class="item-head"><img alt="" class="ibig" style="--rc:' + r.color + '" src="' + G.render.itemIconURL(item, 4) + '"><div>' +
      '<div class="iname" style="color:' + r.color + '">' + U.esc(item.name) + '</div>' +
      '<div class="muted small">' + r.name + ' · ' + b.name + ' · niv. ' + item.ilvl + '</div></div></div>' +
      '<div class="ilines">' + lines + '</div><div class="muted small">Utilisable par : ' + IT.usersText(item) + '</div>';
  }

  // fiche d'un objet. ctx : { from: 'bag'|'equipped'|'shop', hero, slot, onDone }
  ui.itemDetail = function (item, ctx) {
    ctx = ctx || { from: 'bag' };
    const done = () => { ctx.onDone ? ctx.onDone() : ui.refresh(); };
    const team = G.sys.heroes.team().filter((h) => IT.canUse(h, item));
    let hero = ctx.hero || (INV.upgradeFor(item) || {}).hero || team[0];
    const btns = [];
    if (ctx.from === 'equipped') {
      btns.push({ label: 'Changer d\'objet', cls: 'primary', onClick: () => ui.slotPicker(ctx.hero, ctx.slot, ctx.onDone) });
      btns.push({ label: 'Retirer', onClick: () => { if (!INV.unequip(ctx.hero, ctx.slot)) ui.toast('Sac plein', 'danger'); done(); } });
    } else if (ctx.from === 'view') {
      // consultation seule (marchand)
    } else if (ctx.from === 'shop') {
      const p = G.sys.shop.itemPrice(item);
      btns.push({ label: 'Acheter · ' + U.fmt(p) + ' or', cls: 'gold', onClick: () => { if (!G.sys.shop.buyItem(item.uid)) ui.toast(G.sys.inventory.full() ? 'Sac plein' : 'Pas assez d\'or', 'danger'); else ui.toast('Acheté : ' + U.esc(item.name)); done(); } });
    } else {
      if (hero) btns.push({ label: 'Équiper sur ' + U.esc(hero.name), cls: 'primary', id: 'eqbtn', onClick: () => { INV.equip(hero, item, ctx.slot || INV.bestSlot(hero, item).slot); ui.toast(U.esc(hero.name) + ' équipe ' + U.esc(item.name)); done(); } });
      btns.push({ label: 'Vendre · +' + U.fmt(IT.value(item)) + ' or', cls: 'gold', onClick: () => { if (item.locked) return ui.toast('Objet verrouillé', 'danger'); INV.sell(item); done(); } });
      btns.push({ label: 'Recycler · ' + INV.matsText(IT.salvageOf(item)), onClick: () => { if (item.locked) return ui.toast('Objet verrouillé', 'danger'); INV.salvage(item); done(); } });
      btns.push({ label: item.locked ? '🔓 Déverrouiller' : '🔒 Verrouiller', onClick: () => { item.locked = !item.locked; done(); } });
    }
    btns.push({ label: 'Fermer' });
    item.isNew = false;
    let html = itemHead(item);
    if (team.length && ctx.from !== 'equipped') {
      html += '<h3 class="cmp-title">Comparaison</h3><div class="choices small" id="cmp-heroes">' +
        team.map((h) => '<button class="pxbtn small ' + (h === hero ? 'sel' : '') + '" data-h="' + h.id + '">' + U.esc(h.name) + '</button>').join('') + '</div><div id="cmp-box"></div>';
    }
    const close = ui.modal({ html, buttons: btns, dismissable: true });
    const box = close.box;
    const renderCmp = () => {
      const cb = box.querySelector('#cmp-box');
      if (!cb || !hero) return;
      const slot = ctx.slot || INV.bestSlot(hero, item).slot;
      const cur = hero.equip[slot];
      cb.innerHTML = '<div class="muted small">Remplace : ' + (cur ? '<span style="color:' + IT.rarity(cur.rarity).color + '">' + U.esc(cur.name) + '</span>' : 'rien (' + G.data.slots[slot].name.toLowerCase() + ' vide)') + '</div>' + ui.compareHtml(hero, INV.withItem(hero, item, slot));
      const eb = [...box.querySelectorAll('.btns .pxbtn')].find((b) => b.textContent.startsWith('Équiper sur'));
      if (eb) eb.textContent = 'Équiper sur ' + hero.name;
    };
    box.querySelectorAll('#cmp-heroes [data-h]').forEach((b) => (b.onclick = () => {
      hero = G.sys.heroes.get(b.dataset.h);
      box.querySelectorAll('#cmp-heroes .pxbtn').forEach((x) => x.classList.toggle('sel', x === b));
      renderCmp();
    }));
    renderCmp();
    // le bouton "Équiper" doit utiliser le héros sélectionné
    const eqb = [...box.querySelectorAll('.btns .pxbtn')].find((b) => b.textContent.startsWith('Équiper sur'));
    if (eqb) eqb.onclick = () => { close(); INV.equip(hero, item, ctx.slot || INV.bestSlot(hero, item).slot); ui.toast(U.esc(hero.name) + ' équipe ' + U.esc(item.name)); done(); };
  };

  // choisir un objet du sac pour un emplacement d'un héros
  ui.slotPicker = function (hero, slot, onDone) {
    const accepts = G.data.slots[slot].accepts || slot;
    const list = G.state.inventory.filter((it) => IT.base(it).slot === accepts && IT.canUse(hero, it))
      .map((it) => ({ it, g: INV.gain(hero, it, slot) })).sort((a, b) => b.g - a.g);
    let html = '<h2>' + G.data.slots[slot].name + '</h2><p class="muted small" style="text-align:center">' + U.esc(hero.name) + ' · ' + G.data.classes[hero.cls].name + '</p>';
    if (!list.length) html += '<p class="muted">Aucun objet compatible dans le sac.</p>';
    html += '<div class="pick-list">' + list.map(({ it, g }) => {
      const r = IT.rarity(it.rarity);
      return '<button class="pick" data-uid="' + it.uid + '"><img alt="" src="' + G.render.itemIconURL(it, 3) + '" style="--rc:' + r.color + '"><span class="pn" style="color:' + r.color + '">' + U.esc(it.name) + '<small class="muted"> niv. ' + it.ilvl + '</small></span><span class="' + (g > 0.001 ? 'pos' : g < -0.001 ? 'neg' : 'muted') + '">' + (g >= 0 ? '+' : '') + Math.round(g * 1000) / 10 + ' %</span></button>';
    }).join('') + '</div>';
    const close = ui.modal({ html, buttons: [{ label: 'Fermer' }], dismissable: true });
    close.box.querySelectorAll('.pick').forEach((b) => (b.onclick = () => {
      close();
      INV.equip(hero, INV.find(b.dataset.uid), slot);
      onDone ? onDone() : ui.refresh();
    }));
  };
})();
