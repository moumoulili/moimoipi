// =====================================================================
//  SPRITES : transforme les modèles pixel art en images (mises en cache).
//  Remplacement par de vrais sprites : ajouter dans G.render.spriteFiles
//  { 'warrior': 'assets/sprites/warrior.png' } et l'image sera utilisée
//  à la place du dessin généré.
// =====================================================================
(function () {
  const OUTLINE = '#120c18';
  const cache = {};
  const files = {}; // id -> Image chargée
  G.render.spriteFiles = G.render.spriteFiles || {};

  // couleurs par défaut si la palette ne les précise pas
  const DEF = { s: '#f1c59a', e: '#1a1020', w: '#e8e0c8', m: '#c9d1dc', l: '#8a5a2b', c: '#e3b341', b: '#5a4a6a', h: '#6a4a2a', a: '#8a8a9a' };
  function hexToRgb(hx) {
    if (!hx || hx[0] !== '#') return null;
    if (hx.length === 4) hx = '#' + hx[1] + hx[1] + hx[2] + hx[2] + hx[3] + hx[3];
    const n = parseInt(hx.slice(1, 7), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  const rgb = (c) => 'rgb(' + c.map((v) => Math.max(0, Math.min(255, Math.round(v)))).join(',') + ')';
  const mul = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  const lighten = (c, f) => [c[0] + (255 - c[0]) * f, c[1] + (255 - c[1]) * f, c[2] + (255 - c[2]) * f];
  // minuscule = couleur de base, MAJUSCULE = ombre ; ombrage automatique pour les sprites 16 px
  function build(rows, pal, outline) {
    const h = rows.length, w = Math.max.apply(null, rows.map((r) => r.length));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    const at = (i, j) => (j >= 0 && j < h && rows[j][i]) || '.';
    const shadeOn = w >= 16;
    for (let j = 0; j < h; j++) {
      const row = rows[j];
      for (let i = 0; i < w; i++) {
        const ch = row[i];
        if (!ch || ch === '.') continue;
        if (ch === 'o') { x.fillStyle = pal.o || outline || OUTLINE; x.fillRect(i, j, 1, 1); continue; }
        const low = ch.toLowerCase(), dark = ch !== low;
        const base = pal[low] || DEF[low] || '#ff00ff';
        let col = hexToRgb(base);
        if (!col) { x.fillStyle = base; x.fillRect(i, j, 1, 1); continue; }
        if (dark) col = mul(col, 0.68);
        if (shadeOn) {
          const up = at(i, j - 1), dn = at(i, j + 1);
          if (up === '.' || up === 'o') col = lighten(col, 0.18);
          else if (dn === '.' || dn === 'o') col = mul(col, 0.85);
        }
        x.fillStyle = rgb(col);
        x.fillRect(i, j, 1, 1);
      }
    }
    return c;
  }
  // version miroir
  function flip(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
  }
  // silhouette blanche (flash quand on est touché)
  function white(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
    return c;
  }

  // Renvoie {img, flip, white, whiteFlip} pour un sprite {tpl, pal}
  G.render.getSprite = function (spr, outline) {
    const key = (spr.id && files[spr.id] ? spr.id : '') + spr.tpl + '|' + JSON.stringify(spr.pal || {}) + '|' + (outline || '');
    if (cache[key]) return cache[key];
    let base;
    if (spr.id && files[spr.id]) base = files[spr.id];
    else {
      const rows = G.render.templates[spr.tpl];
      if (!rows) throw new Error('Modèle pixel art inconnu : ' + spr.tpl);
      base = build(rows, spr.pal || {}, outline);
    }
    const s = { img: base, flip: flip(base), white: white(base) };
    s.whiteFlip = flip(s.white);
    cache[key] = s;
    return s;
  };
  G.render.decorSprite = function (name) {
    return G.render.getSprite({ tpl: name, pal: G.render.decorPalettes[name] || {} });
  };
  // Image (dataURL) agrandie pour l'interface (portraits)
  const urlCache = {};
  G.render.spriteURL = function (spr, scale) {
    scale = scale || 4;
    const key = JSON.stringify(spr) + scale;
    if (urlCache[key]) return urlCache[key];
    const s = G.render.getSprite(spr);
    const c = document.createElement('canvas');
    c.width = s.img.width * scale; c.height = s.img.height * scale;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(s.img, 0, 0, c.width, c.height);
    return (urlCache[key] = c.toDataURL());
  };
  // Charge les vrais sprites déclarés (s'il y en a)
  G.render.loadSpriteFiles = function () {
    const list = Object.keys(G.render.spriteFiles);
    return Promise.all(list.map((id) => new Promise((res) => {
      const im = new Image();
      im.onload = () => { files[id] = im; res(); };
      im.onerror = () => res();
      im.src = G.render.spriteFiles[id];
    })));
  };
})();
