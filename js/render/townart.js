// =====================================================================
//  VILLE EN PIXEL ART : décor (herbe, chemins, place, arbres) et
//  bâtiments dessinés en code (32x32), affichés agrandis et nets.
// =====================================================================
(function () {
  const O = '#1a1020';
  const cache = {};
  function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // rectangle avec contour sombre
  function box(x, X, y, w, h, col) { x.fillStyle = O; x.fillRect(X - 1, y - 1, w + 2, h + 2); x.fillStyle = col; x.fillRect(X, y, w, h); }
  function px(x, X, Y, col) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); }
  // toit en escalier (triangle pixelisé)
  function roof(x, top, baseY, col, dark, cx, halfMax) {
    cx = cx || 16; halfMax = halfMax || 15;
    const rows = baseY - top;
    for (let r = 0; r <= rows; r++) {
      const half = Math.round(1 + (r / rows) * (halfMax - 1));
      x.fillStyle = O; x.fillRect(cx - half - 1, top + r, half * 2 + 2, 1);
      x.fillStyle = r % 3 === 2 ? dark : col; x.fillRect(cx - half, top + r, half * 2, 1);
    }
    x.fillStyle = O; x.fillRect(cx - halfMax - 1, baseY + 1, halfMax * 2 + 2, 1);
  }
  function window2(x, X, Y, lit) { box(x, X, Y, 5, 5, lit || '#ffe8a0'); px(x, X + 2, Y, O); px(x, X + 2, Y + 1, O); px(x, X + 2, Y + 2, O); px(x, X + 2, Y + 3, O); px(x, X + 2, Y + 4, O); x.fillStyle = O; x.fillRect(X, Y + 2, 5, 1); }
  function door(x, X, Y, w, h, col) { box(x, X, Y, w, h, col || '#5a3a1a'); px(x, X + w - 2, Y + (h >> 1), '#e3b341'); }
  function walls(x, col, shade) { box(x, 4, 15, 24, 15, col); x.fillStyle = shade; x.fillRect(4, 28, 24, 2); }

  const DRAW = {
    tavern(x) {
      walls(x, '#b88a5a', '#8a6040');
      x.fillStyle = '#9a7048'; for (let y = 17; y < 28; y += 3) x.fillRect(4, y, 24, 1);
      roof(x, 3, 14, '#a4443a', '#7a2a22');
      window2(x, 6, 18); door(x, 13, 21, 6, 9);
      box(x, 22, 18, 5, 4, '#ffe8a0');
      x.fillStyle = '#5a3a1a'; x.fillRect(29, 12, 1, 8); x.fillRect(25, 12, 5, 1);
      box(x, 24, 14, 6, 5, '#e3b341'); px(x, 26, 15, '#fff3c0'); px(x, 26, 16, '#8a5a1a'); px(x, 27, 16, '#8a5a1a');
    },
    shop(x) {
      walls(x, '#e8dcc0', '#c0b090');
      roof(x, 3, 13, '#3d6fd1', '#2a4fa0');
      for (let i = 0; i < 13; i++) { x.fillStyle = i % 2 ? '#ffffff' : '#d0383a'; x.fillRect(3 + i * 2, 14, 2, 3); }
      x.fillStyle = O; x.fillRect(3, 17, 26, 1);
      window2(x, 6, 19); window2(x, 21, 19); door(x, 13, 21, 6, 9, '#6a4a24');
      box(x, 0, 25, 4, 5, '#a0703c'); box(x, 28, 26, 4, 4, '#a0703c');
    },
    forge(x) {
      box(x, 21, 1, 5, 10, '#6a6474');
      walls(x, '#8a8494', '#6a6474');
      x.fillStyle = '#6a6474'; for (let y = 17; y < 28; y += 3) for (let i = (y % 2 ? 4 : 7); i < 28; i += 6) x.fillRect(i, y, 1, 3);
      roof(x, 5, 14, '#3a3644', '#24202c');
      window2(x, 6, 18, '#ff9a3b'); door(x, 14, 21, 7, 9, '#3a2a1a');
      box(x, 23, 25, 6, 2, '#4a4552'); box(x, 25, 27, 2, 3, '#4a4552');
    },
    temple(x) {
      walls(x, '#f0ead8', '#c8c0a8');
      roof(x, 6, 14, '#4a7ad0', '#2f58a8');
      box(x, 12, 3, 8, 12, '#f0ead8'); roof(x, 0, 4, '#4a7ad0', '#2f58a8', 16, 5);
      x.fillStyle = '#e3b341'; x.fillRect(15, 6, 2, 6); x.fillRect(13, 8, 6, 2);
      window2(x, 6, 18, '#bfefff'); window2(x, 21, 18, '#bfefff');
      box(x, 13, 21, 6, 9, '#8a5a2b'); x.fillStyle = O; x.fillRect(16, 21, 1, 9);
    },
    library(x) {
      walls(x, '#c8b8a0', '#a09078');
      roof(x, 3, 14, '#6a3fb5', '#4a2a85');
      box(x, 14, 8, 4, 4, '#7fd8ff');
      window2(x, 6, 18, '#ffe8a0'); window2(x, 21, 18, '#ffe8a0'); door(x, 13, 21, 6, 9, '#4a2a6a');
      [['#c0392b', 0], ['#3d6fd1', 1], ['#5ad65a', 2]].forEach(([c, i]) => box(x, 0, 27 - i * 2, 4, 1, c));
    },
    warehouse(x) {
      box(x, 3, 13, 26, 17, '#a4343a'); x.fillStyle = '#7a2028'; x.fillRect(3, 28, 26, 2);
      x.fillStyle = '#8a2a30'; for (let i = 5; i < 29; i += 3) x.fillRect(i, 13, 1, 15);
      roof(x, 4, 12, '#6a4a2a', '#4a3018');
      box(x, 10, 18, 12, 12, '#8a5a2b');
      x.fillStyle = '#e8dcc0'; for (let k = 0; k < 12; k++) { x.fillRect(10 + k, 18 + k, 1, 1); x.fillRect(21 - k, 18 + k, 1, 1); }
      x.fillStyle = O; x.fillRect(16, 18, 1, 12);
    },
    camp(x) {
      for (let r = 0; r < 22; r++) { const half = Math.round(1 + r * 0.62); x.fillStyle = O; x.fillRect(12 - half - 1, 8 + r, half * 2 + 2, 1); x.fillStyle = r % 4 === 3 ? '#3f6a2a' : '#5a8a3a'; x.fillRect(12 - half, 8 + r, half * 2, 1); }
      x.fillStyle = '#1a2a12'; for (let r = 0; r < 9; r++) x.fillRect(12 - Math.round(r * 0.4), 21 + r, Math.round(r * 0.8) + 1, 1);
      x.fillStyle = '#5a3a1a'; x.fillRect(22, 28, 8, 2);
      x.fillStyle = '#ff7a33'; x.fillRect(24, 23, 4, 5); x.fillStyle = '#ffe14d'; x.fillRect(25, 25, 2, 3);
    },
    portal(x) {
      box(x, 3, 8, 6, 22, '#8a8494'); box(x, 23, 8, 6, 22, '#8a8494'); box(x, 3, 3, 26, 6, '#9a94a4');
      x.fillStyle = '#6a6474'; for (let y = 11; y < 30; y += 4) { x.fillRect(3, y, 6, 1); x.fillRect(23, y, 6, 1); }
      box(x, 10, 10, 12, 20, '#5a2aa0');
      x.fillStyle = '#9a5af0'; for (let k = 0; k < 9; k++) { const a = k * 0.9, r = 1 + k * 0.6; x.fillRect(Math.round(16 + Math.cos(a) * r), Math.round(20 + Math.sin(a) * r * 1.4), 1, 1); }
      x.fillStyle = '#e0c8ff'; x.fillRect(15, 19, 2, 2);
      x.fillStyle = '#e3b341'; x.fillRect(15, 4, 2, 2);
    },
    mine(x) {
      for (let r = 0; r < 20; r++) { const half = Math.round(6 + r * 0.55); x.fillStyle = O; x.fillRect(16 - half - 1, 10 + r, half * 2 + 2, 1); x.fillStyle = (r * 7 % 5) ? '#7a6a5a' : '#5a4a3e'; x.fillRect(16 - half, 10 + r, half * 2, 1); }
      x.fillStyle = O; x.fillRect(10, 15, 12, 15);
      x.fillStyle = '#8a5a2b'; x.fillRect(9, 14, 2, 16); x.fillRect(21, 14, 2, 16); x.fillRect(9, 13, 14, 2);
      box(x, 1, 25, 7, 4, '#6a6474'); px(x, 2, 29, O); px(x, 6, 29, O);
      px(x, 3, 24, '#d8803a'); px(x, 5, 24, '#5ad0e0');
    },
  };
  G.render.buildingURL = function (kind) {
    if (cache[kind]) return cache[kind];
    const c = cv(32, 32), x = c.getContext('2d');
    DRAW[kind](x);
    return (cache[kind] = c.toDataURL());
  };

  // décor : W x H pixels
  G.render.townScene = { W: 144, H: 212 };
  G.render.townSceneURL = function () {
    if (cache.scene) return cache.scene;
    const { W, H } = G.render.townScene, c = cv(W, H), x = c.getContext('2d');
    const rng = new G.core.RNG(1234);
    x.fillStyle = '#4a7a3a'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) { x.fillStyle = rng.pick(['#3f6a32', '#5a8a46', '#467436']); x.fillRect(rng.int(0, W), rng.int(0, H), 1, 1); }
    const path = (X, Y, w, h) => { x.fillStyle = '#8a6a40'; x.fillRect(X - 1, Y - 1, w + 2, h + 2); x.fillStyle = '#a88a5a'; x.fillRect(X, Y, w, h); };
    path(66, 36, 12, H - 36);        // allée principale
    path(20, 108, 104, 12);          // rue transversale
    path(22, 66, 8, 44); path(114, 66, 8, 44);   // vers taverne / boutique
    path(22, 118, 8, 22); path(114, 118, 8, 22); // vers forge / entrepôt
    path(22, 170, 46, 8); path(76, 170, 46, 8);  // vers mine / camp
    path(22, 50, 46, 8); path(76, 50, 46, 8);    // vers temple / bibliothèque
    for (let i = 0; i < 160; i++) { x.fillStyle = rng.pick(['#9a7a4a', '#b89a6a']); const X = rng.int(20, 124), Y = rng.int(36, H); const id = x.getImageData(X, Y, 1, 1).data; if (id[0] > 140) x.fillRect(X, Y, 1, 1); }
    // place pavée + fontaine
    for (let j = -16; j <= 16; j++) for (let i = -20; i <= 20; i++) if ((i * i) / 400 + (j * j) / 256 <= 1) { x.fillStyle = (i + j * 3) % 4 ? '#9a9488' : '#7a746a'; x.fillRect(72 + i, 114 + j, 1, 1); }
    const f = G.render.getSprite({ tpl: 'fountain', pal: { m: '#8a8494', w: '#bfefff', b: '#4a9fff' } });
    x.drawImage(f.img, 66, 104);
    // arbres
    // arbre au feuillage arrondi
    const tree = (X, Y) => {
      const rows = [4, 8, 10, 10, 10, 10, 8, 4];
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(X, Y + 11, 10, 2);
      x.fillStyle = O; x.fillRect(X + 3, Y + 7, 4, 6); x.fillStyle = '#6a4424'; x.fillRect(X + 4, Y + 7, 2, 5);
      rows.forEach((w, r) => { const x0 = X + ((10 - w) >> 1); x.fillStyle = O; x.fillRect(x0 - 1, Y + r - 1, w + 2, 3); });
      rows.forEach((w, r) => { const x0 = X + ((10 - w) >> 1); x.fillStyle = r < 2 ? '#5a9a3a' : r < 5 ? '#3f7a2e' : '#2f5a24'; x.fillRect(x0, Y + r, w, 1); });
      x.fillStyle = '#7ab84a'; x.fillRect(X + 3, Y + 1, 2, 1); x.fillRect(X + 2, Y + 2, 1, 1);
      x.fillStyle = '#2a4a1e'; x.fillRect(X + 6, Y + 5, 2, 1);
    };
    [[2, 4], [40, 2], [94, 2], [134, 4], [2, 96], [136, 98], [44, 150], [92, 150], [2, 200], [134, 202], [42, 194], [94, 196]].forEach(([X, Y]) => tree(X, Y));
    for (let i = 0; i < 40; i++) { x.fillStyle = rng.pick(['#ff7aa0', '#ffe14d', '#ffffff', '#c78bff']); const X = rng.int(2, W - 3), Y = rng.int(2, H - 3), id = x.getImageData(X, Y, 1, 1).data; if (id[1] > 100 && id[0] < 110) x.fillRect(X, Y, 1, 1); }
    return (cache.scene = c.toDataURL());
  };
  // positions des bâtiments dans le décor (coin haut-gauche, en pixels)
  G.render.townLayout = {
    portal: [56, 4], temple: [6, 34], library: [106, 34], tavern: [10, 76], shop: [102, 76],
    forge: [10, 130], warehouse: [102, 130], mine: [8, 168], camp: [104, 168],
  };
})();
