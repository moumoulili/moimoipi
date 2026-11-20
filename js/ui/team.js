// =====================================================================
//  ÉCRAN ÉQUIPE : stats détaillées et équipement de chaque héros.
//  (Recrutement, niveaux et classes en phase 3.)
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, IT = G.sys.items, INV = G.sys.inventory;
  let selId = null;
  const pct = (v) => Math.round(v * 1000) / 10 + ' %';

  ui.screens.team = {
    render() {
      const el = U.$('#screen-team');
      const team = G.sys.heroes.team();
      if (!team.find((h) => h.id === selId)) selId = team[0].id;
      const hero = G.sys.heroes.get(selId), c = G.data.classes[hero.cls], s = G.sys.stats.hero(hero);
      let h = '<div class="hero-tabs">' + team.map((t) => '<button class="htab ' + (t.id === selId ? 'sel' : '') + '" data-h="' + t.id + '"><img alt="" src="' + G.render.spriteURL(G.data.classes[t.cls].sprite, 3) + '"><span>' + U.esc(t.name) + '</span></button>').join('') + '</div>';
      const magic = c.attack.dmgType === 'magic';
      let extra = '';
      const add = (n, v) => (extra += '<div>' + n + ' <b>' + v + '</b></div>');
      if (s.healMult > 1) add('Soins', '+' + pct(s.healMult - 1));
      if (s.lifesteal) add('Vol de vie', pct(s.lifesteal));
      if (s.thorns) add('Épines', pct(s.thorns));
      if (s.echo) add('Double frappe', pct(s.echo));
      if (s.bossDmg) add('Contre gardiens', '+' + pct(s.bossDmg));
      if (s.onKillHeal) add('Soin par victime', pct(s.onKillHeal));
      if (s.goldFind) add('Or trouvé', '+' + pct(s.goldFind));
      if (s.magicFind) add('Chance de butin', '+' + pct(s.magicFind));
      for (const e in s.elemDmg) add(G.data.elements[e].icon + ' Dégâts ' + G.data.elements[e].name.toLowerCase(), Math.round(s.elemDmg[e]));
      for (const e in s.res) add(G.data.elements[e].icon + ' Résist. ' + G.data.elements[e].name.toLowerCase(), pct(s.res[e]));
      h += '<div class="panel"><div class="row"><img alt="" class="portrait" src="' + G.render.spriteURL(c.sprite, 5) + '"><div><h2 style="margin:0">' + U.esc(hero.name) + '</h2>' +
        '<span class="tag">' + c.name + '</span><span class="tag">' + G.data.roles[c.role] + '</span> <span class="muted">niv. ' + hero.level + '</span></div></div>' +
        '<div class="stat-grid" style="margin-top:8px">' +
        '<div>PV <b>' + U.fmt(s.maxHp) + '</b></div><div>' + (magic ? 'Puissance mag.' : 'Attaque') + ' <b>' + Math.round(magic ? s.matk : s.atk) + '</b></div>' +
        '<div>Défense <b>' + Math.round(s.def) + '</b></div><div>Vitesse <b>' + Math.round(s.spd) + '</b></div>' +
        '<div>Critique <b>' + pct(s.crit) + '</b></div><div>Dégâts crit. <b>' + pct(s.critDmg) + '</b></div>' +
        '<div>Esquive <b>' + pct(s.dodge) + '</b></div><div>Vit. d\'attaque <b>' + (s.wspd * (1 + s.atkSpd) >= 1 ? '+' : '') + pct(s.wspd * (1 + s.atkSpd) - 1) + '</b></div>' +
        (s.dmgMult > 1 ? '<div>Dégâts <b>+' + pct(s.dmgMult - 1) + '</b></div>' : '') + extra +
        '</div><p class="muted small" style="margin:8px 0 0">Porte : ' + c.desc + '<br>Armes : ' + G.data.classGear[hero.cls].weapons.map((w) => G.data.itemBases[w].name).join(', ') +
        ' · Armures : ' + G.data.classGear[hero.cls].armor.map((w) => ({ heavy: 'lourdes', medium: 'moyennes', light: 'légères' }[w])).join(', ') + '</p></div>';

      h += '<div class="panel"><h3>Équipement</h3><div class="equip-grid">';
      for (const slot of G.data.slotOrder) {
        const it = hero.equip[slot];
        const sd = G.data.slots[slot];
        if (it) {
          const r = IT.rarity(it.rarity);
          h += '<button class="eslot" data-slot="' + slot + '" style="--rc:' + r.color + '"><img alt="" src="' + G.render.itemIconURL(it, 3) + '"><span class="es-n" style="color:' + r.color + '">' + U.esc(it.name) + '</span><span class="es-s">' + sd.short + ' · niv. ' + it.ilvl + '</span></button>';
        } else {
          const n = G.state.inventory.filter((x) => IT.base(x).slot === (sd.accepts || slot) && IT.canUse(hero, x)).length;
          h += '<button class="eslot empty" data-slot="' + slot + '"><span class="es-e">+</span><span class="es-n">' + sd.short + '</span><span class="es-s">' + (n ? n + ' dispo.' : 'vide') + '</span></button>';
        }
      }
      h += '</div><div class="row" style="margin-top:10px"><button class="pxbtn primary" style="flex:1" id="tm-auto">⚡ Équiper le meilleur</button><button class="pxbtn" style="flex:1" id="tm-all">⚡ Toute l\'équipe</button></div></div>';
      h += '<div class="panel muted small">Recrutement à la taverne, niveaux et classes : phase 3.</div>';
      el.innerHTML = h;
      el.querySelectorAll('[data-h]').forEach((b) => (b.onclick = () => { selId = b.dataset.h; this.render(); }));
      const rer = () => this.render();
      el.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => {
        const slot = b.dataset.slot, it = hero.equip[slot];
        if (it) ui.itemDetail(it, { from: 'equipped', hero, slot, onDone: rer });
        else ui.slotPicker(hero, slot, rer);
      }));
      U.$('#tm-auto').onclick = () => { const n = INV.autoEquip(hero); ui.toast(n ? n + ' objet(s) équipé(s)' : 'Déjà le meilleur équipement'); this.render(); };
      U.$('#tm-all').onclick = () => { const n = INV.autoEquipTeam(); ui.toast(n ? n + ' objet(s) équipé(s)' : 'Déjà le meilleur équipement'); this.render(); };
    },
  };
})();
