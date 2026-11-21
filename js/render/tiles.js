// =====================================================================
//  TUILES : textures de sol et de murs en pixel art, générées selon la
//  palette du biome, puis dessin de toute la carte de l'étage dans une
//  image (pré-rendu) pour que l'affichage soit rapide.
//  Détails : dalles biseautées, pavés dans les couloirs, ombres au pied
//  des murs, briques en relief, bord lumineux du dessus des murs,
//  décorations murales (bannières, chaînes, grilles, veines…), tapis et
//  mosaïques dans les salles, détails de sol propres à chaque biome.
// =====================================================================
(function () {
  const T = 16; // taille d'une case en pixels
  G.render.TILE = T;

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  // ---------- couleurs ----------
  const rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, f) => { const [r, g, b] = rgb(h); return f >= 1 ? hex(r + (255 - r) * (f - 1), g + (255 - g) * (f - 1), b + (255 - b) * (f - 1)) : hex(r * f, g * f, b * f); };
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };

  // détails propres à chaque biome : décalcomanies au sol, décor mural, couleur des tapis
  const STYLE = {
    crypt: { decals: ['crack', 'bone', 'stain'], wall: ['niche', 'chain', 'cobweb', 'banner'], rug: '#5a1f2a', glow: null },
    forest: { decals: ['moss', 'grass', 'leaf'], wall: ['vines', 'vines', 'moss'], rug: '#3d5a2a', glow: null },
    caves: { decals: ['pebble', 'puddle', 'crack'], wall: ['vein', 'crack', 'grate'], rug: '#4a4a6a', glow: '#7fd8ff' },
    volcano: { decals: ['lava', 'crack', 'ash'], wall: ['lava', 'chain', 'grate'], rug: '#6a2418', glow: '#ff7a33' },
    ice: { decals: ['frost', 'crack', 'frost'], wall: ['icicle', 'vein', 'crack'], rug: '#3a5a7a', glow: '#bfeaff' },
    abyss: { decals: ['rune', 'crack', 'stain'], wall: ['rune', 'chain', 'banner'], rug: '#3a1d55', glow: '#c06aff' },
    celestial: { decals: ['inlay', 'inlay', 'crack'], wall: ['gold', 'banner', 'gold'], rug: '#7a5a1a', glow: '#ffe9a0' },
  };

  // ---------- sol des salles : dalles biseautées ----------
  function stone(x, px, py, w, h, base, f, rng) {
    x.fillStyle = base; x.fillRect(px, py, w, h);
    x.fillStyle = shade(base, 1.12); x.fillRect(px, py, w, 1); x.fillRect(px, py, 1, h);
    x.fillStyle = shade(base, 0.8); x.fillRect(px, py + h - 1, w, 1); x.fillRect(px + w - 1, py, 1, h);
    for (let i = 0; i < Math.max(1, (w * h) / 22); i++) { x.fillStyle = rng.pick([f[1], f[3], shade(base, 1.06)]); x.fillRect(px + rng.int(1, w - 2), py + rng.int(1, h - 2), 1, 1); }
  }
  function floorTile(pal, rng, variant) {
    const c = canvas(T, T), x = c.getContext('2d');
    const f = pal.floor;
    x.fillStyle = shade(f[3], 0.85); x.fillRect(0, 0, T, T); // joints
    const pick = () => rng.pick([f[0], f[0], f[1], f[2]]);
    const layout = variant % 4;
    if (layout === 0) { for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) stone(x, bx * 8, by * 8, 7, 7, pick(), f, rng); }
    else if (layout === 1) { stone(x, 0, 0, 15, 7, pick(), f, rng); stone(x, 0, 8, 7, 7, pick(), f, rng); stone(x, 8, 8, 7, 7, pick(), f, rng); }
    else if (layout === 2) { stone(x, 0, 0, 7, 15, pick(), f, rng); stone(x, 8, 0, 7, 7, pick(), f, rng); stone(x, 8, 8, 7, 7, pick(), f, rng); }
    else stone(x, 0, 0, 15, 15, pick(), f, rng);
    if (variant >= 4) { // fissure
      x.fillStyle = shade(f[3], 0.7);
      let px = rng.int(3, 12), py = rng.int(1, 5);
      for (let i = 0; i < 8; i++) { x.fillRect(px, py, 1, 1); px += rng.int(-1, 1); py += 1; }
    }
    return c;
  }
  // ---------- couloirs : petits pavés ----------
  function cobbleTile(pal, rng) {
    const c = canvas(T, T), x = c.getContext('2d');
    const f = pal.floor;
    x.fillStyle = shade(f[3], 0.75); x.fillRect(0, 0, T, T);
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 2 : 0;
      for (let k = -1; k < 4; k++) {
        const px = k * 5 + off, w = 4;
        const base = shade(rng.pick([f[0], f[1], f[3]]), 0.92);
        x.fillStyle = base; x.fillRect(px, row * 4, w, 3);
        x.fillStyle = shade(base, 1.14); x.fillRect(px, row * 4, w, 1);
        x.fillStyle = shade(base, 0.78); x.fillRect(px, row * 4 + 2, w, 1);
      }
    }
    return c;
  }
  // ---------- murs vus de face (briques en relief) ----------
  function wallFace(pal, rng, variant) {
    const c = canvas(T, T), x = c.getContext('2d');
    x.fillStyle = pal.mortar; x.fillRect(0, 0, T, T);
    for (let row = 0; row < 3; row++) {
      const off = row % 2 ? 4 : 0;
      for (let bx = -1; bx < 3; bx++) {
        const px = bx * 8 + off, py = 1 + row * 4;
        const base = rng.pick(pal.wallFace);
        x.fillStyle = base; x.fillRect(px + 1, py, 7, 3);
        x.fillStyle = shade(base, 1.18); x.fillRect(px + 1, py, 7, 1);
        x.fillStyle = shade(base, 0.78); x.fillRect(px + 1, py + 2, 7, 1); x.fillRect(px + 7, py, 1, 3);
        if (rng.chance(0.25)) { x.fillStyle = shade(base, 0.88); x.fillRect(px + rng.int(2, 6), py + 1, 1, 1); }
      }
    }
    // arête supérieure éclairée
    x.fillStyle = shade(pal.wallFace[0], 1.3); x.fillRect(0, 0, T, 1);
    // plinthe au pied du mur
    x.fillStyle = shade(pal.mortar, 0.8); x.fillRect(0, 13, T, 3);
    x.fillStyle = shade(pal.wallFace[1], 0.9); x.fillRect(0, 13, T, 1);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, 15, T, 1);
    if (variant === 2) { // fissure
      x.fillStyle = 'rgba(0,0,0,0.45)';
      let px = rng.int(4, 11), py = 1;
      for (let i = 0; i < 9; i++) { x.fillRect(px, py, 1, 1); px += rng.int(-1, 1); py++; }
    }
    return c;
  }
  // ---------- dessus des murs : pierre sombre texturée ----------
  function wallTop(pal, rng) {
    const c = canvas(T, T), x = c.getContext('2d');
    x.fillStyle = pal.wallTop; x.fillRect(0, 0, T, T);
    for (let i = 0; i < 10; i++) { x.fillStyle = rng.chance(0.5) ? shade(pal.wallTop, 1.25) : shade(pal.wallTop, 0.7); x.fillRect(rng.int(0, 15), rng.int(0, 15), rng.int(1, 2), 1); }
    return c;
  }

  // ---------- décorations murales (sur les faces de mur) ----------
  function wallDecor(x, kind, px, py, pal, accent, rng) {
    const P = (c, i, j, w, h) => { x.fillStyle = c; x.fillRect(px + i, py + j, w || 1, h || 1); };
    if (kind === 'banner') {
      const a = accent; P('#3a2a1a', 3, 1, 10, 1); P('#c9a24a', 3, 1, 1, 1); P('#c9a24a', 12, 1, 1, 1);
      P(a, 4, 2, 8, 9); P(shade(a, 1.25), 4, 2, 1, 9); P(shade(a, 0.7), 11, 2, 1, 9);
      P(a, 4, 11, 3, 2); P(a, 9, 11, 3, 2); P(shade(a, 0.7), 7, 11, 2, 1);
      P('#e3c46a', 7, 4, 2, 1); P('#e3c46a', 6, 5, 4, 2); P('#e3c46a', 7, 7, 2, 2); // emblème
    } else if (kind === 'chain') {
      for (let j = 1; j < 12; j += 2) { P('#6a6a74', 7, j, 2, 1); P('#9a9aa4', 7, j + 1, 1, 1); }
      P('#4a4a54', 6, 12, 4, 1); P('#8a8a94', 6, 11, 1, 1); P('#8a8a94', 9, 11, 1, 1);
    } else if (kind === 'grate') {
      P('#141218', 4, 3, 8, 8); for (let i = 0; i < 4; i++) P('#5a5a64', 4 + i * 2, 3, 1, 8);
      P('#7a7a84', 4, 3, 8, 1); P('#3a3a44', 4, 10, 8, 1);
    } else if (kind === 'niche') {
      P('#0e0b12', 4, 3, 8, 8); P(shade(pal.wallFace[0], 1.2), 4, 2, 8, 1);
      P('#d8d0bc', 6, 5, 4, 3); P('#d8d0bc', 7, 8, 2, 1); P('#1a1020', 6, 6, 1, 1); P('#1a1020', 9, 6, 1, 1);
      P('#a8a08c', 6, 10, 4, 1);
    } else if (kind === 'cobweb') {
      x.strokeStyle = 'rgba(230,230,240,0.45)'; x.lineWidth = 1; x.beginPath();
      x.moveTo(px + 0.5, py + 1.5); x.lineTo(px + 8.5, py + 1.5); x.moveTo(px + 0.5, py + 1.5); x.lineTo(px + 0.5, py + 9.5);
      x.moveTo(px + 0.5, py + 1.5); x.lineTo(px + 6.5, py + 7.5); x.moveTo(px + 4.5, py + 1.5); x.lineTo(px + 0.5, py + 5.5); x.moveTo(px + 7.5, py + 1.5); x.lineTo(px + 0.5, py + 8.5);
      x.stroke();
    } else if (kind === 'vines' || kind === 'moss') {
      const g1 = '#4f8a3a', g2 = '#2e5a24';
      for (let k = 0; k < (kind === 'vines' ? 3 : 5); k++) {
        const i = rng.int(1, 14), len = kind === 'vines' ? rng.int(5, 12) : rng.int(1, 3);
        for (let j = 0; j < len; j++) P(j % 3 ? g1 : g2, i + (j % 4 === 3 ? 1 : 0), j, 1, 1);
        if (kind === 'vines') P('#7ac25a', i + 1, rng.int(2, len), 1, 1);
      }
    } else if (kind === 'vein' || kind === 'lava' || kind === 'rune' || kind === 'gold') {
      const col = kind === 'lava' ? '#ff7a33' : kind === 'rune' ? '#c06aff' : kind === 'gold' ? '#e3c46a' : '#7fd8ff';
      if (kind === 'rune') { P(col, 6, 3, 4, 1); P(col, 7, 4, 1, 5); P(col, 5, 6, 6, 1); P(col, 6, 9, 4, 1); P(shade(col, 1.4), 7, 6, 1, 1); }
      else if (kind === 'gold') { P(col, 0, 2, 16, 1); P(shade(col, 0.7), 0, 3, 16, 1); P(col, 7, 5, 2, 6); P(shade(col, 1.3), 7, 5, 1, 1); }
      else { let i = rng.int(2, 12), j = 1; for (let k = 0; k < 10; k++) { P(col, i, j); if (k % 3 === 0) P(shade(col, 1.4), i, j); i += rng.int(-1, 1); j++; if (j > 12) break; } }
    } else if (kind === 'icicle') {
      for (let k = 0; k < 4; k++) { const i = rng.int(1, 14), len = rng.int(2, 5); for (let j = 0; j < len; j++) P(j < len - 1 ? '#cfefff' : '#ffffff', i, 12 + j - len + 1, j < len - 2 ? 2 : 1, 1); }
    } else if (kind === 'crack') {
      x.fillStyle = 'rgba(0,0,0,0.5)'; let i = rng.int(4, 11); for (let j = 1; j < 13; j++) { x.fillRect(px + i, py + j, 1, 1); i += rng.int(-1, 1); }
    }
  }

  // ---------- détails au sol ----------
  function floorDecal(x, kind, px, py, pal, rng) {
    const P = (c, i, j, w, h) => { x.fillStyle = c; x.fillRect(px + i, py + j, w || 1, h || 1); };
    const i0 = rng.int(2, 9), j0 = rng.int(2, 9);
    if (kind === 'crack') { x.fillStyle = 'rgba(0,0,0,0.45)'; let i = i0, j = j0; for (let k = 0; k < 7; k++) { x.fillRect(px + i, py + j, 1, 1); i += rng.int(0, 1); j += rng.int(0, 1) || (i === i0 ? 1 : 0); } }
    else if (kind === 'bone') { P('#d8d0bc', i0, j0, 4, 1); P('#d8d0bc', i0 - 1, j0 - 1, 1, 1); P('#d8d0bc', i0 - 1, j0 + 1, 1, 1); P('#d8d0bc', i0 + 4, j0 - 1, 1, 1); P('#d8d0bc', i0 + 4, j0 + 1, 1, 1); P('#9a9282', i0, j0 + 1, 4, 1); }
    else if (kind === 'stain') { x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(px + i0, py + j0, 5, 3); x.fillRect(px + i0 + 1, py + j0 - 1, 3, 5); }
    else if (kind === 'moss') { for (let k = 0; k < 7; k++) P(rng.pick(['#3f6a2e', '#4f8a3a', '#2e5a24']), i0 + rng.int(-2, 3), j0 + rng.int(-2, 3), rng.int(1, 2), 1); }
    else if (kind === 'grass') { for (let k = 0; k < 3; k++) { const i = i0 + k * 2; P('#4f8a3a', i, j0, 1, 3); P('#7ac25a', i, j0 - 1, 1, 1); } }
    else if (kind === 'leaf') { P('#a0602a', i0, j0, 2, 1); P('#c07a30', i0 + 1, j0 + 1, 2, 1); P('#7a8a2a', i0 + 4, j0 + 2, 2, 1); }
    else if (kind === 'pebble') { for (let k = 0; k < 3; k++) { const i = i0 + rng.int(-2, 3), j = j0 + rng.int(-2, 3); P(shade(pal.floor[2], 1.2), i, j, 2, 1); P(shade(pal.floor[3], 0.8), i, j + 1, 2, 1); } }
    else if (kind === 'puddle') { P('rgba(60,120,180,0.45)', i0 - 1, j0, 6, 3); P('rgba(60,120,180,0.45)', i0, j0 - 1, 4, 5); P('rgba(200,240,255,0.6)', i0, j0, 2, 1); }
    else if (kind === 'lava') { let i = i0, j = j0; for (let k = 0; k < 7; k++) { P(k % 3 ? '#ff7a33' : '#ffd24d', i, j); i += rng.int(-1, 1); j += 1; } P('rgba(255,120,40,0.25)', i0 - 2, j0, 5, 7); }
    else if (kind === 'ash') { for (let k = 0; k < 5; k++) P(rng.pick(['#5a5050', '#3a3030', '#7a6a60']), i0 + rng.int(-3, 3), j0 + rng.int(-3, 3)); }
    else if (kind === 'frost') { P('rgba(230,250,255,0.55)', i0, j0, 5, 1); P('rgba(230,250,255,0.55)', i0 + 2, j0 - 2, 1, 5); P('#ffffff', i0 + 2, j0, 1, 1); P('rgba(230,250,255,0.35)', i0 + 1, j0 - 1, 3, 3); }
    else if (kind === 'rune') { const c = 'rgba(192,106,255,0.55)'; P(c, i0, j0, 5, 1); P(c, i0 + 2, j0 - 2, 1, 5); P(c, i0, j0 + 2, 1, 1); P(c, i0 + 4, j0 - 2, 1, 1); }
    else if (kind === 'inlay') { P('#e3c46a', 0, 7, 16, 1); P('#b89640', 0, 8, 16, 1); P('#fff2b0', 7, 7, 2, 1); }
  }

  // ---------- tapis et mosaïques dans les salles ----------
  function drawRug(x, r, color, rng) {
    const px = (r.x + 1) * T + 4, py = (r.y + 1) * T + 4, w = (r.w - 2) * T - 8, h = (r.h - 2) * T - 8;
    if (w < 24 || h < 20) return;
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(px + 2, py + 2, w, h); // ombre
    x.fillStyle = color; x.fillRect(px, py, w, h);
    x.fillStyle = shade(color, 0.7); x.fillRect(px + 3, py + 3, w - 6, h - 6);
    x.fillStyle = color; x.fillRect(px + 5, py + 5, w - 10, h - 10);
    // liseré doré + motifs
    x.fillStyle = '#c9a24a'; x.fillRect(px + 2, py + 2, w - 4, 1); x.fillRect(px + 2, py + h - 3, w - 4, 1); x.fillRect(px + 2, py + 2, 1, h - 4); x.fillRect(px + w - 3, py + 2, 1, h - 4);
    for (let i = px + 8; i < px + w - 8; i += 6) { x.fillStyle = shade(color, 1.35); x.fillRect(i, py + 7, 2, 2); x.fillRect(i, py + h - 9, 2, 2); }
    const cx = px + (w >> 1), cy = py + (h >> 1);
    x.fillStyle = '#c9a24a'; x.fillRect(cx - 1, cy - 5, 2, 10); x.fillRect(cx - 5, cy - 1, 10, 2);
    x.fillStyle = shade(color, 1.4); x.fillRect(cx - 3, cy - 3, 6, 6); x.fillStyle = '#e3c46a'; x.fillRect(cx - 1, cy - 1, 2, 2);
    // franges
    x.fillStyle = '#d8c8a0';
    for (let i = px + 1; i < px + w - 1; i += 2) { x.fillRect(i, py - 2, 1, 2); x.fillRect(i, py + h, 1, 2); }
  }
  function drawMosaic(x, cx, cy, pal, glow) {
    const R = 22;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const d = Math.sqrt(i * i + j * j);
      if (d > R) continue;
      const ring = d > R - 3 || (d > R - 11 && d < R - 8);
      if (ring) { x.fillStyle = shade(pal.floor[2], 1.25); x.fillRect(cx + i, cy + j, 1, 1); }
      else if (d < 5) { x.fillStyle = glow || shade(pal.floor[2], 1.4); x.fillRect(cx + i, cy + j, 1, 1); }
      else if ((i + j) % 6 === 0 || (i - j) % 6 === 0) { x.fillStyle = shade(pal.floor[0], 1.15); x.fillRect(cx + i, cy + j, 1, 1); }
    }
  }
  // cercle de l'entrée (point d'arrivée de l'équipe)
  function drawEntrance(x, cx, cy) {
    x.strokeStyle = 'rgba(120,200,255,0.55)'; x.lineWidth = 1;
    x.beginPath(); x.arc(cx, cy, 13.5, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = 'rgba(120,200,255,0.3)'; x.beginPath(); x.arc(cx, cy, 9.5, 0, Math.PI * 2); x.stroke();
    x.fillStyle = 'rgba(160,220,255,0.6)';
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; x.fillRect(Math.round(cx + Math.cos(a) * 11.5) - 1, Math.round(cy + Math.sin(a) * 11.5) - 1, 2, 2); }
  }

  // Dessine toute la carte d'un étage dans une image
  G.render.buildMapCanvas = function (map) {
    const pal = map.biome.palette, sty = STYLE[map.biome.id] || STYLE.crypt;
    const accent = (map.dungeon && map.dungeon.accent) || sty.rug;
    const rng = new G.core.RNG(map.seed + 7);
    const floors = [0, 1, 2, 3, 4, 5].map((v) => floorTile(pal, rng, v));
    const cobbles = [0, 1, 2].map(() => cobbleTile(pal, rng));
    const faces = [0, 1, 2].map((v) => wallFace(pal, rng, v));
    const tops = [0, 1].map(() => wallTop(pal, rng));
    const c = canvas(map.w * T, map.h * T), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    const W = map.w;
    const isFloor = (i, j) => i >= 0 && j >= 0 && i < map.w && j < map.h && map.tiles[j * W + i] !== 0;
    const torchAt = new Set(map.torches.map((t) => t.x + ',' + t.y));
    const rim = shade(pal.wallFace[0], 1.1);
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      const px = i * T, py = j * T;
      if (isFloor(i, j)) {
        const k = j * W + i, v = map.variant[k];
        if (map.tiles[k] === 2) x.drawImage(cobbles[(i * 5 + j * 3) % 3], px, py);
        else x.drawImage(floors[v === 3 ? 4 + ((i + j) & 1) : (v + i * 3 + j) % 4], px, py);
        if (rng.chance(0.07)) floorDecal(x, rng.pick(sty.decals), px, py, pal, rng);
      } else {
        let near = false;
        for (let dj = -1; dj <= 1 && !near; dj++) for (let di = -1; di <= 1; di++) if (isFloor(i + di, j + dj)) { near = true; break; }
        if (!near) continue;
        if (isFloor(i, j + 1)) {
          x.drawImage(faces[(i * 7 + j * 3) % 3], px, py);
          if (!torchAt.has(i + ',' + j) && !torchAt.has((i - 1) + ',' + j) && !torchAt.has((i + 1) + ',' + j) && rng.chance(0.14)) {
            let kind = rng.pick(sty.wall);
            if (kind === 'banner' && rng.chance(0.4)) kind = 'chain';
            wallDecor(x, kind, px, py, pal, accent, rng);
          }
        } else {
          x.drawImage(tops[(i + j) & 1], px, py);
          // bord éclairé du dessus du mur, côté sol (effet de coupe)
          x.fillStyle = rim;
          if (isFloor(i - 1, j) || isFloor(i - 1, j + 1)) x.fillRect(px, py, 1, T);
          if (isFloor(i + 1, j) || isFloor(i + 1, j + 1)) x.fillRect(px + T - 1, py, 1, T);
          if (isFloor(i, j - 1)) x.fillRect(px, py, T, 1);
        }
      }
    }
    // tapis, mosaïques et cercle d'entrée
    for (const r of map.rooms) {
      if (r === map.entrance) { drawEntrance(x, r.cx * T + 8, r.cy * T + 8); continue; }
      if (r === map.exit) continue;
      const roll = rng.next();
      if (roll < 0.28 && r.w >= 6 && r.h >= 5) drawRug(x, r, rng.chance(0.5) ? accent : sty.rug, rng);
      else if (roll < 0.45 && r.w >= 5 && r.h >= 5) drawMosaic(x, r.cx * T + 8, r.cy * T + 8, pal, sty.glow);
    }
    // ombres au pied des murs (après les tapis pour les recouvrir aussi)
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      if (!isFloor(i, j)) continue;
      const px = i * T, py = j * T;
      if (!isFloor(i, j - 1)) { x.fillStyle = 'rgba(0,0,0,0.38)'; x.fillRect(px, py, T, 3); x.fillStyle = 'rgba(0,0,0,0.16)'; x.fillRect(px, py + 3, T, 3); }
      if (!isFloor(i - 1, j)) { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(px, py, 2, T); x.fillStyle = 'rgba(0,0,0,0.1)'; x.fillRect(px + 2, py, 2, T); }
      if (!isFloor(i + 1, j)) { x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(px + T - 2, py, 2, T); }
      if (!isFloor(i, j + 1)) { x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(px, py + T - 1, T, 1); }
    }
    // décors
    for (const d of map.decor) {
      const s = G.render.decorSprite(d.kind);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(d.x * T + d.ox + 1, d.y * T + d.oy + s.img.height - 1, s.img.width - 2, 2);
      x.drawImage(s.img, d.x * T + d.ox, d.y * T + d.oy);
    }
    // escalier
    const st = map.stairs;
    drawStairs(x, st.x * T, st.y * T, pal);
    return c;
  };

  // escalier : cage descendante encadrée de pierre et d'or
  function drawStairs(x, px, py, pal) {
    x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(px - 1, py - 1, 18, 18);
    x.fillStyle = '#05040a'; x.fillRect(px + 1, py + 1, 14, 14);
    const shades = ['#9a94a4', '#7a7484', '#5a5564', '#3a3644', '#221f2a'];
    for (let i = 0; i < 5; i++) {
      x.fillStyle = shades[i]; x.fillRect(px + 2 + i, py + 2 + i * 2.6, 12 - i * 2, 2);
      x.fillStyle = shade(shades[i], 1.25); x.fillRect(px + 2 + i, py + 2 + i * 2.6, 12 - i * 2, 1);
    }
    const fr = shade(pal.wallFace[0], 1.15);
    x.fillStyle = fr; x.fillRect(px, py, 16, 2); x.fillRect(px, py, 2, 16); x.fillRect(px + 14, py, 2, 16);
    x.fillStyle = '#e3b341'; x.fillRect(px + 1, py, 14, 1); x.fillRect(px, py + 1, 1, 14); x.fillRect(px + 15, py + 1, 1, 14);
    x.fillStyle = '#fff0a0'; x.fillRect(px + 7, py, 2, 1);
  }
})();
