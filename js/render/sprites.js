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

  function build(rows, pal, outline) {
    const h = rows.length, w = rows[0].length;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    for (let j = 0; j < h; j++) {
      const row = rows[j];
      for (let i = 0; i < w; i++) {
        const ch = row[i];
        if (!ch || ch === '.') continue;
        const col = ch === 'o' ? (pal.o || outline || OUTLINE) : pal[ch] || '#ff00ff';
        x.fillStyle = col;
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
