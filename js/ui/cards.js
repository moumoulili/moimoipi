// =====================================================================
//  COLLECTION DE CARTES : fenêtre (Salle des trophées) + apparition
//  d'une carte quand elle tombe (sans mettre le jeu en pause).
// =====================================================================
(function () {
  const U = G.core.U, ui = G.ui, C = () => G.sys.cards;
  const KIND = { monster: 'Monstre', mini: 'Gardien', boss: 'Boss' };

  function cardHtml(card, stars, big) {
    const owned = stars > 0;
    return '<div class="mcard k-' + card.kind + (owned ? '' : ' locked') + (big ? ' big' : '') + '">' +
      '<div class="mc-art"><img alt="" src="' + G.render.spriteURL(Object.assign({ id: card.id }, card.sprite), big ? 6 : 4) + '"></div>' +
      '<div class="mc-name">' + (owned ? U.esc(card.name) : '???') + '</div>' +
      '<div class="mc-stars">' + (owned ? '★'.repeat(stars) + '<span>' + '★'.repeat(G.data.cardDrop.maxStars - stars) + '</span>' : KIND[card.kind]) + '</div>' +
      '<div class="mc-bonus">' + (owned ? C().bonusText(C().bonusOf(card, stars)) : C().bonusText(card.bonus)) + '</div></div>';
  }

  ui.cardsHtml = function () {
    const tb = C().bonus();
    let h = '<p class="small" style="text-align:center"><b>' + C().owned() + ' / ' + C().total() + '</b> cartes · très rares sur les monstres (0,15 %), élites (0,6 %), gardiens (4 %) et boss (8 %).<br>Un doublon ajoute une étoile (max ' + G.data.cardDrop.maxStars + ' ★).</p>' +
      '<div class="setbox"><b>Bonus de la collection (tous les héros)</b><div class="small">' + (Object.keys(tb).length ? C().bonusText(tb) : 'Aucune carte pour l\'instant.') + '</div></div>';
    for (const b of G.data.biomes) {
      const cards = G.data.cards.filter((c) => c.biome === b.id);
      const n = cards.filter((c) => C().stars(c.id)).length;
      h += '<h3 class="cmp-title">' + b.name + ' <span class="muted small">' + n + ' / ' + cards.length + '</span></h3><div class="mcards">' + cards.map((c) => cardHtml(c, C().stars(c.id))).join('') + '</div>';
    }
    return h;
  };

  // carte qui apparaît en grand au-dessus du jeu
  ui.cardPop = function (res) {
    const root = U.$('#app');
    const el = U.el('div', 'card-pop', '<div class="cp-title">' + (res.isNew ? '🃏 Nouvelle carte !' : res.maxed ? '🃏 Carte au maximum (+' + U.fmt(res.gold) + ' or)' : '🃏 Carte ★' + res.stars + ' !') + '</div>' + cardHtml(res.card, res.stars, true));
    root.appendChild(el);
    el.onclick = () => el.remove();
    setTimeout(() => el.classList.add('out'), 3200);
    setTimeout(() => el.remove(), 3800);
  };
})();
