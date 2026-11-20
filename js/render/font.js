// Petite police pixel 3x5 pour les chiffres de dégâts.
(function () {
  const GL = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '011', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    '+': ['000', '010', '111', '010', '000'], '-': ['000', '000', '111', '000', '000'],
    ',': ['000', '000', '000', '010', '100'], 'k': ['100', '101', '110', '101', '101'],
    'M': ['101', '111', '111', '101', '101'], 'd': ['001', '001', '111', '101', '111'],
    ' ': ['000', '000', '000', '000', '000'],
  };
  // dessine un texte centré en (x, y) pixels ; renvoie false si un caractère manque
  G.render.pixelText = function (ctx, txt, x, y, color, s) {
    s = s || 1;
    for (const ch of txt) if (!GL[ch]) return false;
    const w = txt.length * 4 * s - s;
    let px = Math.round(x - w / 2), py = Math.round(y);
    for (const pass of [0, 1]) {
      ctx.fillStyle = pass ? color : '#120c18';
      let cx = px;
      for (const ch of txt) {
        const g = GL[ch];
        for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) {
          if (g[j][i] !== '1') continue;
          if (pass) ctx.fillRect(cx + i * s, py + j * s, s, s);
          else ctx.fillRect(cx + i * s - s, py + j * s - s, s * 3, s * 3);
        }
        cx += 4 * s;
      }
    }
    return true;
  };
})();
