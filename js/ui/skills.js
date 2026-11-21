// =====================================================================
//  ARBRE DE COMPÉTENCES (dans l'onglet Équipe) + PRIORITÉS
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, K = G.sys.skills;
  const SK = () => G.data.skills;

  function nodeHtml(h, s) {
    const r = K.rank(h, s.id), lock = K.lockReason(h, s.id), can = K.canLearn(h, s.id);
    const cls = r >= s.maxRank ? 'max' : r > 0 ? 'learned' : lock ? 'locked' : 'open';
    return '<button class="snode ' + cls + (can ? ' can' : '') + (s.ult ? ' ult' : '') + (s.type === 'passive' ? ' passive' : '') + '" data-sk="' + s.id + '">' +
      '<span class="si">' + s.icon + '</span><span class="sr">' + r + '/' + s.maxRank + '</span><span class="sn">' + s.name + '</span></button>';
  }

  ui.skillTreeHtml = function (h) {
    const br = G.data.skillBranches[h.cls];
    let html = '<div class="panel"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px"><h3 style="flex:1;margin:0">Arbre de compétences</h3>' +
      '<span class="sp-badge' + (h.sp ? ' has' : '') + '">' + (h.sp || 0) + ' point' + ((h.sp || 0) > 1 ? 's' : '') + '</span></div>' +
      '<div class="tree">';
    for (const b of ['A', 'B']) {
      const nodes = K.forClass(h.cls).filter((s) => s.branch === b).sort((x, y) => x.row - y.row);
      html += '<div class="branch"><div class="bh">' + br[b].icon + ' ' + br[b].name + ' <small>(' + K.pointsIn(h, b) + ')</small></div>';
      nodes.forEach((s, i) => {
        if (i) html += '<div class="link' + (K.rank(h, nodes[i - 1].id) ? ' on' : '') + '"></div>';
        html += nodeHtml(h, s);
      });
      html += '</div>';
    }
    html += '</div><p class="muted small">Chaque rangée demande ' + G.data.skillRowCost + ' points de plus dans sa branche. ⭐ = compétence ultime. Les classes avancées (phase 6) ajouteront des branches.</p>' +
      '<div class="row" style="gap:6px"><button class="pxbtn small primary" style="flex:1" id="sk-auto"' + (h.sp ? '' : ' disabled') + '>Répartir auto</button>' +
      '<button class="pxbtn small danger" style="flex:1" id="sk-reset"' + (K.spent(h) ? '' : ' disabled') + '>Réinitialiser · ' + U.fmt(K.respecCost(h)) + ' or</button></div>' +
      '<label class="toggle"><span>Répartir automatiquement les points de tous les héros à chaque niveau</span><input type="checkbox" id="sk-autoall"></label></div>';

    // priorités
    const list = K.activeList(h);
    html += '<div class="panel"><h3>Priorités</h3>';
    if (!list.length) html += '<p class="muted">Aucune compétence active apprise.</p>';
    else html += '<p class="muted small">Le héros essaie ses compétences dans cet ordre, quand leur condition est remplie.</p>';
    list.forEach((id, i) => {
      const s = SK()[id], rule = K.ruleOf(h, id);
      const modes = K.modesFor(s);
      let val = '';
      if (rule.mode === 'enemies') val = '<select data-rv="' + id + '">' + [2, 3, 4, 5].map((v) => '<option value="' + v + '"' + (rule.value === v ? ' selected' : '') + '>' + v + ' ennemis</option>').join('') + '</select>';
      else if (['allyHp', 'teamHp', 'selfHp', 'targetHp'].indexOf(rule.mode) >= 0) val = '<select data-rv="' + id + '">' + [0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((v) => '<option value="' + v + '"' + (Math.abs((rule.value || 0) - v) < 0.001 ? ' selected' : '') + '>' + v * 100 + ' %</option>').join('') + '</select>';
      html += '<div class="prio"><div class="row"><span class="pn2">' + (i + 1) + '.</span><span class="si">' + s.icon + '</span><b style="flex:1">' + s.name + '</b>' +
        (i ? '<button class="pxbtn small" data-pu="' + id + '">▲</button>' : '') + '</div>' +
        '<div class="muted small">' + (s.cd ? 'Recharge ' + s.cd + ' s · ' : '') + K.manaCost({ stats: G.sys.stats.hero(h), level: h.level }, s) + ' mana</div>' +
        '<div class="row" style="gap:6px"><select data-rm="' + id + '" style="flex:2">' + modes.map((m) => '<option value="' + m + '"' + (rule.mode === m ? ' selected' : '') + '>' + K.MODES[m] + '</option>').join('') + '</select>' +
        (val ? '<span style="flex:1">' + val + '</span>' : '') + '</div></div>';
    });
    html += '</div>';
    return html;
  };

  function setRule(h, id, mode, value) {
    h.skillRules = h.skillRules || {};
    const def = SK()[id].rule;
    if (value == null) value = mode === 'enemies' ? 2 : ['allyHp', 'teamHp', 'selfHp', 'targetHp'].indexOf(mode) >= 0 ? (def.mode === mode ? def.value : 0.5) : undefined;
    h.skillRules[id] = { mode, value };
    G.sys.run.refreshStats && G.sys.run.refreshStats();
    G.core.save.save();
  }

  ui.bindSkillTree = function (root, h, rer) {
    root.querySelectorAll('[data-sk]').forEach((b) => (b.onclick = () => ui.skillDetail(h, b.dataset.sk, rer)));
    const a = root.querySelector('#sk-auto');
    if (a) a.onclick = () => { const n = K.autoSpend(h); ui.toast(n + ' point(s) répartis'); rer(); };
    const r = root.querySelector('#sk-reset');
    if (r) r.onclick = () => ui.confirm('Réinitialiser l\'arbre ?', '<p>Tous les points de ' + U.esc(h.name) + ' sont rendus, pour ' + U.fmt(K.respecCost(h)) + ' or.</p>', 'Réinitialiser', () => { if (!K.respec(h)) ui.toast('Pas assez d\'or', 'danger'); rer(); });
    const aa = root.querySelector('#sk-autoall');
    if (aa) { aa.checked = !!G.state.settings.autoSkills; aa.onchange = () => { G.state.settings.autoSkills = aa.checked; if (aa.checked) G.state.heroes.forEach((x) => K.autoSpend(x)); G.core.save.save(); rer(); }; }
    root.querySelectorAll('[data-pu]').forEach((b) => (b.onclick = () => { K.moveUp(h, b.dataset.pu); G.sys.run.refreshStats && G.sys.run.refreshStats(); rer(); }));
    root.querySelectorAll('[data-rm]').forEach((sel) => (sel.onchange = () => { setRule(h, sel.dataset.rm, sel.value); rer(); }));
    root.querySelectorAll('[data-rv]').forEach((sel) => (sel.onchange = () => { setRule(h, sel.dataset.rv, K.ruleOf(h, sel.dataset.rv).mode, +sel.value); }));
  };

  ui.skillDetail = function (h, id, rer) {
    const s = SK()[id], r = K.rank(h, id), lock = K.lockReason(h, id);
    const typ = s.ult ? 'Ultime' : s.type === 'active' ? 'Compétence active' : 'Passif';
    let html = '<div class="item-head"><span class="sbig">' + s.icon + '</span><div><div class="iname sk">' + s.name + '</div><div class="muted small">' + typ + ' · ' +
      G.data.skillBranches[s.cls][s.branch].name + ' · rang ' + r + '/' + s.maxRank + '</div></div></div>';
    if (s.type === 'active') html += '<p class="small">⏱ Recharge ' + s.cd + ' s · 💧 ' + K.manaCost({ stats: G.sys.stats.hero(h), level: h.level }, s) + ' mana' + (s.element && s.element !== 'physical' ? ' · ' + G.data.elements[s.element].icon + ' ' + G.data.elements[s.element].name : '') + '</p>';
    if (s.innate) html += '<p class="small" style="color:var(--green)">🎁 Compétence de départ : le rang 1 est offert.</p>';
    if (r) html += '<p><b>Actuel :</b> ' + s.desc(r) + '</p>';
    if (r < s.maxRank) html += '<p><b>' + (r ? 'Rang suivant' : 'Rang 1') + ' :</b> ' + s.desc(r + 1) + '</p>';
    if (lock && r < s.maxRank) html += '<p class="neg small">🔒 ' + lock + '</p>';
    if (s.type === 'active') html += '<p class="muted small">Règle : ' + K.MODES[K.ruleOf(h, id).mode] + ' (modifiable dans Priorités)</p>';
    const btns = [];
    if (r < s.maxRank) btns.push({ label: 'Apprendre · 1 point (' + (h.sp || 0) + ' dispo.)', cls: 'primary', onClick: () => { if (!K.learn(h, id)) ui.toast(lock || 'Pas de point disponible', 'danger'); else ui.toast(s.icon + ' ' + s.name + ' rang ' + K.rank(h, id)); rer(); } });
    btns.push({ label: 'Fermer' });
    ui.modal({ html, buttons: btns, dismissable: true });
  };
})();
