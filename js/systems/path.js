// =====================================================================
//  CHEMINS : A* (plus court chemin sur la grille, 8 directions),
//  BFS (distances depuis un point) et ligne de vue.
// =====================================================================
(function () {
  const P = {};
  P.walk = (map, i, j) => i >= 0 && j >= 0 && i < map.w && j < map.h && map.tiles[j * map.w + i] !== 0;
  // un point (en cases, décimal) est-il praticable avec une marge de corps
  P.free = function (map, x, y, m) {
    m = m == null ? 0.2 : m;
    return P.walk(map, Math.floor(x - m), Math.floor(y - m)) && P.walk(map, Math.floor(x + m), Math.floor(y - m)) &&
      P.walk(map, Math.floor(x - m), Math.floor(y + m)) && P.walk(map, Math.floor(x + m), Math.floor(y + m));
  };
  // ligne de vue (option "épaisse" pour les déplacements)
  P.los = function (map, x0, y0, x1, y1, thick) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    if (len < 0.01) return true;
    const steps = Math.ceil(len / 0.25);
    const offs = thick ? [-thick, 0, thick] : [0];
    const nx = -dy / len, ny = dx / len;
    for (const o of offs) {
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        const px = x0 + dx * t + nx * o, py = y0 + dy * t + ny * o;
        if (!P.walk(map, Math.floor(px), Math.floor(py))) return false;
      }
    }
    return true;
  };

  // Tas binaire minimal pour A*
  function Heap() { this.a = []; }
  Heap.prototype.push = function (n, f) {
    const a = this.a; a.push([f, n]); let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p][0] <= a[i][0]) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  };
  Heap.prototype.pop = function () {
    const a = this.a, top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top[1];
  };
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];

  // renvoie une liste de cases [{x,y}] (sans la case de départ), ou null
  P.astar = function (map, sx, sy, tx, ty, maxIter) {
    const W = map.w, N = W * map.h;
    if (!P.walk(map, tx, ty)) return null;
    const start = sy * W + sx, goal = ty * W + tx;
    if (start === goal) return [];
    const g = new Float32Array(N).fill(1e9), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const h = new Heap();
    g[start] = 0; h.push(start, 0);
    let it = 0; maxIter = maxIter || 6000;
    while (h.a.length && it++ < maxIter) {
      const cur = h.pop();
      if (cur === goal) break;
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % W, cy = (cur / W) | 0;
      for (const d of DIRS) {
        const nx = cx + d[0], ny = cy + d[1];
        if (!P.walk(map, nx, ny)) continue;
        if (d[0] && d[1] && (!P.walk(map, cx + d[0], cy) || !P.walk(map, cx, cy + d[1]))) continue; // pas de coupe d'angle
        const ni = ny * W + nx, ng = g[cur] + d[2];
        if (ng < g[ni]) {
          g[ni] = ng; from[ni] = cur;
          const hh = Math.max(Math.abs(nx - tx), Math.abs(ny - ty)) + 0.414 * Math.min(Math.abs(nx - tx), Math.abs(ny - ty));
          h.push(ni, ng + hh);
        }
      }
    }
    if (from[goal] < 0) return null;
    const out = [];
    for (let c = goal; c !== start; c = from[c]) out.push({ x: c % W, y: (c / W) | 0 });
    return out.reverse();
  };

  // distances (en pas) depuis une case vers toutes les autres
  P.bfs = function (map, sx, sy) {
    const W = map.w, N = W * map.h, d = new Int32Array(N).fill(-1);
    const q = new Int32Array(N); let qh = 0, qt = 0;
    const s = sy * W + sx; d[s] = 0; q[qt++] = s;
    while (qh < qt) {
      const c = q[qh++], cx = c % W, cy = (c / W) | 0;
      const nb = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
      for (const [nx, ny] of nb) {
        if (!P.walk(map, nx, ny)) continue;
        const ni = ny * W + nx;
        if (d[ni] < 0) { d[ni] = d[c] + 1; q[qt++] = ni; }
      }
    }
    return d;
  };
  G.sys.path = P;
})();
