// =====================================================================
//  BOUCLE DE JEU : la simulation avance par petits pas fixes (30/s),
//  multipliés par la vitesse (x1/x2/x4). L'affichage suit à chaque image.
// =====================================================================
(function () {
  const L = { speed: 1 };
  let acc = 0, last = 0, saveT = 0;
  const STEP = 1 / G.data.balance.tickRate;

  function frame(now) {
    const dt = Math.min(0.25, (now - last) / 1000 || 0);
    last = now;
    acc += dt * L.speed;
    let n = 0;
    while (acc >= STEP && n < 16) { G.sys.run.update(STEP); acc -= STEP; n++; }
    if (n >= 16) acc = 0;
    G.render.draw(dt);
    G.ui.tick && G.ui.tick(dt);
    saveT += dt;
    if (saveT >= G.data.balance.autosaveEvery) { saveT = 0; G.core.save.save(); }
    requestAnimationFrame(frame);
  }
  L.start = function () { last = performance.now(); requestAnimationFrame(frame); };
  L.setSpeed = function (s) { L.speed = s; G.state.settings.speed = s; };
  G.core.loop = L;
})();
