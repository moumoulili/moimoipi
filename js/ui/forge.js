// =====================================================================
//  ÉVOLUTIONS (fenêtre de choix) et FORGE (améliorer, relancer, fusionner)
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, IT = G.sys.items, H = G.sys.heroes, F = G.sys.forge;
  const pct = (v) => Math.round(v * 100) + ' %';
  const bonusList = (b) => Object.keys(b).map((k) => G.sys.items.fmtStat(k, b[k])).join(', ');
  const haveTxt = (c) => (H.canAfford(c) ? '' : ' <span class="neg">(insuffisant)</span>');

  // ---------- Évolution : bloc dans la fiche du héros ----------
  ui.evoHtml = function (h) {
    const opts = H.evoOptions(h), next = H.nextEvoLevel(h), e = H.evo(h);
    let s = '';
    if (e) s += '<div class="evo-cur">' + e.icon + ' <b>' + e.name + '</b> <span class="muted small">' + bonusList(H.evoBonus(h)) + '</span></div>';
    if (h.legacy) s += '<div class="small" style="margin-top:6px">🏛️ <b>Héritage ' + h.legacy + '</b> : +' + Math.round(G.data.balance.legacyBonus * h.legacy * 100) + ' % de stats de base</div>';
    if (opts.length) s += '<button class="pxbtn epic wide" id="tm-evolve">✨ ' + (h.cls === 'adventurer' ? 'Choisir une classe !' : 'Évolution disponible !') + '</button>';
    else if (next) s += '<p class="muted small">' + (h.cls === 'adventurer' ? 'Choix de classe' : 'Prochaine évolution') + ' au niveau ' + next + ' (le héros repassera niveau 1).</p>';
    return s;
  };
  ui.evolveModal = function (h, after) {
    const opts = H.evoOptions(h), B = G.data.balance;
    const newLeg = (h.legacy || 0) + 1;
    let html = '<p class="small" style="text-align:center">' + U.esc(h.name) + ' peut choisir sa voie. Ce choix est définitif.</p>' +
      '<p class="small warnbox">⚠ Le héros <b>repassera niveau 1</b>. Il garde son équipement (s\'il peut le porter), ses compétences apprises, et gagne ' +
      '<b>Héritage ' + newLeg + '</b> : +' + Math.round(B.legacyBonus * newLeg * 100) + ' % de stats de base.</p>';
    for (const id of opts) {
      const e = H.optionInfo(id), c = H.evoCost(id), isClass = !G.data.evolutions[id];
      const skills = Object.values(G.data.skills).filter((s) => (isClass ? s.cls === id && !s.evo : s.evo === id)).sort((a, b) => (a.branch + a.row > b.branch + b.row ? 1 : -1));
      const spr = isClass ? Object.assign({ id }, e.sprite) : { tpl: G.data.classes[h.cls].sprite.tpl, pal: Object.assign({}, G.data.classes[h.cls].sprite.pal, e.pal), id };
      const gear = isClass ? G.data.classGear[id] : null;
      html += '<div class="evo-card"><div class="row"><img alt="" src="' + G.render.spriteURL(spr, 4) + '"><div style="flex:1"><div class="iname sk">' + (e.icon ? e.icon + ' ' : '') + e.name + '</div>' +
        '<span class="tag">' + G.data.roles[e.role] + '</span></div></div><p class="small">' + e.desc + '</p>' +
        (e.bonus ? '<p class="small"><b>Bonus :</b> ' + bonusList(e.bonus) + '</p>' : '') +
        (gear ? '<p class="small"><b>Armes :</b> ' + gear.weapons.map((w) => G.data.itemBases[w].name).join(', ') + ' · <b>Armures :</b> ' + gear.armor.map((w) => ({ heavy: 'lourdes', medium: 'moyennes', light: 'légères' }[w])).join(', ') + '</p>' : '') +
        '<p class="small"><b>' + (isClass ? 'Compétences' : 'Nouvelles compétences') + ' :</b> ' + skills.map((s) => s.icon + ' ' + s.name + (s.ult ? ' ⭐' : '')).join(', ') + '</p>' +
        '<p class="small"><b>Coût :</b> ' + F.costText(c) + haveTxt(c) + '</p>' +
        '<button class="pxbtn primary wide" data-evo="' + id + '"' + (H.canAfford(c) ? '' : ' disabled') + '>Devenir ' + e.name + '</button></div>';
    }
    const close = ui.modal({ title: '✨ ' + (h.cls === 'adventurer' ? 'Choix de classe' : 'Évolution'), html, buttons: [{ label: 'Plus tard' }], dismissable: true });
    close.box.querySelectorAll('[data-evo]').forEach((b) => (b.onclick = () => {
      const r = H.evolve(h, b.dataset.evo);
      close();
      if (r === 'ok') {
        const e = H.optionInfo(b.dataset.evo);
        ui.toast('✨ ' + U.esc(h.name) + ' devient ' + e.name + ' (niveau 1, Héritage ' + h.legacy + ')', 'gold');
        ui.banner(e.name, h.name, 'gold');
        G.core.U.vibrate([60, 40, 120]);
        ui.invalidateHud();
      } else ui.toast('Pas assez de ressources', 'danger');
      after && after();
    }));
  };

  // ---------- Forge : fenêtre pour un objet ----------
  ui.forgeModal = function (item, after) {
    const render = () => {
      const up = item.up || 0, c = F.upCost(item), ch = F.upChance(item);
      let h = '<div class="item-head"><img alt="" class="ibig" style="--rc:' + IT.rarity(item.rarity).color + '" src="' + G.render.itemIconURL(item, 4) + '"><div><div class="iname" style="color:' + IT.rarity(item.rarity).color + '">' + U.esc(item.name) + '</div>' +
        '<div class="muted small">' + IT.rarity(item.rarity).name + ' · niv. ' + item.ilvl + ' · amélioration +' + up + ' / +' + F.maxUp() + '</div></div></div>';
      h += '<h3 class="cmp-title">⚒ Améliorer</h3>';
      if (up >= F.maxUp()) h += '<p class="muted small">Amélioration maximale atteinte.</p>';
      else {
        h += '<p class="small">+' + up + ' → <b>+' + (up + 1) + '</b> : +' + Math.round(G.data.balance.forge.upFlat * 100) + ' % aux stats et dégâts (+' + Math.round(G.data.balance.forge.upPct * 100) + ' % aux bonus en %)</p>' +
          '<p class="small">Coût : ' + F.costText(c) + haveTxt(c) + '<br>Réussite : <b class="' + (ch < 1 ? 'neg' : 'pos') + '">' + pct(ch) + '</b>' + (ch < 1 ? ' (un échec consomme le coût, l\'objet est conservé)' : '') + '</p>' +
          '<button class="pxbtn gold wide" id="fg-up"' + (H.canAfford(c) ? '' : ' disabled') + '>⚒ Améliorer en +' + (up + 1) + '</button>';
      }
      const rc = F.rerollCost(item);
      h += '<h3 class="cmp-title">🎲 Relancer un bonus</h3><p class="muted small">Remplace un bonus par un autre au hasard. Coût : ' + F.costText(rc) + haveTxt(rc) + '</p>';
      if (!item.affixes.length) h += '<p class="muted small">Cet objet n\'a pas de bonus aléatoire.</p>';
      item.affixes.forEach((a, i) => {
        h += '<div class="row reroll"><span style="flex:1" class="small' + (a.special ? ' muted' : '') + '">' + U.esc(IT.fmtStat(a.stat, a.v * IT.upMult(item, a.stat))) + (a.special ? ' (spécial)' : '') + '</span>' +
          (a.special ? '' : '<button class="pxbtn small" data-rr="' + i + '"' + (H.canAfford(rc) ? '' : ' disabled') + '>🎲</button>') + '</div>';
      });
      h += '<p class="muted small" style="margin-top:8px">Tes matériaux : ' + Object.keys(G.data.materials).map((k) => G.data.materials[k].name + ' ' + (G.state.materials[k] || 0)).join(' · ') + ' · or ' + U.fmt(G.state.gold) + '</p>';
      return h;
    };
    const close = ui.modal({ title: '⚒ Forge', html: '<div id="fg-box">' + render() + '</div>', buttons: [{ label: 'Fermer', onClick: after }], dismissable: true });
    const box = close.box.querySelector('#fg-box');
    const bind = () => {
      const b = box.querySelector('#fg-up');
      if (b) b.onclick = () => {
        const r = F.upgrade(item);
        if (r === 'ok') { ui.toast('⚒ Réussite : ' + U.esc(item.name), 'gold'); G.core.U.vibrate(40); }
        else if (r === 'fail') ui.toast('💥 Échec… l\'objet est intact', 'danger');
        else ui.toast('Pas assez de ressources', 'danger');
        box.innerHTML = render(); bind();
      };
      box.querySelectorAll('[data-rr]').forEach((x) => (x.onclick = () => {
        if (F.reroll(item, +x.dataset.rr) === 'ok') ui.toast('🎲 Nouveau bonus !'); else ui.toast('Pas assez de ressources', 'danger');
        box.innerHTML = render(); bind();
      }));
    };
    bind();
  };

  // ---------- Fusion (panneau de la Ville) ----------
  ui.fusionHtml = function () {
    let h = '<div class="panel" id="tw-forge"><h3>⚒ Forge</h3><p class="muted small">Pour améliorer ou relancer un objet : touche-le dans le Sac ou l\'Équipe, puis « Forge ».<br>' +
      '<b>Fusion</b> : 3 objets d\'une rareté (les moins précieux, hors verrouillés, améliorés et ▲) → 1 objet de la rareté suivante.</p>';
    G.data.rarities.slice(0, 5).forEach((r, i) => {
      const n = F.fuseCandidates(i).length, nx = G.data.rarities[i + 1], c = F.fuseCost(i);
      h += '<div class="row fuse"><span style="flex:1" class="small"><b style="color:' + r.color + '">3 × ' + r.name + '</b> → <b style="color:' + nx.color + '">' + nx.name + '</b><br><span class="muted">' + n + ' disponible(s) · ' + F.costText(c) + '</span></span>' +
        '<button class="pxbtn small gold" data-fuse="' + i + '"' + (n >= 3 && H.canAfford(c) ? '' : ' disabled') + '>Fusionner</button></div>';
    });
    return h + '</div>';
  };
  ui.bindFusion = function (root, after) {
    root.querySelectorAll('[data-fuse]').forEach((b) => (b.onclick = () => {
      const r = F.fuse(+b.dataset.fuse);
      if (r && r.uid) { ui.toast('✨ Fusion : ' + '<span style="color:' + IT.rarity(r.rarity).color + '">' + U.esc(r.name) + '</span>', 'gold'); ui.itemDetail(r, { from: 'bag', onDone: after }); }
      else ui.toast('Fusion impossible', 'danger');
      after && after();
    }));
  };
})();
