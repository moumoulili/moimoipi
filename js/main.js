// =====================================================================
//  DÉMARRAGE DU JEU
// =====================================================================
(function () {
  const st0 = G.core.save.load();
  if (!st0 || !G.state.heroes.length) G.sys.heroes.createStarting();

  G.render.init(document.getElementById('game'), document.getElementById('canvas-wrap'));
  G.ui.buildTabs();
  G.ui.initHud();
  G.core.loop.setSpeed(G.state.settings.speed || 1);

  if (G.state.run) {
    G.sys.run.resume();
    G.ui.log('Reprise de l\'expédition à l\'étage ' + G.state.run.floor + '.', 'info');
  } else {
    G.ui.log('Bienvenue ! Lance une expédition pour commencer.', 'info');
  }
  G.ui.show('dungeon');
  G.render.loadSpriteFiles().then(() => G.core.loop.start());

  // sauvegarde quand on quitte / met l'appli en arrière-plan
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.core.save.save(); });
  window.addEventListener('pagehide', () => G.core.save.save());

  // mode hors ligne (uniquement en https / localhost)
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  }
})();
