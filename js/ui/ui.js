// =====================================================================
//  INTERFACE : onglets, fenêtres, notifications, journal, bannière.
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui;
  ui.screens = {}; // chaque écran s'enregistre ici : { render() }
  ui.tabs = [
    { id: 'dungeon', label: 'Donjon', icon: '⚔️' },
    { id: 'town', label: 'Ville', icon: '🏰' },
    { id: 'team', label: 'Équipe', icon: '🛡️', locked: 'L\'écran d\'équipe (recrutement, niveaux, classes) arrive en phase 3.' },
    { id: 'bag', label: 'Sac', icon: '🎒', locked: 'L\'inventaire et l\'équipement arrivent en phase 2.' },
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
    back.appendChild(box);
    root.appendChild(back);
    return close;
  };
  ui.confirm = function (title, html, okLabel, onOk, cls) {
    ui.modal({ title, html, buttons: [{ label: okLabel, cls: cls || 'danger', onClick: onOk }, { label: 'Annuler' }] });
  };

  // ---------- Notifications ----------
  ui.toast = function (msg, cls) {
    const t = U.el('div', 'toast ' + (cls || ''), msg);
    U.$('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 2900);
  };

  // ---------- Journal ----------
  const logs = [];
  let logDirty = true;
  ui.log = function (text, cls) {
    logs.push({ text, cls: cls || '' });
    if (logs.length > 40) logs.shift();
    logDirty = true;
  };
  ui.renderLog = function () {
    if (!logDirty) return;
    logDirty = false;
    const el = U.$('#log');
    el.innerHTML = logs.map((l) => '<div class="' + l.cls + '">' + U.esc(l.text) + '</div>').join('');
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
