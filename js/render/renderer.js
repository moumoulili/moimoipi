// =====================================================================
//  RENDU CANVAS : la carte, les unités, les effets, la lumière.
//  Le canvas a une petite résolution "pixel" agrandie à l'écran
//  (effet pixel art net).
// =====================================================================
(function () {
  const T = G.render.TILE;
  const fx = G.render.fx;
  let canvas, ctx, wrap, scale = 3, vw = 0, vh = 0;
  const cam = { x: 0, y: 0, snap: true };
  let mapCanvas = null, mapRef = null, time = 0;

  G.render.init = function (canvasEl, wrapEl) {
    canvas = canvasEl; wrap = wrapEl;
    ctx = canvas.getContext('2d');
    G.render.resize();
    window.addEventListener('resize', G.render.resize);
  };
  G.render.resize = function () {
    if (!wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const pw = wrap.clientWidth * dpr, ph = wrap.clientHeight * dpr;
    // ~13 cases visibles en largeur
    scale = Math.max(1, Math.round(pw / (T * 13)));
    vw = Math.ceil(pw / scale); vh = Math.ceil(ph / scale);
    canvas.width = vw; canvas.height = vh;
    canvas.style.width = (vw * scale) / dpr + 'px';
    canvas.style.height = (vh * scale) / dpr + 'px';
    ctx.imageSmoothingEnabled = false;
  };
  G.render.onFloor = function (run) {
    mapCanvas = G.render.buildMapCanvas(run.map);
    mapRef = run.map;
    cam.snap = true;
    fx.clear();
  };

  function drawUnit(u, run) {
    const s = G.render.getSprite(u.sprite, u.outline);
    const sc = u.scale || 1;
    const w = 12 * sc, h = 12 * sc;
    let ox = 0, oy = 0;
    if (u.anim.atk > 0) { const k = u.anim.atk / 0.18; ox = u.anim.lx * 3 * k; oy = u.anim.ly * 3 * k; }
    const bob = u.moving ? -Math.abs(Math.sin(u.anim.bob)) * 1.5 : Math.sin(u.anim.bob) * 0.4;
    const px = Math.round(u.x * T - w / 2 + ox - cam.x);
    const py = Math.round(u.y * T - h + 4 + bob + oy - cam.y);
    // ombre
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(Math.round(u.x * T - cam.x), Math.round(u.y * T + 4 - cam.y), 4 * sc, 1.6 * sc, 0, 0, Math.PI * 2); ctx.fill();
    const flip = u.facing < 0;
    const img = u.anim.hit > 0 ? (flip ? s.whiteFlip : s.white) : flip ? s.flip : s.img;
    if (u.dead) ctx.globalAlpha = Math.max(0, u.deadT / 0.6);
    if (!u.dead && u.anim.atk > 0 && u.attack && u.attack.type === 'ranged' && u.attack.projectile !== 'arrow') {
      ctx.globalCompositeOperation = 'lighter';
      glow(Math.round(u.x * T - cam.x), Math.round(u.y * T - 6 - cam.y), 10, hexA(G.render.fx.colorOf(G.sys.combat.vfxEl(u.attack)), (u.anim.atk / 0.18) * 0.6));
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(img, px, py, w, h);
    ctx.globalAlpha = 1;
    if (u.dead) return;
    if (u.guardian) {
      const cr = G.render.getSprite({ tpl: 'crown', pal: { c: '#ffd34d', w: '#ff3b3b' } });
      ctx.drawImage(cr.img, Math.round(px + w / 2 - 3.5), py - 4);
    }
    // barre de vie
    const showBar = u.hp < u.stats.maxHp || (u.side === 'monster' && u.aggro);
    if (showBar) {
      const bw = u.guardian ? 18 : 10, bx = Math.round(u.x * T - bw / 2 - cam.x), by = py - (u.guardian ? 7 : 3);
      ctx.fillStyle = '#120c18'; ctx.fillRect(bx - 1, by - 1, bw + 2, 4);
      ctx.fillStyle = '#3a1a1a'; ctx.fillRect(bx, by, bw, 2);
      ctx.fillStyle = u.side === 'hero' ? '#5ad65a' : u.guardian ? '#ff8a3b' : '#e04040';
      ctx.fillRect(bx, by, Math.max(1, Math.round((bw * u.hp) / u.stats.maxHp)), 2);
    }
  }

  // halo lumineux (mode additif)
  function glow(x, y, r, rgbaCore) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgbaCore); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function hexA(hex, a) {
    if (hex[0] !== '#') return hex;
    const n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function drawProjectile(p) {
    const x = Math.round(p.x * T - cam.x), y = Math.round(p.y * T - cam.y);
    const dx = Math.cos(p.ang || 0), dy = Math.sin(p.ang || 0);
    if (p.kind === 'arrow') {
      ctx.fillStyle = '#e8e0c8';
      for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(x - dx * i), Math.round(y - dy * i), 1, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1);
      ctx.fillStyle = '#c0392b'; ctx.fillRect(Math.round(x - dx * 6), Math.round(y - dy * 6), 1, 1);
      return;
    }
    const col = G.render.fx.colorOf(p.el);
    const pulse = 1 + Math.sin(p.age * 30) * 0.25;
    ctx.globalCompositeOperation = 'lighter';
    glow(x, y, 9 * pulse, hexA(col, 0.55));
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = col;
    if (p.kind === 'ice') { // éclat en losange
      ctx.fillRect(x - 1, y - 2, 2, 4); ctx.fillRect(x - 2, y - 1, 4, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y - 1, 1, 1);
    } else if (p.kind === 'holy') { // croix lumineuse
      ctx.fillRect(x - 2, y, 5, 1); ctx.fillRect(x, y - 2, 1, 5);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
    } else if (p.kind === 'spark') { // crépitement
      for (let i = 0; i < 4; i++) ctx.fillRect(x + Math.round(Math.random() * 4 - 2), y + Math.round(Math.random() * 4 - 2), 1, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
    } else { // orbe / boule de feu
      const r = p.kind === 'fire' ? 2 : 1;
      ctx.fillRect(x - r, y - r, r * 2 + 1, r * 2 + 1);
      ctx.fillRect(Math.round(x - dx * 3), Math.round(y - dy * 3), 2, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
    }
  }
  // objets qui tombent : colonne de lumière de la couleur de la rareté + icône qui flotte
  function drawLoot() {
    for (const d of fx.drops) {
      const k = d.t / d.life, ri = G.data.rarityIndex[d.item.rarity], col = G.data.rarities[ri].color;
      const x = Math.round(d.x * T - cam.x), y = Math.round(d.y * T - cam.y);
      const alpha = k > 0.75 ? (1 - k) * 4 : 1;
      if (ri >= 2) {
        ctx.globalCompositeOperation = 'lighter';
        const h = 18 + ri * 10;
        const g = ctx.createLinearGradient(0, y - h, 0, y + 2);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, hexA(col, 0.55 * alpha));
        ctx.fillStyle = g; ctx.fillRect(x - 2 - (ri >= 4 ? 1 : 0), y - h, 4 + (ri >= 4 ? 2 : 0), h + 2);
        glow(x, y, 8 + ri * 2, hexA(col, 0.4 * alpha));
        ctx.globalCompositeOperation = 'source-over';
      }
      const s = G.render.getSprite(G.render.itemSprite(d.item));
      const bob = Math.round(Math.sin(d.t * 8) * 1.5) - Math.round(Math.min(1, d.t * 5) * 8);
      ctx.globalAlpha = alpha;
      ctx.drawImage(s.img, x - 6, y - 10 + bob);
      ctx.globalAlpha = 1;
    }
  }
  // arc de lame : quelques pixels en croissant qui balaient
  function drawArc(a) {
    const k = a.t / a.life, cx = a.x * T - cam.x, cy = a.y * T - cam.y, r = a.r * T;
    const start = -1.3 + k * 1.2, end = start + 1.6;
    ctx.fillStyle = hexA(a.color, 1 - k * 0.7);
    for (let t = start; t <= end; t += 0.12) {
      const ang = a.dir > 0 ? t : Math.PI - t;
      const px = Math.round(cx + Math.cos(ang) * r - a.dir * r * 0.4), py = Math.round(cy + Math.sin(ang) * r);
      ctx.fillRect(px, py, 1, 1);
      if (t > start + 0.4 && t < end - 0.4) ctx.fillRect(px - a.dir, py, 1, 1);
    }
  }
  function drawRing(rg) {
    const k = rg.t / rg.life, ease = 1 - Math.pow(1 - k, 2);
    const r = (rg.inward ? 1 - ease : ease) * rg.r * T + 1;
    const cx = rg.x * T - cam.x, cy = rg.y * T - cam.y;
    ctx.fillStyle = hexA(rg.color, 1 - k);
    const n = Math.max(10, Math.round(r * 2.2));
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r * 0.6), 1, 1);
    }
  }
  function drawBeam(bm) {
    const k = bm.t / bm.life;
    const x0 = bm.x0 * T - cam.x, y0 = bm.y0 * T - cam.y, x1 = bm.x1 * T - cam.x, y1 = bm.y1 * T - cam.y;
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len));
    const nx = -(y1 - y0) / (len || 1), ny = (x1 - x0) / (len || 1);
    for (const pass of [0, 1]) {
      ctx.fillStyle = pass ? hexA('#ffffff', 1 - k) : hexA(bm.color, (1 - k) * 0.8);
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        let off = 0;
        if (bm.zig) off = Math.sin(t * 9 + bm.seed + bm.t * 60) * 2.5 * (1 - Math.abs(t - 0.5) * 2 + 0.3);
        else off = Math.sin(t * 12 - bm.t * 30) * 0.8;
        const px = Math.round(x0 + (x1 - x0) * t + nx * off), py = Math.round(y0 + (y1 - y0) * t + ny * off);
        if (pass) ctx.fillRect(px, py, 1, 1); else ctx.fillRect(px - 1, py - 1, 3, 3);
      }
    }
  }

  function drawTorches(map, x0, y0, x1, y1) {
    ctx.globalCompositeOperation = 'lighter';
    for (const t of map.torches) {
      if (t.x < x0 - 3 || t.x > x1 + 3 || t.y < y0 - 3 || t.y > y1 + 3) continue;
      if (!map.seen[t.y * map.w + t.x]) continue;
      const fl = Math.sin(time * 9 + t.phase) * 0.5 + Math.sin(time * 23 + t.phase * 2) * 0.3;
      const cx = t.x * T + 8 - cam.x, cy = t.y * T + 8 - cam.y;
      const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 30 + fl * 3);
      g.addColorStop(0, 'rgba(' + map.biome.palette.light + ',0.32)');
      g.addColorStop(1, 'rgba(' + map.biome.palette.light + ',0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 36, cy - 36, 72, 72);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const t of map.torches) {
      if (t.x < x0 - 1 || t.x > x1 + 1 || t.y < y0 - 1 || t.y > y1 + 1 || !map.seen[t.y * map.w + t.x]) continue;
      const cx = Math.round(t.x * T + 8 - cam.x), cy = Math.round(t.y * T + 7 - cam.y);
      const f = Math.floor(time * 10 + t.phase) % 2;
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(cx - 1, cy + 1, 2, 4);
      ctx.fillStyle = '#ff7a33'; ctx.fillRect(cx - 1, cy - 2 - f, 2, 3 + f);
      ctx.fillStyle = '#ffe14d'; ctx.fillRect(cx, cy - 1, 1, 2);
    }
  }

  function drawWorld(run, dt) {
    const map = run.map;
    if (mapRef !== map) G.render.onFloor(run);
    // caméra : centre de l'équipe
    let cx = 0, cy = 0, n = 0;
    for (const h of run.heroes) if (!h.dead) { cx += h.x; cy += h.y; n++; }
    if (!n) for (const h of run.heroes) { cx += h.x; cy += h.y; n++; }
    const tx = (cx / n) * T - vw / 2, ty = (cy / n) * T - vh / 2;
    const k = cam.snap ? 1 : 1 - Math.exp(-dt * 5);
    cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; cam.snap = false;
    const shake = fx.shakeT > 0 ? fx.shakeT * 6 : 0;
    if (fx.shakeT > 0) fx.shakeT -= dt;
    const save = { x: cam.x, y: cam.y };
    cam.x = Math.round(cam.x + (Math.random() - 0.5) * shake);
    cam.y = Math.round(cam.y + (Math.random() - 0.5) * shake);

    ctx.drawImage(mapCanvas, -cam.x, -cam.y);
    const x0 = Math.max(0, Math.floor(cam.x / T)), y0 = Math.max(0, Math.floor(cam.y / T));
    const x1 = Math.min(map.w - 1, Math.ceil((cam.x + vw) / T)), y1 = Math.min(map.h - 1, Math.ceil((cam.y + vh) / T));

    // pièges déclenchés, coffres
    for (const t of map.traps) if (t.triggered) {
      const px = t.x * T - cam.x, py = t.y * T - cam.y;
      ctx.fillStyle = '#2a2430'; ctx.fillRect(px + 3, py + 3, 10, 10);
      ctx.fillStyle = '#c9d1dc';
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) ctx.fillRect(px + 4 + i * 3, py + 4 + j * 3, 1, 2);
    }
    for (const c of map.chests) {
      if (!map.seen[c.y * map.w + c.x]) continue;
      const s = G.render.getSprite({ tpl: c.opened ? 'chestOpen' : 'chest', pal: { b: '#8a5a2b', c: '#e3b341', m: '#ffe14d', d: '#3a2410', w: '#ffd34d' } });
      ctx.drawImage(s.img, c.x * T + 2 - cam.x, c.y * T + 2 - cam.y);
    }
    drawTorches(map, x0, y0, x1, y1);

    // unités triées par profondeur
    const vis = (u) => {
      const k2 = Math.floor(u.y) * map.w + Math.floor(u.x);
      if (!map.seen[k2]) return false;
      if (u.side === 'monster' && !u.aggro) return lightAt(run, u.x, u.y) < 0.55;
      return true;
    };
    const list = run.units.filter((u) => (u.side === 'hero' || !u.dead || u.deadT > 0) && vis(u)).sort((a, b) => a.y - b.y);
    for (const u of list) {
      if (u.side === 'hero' && u.dead) {
        const s = G.render.getSprite({ tpl: 'tomb', pal: { w: '#9a9aa8', b: '#5a5a68' } });
        ctx.drawImage(s.img, Math.round(u.x * T - 6 - cam.x), Math.round(u.y * T - 8 - cam.y));
      } else drawUnit(u, run);
    }
    // particules "matérielles" (éclats, pièces, débris) : sous l'obscurité
    for (const p of fx.parts) {
      if (p.glow) continue;
      ctx.globalAlpha = Math.min(1, 2 * (1 - p.t / p.life));
      ctx.fillStyle = p.color;
      const sz = p.size || 1;
      ctx.fillRect(Math.round(p.x * T - cam.x), Math.round(p.y * T - cam.y), sz, sz);
    }
    ctx.globalAlpha = 1;

    // brouillard et lumière
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      const px = i * T - cam.x, py = j * T - cam.y;
      if (!map.seen[j * map.w + i]) { ctx.fillStyle = '#000'; ctx.fillRect(px, py, T, T); continue; }
      const a = lightAt(run, i + 0.5, j + 0.5);
      if (a > 0.02) { ctx.fillStyle = 'rgba(4,2,10,' + a.toFixed(2) + ')'; ctx.fillRect(px, py, T, T); }
    }
    // couche lumineuse : sorts, traînées, anneaux, rayons (brillent dans le noir)
    for (const a of fx.arcs) drawArc(a);
    for (const p of run.projectiles) if (!(p.wait > 0)) drawProjectile(p);
    drawLoot();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of fx.parts) {
      if (!p.glow) continue;
      let a = 1 - p.t / p.life;
      if (p.twinkle && Math.random() < 0.3) a *= 0.3;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const sz = p.size || 1;
      ctx.fillRect(Math.round(p.x * T - cam.x), Math.round(p.y * T - cam.y), sz, sz);
    }
    ctx.globalAlpha = 1;
    for (const rg of fx.rings) drawRing(rg);
    for (const bm of fx.beams) drawBeam(bm);
    ctx.globalCompositeOperation = 'source-over';
    // textes flottants (par-dessus la lumière)
    for (const t of fx.texts) {
      const a = 1 - Math.max(0, (t.t - t.life * 0.6) / (t.life * 0.4));
      ctx.globalAlpha = a;
      const px = t.x * T - cam.x, py = t.y * T - cam.y - (t.size > 1 ? 4 : 0);
      const sz = t.size > 1 && t.t < 0.08 ? t.size + 1 : t.size;
      if (!G.render.pixelText(ctx, t.txt, px, py, t.color, sz)) {
        ctx.font = '6px monospace'; ctx.textAlign = 'center';
        ctx.fillStyle = '#120c18'; ctx.fillText(t.txt, px + 1, py + 6);
        ctx.fillStyle = t.color; ctx.fillText(t.txt, px, py + 5);
      }
    }
    ctx.globalAlpha = 1;
    cam.x = save.x; cam.y = save.y;
  }

  // assombrissement selon la distance au héros le plus proche
  function lightAt(run, x, y) {
    let d = 1e9;
    for (const h of run.heroes) if (!h.dead) { const dd = (h.x - x) ** 2 + (h.y - y) ** 2; if (dd < d) d = dd; }
    d = Math.sqrt(d);
    const V = G.data.balance.vision;
    return Math.max(0, Math.min(0.72, (d - (V - 3)) / 3.5));
  }

  // écran au repos : feu de camp en ville
  function drawCamp(dt) {
    ctx.fillStyle = '#0d0a14'; ctx.fillRect(0, 0, vw, vh);
    const cx = Math.round(vw / 2), cy = Math.round(vh / 2) + 6;
    const fl = Math.sin(time * 8) * 2 + Math.sin(time * 19) * 1.5;
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70 + fl);
    g.addColorStop(0, 'rgba(255,150,60,0.45)'); g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = '#5a3a20'; ctx.fillRect(cx - 6, cy + 2, 12, 2); ctx.fillRect(cx - 4, cy, 8, 2);
    const f = Math.floor(time * 8) % 3;
    ctx.fillStyle = '#ff5a20'; ctx.fillRect(cx - 3, cy - 5 - f, 6, 6 + f);
    ctx.fillStyle = '#ffb347'; ctx.fillRect(cx - 2, cy - 3 - f, 4, 4);
    ctx.fillStyle = '#ffe14d'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
    const team = G.state ? G.sys.heroes.team() : [];
    team.forEach((h, i) => {
      const c = G.data.classes[h.cls];
      const s = G.render.getSprite(Object.assign({ id: h.cls }, c.sprite));
      const px = Math.round(cx + (i - (team.length - 1) / 2) * 18) - 6;
      const py = Math.round(cy + (i % 2 ? 10 : -16) + Math.sin(time * 2 + i) * 0.5) - 6;
      ctx.drawImage(px + 6 < cx ? s.img : s.flip, px, py);
    });
    for (let i = 0; i < 4; i++) {
      const t2 = (time * 0.7 + i * 0.25) % 1;
      ctx.fillStyle = 'rgba(255,200,120,' + (1 - t2) + ')';
      ctx.fillRect(Math.round(cx + Math.sin(i * 7 + time) * 4), Math.round(cy - 6 - t2 * 24), 1, 1);
    }
  }

  G.render.draw = function (dt) {
    if (!ctx) return;
    time += dt;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, vw, vh);
    const run = G.sys.run.active;
    if (run && run.map) drawWorld(run, dt);
    else drawCamp(dt);
    if (fx.flashT > 0) {
      fx.flashT -= dt;
      ctx.globalAlpha = Math.max(0, fx.flashT / fx.flashMax) * 0.45;
      ctx.fillStyle = fx.flashCol; ctx.fillRect(0, 0, vw, vh);
      ctx.globalAlpha = 1;
    }
    if (fx.fadeT > 0) {
      fx.fadeT -= dt;
      const k = fx.fadeT / fx.fadeMax;
      ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, Math.sin(k * Math.PI) * 1.4) + ')';
      ctx.fillRect(0, 0, vw, vh);
    }
  };
})();
