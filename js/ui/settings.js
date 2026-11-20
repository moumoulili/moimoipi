// =====================================================================
//  ÉCRAN OPTIONS : réglages, export/import de sauvegarde, remise à zéro.
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui;
  ui.screens.settings = {
    render() {
      const st = G.state, s = st.settings, el = U.$('#screen-settings');
      el.innerHTML =
        '<div class="panel"><h2>⚙️ Options</h2>' +
        '<p><b>Après un gardien vaincu</b></p><select id="op-cp">' +
        '<option value="ask">Me demander (10 s pour choisir)</option>' +
        '<option value="continue">Toujours continuer</option>' +
        '<option value="retreat">Toujours rentrer en ville</option></select>' +
        '<label class="toggle"><span>Relancer une expédition après une défaite</span><input type="checkbox" id="op-auto"></label>' +
        '<label class="toggle"><span>Vibrations</span><input type="checkbox" id="op-vib"></label>' +
        '<label class="toggle"><span>Flashs à l\'écran (critiques, boss)</span><input type="checkbox" id="op-flash"></label></div>' +

        '<div class="panel"><h3>Sauvegarde</h3><p class="muted">Le jeu se sauvegarde tout seul. Pour transférer ta partie ou la mettre à l\'abri, copie ce texte :</p>' +
        '<div class="row"><button class="pxbtn small" id="op-exp">Exporter</button><button class="pxbtn small" id="op-copy">Copier</button></div>' +
        '<textarea id="op-text" placeholder="Colle ici une sauvegarde exportée puis appuie sur Importer"></textarea>' +
        '<div class="row" style="margin-top:6px"><button class="pxbtn small primary" id="op-imp">Importer</button></div></div>' +

        '<div class="panel"><h3>Zone dangereuse</h3><button class="pxbtn danger wide" id="op-reset">Effacer la partie</button></div>' +
        '<p class="muted" style="text-align:center;font-size:12px">Moimoipi · phase 1 · ' + (navigator.serviceWorker && navigator.serviceWorker.controller ? 'hors ligne prêt' : 'en ligne') + '</p>';
      const cp = U.$('#op-cp'); cp.value = s.checkpointMode; cp.onchange = () => { s.checkpointMode = cp.value; G.core.save.save(); };
      const au = U.$('#op-auto'); au.checked = s.autoRestart; au.onchange = () => { s.autoRestart = au.checked; G.core.save.save(); };
      const vb = U.$('#op-vib'); vb.checked = s.vibrate; vb.onchange = () => { s.vibrate = vb.checked; G.core.save.save(); };
      const fl = U.$('#op-flash'); fl.checked = s.flashes; fl.onchange = () => { s.flashes = fl.checked; G.core.save.save(); };
      const ta = U.$('#op-text');
      U.$('#op-exp').onclick = () => { ta.value = G.core.save.exportText(); ta.select(); };
      U.$('#op-copy').onclick = async () => {
        if (!ta.value) ta.value = G.core.save.exportText();
        try { await navigator.clipboard.writeText(ta.value); ui.toast('Sauvegarde copiée'); }
        catch (e) { ta.select(); document.execCommand && document.execCommand('copy'); ui.toast('Sélectionné : copie-le'); }
      };
      U.$('#op-imp').onclick = () => {
        if (!ta.value.trim()) return ui.toast('Colle d\'abord une sauvegarde', 'danger');
        ui.confirm('Importer ?', '<p>La partie actuelle sera remplacée.</p>', 'Importer', () => {
          try { G.core.save.importText(ta.value); } catch (e) { ui.toast('Import impossible : ' + e.message, 'danger'); }
        });
      };
      U.$('#op-reset').onclick = () => ui.confirm('Tout effacer ?', '<p>Toute ta progression sera perdue définitivement.</p>', 'Effacer', () => G.core.save.reset());
    },
  };
})();
