// Génère les icônes PNG de l'appli (pixel art) sans dépendance.
// Usage : node tools/make-icons.js
const fs = require('fs'), zlib = require('zlib'), path = require('path');
// 20x20 : bouclier bleu et or, deux épées croisées, cadre doré
const ART = [
  '....................',
  '.mm..............mm.',
  '.mwm............mwm.',
  '..mwm..........mwm..',
  '...mwmoooooooomwm...',
  '...omwmggggggmwmo...',
  '...ogmwmbbbbmwmgo...',
  '...ogbmwmbbmwmbgo...',
  '...ogbbmwmmwmbbgo...',
  '...ogbbbmwwmbbbgo...',
  '...ogbbbmwwmbbbgo...',
  '...ogbbmwmmwmbbgo...',
  '...ogbmwmbbmwmbgo...',
  '....ocmcbbbbcmco....',
  '...occcogbbgocccc...',
  '..occo..ogbgo..occo.',
  '..oo.....ogo.....oo.',
  '..........o.........',
  '....................',
  '....................',
];
const PAL = { o: [20, 10, 18], m: [150, 160, 178], w: [245, 248, 255], g: [235, 185, 70], b: [52, 96, 200], c: [150, 96, 40] };
function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(size) {
  const N = ART.length, pad = Math.round(size * 0.14), cell = Math.floor((size - pad * 2) / N), off = Math.floor((size - cell * N) / 2);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      // fond : dégradé violet sombre + cadre doré
      const dx = x / size - 0.5, dy = y / size - 0.45, d = Math.sqrt(dx * dx + dy * dy);
      let col = [Math.round(70 - d * 80), Math.round(40 - d * 50), Math.round(90 - d * 90)].map((v) => Math.max(10, v));
      const edge = Math.min(x, y, size - 1 - x, size - 1 - y), fw = Math.max(2, Math.round(size * 0.035));
      if (edge < fw) col = [200, 150, 50]; else if (edge < fw * 1.6) col = [90, 60, 20];
      const i = Math.floor((x - off) / cell), j = Math.floor((y - off) / cell);
      const ch = i >= 0 && j >= 0 && i < N && j < N ? ART[j][i] : '.';
      if (ch !== '.') {
        col = PAL[ch].slice();
        // ombrage pixel : haut éclairci, bas assombri
        const up = j > 0 ? ART[j - 1][i] : '.', dn = j < N - 1 ? ART[j + 1][i] : '.';
        if (ch !== 'o' && (up === '.' || up === 'o')) col = col.map((v) => Math.min(255, v + (255 - v) * 0.25));
        else if (ch !== 'o' && (dn === '.' || dn === 'o')) col = col.map((v) => v * 0.8);
      }
      const p = y * (size * 3 + 1) + 1 + x * 3; raw[p] = col[0]; raw[p + 1] = col[1]; raw[p + 2] = col[2];
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const s of [192, 512]) fs.writeFileSync(path.join(__dirname, '..', 'assets', 'icons', 'icon-' + s + '.png'), png(s));
console.log('icônes générées');
