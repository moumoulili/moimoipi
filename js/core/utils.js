// Petites fonctions utilitaires partagées.
(function () {
  const U = {};
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  U.pct = (v) => Math.round(v * 100) + ' %';

  // Format court des grands nombres : 1 234 -> 1,23 k
  const SUFFIX = ['', 'k', 'M', 'Md', 'T', 'Qa', 'Qi'];
  U.fmt = function (n) {
    n = Math.floor(n || 0);
    if (Math.abs(n) < 10000) return String(n);
    let i = 0, v = n;
    while (Math.abs(v) >= 1000 && i < SUFFIX.length - 1) { v /= 1000; i++; }
    if (Math.abs(v) >= 1000) return n.toExponential(2);
    return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)).replace('.', ',') + ' ' + SUFFIX[i];
  };

  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  U.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.vibrate = function (pattern) {
    if (G.state && G.state.settings.vibrate && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  };
  G.core.U = U;
})();
