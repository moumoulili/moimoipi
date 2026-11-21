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
  let vignette = null;
  G.render.onFloor = function (run) {
    mapCanvas = G.render.buildMapCanvas(run.map);
    mapRef = run.map;
    cam.snap = true;
    fx.clear();
  };

  function drawUnit(u, run) {
    const s = G.render.getSprite(u.sprite, u.outline);
    const sc = u.scale || 1;
    const w = s.img.width * sc, h = s.img.height * sc;
    let ox = 0, oy = 0;
    if (u.anim.atk > 0) { const k = u.anim.atk / 0.18; ox = u.anim.lx * 3 * k; oy = u.anim.ly * 3 * k; }
    const bob = u.moving ? -Math.abs(Math.sin(u.anim.bob)) * 1.5 : Math.sin(u.anim.bob) * 0.4;
    const px = Math.round(u.x * T - w / 2 + ox - cam.x);
    const py = Math.round(u.y * T - h + 4 + (s.img.height > 12 ? 1 : 0) + bob + oy - cam.y);
    // ombre
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(Math.round(u.x * T - cam.x), Math.round(u.y * T + 4 - cam.y), 4 * sc, 1.6 * sc, 0, 0, Math.PI * 2); ctx.fill();
    // montée de niveau : aura dorée, colonne de lumière, rebond
    if (u.lvlFx > 0 && !u.dead) {
      const k = Math.min(1, u.lvlFx / 2), cx = Math.round(u.x * T - cam.x), cy = Math.round(u.y * T - cam.y);
      ctx.globalCompositeOperation = 'lighter';
      glow(cx, cy - 6, 18 + Math.sin(time * 10) * 3, 'rgba(255,215,80,' + (0.55 * k) + ')');
      const g = ctx.createLinearGradient(0, cy - 44, 0, cy + 2);
      g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(1, 'rgba(255,220,100,' + (0.45 * k) + ')');
      ctx.fillStyle = g; ctx.fillRect(cx - 6, cy - 44, 12, 46);
      ctx.globalCompositeOperation = 'source-over';
    }
    const flip = u.facing < 0;
    const img = u.anim.hit > 0 || (u.enraged && Math.sin(time * 14) > 0.85) ? (flip ? s.whiteFlip : s.white) : flip ? s.flip : s.img;
    if (u.dead) ctx.globalAlpha = Math.max(0, u.deadT / 0.6);
    let lvlScale = 1;
    if (u.lvlFx > 1.4) lvlScale = 1 + Math.sin(((2 - u.lvlFx) / 0.6) * Math.PI) * 0.25;
    if (!u.dead && u.anim.atk > 0 && u.attack && u.attack.type === 'ranged' && u.attack.projectile !== 'arrow') {
      ctx.globalCompositeOperation = 'lighter';
      glow(Math.round(u.x * T - cam.x), Math.round(u.y * T - 6 - cam.y), 10, hexA(G.render.fx.colorOf(G.sys.combat.vfxEl(u.attack)), (u.anim.atk / 0.18) * 0.6));
      ctx.globalCompositeOperation = 'source-over';
    }
    if (lvlScale !== 1) { const w2 = Math.round(w * lvlScale), h2 = Math.round(h * lvlScale); ctx.drawImage(img, px - ((w2 - w) >> 1), py - (h2 - h), w2, h2); }
    else ctx.drawImage(img, px, py, w, h);
    // clignotement lumineux pendant la montée de niveau
    if (u.lvlFx > 0 && !u.dead && Math.floor(time * 8) % 2 === 0) { ctx.globalAlpha = 0.55 * Math.min(1, u.lvlFx); ctx.drawImage(flip ? s.whiteFlip : s.white, px, py, w, h); }
    ctx.globalAlpha = 1;
    if (u.dead) return;
    if (u.guardian) {
      const cr = G.render.getSprite({ tpl: 'crown', pal: { c: '#ffd34d', w: '#ff3b3b' } });
      ctx.drawImage(cr.img, Math.round(px + w / 2 - 3.5), py - 4);
    }
    // effets de statut : bouclier, étourdissement, petites pastilles
    if (u.effects && u.effects.length) {
      const cx = Math.round(u.x * T - cam.x);
      let pip = 0;
      for (const e of u.effects) {
        if (e.id === 'shield') {
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = 'rgba(255,243,168,' + (0.35 + Math.sin(time * 6) * 0.15) + ')';
          ctx.beginPath(); ctx.ellipse(cx, Math.round(u.y * T - 4 - cam.y), 8 * sc, 9 * sc, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        } else if (e.id === 'stun' || e.id === 'freeze') {
          for (let k = 0; k < 3; k++) {
            const a = time * 6 + (k * Math.PI * 2) / 3;
            ctx.fillStyle = e.id === 'freeze' ? '#bfefff' : '#ffe14d';
            ctx.fillRect(Math.round(cx + Math.cos(a) * 5), Math.round(py - 3 + Math.sin(a) * 1.5), 1, 1);
          }
          if (e.id === 'freeze') { ctx.fillStyle = 'rgba(160,220,255,0.35)'; ctx.fillRect(px, py, w, h); }
        } else if (e.id === 'taunt') {
          ctx.fillStyle = '#ff4040'; ctx.fillRect(cx - 1 + 6, py - 4, 1, 3); ctx.fillRect(cx - 1 + 6, py, 1, 1);
        }
        const col = G.data.effects[e.id] && G.data.effects[e.id].color;
        if (col && e.id !== 'shield' && e.id !== 'taunt') { ctx.fillStyle = col; ctx.fillRect(Math.round(px + pip * 3), py + h + 1, 2, 2); pip++; }
      }
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
      if (p.big) { ctx.globalCompositeOperation = 'lighter'; glow(x, y, 7, 'rgba(255,240,200,0.5)'); ctx.globalCompositeOperation = 'source-over'; }
      ctx.fillStyle = '#e8e0c8';
      for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(x - dx * i), Math.round(y - dy * i), 1, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(x + dx), Math.round(y + dy), 1, 1);
      ctx.fillStyle = '#c0392b'; ctx.fillRect(Math.round(x - dx * 6), Math.round(y - dy * 6), 1, 1);
      return;
    }
    const col = G.render.fx.colorOf(p.el);
    const pulse = (1 + Math.sin(p.age * 30) * 0.25) * (p.big ? 1.6 : 1);
    ctx.globalCompositeOperation = 'lighter';
    glow(x, y, 9 * pulse, hexA(col, 0.55));
    if (p.big) { ctx.fillStyle = col; ctx.fillRect(x - 2, y - 2, 5, 5); }
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

  // objets des salles spéciales (fontaine, autel, marchand, pierre mystère)
  const SPECIAL_SPR = {
    fountain: { tpl: 'fountain', pal: { m: '#8a8494', w: '#bfefff', b: '#4a9fff' }, glow: '127,216,255' },
    altar: { tpl: 'altar', pal: { c: '#e3b341', w: '#fff3a8', a: '#6a6474', b: '#4a4554' }, glow: '255,211,77' },
    merchant: { tpl: 'merchant', pal: { b: '#6a3a8a', s: '#f1c59a', e: '#1a1020', a: '#8a5a2b', c: '#e3b341' }, glow: '255,200,120' },
    event: { tpl: 'mystery', pal: { a: '#5a5070', w: '#c78bff', b: '#3a3448' }, glow: '199,139,255' },
  };
  function drawSpecials(map) {
    for (const sp of map.specials) {
      if (!map.seen[sp.y * map.w + sp.x]) continue;
      if (sp.used && sp.kind === 'merchant') continue;
      const d = SPECIAL_SPR[sp.kind];
      const cx = sp.x * T + 8 - cam.x, cy = sp.y * T + 8 - cam.y;
      if (!sp.used) {
        ctx.globalCompositeOperation = 'lighter';
        glow(cx, cy, 18 + Math.sin(time * 3) * 3, 'rgba(' + d.glow + ',0.35)');
        ctx.globalCompositeOperation = 'source-over';
      }
      const s = G.render.getSprite(d.pal ? { tpl: d.tpl, pal: d.pal } : d);
      ctx.globalAlpha = sp.used ? 0.5 : 1;
      ctx.drawImage(s.img, Math.round(cx - 6), Math.round(cy - 8 + (sp.used ? 0 : Math.sin(time * 2.5) * 0.8)));
      ctx.globalAlpha = 1;
    }
  }
  // zones de danger des boss : cercle qui se remplit jusqu'à l'impact
  function drawTelegraphs(run) {
    for (const t of run.telegraphs) {
      const cx = t.x * T - cam.x, cy = t.y * T - cam.y, r = t.r * T, k = 1 - t.t / t.warn;
      ctx.fillStyle = 'rgba(255,40,40,' + (0.12 + 0.1 * Math.sin(time * 18)) + ')';
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = hexA(t.color && t.color[0] === '#' ? t.color : '#ff4040', 0.35);
      ctx.beginPath(); ctx.ellipse(cx, cy, r * k, r * 0.7 * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,60,60,0.9)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.7, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  // particules d'ambiance du biome (en coordonnées d'écran)
  const amb = [];
  function drawAmbient(map, dt) {
    const a = map.biome.ambient;
    if (!a) return;
    const rate = { dust: 6, firefly: 3, drip: 2, ember: 10, snow: 14, wisp: 2, mote: 5 }[a.kind] || 4;
    if (amb.length < 80 && Math.random() < dt * rate) {
      const p = { x: Math.random() * vw, y: Math.random() * vh, t: 0, life: 3 + Math.random() * 3, ph: Math.random() * 6, kind: a.kind };
      if (a.kind === 'snow' || a.kind === 'drip') p.y = -4;
      if (a.kind === 'ember' || a.kind === 'mote') p.y = vh + 4;
      amb.push(p);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of amb) {
      p.t += dt;
      if (p.kind === 'snow') { p.y += dt * 14; p.x += Math.sin(p.t * 2 + p.ph) * dt * 8; }
      else if (p.kind === 'drip') { p.y += dt * 60; }
      else if (p.kind === 'ember') { p.y -= dt * 18; p.x += Math.sin(p.t * 3 + p.ph) * dt * 10; }
      else if (p.kind === 'mote') { p.y -= dt * 8; p.x += Math.sin(p.t + p.ph) * dt * 4; }
      else { p.x += Math.sin(p.t * 0.7 + p.ph) * dt * 6; p.y += Math.cos(p.t * 0.5 + p.ph) * dt * 4; }
      let al = Math.min(1, p.t, (p.life - p.t)) * (p.kind === 'dust' ? 0.35 : 0.8);
      if (p.kind === 'firefly') al *= 0.5 + 0.5 * Math.sin(p.t * 5 + p.ph);
      ctx.globalAlpha = Math.max(0, al);
      ctx.fillStyle = a.color;
      if (p.kind === 'drip') ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 3);
      else if (p.kind === 'wisp') { glow(p.x, p.y, 5, 'rgba(192,106,255,0.5)'); }
      else ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    for (let i = amb.length - 1; i >= 0; i--) if (amb[i].t >= amb[i].life || amb[i].y > vh + 6 || amb[i].y < -8) amb.splice(i, 1);
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
    drawSpecials(map);
    drawTelegraphs(run);

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
    drawAmbient(map, dt);
    // cycle « Cauchemar » : le donjon prend une teinte rouge
    if (map.cycle) { ctx.fillStyle = 'rgba(120,0,0,' + Math.min(0.25, 0.08 * map.cycle) + ')'; ctx.fillRect(0, 0, vw, vh); }
    // teinte propre au donjon (Catacombes sanglantes, Citadelle du Chaos…)
    if (map.dungeon && map.dungeon.tint) { ctx.fillStyle = map.dungeon.tint; ctx.fillRect(0, 0, vw, vh); }
    // vignette : bords de l'écran assombris pour plus de profondeur
    if (!vignette || vignette.w !== vw || vignette.h !== vh) {
      vignette = { w: vw, h: vh, g: ctx.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.35, vw / 2, vh / 2, Math.max(vw, vh) * 0.75) };
      vignette.g.addColorStop(0, 'rgba(0,0,0,0)'); vignette.g.addColorStop(1, 'rgba(0,0,0,0.45)');
    }
    ctx.fillStyle = vignette.g; ctx.fillRect(0, 0, vw, vh);
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
      const s = G.render.getSprite(G.sys.heroes.sprite(h));
      const px = Math.round(cx + (i - (team.length - 1) / 2) * 20) - (s.img.width >> 1);
      const py = Math.round(cy + (i % 2 ? 10 : -16) + Math.sin(time * 2 + i) * 0.5) - (s.img.height >> 1);
      ctx.drawImage(px + (s.img.width >> 1) < cx ? s.img : s.flip, px, py);
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
