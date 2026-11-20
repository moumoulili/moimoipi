// =====================================================================
//  EFFETS VISUELS : chiffres de dégâts, particules, pièces, coups,
//  tremblement d'écran, fondu. Tout est en coordonnées de cases.
// =====================================================================
(function () {
  const fx = { texts: [], parts: [], slashes: [], shakeT: 0, fadeT: 0, fadeMax: 0 };
  fx.text = function (x, y, txt, color, size) {
    if (fx.texts.length > 60) fx.texts.shift();
    fx.texts.push({ x: x + (Math.random() - 0.5) * 0.3, y, txt, color, size: size || 1, t: 0, life: 0.9 });
  };
  fx.burst = function (x, y, color, n, vyBias) {
    for (let i = 0; i < n; i++) {
      if (fx.parts.length > 300) fx.parts.shift();
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5;
      fx.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + (vyBias || 0), color, t: 0, life: 0.35 + Math.random() * 0.35, g: vyBias ? 0 : 4 });
    }
  };
  fx.coins = function (x, y, amount) {
    const n = Math.min(8, 2 + Math.floor(Math.log10(amount + 1) * 2));
    for (let i = 0; i < n; i++) fx.parts.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 2, color: '#ffd34d', t: 0, life: 0.7, g: 9, coin: true });
    fx.text(x, y - 0.9, '+' + G.core.U.fmt(amount), '#ffd34d', 1);
  };
  fx.slash = function (x, y, dir) { fx.slashes.push({ x, y, dir, t: 0, life: 0.15 }); };
  fx.shake = function (t) { fx.shakeT = Math.max(fx.shakeT, t); };
  fx.fade = function (t) { fx.fadeT = t; fx.fadeMax = t; };
  fx.clear = function () { fx.texts.length = 0; fx.parts.length = 0; fx.slashes.length = 0; };

  fx.update = function (dt) {
    for (const t of fx.texts) { t.t += dt; t.y -= dt * 0.9; }
    fx.texts = fx.texts.filter((t) => t.t < t.life);
    for (const p of fx.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96; }
    fx.parts = fx.parts.filter((p) => p.t < p.life);
    for (const s of fx.slashes) s.t += dt;
    fx.slashes = fx.slashes.filter((s) => s.t < s.life);
  };
  G.render.fx = fx;
})();
