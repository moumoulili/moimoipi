// Générateur de hasard "à graine" : une même graine donne toujours la même suite.
// Sert à générer les donjons (et plus tard le donjon du jour, identique pour tous).
(function () {
  function hashStr(s) {
    s = String(s);
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
  }
  function RNG(seed) {
    this.s = (typeof seed === 'number' ? seed : hashStr(seed)) >>> 0 || 1;
  }
  RNG.prototype.next = function () {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  RNG.prototype.float = function (a, b) { return a + (b - a) * this.next(); };
  RNG.prototype.int = function (a, b) { return a + Math.floor(this.next() * (b - a + 1)); };
  RNG.prototype.chance = function (p) { return this.next() < p; };
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  // list: [{w: poids, ...}] ou objet {cle: poids}
  RNG.prototype.weighted = function (list) {
    if (!Array.isArray(list)) list = Object.keys(list).map((k) => ({ id: k, w: list[k] }));
    let total = 0;
    for (const it of list) total += it.w;
    let r = this.next() * total;
    for (const it of list) { r -= it.w; if (r <= 0) return it; }
    return list[list.length - 1];
  };
  RNG.prototype.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  G.core.RNG = RNG;
  G.core.hashStr = hashStr;
  G.core.rng = new RNG(Date.now()); // hasard "libre" pour le combat
})();
