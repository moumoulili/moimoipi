// =====================================================================
//  BUTIN : objets et matériaux lâchés par les monstres et les coffres.
// =====================================================================
(function () {
  const B = G.data.balance, IT = G.sys.items, U = G.core.U;
  const rng = G.core.rng;
  const L = {};
  let lastUpToast = 0;

  function give(run, item, x, y) {
    const res = G.sys.inventory.receive(item);
    const r = IT.rarity(item.rarity), ri = IT.rIdx(item.rarity);
    run.saved.items = (run.saved.items || 0) + 1;
    G.render.fx.loot(x, y, item);
    const col = '<span style="color:' + r.color + '">' + U.esc(item.name) + '</span>';
    if (res.fate === 'sold') G.ui.log('Vendu auto : ' + item.name + ' (+' + U.fmt(res.gold) + ' or)', 'muted');
    else if (res.fate === 'salvaged') G.ui.log('Recyclé auto : ' + item.name, 'muted');
    else G.ui.log({ html: 'Butin : ' + col + (res.up ? ' <b class="up">▲</b>' : '') });
    if (res.fate === 'equipped') G.ui.toast('⚡ ' + U.esc(res.up.hero.name) + ' équipe ' + col);
    else if (res.up && res.fate === 'kept' && res.up.gain > 0.03 && Date.now() - lastUpToast > 5000) {
      lastUpToast = Date.now();
      G.ui.toast('▲ ' + col + ' : meilleur pour ' + U.esc(res.up.hero.name));
    }
    if (ri >= 3) { // épique ou mieux
      G.ui.toast('✨ ' + r.name + ' : ' + col, 'rarity');
      U.vibrate(ri >= 4 ? [80, 50, 80, 50, 160] : [60, 40, 60]);
      G.render.fx.flash(r.color, ri >= 4 ? 0.3 : 0.15);
      G.render.fx.shake(ri >= 4 ? 0.3 : 0.12);
    }
    G.core.bus.emit('item:drop', { item, fate: res.fate });
  }
  function giveMat(run, id, n) {
    G.state.materials[id] = (G.state.materials[id] || 0) + n;
    run.saved.mats = run.saved.mats || {};
    run.saved.mats[id] = (run.saved.mats[id] || 0) + n;
  }

  L.onMonsterKill = function (run, m) {
    const mf = run.magicFind || 0;
    const ilvl = m.level;
    if (m.guardian) {
      const g = B.guardianDrops[m.guardian];
      for (let i = 0; i < g.n; i++) {
        const minR = g.bonus && i === 0 ? g.bonus : g.minRarity;
        give(run, IT.create(rng, { rarity: IT.rollRarity(rng, ilvl, mf, minR), ilvl: ilvl + rng.int(0, 2) }), m.x + rng.float(-0.4, 0.4), m.y);
      }
      if (m.guardian === 'boss') giveMat(run, 'ether', B.materialDrops.bossEther);
      giveMat(run, 'dust', B.materialDrops.miniDust);
      return;
    }
    const ch = m.elite ? B.dropChance.elite : B.dropChance.normal;
    if (rng.chance(ch * (1 + mf * 0.5))) give(run, IT.create(rng, { rarity: IT.rollRarity(rng, ilvl, mf, m.elite ? 'uncommon' : null), ilvl }), m.x, m.y);
    if (m.elite) giveMat(run, 'scrap', B.materialDrops.eliteScrap);
    else if (rng.chance(B.materialDrops.scrap)) giveMat(run, 'scrap', 1);
  };
  L.onChest = function (run, c) {
    for (let i = 0; i < B.chestItems; i++) give(run, IT.create(rng, { rarity: IT.rollRarity(rng, run.saved.floor, (run.magicFind || 0) + 0.3), ilvl: run.saved.floor }), c.x + 0.5, c.y + 0.5);
  };
  G.sys.loot = L;
})();
