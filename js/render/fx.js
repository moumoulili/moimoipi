// =====================================================================
//  EFFETS VISUELS : chiffres de dégâts, particules, pièces, arcs de lame,
//  anneaux d'impact, rayons, éclats de pixels, flash et tremblement.
//  Tout est en coordonnées de cases. Les effets "glow" sont dessinés en
//  mode lumineux après l'obscurité : ils brillent dans le noir.
// =====================================================================
(function () {
  const fx = { drops: [], texts: [], parts: [], arcs: [], rings: [], beams: [], shakeT: 0, fadeT: 0, fadeMax: 0, flashT: 0, flashMax: 0, flashCol: '#fff' };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const MAXP = 600;
  function part(p) { if (fx.parts.length >= MAXP) fx.parts.shift(); p.t = 0; fx.parts.push(p); }

  fx.text = function (x, y, txt, color, size, life, rise) {
    if (fx.texts.length > 60) fx.texts.shift();
    fx.texts.push({ x: x + rnd(-0.15, 0.15), y, txt, color, size: size || 1, t: 0, life: life || (size > 1 ? 1.1 : 0.9), rise: rise == null ? 0.9 : rise });
  };
  fx.burst = function (x, y, color, n, vyBias, glow) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(1, 3.5);
      part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + (vyBias || 0), color, life: rnd(0.3, 0.7), g: vyBias ? 0 : 4, glow });
    }
  };
  fx.coins = function (x, y, amount) {
    const n = Math.min(10, 2 + Math.floor(Math.log10(amount + 1) * 2));
    for (let i = 0; i < n; i++) part({ x, y, vx: rnd(-1.6, 1.6), vy: rnd(-4, -2), color: i % 3 ? '#ffd34d' : '#fff3a8', life: 0.8, g: 9, size: 2, bounce: y + 0.25 });
    fx.text(x, y - 0.9, '+' + G.core.U.fmt(amount), '#ffd34d', 1);
  };
  // arc de lame (coup de corps à corps)
  fx.slash = function (x, y, dir, color, big) { fx.arcs.push({ x, y, dir, color: color || '#ffffff', t: 0, life: 0.18, r: big ? 0.75 : 0.55 }); };
  // anneau qui s'agrandit (impact, onde)
  fx.ring = function (x, y, color, r, life, inward) { fx.rings.push({ x, y, color, r: r || 0.8, t: 0, life: life || 0.3, inward }); };
  // rayon entre deux points (soin, éclair)
  fx.beam = function (x0, y0, x1, y1, color, life, zigzag) { fx.beams.push({ x0, y0, x1, y1, color, t: 0, life: life || 0.25, zig: zigzag, seed: Math.random() * 100 }); };
  // traînée derrière un projectile
  fx.trail = function (x, y, color, size) { part({ x: x + rnd(-0.05, 0.05), y: y + rnd(-0.05, 0.05), vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), color, life: rnd(0.15, 0.3), g: 0, glow: true, size: size || 1 }); };
  // étincelles qui montent (soin, bénédiction)
  fx.sparkle = function (x, y, color, n) { for (let i = 0; i < n; i++) part({ x: x + rnd(-0.35, 0.35), y: y + rnd(-0.2, 0.3), vx: 0, vy: rnd(-1.8, -0.8), color, life: rnd(0.4, 0.8), g: 0, glow: true, twinkle: true }); };
  // la silhouette d'un monstre éclate en pixels
  const pixCache = new WeakMap();
  fx.shatter = function (x, y, img, scale, flipped) {
    let px = pixCache.get(img);
    if (!px) {
      px = [];
      const d = img.getContext('2d').getImageData(0, 0, img.width, img.height).data;
      for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
        const k = (j * img.width + i) * 4;
        if (d[k + 3] > 0) px.push([i, j, 'rgb(' + d[k] + ',' + d[k + 1] + ',' + d[k + 2] + ')']);
      }
      pixCache.set(img, px);
    }
    const T = 16, sc = scale || 1, w = img.width, h = img.height;
    for (const [i, j, c] of px) {
      if (Math.random() < 0.35) continue;
      const lx = ((flipped ? w - 1 - i : i) - w / 2) * sc / T, ly = (j - h + 4) * sc / T;
      const a = Math.atan2(ly + 0.3, lx);
      part({ x: x + lx, y: y + ly, vx: Math.cos(a) * rnd(0.8, 3) + rnd(-0.5, 0.5), vy: Math.sin(a) * rnd(0.8, 3) - rnd(0.5, 2), color: c, life: rnd(0.4, 0.9), g: 7, size: sc > 1.2 ? 2 : 1, bounce: y + 0.25 });
    }
  };

  // ---------- Impacts par élément ----------
  const EL = {
    physical: { c1: '#ffffff', c2: '#c9d1dc' },
    arcane: { c1: '#c78bff', c2: '#f0d8ff' },
    fire: { c1: '#ff7a33', c2: '#ffe14d' },
    ice: { c1: '#7fd8ff', c2: '#ffffff' },
    lightning: { c1: '#ffe14d', c2: '#ffffff' },
    earth: { c1: '#b58a4c', c2: '#7a5a30' },
    shadow: { c1: '#a46bff', c2: '#3a1a6a' },
    light: { c1: '#fff3a8', c2: '#ffffff' },
    heal: { c1: '#6dff8a', c2: '#d8ffe0' },
  };
  fx.colorOf = (el) => (EL[el] || EL.physical).c1;
  fx.impact = function (x, y, el, big) {
    const e = EL[el] || EL.physical, m = big ? 1.6 : 1;
    fx.ring(x, y, e.c1, 0.6 * m, 0.28);
    switch (el) {
      case 'fire':
        fx.burst(x, y, e.c1, 8 * m, 0, true);
        for (let i = 0; i < 6 * m; i++) part({ x: x + rnd(-0.3, 0.3), y, vx: rnd(-0.4, 0.4), vy: rnd(-2.2, -1), color: Math.random() < 0.5 ? e.c1 : e.c2, life: rnd(0.4, 0.8), g: 0, glow: true });
        break;
      case 'ice':
        for (let i = 0; i < 8 * m; i++) part({ x, y, vx: rnd(-2.5, 2.5), vy: rnd(-3, 0), color: i % 2 ? e.c1 : e.c2, life: rnd(0.4, 0.7), g: 8, size: 2, bounce: y + 0.25 });
        break;
      case 'lightning':
        fx.beam(x, y - 2.2, x + rnd(-0.3, 0.3), y, e.c1, 0.16, true);
        fx.burst(x, y, e.c2, 6 * m, 0, true);
        fx.flash('#fff8c0', 0.05);
        break;
      case 'earth':
        for (let i = 0; i < 8 * m; i++) part({ x, y, vx: rnd(-2, 2), vy: rnd(-3.5, -1), color: i % 2 ? e.c1 : e.c2, life: 0.7, g: 10, size: 2, bounce: y + 0.25 });
        break;
      case 'shadow':
        fx.ring(x, y, e.c1, 0.9 * m, 0.35, true);
        fx.burst(x, y, e.c1, 6 * m, -0.5, true);
        break;
      case 'light':
        fx.ring(x, y, e.c2, 0.4 * m, 0.2);
        fx.sparkle(x, y, e.c1, 6 * m);
        break;
      default:
        fx.burst(x, y, e.c1, 5 * m, 0, true);
    }
  };
  // éclat au départ d'un tir / sort
  fx.muzzle = function (x, y, el) { const e = EL[el] || EL.physical; fx.ring(x, y, e.c1, 0.35, 0.15); fx.burst(x, y, e.c2, 3, 0, true); };

  // objet tombé (affiché ~1,6 s puis ramassé)
  fx.loot = function (x, y, item) {
    if (fx.drops.length > 12) fx.drops.shift();
    fx.drops.push({ x, y, item, t: 0, life: 1.6 });
    const ri = G.data.rarityIndex[item.rarity];
    if (ri >= 2) fx.sparkle(x, y, G.data.rarities[ri].color, 4 + ri * 3);
  };
  fx.shake = function (t) { fx.shakeT = Math.max(fx.shakeT, t); };
  fx.flash = function (color, t) { if (G.state && G.state.settings.flashes === false) return; fx.flashCol = color; fx.flashT = fx.flashMax = t; };
  fx.fade = function (t) { fx.fadeT = t; fx.fadeMax = t; };
  fx.clear = function () { fx.drops.length = 0; fx.texts.length = 0; fx.parts.length = 0; fx.arcs.length = 0; fx.rings.length = 0; fx.beams.length = 0; };

  fx.update = function (dt) {
    for (const t of fx.texts) { t.t += dt; t.y -= dt * t.rise; }
    fx.texts = fx.texts.filter((t) => t.t < t.life);
    for (const p of fx.parts) {
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.96;
      if (p.bounce && p.y > p.bounce && p.vy > 0) { p.y = p.bounce; p.vy *= -0.35; p.vx *= 0.6; }
    }
    fx.parts = fx.parts.filter((p) => p.t < p.life);
    for (const list of [fx.arcs, fx.rings, fx.beams, fx.drops]) for (const a of list) a.t += dt;
    fx.drops = fx.drops.filter((d) => d.t < d.life);
    fx.arcs = fx.arcs.filter((a) => a.t < a.life);
    fx.rings = fx.rings.filter((a) => a.t < a.life);
    fx.beams = fx.beams.filter((a) => a.t < a.life);
  };
  G.render.fx = fx;
})();
