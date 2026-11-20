// =====================================================================
//  TUILES : textures de sol et de murs en pixel art, générées selon la
//  palette du biome, puis dessin de toute la carte de l'étage dans une
//  image (pré-rendu) pour que l'affichage soit rapide.
// =====================================================================
(function () {
  const T = 16; // taille d'une case en pixels
  G.render.TILE = T;

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  function floorTile(pal, rng, variant) {
    const c = canvas(T, T), x = c.getContext('2d');
    const f = pal.floor;
    x.fillStyle = f[0]; x.fillRect(0, 0, T, T);
    // dalles : 2x2 pierres légèrement différentes
    for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) {
      x.fillStyle = rng.pick([f[0], f[1], f[2]]);
      x.fillRect(bx * 8 + 1, by * 8 + 1, 7, 7);
      x.fillStyle = f[2]; x.fillRect(bx * 8 + 1, by * 8 + 1, 6, 1); // reflet
    }
    x.fillStyle = f[3];
    x.fillRect(0, 0, T, 1); x.fillRect(0, 8, T, 1); x.fillRect(0, 0, 1, T); x.fillRect(8, 0, 1, T);
    // petits grains
    const n = 3 + variant;
    for (let i = 0; i < n; i++) { x.fillStyle = rng.pick([f[1], f[3]]); x.fillRect(rng.int(1, 14), rng.int(1, 14), 1, 1); }
    if (variant === 3) { // fissure
      x.fillStyle = f[3];
      let px = rng.int(3, 12), py = rng.int(3, 6);
      for (let i = 0; i < 6; i++) { x.fillRect(px, py, 1, 1); px += rng.int(-1, 1); py += 1; }
    }
    return c;
  }
  function wallFace(pal, rng) {
    const c = canvas(T, T), x = c.getContext('2d');
    x.fillStyle = pal.mortar; x.fillRect(0, 0, T, T);
    // briques
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 4 : 0;
      for (let bx = -1; bx < 3; bx++) {
        const px = bx * 8 + off;
        x.fillStyle = rng.pick(pal.wallFace);
        x.fillRect(px + 1, row * 4 + 1, 7, 3);
        x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(px + 1, row * 4 + 1, 7, 1);
      }
    }
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, 13, T, 3); // ombre au pied du mur
    return c;
  }
  function wallTop(pal) {
    const c = canvas(T, T), x = c.getContext('2d');
    x.fillStyle = pal.wallTop; x.fillRect(0, 0, T, T);
    return c;
  }

  // Dessine toute la carte d'un étage dans une image
  G.render.buildMapCanvas = function (map) {
    const pal = map.biome.palette;
    const rng = new G.core.RNG(map.seed + 7);
    const floors = [0, 1, 2, 3].map((v) => floorTile(pal, rng, v));
    const faces = [0, 1, 2].map(() => wallFace(pal, rng));
    const top = wallTop(pal);
    const c = canvas(map.w * T, map.h * T), x = c.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
    const W = map.w;
    const isFloor = (i, j) => i >= 0 && j >= 0 && i < map.w && j < map.h && map.tiles[j * W + i] !== 0;
    for (let j = 0; j < map.h; j++) for (let i = 0; i < map.w; i++) {
      if (isFloor(i, j)) {
        const v = map.variant[j * W + i];
        x.drawImage(floors[v], i * T, j * T);
        // ombre portée par le mur au-dessus
        if (!isFloor(i, j - 1)) { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(i * T, j * T, T, 4); }
        if (!isFloor(i - 1, j)) { x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(i * T, j * T, 2, T); }
      } else {
        let near = false;
        for (let dj = -1; dj <= 1 && !near; dj++) for (let di = -1; di <= 1; di++) if (isFloor(i + di, j + dj)) { near = true; break; }
        if (!near) continue;
        if (isFloor(i, j + 1)) x.drawImage(faces[(i * 7 + j * 3) % 3], i * T, j * T);
        else x.drawImage(top, i * T, j * T);
      }
    }
    // décors
    for (const d of map.decor) {
      const s = G.render.decorSprite(d.kind);
      x.drawImage(s.img, d.x * T + d.ox, d.y * T + d.oy);
    }
    // escalier
    const st = map.stairs;
    drawStairs(x, st.x * T, st.y * T);
    return c;
  };

  function drawStairs(x, px, py) {
    x.fillStyle = '#000'; x.fillRect(px + 1, py + 1, 14, 14);
    const shades = ['#8a8494', '#6a6474', '#4a4554', '#2a2634'];
    for (let i = 0; i < 4; i++) { x.fillStyle = shades[i]; x.fillRect(px + 2 + i, py + 2 + i * 3, 12 - i * 2, 3); }
    x.fillStyle = '#e3b341'; x.fillRect(px + 1, py + 1, 14, 1); x.fillRect(px + 1, py + 1, 1, 14); x.fillRect(px + 14, py + 1, 1, 14);
  }
})();
