// =====================================================================
//  INTERFACE : onglets, fenêtres, notifications, journal, bannière.
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui;
  ui.screens = {}; // chaque écran s'enregistre ici : { render() }
  ui.tabs = [
    { id: 'dungeon', label: 'Donjon', icon: '⚔️' },
    { id: 'team', label: 'Équipe', icon: '🛡️' },
    { id: 'bag', label: 'Sac', icon: '🎒' },
    { id: 'town', label: 'Ville', icon: '🏰' },
    { id: 'settings', label: 'Options', icon: '⚙️' },
  ];
  ui.current = 'dungeon';

  ui.buildTabs = function () {
    const nav = U.$('#tabs');
    nav.innerHTML = '';
    for (const t of ui.tabs) {
      const b = U.el('button', t.locked ? 'locked' : '', '<span class="ti">' + t.icon + '</span>' + t.label);
      b.dataset.tab = t.id;
      b.onclick = () => ui.show(t.id);
      nav.appendChild(b);
    }
  };
  ui.show = function (id) {
    ui.current = id;
    const tab = ui.tabs.find((t) => t.id === id);
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === id));
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    if (tab && tab.locked) {
      const s = U.$('#screen-locked');
      s.innerHTML = '<div class="panel"><h2>' + tab.icon + ' ' + tab.label + '</h2><p class="muted">' + tab.locked + '</p></div>';
      s.classList.add('active');
      return;
    }
    const scr = U.$('#screen-' + id);
    scr.classList.add('active');
    if (ui.screens[id] && ui.screens[id].render) ui.screens[id].render();
    if (id === 'dungeon') requestAnimationFrame(G.render.resize);
  };
  ui.refresh = function () { if (ui.screens[ui.current] && ui.screens[ui.current].render) ui.screens[ui.current].render(); };

  // ---------- Fenêtre modale ----------
  // opts : { title, html, buttons: [{label, cls, onClick}], countdown: {seconds, label, onEnd} }
  ui.modal = function (opts) {
    const root = U.$('#modal-root');
    const back = U.el('div', 'modal-back');
    const box = U.el('div', 'modal');
    box.innerHTML = (opts.title ? '<h2>' + opts.title + '</h2>' : '') + (opts.html || '');
    const btns = U.el('div', 'btns');
    let timer = null;
    const close = () => { if (timer) clearInterval(timer); back.remove(); };
    for (const b of opts.buttons || [{ label: 'OK' }]) {
      const e = U.el('button', 'pxbtn wide ' + (b.cls || ''), b.label);
      e.onclick = () => { close(); b.onClick && b.onClick(); };
      btns.appendChild(e);
    }
    box.appendChild(btns);
    if (opts.countdown) {
      let left = opts.countdown.seconds;
      const cd = U.el('div', 'countdown');
      const upd = () => (cd.textContent = opts.countdown.label.replace('{s}', left));
      upd();
      box.appendChild(cd);
      timer = setInterval(() => {
        left--;
        if (left <= 0) { close(); opts.countdown.onEnd(); } else upd();
      }, 1000);
    }
    const wrap = U.el('div', 'scroll-wrap');
    wrap.appendChild(U.el('div', 'roll'));
    wrap.appendChild(box);
    wrap.appendChild(U.el('div', 'roll'));
    back.appendChild(wrap);
    root.appendChild(back);
    back.onclick = (e) => { if (e.target === back && opts.dismissable) close(); };
    close.box = box;
    return close;
  };
  // bouton commun "Optimiser l'équipe"
  ui.optimizeBtnHtml = (id) => '<button class="pxbtn epic wide optimize" id="' + id + '">✨ Optimiser l\'équipement de l\'équipe</button>';
  ui.bindOptimize = function (id, after) {
    const b = document.getElementById(id);
    if (!b) return;
    b.onclick = () => {
      const r = G.sys.inventory.optimizeTeam();
      if (r.changes) {
        ui.toast('✨ ' + r.changes + ' changement(s) · puissance +' + Math.round(r.gain * 1000) / 10 + ' %', 'gold');
        G.render.fx && G.sys.run.active && G.sys.run.active.heroes.forEach((h) => !h.dead && G.render.fx.sparkle(h.x, h.y, '#ffd34d', 8));
      } else ui.toast('L\'équipement est déjà optimal');
      after && after();
    };
  };
  ui.confirm = function (title, html, okLabel, onOk, cls) {
    ui.modal({ title, html, buttons: [{ label: okLabel, cls: cls || 'danger', onClick: onOk }, { label: 'Annuler' }] });
  };

  // ---------- Notifications ----------
  ui.toast = function (msg, cls) {
    const box = U.$('#toasts');
    while (box.children.length >= 3) box.firstChild.remove();
    const t = U.el('div', 'toast ' + (cls || ''), msg);
    box.appendChild(t);
    setTimeout(() => t.remove(), 2900);
  };

  // ---------- Journal ----------
  const logs = [];
  let logDirty = true;
  ui.log = function (text, cls) {
    if (text && text.html) logs.push({ html: text.html, cls: cls || '' });
    else logs.push({ html: U.esc(text), cls: cls || '' });
    if (logs.length > 40) logs.shift();
    logDirty = true;
  };
  ui.renderLog = function () {
    if (!logDirty) return;
    logDirty = false;
    const el = U.$('#log');
    el.innerHTML = logs.map((l) => '<div class="' + l.cls + '">' + l.html + '</div>').join('');
    if (el.classList.contains('expanded')) el.scrollTop = el.scrollHeight;
  };

  // ---------- Bannière ----------
  ui.banner = function (title, sub, cls) {
    const b = U.$('#banner');
    b.className = '';
    b.innerHTML = '<div class="b-title">' + U.esc(title) + '</div>' + (sub ? '<div class="b-sub">' + U.esc(sub) + '</div>' : '');
    void b.offsetWidth; // relance l'animation
    b.className = 'show ' + (cls || '');
  };
})();
