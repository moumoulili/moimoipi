// Génère les icônes PNG de l'appli (pixel art) sans dépendance.
// Usage : node tools/make-icons.js
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const ART = [ // 16x16 : épée croisée sur bouclier
  '................',
  '..oooooooooooo..',
  '.obbbbbbbbbbbbo.',
  '.obaaaaaaaaaabo.',
  '.obaaaammaaaabo.',
  '.obaaaawmaaaabo.',
  '.obaaaawmaaaabo.',
  '.obaccccccccabo.',
  '.obaaaawmaaaabo.',
  '.obaaaawmaaaabo.',
  '..obaaawmaaabo..',
  '..obaaawmaaabo..',
  '...obaaggaabo...',
  '....obaaaabo....',
  '.....obbbbo.....',
  '......oooo......',
];
const PAL = { '.': [18, 12, 24], o: [8, 4, 12], b: [227, 179, 65], a: [61, 111, 209], m: [201, 209, 220], w: [255, 255, 255], c: [138, 90, 43], g: [255, 211, 77] };
function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); }
function png(size) {
  const pad = Math.round(size * 0.12), cell = Math.floor((size - pad * 2) / 16), off = Math.floor((size - cell * 16) / 2);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const i = Math.floor((x - off) / cell), j = Math.floor((y - off) / cell);
      const ch = i >= 0 && j >= 0 && i < 16 && j < 16 ? ART[j][i] : '.';
      const [r, g, b] = PAL[ch];
      const p = y * (size * 3 + 1) + 1 + x * 3; raw[p] = r; raw[p + 1] = g; raw[p + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
for (const s of [192, 512]) fs.writeFileSync(path.join(__dirname, '..', 'assets', 'icons', 'icon-' + s + '.png'), png(s));
console.log('icônes générées');
