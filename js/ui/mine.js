// =====================================================================
//  ÉCRAN MINE : choisir un minerai, taper sur le rocher, améliorations,
//  et atelier pour fabriquer de l'équipement avec les minerais.
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, B = G.data.balance;
  const M = () => G.sys.mine;
  let craftBase = 'sword', craftOre = null;
  const rockURL = (o) => G.render.spriteURL({ tpl: 'ore_rock', pal: { g: '#6a6474', a: o.a, b: o.b, w: o.w } }, 10);
  const fmt1 = (v) => (v >= 100 ? U.fmt(v) : String(Math.round(v * 10) / 10).replace('.', ','));

  function hpBar() {
    const s = G.state.mine, max = M().maxHp();
    return '<div class="bar mine-hp"><i style="width:' + Math.max(0, (s.hp / max) * 100) + '%"></i></div><div class="muted small" style="text-align:center">' + fmt1(s.hp) + ' / ' + U.fmt(max) + '</div>';
  }

  ui.screens.mine = {
    render() {
      const el = U.$('#screen-mine'), s = G.state.mine, Mn = M(), o = Mn.ore();
      let h = '<div class="panel"><div class="row" style="justify-content:space-between"><h2 style="margin:0">⛏️ Mine</h2><span class="muted small">Profondeur ' + s.depth + ' / ' + G.data.ores.length + '</span></div>' +
        '<div class="choices small">' + Mn.unlocked().map((x) => '<button class="pxbtn small ' + (x.id === s.sel ? 'sel' : '') + '" data-ore="' + x.id + '"><span class="ore-dot" style="background:' + x.a + '"></span>' + x.name + ' <b>' + U.fmt(s.ores[x.id] || 0) + '</b></button>').join('') + '</div>' +
        '<div class="rock-wrap"><button class="rock" id="mn-rock" aria-label="Miner"><img alt="" src="' + rockURL(o) + '"></button><div id="mn-fx"></div></div>' +
        '<div id="mn-hp">' + hpBar() + '</div>' +
        '<div class="stat-grid small" style="margin-top:6px"><div>Force <b>' + fmt1(Mn.power()) + '</b></div><div>Auto <b>' + fmt1(Mn.dps()) + '/s</b></div>' +
        '<div>Critique <b>' + Math.round(Mn.critChance() * 100) + ' % (×' + B.mine.critMult + ')</b></div><div>Rochers cassés <b>' + U.fmt(s.broken || 0) + '</b></div></div>' +
        '<p class="muted small" style="text-align:center;margin:6px 0 0">Tape sur le rocher ! Chaque rocher cassé donne 1 ' + o.name.toLowerCase() + '. Les mineurs continuent même quand l\'appli est fermée.</p></div>';

      // améliorations
      const ups = [['power', '💪 Force de la pioche', 'Dégâts par toucher ×1,6'], ['auto', '🤖 Mineurs automatiques', 'Minage automatique (+50 % de la force par seconde)'], ['crit', '💥 Coup critique', '+5 % de chance de frapper ×' + B.mine.critMult]];
      h += '<div class="panel"><h3>Améliorations</h3>';
      for (const [k, name, d] of ups) {
        const lvl = s[k], max = lvl >= B.mine.maxLevel[k], c = Mn.upCost(k);
        h += '<div class="row mine-up"><div style="flex:1"><b>' + name + '</b> <span class="muted small">niv. ' + lvl + '</span><div class="muted small">' + d + '</div></div>' +
          (max ? '<span class="tag">Max</span>' : '<button class="pxbtn small gold" data-up="' + k + '"' + (Mn.afford(c) ? '' : ' disabled') + '>' + Mn.costText(c) + '</button>') + '</div>';
      }
      const dc = Mn.depthCost();
      if (dc) { const nx = G.data.ores[s.depth]; h += '<div class="row mine-up"><div style="flex:1"><b>⬇️ Creuser plus profond</b><div class="muted small">Débloque le ' + nx.name.toLowerCase() + ' (équipement niv. ' + B.craft.ilvl(nx.tier) + ')</div></div><button class="pxbtn small gold" id="mn-dig"' + (Mn.afford(dc) ? '' : ' disabled') + '>' + Mn.costText(dc) + '</button></div>'; }
      h += '</div>';

      // atelier
      const owned = Mn.unlocked();
      if (!craftOre || !owned.some((x) => x.id === craftOre)) craftOre = owned[owned.length - 1].id;
      const cc = Mn.craftCost(craftBase, craftOre), co = Mn.ore(craftOre);
      const cats = { weapon: 'Armes', offhand: 'Main secondaire', armor: 'Armures', jewel: 'Accessoires' };
      let opts = '';
      for (const cat in cats) {
        opts += '<optgroup label="' + cats[cat] + '">' + Object.keys(G.data.itemBases).filter((k) => G.data.itemBases[k].cat === cat)
          .map((k) => '<option value="' + k + '"' + (k === craftBase ? ' selected' : '') + '>' + G.data.itemBases[k].name + '</option>').join('') + '</optgroup>';
      }
      h += '<div class="panel"><h3>🔨 Atelier</h3><p class="muted small">Fabrique un équipement avec tes minerais : plus le minerai est précieux, plus l\'objet est puissant et rare.</p>' +
        '<label class="lbl">Objet</label><select id="mn-base">' + opts + '</select>' +
        '<p class="muted small" style="margin:4px 0">Utilisable par : ' + G.sys.items.usersText({ base: craftBase }) + '</p>' +
        '<label class="lbl">Minerai</label><div class="choices small">' + owned.map((x) => '<button class="pxbtn small ' + (x.id === craftOre ? 'sel' : '') + '" data-co="' + x.id + '"><span class="ore-dot" style="background:' + x.a + '"></span>' + x.name + '</button>').join('') + '</div>' +
        '<p class="small">Résultat : <b>' + G.data.itemBases[craftBase].name + ' niv. ' + cc.ilvl + '</b>, rareté ' + G.data.rarities[G.data.rarityIndex[B.craft.minRarity(co.tier)]].name.toLowerCase() + ' ou mieux<br>Coût : ' + U.fmt(cc.gold) + ' or · ' + cc.ore.n + ' ' + co.name.toLowerCase() + ' (tu en as ' + U.fmt(s.ores[craftOre] || 0) + ')</p>' +
        '<button class="pxbtn primary wide" id="mn-craft"' + (Mn.canCraft(craftBase, craftOre) ? '' : ' disabled') + '>🔨 Fabriquer</button></div>';
      el.innerHTML = h; ui.fixTitles(el);

      const rer = () => this.render();
      el.querySelectorAll('[data-ore]').forEach((b) => (b.onclick = () => { Mn.select(b.dataset.ore); rer(); }));
      el.querySelectorAll('[data-up]').forEach((b) => (b.onclick = () => { if (Mn.upgrade(b.dataset.up) === 'ok') { ui.toast('⛏️ Amélioré !'); G.sys.audio && G.sys.audio.sfx('up'); } rer(); }));
      const dg = U.$('#mn-dig'); if (dg) dg.onclick = () => { if (Mn.dig() === 'ok') { ui.toast('⬇️ Nouveau filon : ' + Mn.ore().name, 'gold'); G.sys.audio && G.sys.audio.sfx('up'); } rer(); };
      U.$('#mn-base').onchange = (e) => { craftBase = e.target.value; rer(); };
      el.querySelectorAll('[data-co]').forEach((b) => (b.onclick = () => { craftOre = b.dataset.co; rer(); }));
      U.$('#mn-craft').onclick = () => {
        const r = Mn.craft(craftBase, craftOre);
        if (r && r.uid) { G.sys.audio && G.sys.audio.sfx('craft'); ui.itemDetail(r, { from: 'bag', onDone: rer }); }
        else ui.toast(r === 'full' ? 'Sac plein' : 'Pas assez de ressources', 'danger');
        rer();
      };
      // toucher le rocher (pointerdown : réactif, sans délai)
      const rock = U.$('#mn-rock'), fxBox = U.$('#mn-fx');
      rock.onpointerdown = (e) => {
        e.preventDefault();
        const r = Mn.tap();
        rock.classList.remove('hit'); void rock.offsetWidth; rock.classList.add('hit');
        const rect = rock.getBoundingClientRect(), wr = fxBox.getBoundingClientRect();
        const x = (e.clientX || rect.left + rect.width / 2) - wr.left, y = (e.clientY || rect.top + rect.height / 2) - wr.top;
        const n = U.el('div', 'mn-num' + (r.crit ? ' crit' : ''), (r.crit ? '💥' : '') + fmt1(r.dmg));
        n.style.left = x + 'px'; n.style.top = y + 'px'; fxBox.appendChild(n); setTimeout(() => n.remove(), 700);
        for (let k = 0; k < (r.crit ? 8 : 4); k++) {
          const c = U.el('i', 'mn-chip'); c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.background = Math.random() < 0.5 ? Mn.ore().a : '#6a6474';
          c.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); c.style.setProperty('--dy', (-Math.random() * 80 - 20) + 'px');
          fxBox.appendChild(c); setTimeout(() => c.remove(), 600);
        }
        if (r.got) { const g = U.el('div', 'mn-got', '+' + r.got + ' ' + Mn.ore().name.toLowerCase()); fxBox.appendChild(g); setTimeout(() => g.remove(), 900); this.refreshCounts(); }
        G.sys.audio && G.sys.audio.sfx(r.got ? 'break' : r.crit ? 'crit' : 'tink');
        if (r.crit || r.got) U.vibrate(r.got ? 30 : 12);
        U.$('#mn-hp').innerHTML = hpBar();
      };
    },
    // mise à jour légère (auto-minage) sans tout redessiner
    refreshCounts() {
      const s = G.state.mine;
      document.querySelectorAll('#screen-mine [data-ore] b').forEach((b) => { const id = b.parentNode.dataset.ore; b.textContent = U.fmt(s.ores[id] || 0); });
    },
    tick() {
      const hp = U.$('#mn-hp');
      if (hp) hp.innerHTML = hpBar();
      this.refreshCounts();
    },
  };
})();
