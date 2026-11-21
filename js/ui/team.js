// =====================================================================
//  ÉCRAN ÉQUIPE : composition (équipe + réserve), synergies, et pour le
//  héros sélectionné : niveau/XP, stats détaillées et équipement.
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, IT = G.sys.items, INV = G.sys.inventory, TV = G.sys.tavern, B = G.data.balance;
  let selId = null, view = 'equip';
  const pct = (v) => Math.round(v * 1000) / 10 + ' %';

  ui.xpBarHtml = function (h) {
    const max = h.level >= B.levelCap;
    const need = G.sys.xp.toNext(h);
    return '<div class="bar xp"><i style="width:' + (max ? 100 : Math.min(100, (h.xp / need) * 100)) + '%"></i></div>' +
      '<div class="muted small">' + (max ? 'Niveau maximum' : 'XP ' + U.fmt(h.xp) + ' / ' + U.fmt(need)) + '</div>';
  };
  ui.qualityTag = function (h) {
    const q = TV.quality(h.quality);
    return h.quality && h.quality !== 'common' ? '<span class="tag" style="color:' + q.color + ';border-color:' + q.color + '">' + q.name + '</span>' : '';
  };

  function compositionHtml() {
    const st = G.state, run = !!G.sys.run.active;
    let h = '<div class="panel"><h3>Composition ' + st.team.length + ' / ' + TV.teamSize() + '</h3>';
    if (run) h += '<p class="muted small">⚠ Composition modifiable seulement au camp (hors expédition).</p>';
    const order = G.sys.heroes.team().concat(G.sys.heroes.bench());
    for (const hero of order) {
      const c = G.data.classes[hero.cls], idx = st.team.indexOf(hero.id), inTeam = idx >= 0;
      h += '<div class="hero-line comp ' + (inTeam ? '' : 'bench') + '"><img alt="" src="' + G.render.spriteURL(c.sprite, 4) + '"><div class="info">' +
        '<b>' + (inTeam ? '<span class="pos-badge">' + (idx + 1) + '</span> ' : '') + U.esc(hero.name) + '</b> <span class="muted small">niv. ' + hero.level + '</span><br>' +
        '<span class="tag">' + c.name + '</span><span class="tag">' + G.data.roles[c.role] + '</span>' + ui.qualityTag(hero) + '</div><div class="comp-btns">' +
        (inTeam ? (idx > 0 ? '<button class="pxbtn small" data-up="' + hero.id + '"' + (run ? ' disabled' : '') + '>▲</button>' : '') +
          '<button class="pxbtn small danger" data-tog="' + hero.id + '"' + (run || st.team.length <= 1 ? ' disabled' : '') + '>Retirer</button>'
          : '<button class="pxbtn small primary" data-tog="' + hero.id + '"' + (run || st.team.length >= TV.teamSize() ? ' disabled' : '') + '>Ajouter</button>') +
        '</div></div>';
    }
    h += '<p class="muted small">Le n°1 mène l\'équipe dans le donjon. Les héros en réserve reçoivent ' + Math.round(B.benchXp * 100) + ' % de l\'XP.</p>' +
      '<button class="pxbtn wide gold" id="tm-tavern">🍺 Taverne : recruter (' + st.heroes.length + ' / ' + TV.rosterMax() + ')</button></div>';
    return h;
  }
  function synergiesHtml() {
    const act = G.sys.synergy.active();
    const list = G.data.synergies.slice().sort((a, b) => (act.indexOf(b) >= 0) - (act.indexOf(a) >= 0));
    return '<div class="panel"><h3>Synergies ' + act.length + ' active' + (act.length > 1 ? 's' : '') + '</h3><div class="syn-list">' +
      list.map((s) => '<div class="syn ' + (act.indexOf(s) >= 0 ? 'on' : '') + '"><span class="syn-i">' + s.icon + '</span><div><b>' + s.name + '</b>' + (act.indexOf(s) >= 0 ? ' <span class="pos">✓</span>' : '') + '<div class="small">' + s.desc + '</div></div></div>').join('') +
      '</div></div>';
  }

  ui.screens.team = {
    render() {
      const el = U.$('#screen-team');
      const roster = G.sys.heroes.team().concat(G.sys.heroes.bench());
      if (!roster.find((h) => h.id === selId)) selId = roster[0].id;
      const hero = G.sys.heroes.get(selId), c = G.data.classes[hero.cls], s = G.sys.stats.hero(hero);
      const inTeam = G.state.team.indexOf(hero.id) >= 0;
      let h = ui.optimizeBtnHtml('tm-opt') + '<div class="hero-tabs">' + roster.map((t) => '<button class="htab ' + (t.id === selId ? 'sel ' : '') + (G.state.team.indexOf(t.id) < 0 ? 'bench' : '') + '" data-h="' + t.id + '"><img alt="" src="' + G.render.spriteURL(G.data.classes[t.cls].sprite, 3) + '"><span>' + U.esc(t.name) + '</span><small>niv. ' + t.level + '</small></button>').join('') + '</div>';
      const magic = c.attack.dmgType === 'magic';
      let extra = '';
      const add = (n, v) => (extra += '<div>' + n + ' <b>' + v + '</b></div>');
      if (s.healMult > 1) add('Soins', '+' + pct(s.healMult - 1));
      if (s.lifesteal) add('Vol de vie', pct(s.lifesteal));
      if (s.thorns) add('Épines', pct(s.thorns));
      if (s.echo) add('Double frappe', pct(s.echo));
      if (s.bossDmg) add('Contre gardiens', '+' + pct(s.bossDmg));
      if (s.onKillHeal) add('Soin par victime', pct(s.onKillHeal));
      if (s.goldFind) add('Or trouvé', '+' + pct(s.goldFind));
      if (s.magicFind) add('Chance de butin', '+' + pct(s.magicFind));
      for (const e in s.elemDmg) add(G.data.elements[e].icon + ' Dégâts ' + G.data.elements[e].name.toLowerCase(), Math.round(s.elemDmg[e]));
      for (const e in s.res) add(G.data.elements[e].icon + ' Résist. ' + G.data.elements[e].name.toLowerCase(), pct(s.res[e]));
      h += '<div class="panel"><div class="row"><img alt="" class="portrait" src="' + G.render.spriteURL(c.sprite, 5) + '"><div style="flex:1;min-width:0"><h2 style="margin:0">' + U.esc(hero.name) + '</h2>' +
        '<span class="tag">' + c.name + '</span><span class="tag">' + G.data.roles[c.role] + '</span>' + ui.qualityTag(hero) + (inTeam ? '' : '<span class="tag">Réserve</span>') +
        '<div style="margin-top:6px"><b>Niveau ' + hero.level + '</b>' + (hero.sp ? ' <span class="small" style="color:var(--gold)">· ' + hero.sp + ' point(s) de compétence</span>' : '') + ui.xpBarHtml(hero) + '</div></div></div>' +
        '<div class="stat-grid" style="margin-top:8px">' +
        '<div>PV <b>' + U.fmt(s.maxHp) + '</b></div><div>Mana <b>' + U.fmt(s.maxMp) + '</b></div><div>' + (magic ? 'Puissance mag.' : 'Attaque') + ' <b>' + Math.round(magic ? s.matk : s.atk) + '</b></div>' +
        '<div>Défense <b>' + Math.round(s.def) + '</b></div><div>Vitesse <b>' + Math.round(s.spd) + '</b></div>' +
        '<div>Force <b>' + Math.round(s.str) + '</b></div><div>Agilité <b>' + Math.round(s.agi) + '</b></div>' +
        '<div>Intelligence <b>' + Math.round(s.int) + '</b></div><div>Critique <b>' + pct(s.crit) + '</b></div>' +
        '<div>Dégâts crit. <b>' + pct(s.critDmg) + '</b></div><div>Esquive <b>' + pct(s.dodge) + '</b></div>' +
        '<div>Vit. d\'attaque <b>' + (s.wspd * (1 + s.atkSpd) >= 1 ? '+' : '') + pct(s.wspd * (1 + s.atkSpd) - 1) + '</b></div>' +
        (s.dmgMult > 1 ? '<div>Dégâts <b>+' + pct(s.dmgMult - 1) + '</b></div>' : '') + extra +
        '</div><p class="muted small" style="margin:8px 0 0">' + c.desc + '<br>Armes : ' + G.data.classGear[hero.cls].weapons.map((w) => G.data.itemBases[w].name).join(', ') +
        ' · Armures : ' + G.data.classGear[hero.cls].armor.map((w) => ({ heavy: 'lourdes', medium: 'moyennes', light: 'légères' }[w])).join(', ') + '</p>' +
        (!inTeam ? '<button class="pxbtn small danger" id="tm-dismiss"' + (TV.canDismiss(hero) ? '' : ' disabled') + '>Renvoyer ce héros</button>' : '') + '</div>';

      h += '<div class="subtabs"><button class="pxbtn small ' + (view === 'equip' ? 'sel' : '') + '" data-v="equip">🛡️ Équipement</button>' +
        '<button class="pxbtn small ' + (view === 'skills' ? 'sel' : '') + '" data-v="skills">✨ Compétences' + (hero.sp ? ' <span class="dot">' + hero.sp + '</span>' : '') + '</button></div>';
      if (view === 'skills') h += ui.skillTreeHtml(hero);
      else {
      h += '<div class="panel"><h3>Équipement</h3><div class="equip-grid">';
      for (const slot of G.data.slotOrder) {
        const it = hero.equip[slot];
        const sd = G.data.slots[slot];
        if (it) {
          const r = IT.rarity(it.rarity);
          h += '<button class="eslot" data-slot="' + slot + '" style="--rc:' + r.color + '"><img alt="" src="' + G.render.itemIconURL(it, 3) + '"><span class="es-n" style="color:' + r.color + '">' + U.esc(it.name) + '</span><span class="es-s">' + sd.short + ' · niv. ' + it.ilvl + '</span></button>';
        } else {
          const n = G.state.inventory.filter((x) => IT.base(x).slot === (sd.accepts || slot) && IT.canUse(hero, x)).length;
          h += '<button class="eslot empty" data-slot="' + slot + '"><span class="es-e">+</span><span class="es-n">' + sd.short + '</span><span class="es-s">' + (n ? n + ' dispo.' : 'vide') + '</span></button>';
        }
      }
      h += '</div><div class="row" style="margin-top:10px"><button class="pxbtn primary" style="flex:1" id="tm-auto">⚡ Équiper le meilleur</button></div></div>';
      }
      h += compositionHtml() + synergiesHtml();
      el.innerHTML = h;

      const rer = () => this.render();
      el.querySelectorAll('[data-h]').forEach((b) => (b.onclick = () => { selId = b.dataset.h; rer(); }));
      el.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => {
        const slot = b.dataset.slot, it = hero.equip[slot];
        if (it) ui.itemDetail(it, { from: 'equipped', hero, slot, onDone: rer });
        else ui.slotPicker(hero, slot, rer);
      }));
      ui.bindOptimize('tm-opt', rer);
      el.querySelectorAll('[data-v]').forEach((b) => (b.onclick = () => { view = b.dataset.v; rer(); }));
      if (view === 'skills') ui.bindSkillTree(el, hero, rer);
      else U.$('#tm-auto').onclick = () => { const n = INV.autoEquip(hero); ui.toast(n ? n + ' objet(s) équipé(s)' : 'Déjà le meilleur équipement du sac'); rer(); };
      el.querySelectorAll('[data-tog]').forEach((b) => (b.onclick = () => {
        const r = TV.toggle(b.dataset.tog);
        if (r === 'max') ui.toast('Équipe complète (' + TV.teamSize() + ' max)', 'danger');
        ui.invalidateHud(); rer();
      }));
      el.querySelectorAll('[data-up]').forEach((b) => (b.onclick = () => { TV.moveUp(b.dataset.up); ui.invalidateHud(); rer(); }));
      U.$('#tm-tavern').onclick = () => ui.tavernModal(rer);
      const dm = U.$('#tm-dismiss');
      if (dm) dm.onclick = () => ui.confirm('Renvoyer ' + U.esc(hero.name) + ' ?', '<p>Le héros quitte définitivement ta compagnie. Son équipement retourne dans le sac.</p>', 'Renvoyer', () => { TV.dismiss(hero.id); selId = null; rer(); });
    },
  };

  // ---------- Taverne (fenêtre) ----------
  ui.tavernHtml = function () {
    const st = G.state, list = TV.recruits();
    const mins = Math.max(0, Math.ceil((st.tavern.refreshAt - Date.now()) / 60000));
    let h = '<p class="muted small">Compagnie : ' + st.heroes.length + ' / ' + TV.rosterMax() + ' aventuriers · nouvelles recrues dans ' + mins + ' min</p>';
    if (!list.length) h += '<p class="muted">Plus personne à la taverne pour l\'instant.</p>';
    for (const r of list) {
      const c = G.data.classes[r.cls], q = TV.quality(r.quality), p = TV.price(r);
      const s = G.sys.stats.hero({ cls: r.cls, level: r.level, quality: r.quality, equip: {} });
      h += '<div class="recruit" style="--rc:' + q.color + '"><img alt="" src="' + G.render.spriteURL(c.sprite, 4) + '"><div class="info">' +
        '<b>' + U.esc(r.name) + '</b> <span class="muted small">niv. ' + r.level + '</span><br><span class="tag">' + c.name + '</span><span class="tag">' + G.data.roles[c.role] + '</span>' +
        '<span class="tag" style="color:' + q.color + ';border-color:' + q.color + '">' + q.name + (q.growth > 1 ? ' +' + Math.round((q.growth - 1) * 100) + ' %' : '') + '</span>' +
        '<div class="muted small">PV ' + s.maxHp + ' · ' + (c.attack.dmgType === 'magic' ? 'Puiss. ' + Math.round(s.matk) : 'Att. ' + Math.round(s.atk)) + ' · Déf. ' + Math.round(s.def) + '</div></div>' +
        '<button class="pxbtn small gold" data-hire="' + r.rid + '"' + (st.gold < p || st.heroes.length >= TV.rosterMax() ? ' disabled' : '') + '>' + U.fmt(p) + '</button></div>';
    }
    h += '<button class="pxbtn small wide" id="tv-refresh"' + (st.gold < TV.refreshCost() ? ' disabled' : '') + '>Nouvelles recrues · ' + U.fmt(TV.refreshCost()) + ' or</button>' +
      '<p class="muted small">Qualité : <span style="color:#4a9fff">Doué</span> et <span style="color:#ff9a2e">Héroïque</span> gagnent plus de stats à chaque niveau.</p>';
    return h;
  };
  ui.bindTavern = function (root, after) {
    root.querySelectorAll('[data-hire]').forEach((b) => (b.onclick = () => {
      const r = TV.hire(b.dataset.hire);
      if (r === 'ok') { ui.toast('🍺 Nouvelle recrue !', 'gold'); ui.invalidateHud(); }
      else ui.toast(r === 'full' ? 'Compagnie complète : renvoie quelqu\'un' : 'Pas assez d\'or', 'danger');
      after && after();
    }));
    const rf = root.querySelector('#tv-refresh');
    if (rf) rf.onclick = () => { if (TV.paidRefresh()) ui.toast('Nouvelles têtes à la taverne'); after && after(); };
  };
  ui.tavernModal = function (after) {
    const close = ui.modal({ title: '🍺 Taverne', html: '<div id="tv-box">' + ui.tavernHtml() + '</div>', buttons: [{ label: 'Fermer', onClick: after }], dismissable: true });
    const box = close.box.querySelector('#tv-box');
    const re = () => { box.innerHTML = ui.tavernHtml(); ui.bindTavern(box, re); };
    ui.bindTavern(box, re);
  };
})();
