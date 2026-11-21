// =====================================================================
//  BOUTIQUE : potions + quelques objets qui changent régulièrement.
//  Les prix suivent l'étage record pour rester utiles toute la partie.
// =====================================================================
(function () {
  const B = G.data.balance, IT = G.sys.items;
  const S = {};
  const floorRef = () => Math.max(1, G.sys.dungeon.bestLevel());
  const sv = () => G.sys.town.val('shop');
  S.priceMult = () => Math.pow(floorRef(), 1.2) * (1 - sv().discount);
  S.potionPrice = (id) => Math.round(G.data.potions[id].price * S.priceMult() * (id === 'revive' ? 1 - G.sys.town.val('temple').revive : 1));
  S.maxPotions = () => G.sys.town.val('warehouse').potions;
  S.buyPotion = function (id, n) {
    n = Math.min(n || 1, S.maxPotions() - (G.state.potions[id] || 0));
    const price = S.potionPrice(id);
    n = Math.min(n, Math.floor(G.state.gold / price));
    if (n <= 0) return 0;
    G.state.gold -= price * n;
    G.state.potions[id] = (G.state.potions[id] || 0) + n;
    return n;
  };
  S.itemPrice = (item) => Math.round(IT.value(item) * B.shop.priceMult * (1 - sv().discount));
  S.refreshCost = () => Math.round(40 * S.priceMult());
  S.restock = function () {
    const rng = G.core.rng, sh = G.state.shop;
    sh.items = [];
    for (let i = 0; i < sv().items; i++) sh.items.push(IT.create(rng, { rarity: IT.rollRarity(rng, floorRef(), 0.2 + sv().mf, B.shop.minRarity), ilvl: floorRef() }));
    sh.refreshAt = Date.now() + B.shop.refreshMinutes * 60000;
  };
  S.stock = function () {
    if (!G.state.shop.refreshAt || Date.now() >= G.state.shop.refreshAt) S.restock();
    return G.state.shop.items;
  };
  S.paidRefresh = function () {
    const c = S.refreshCost();
    if (G.state.gold < c) return false;
    G.state.gold -= c; S.restock(); return true;
  };
  S.buyItem = function (uid) {
    const sh = G.state.shop, it = sh.items.find((i) => i.uid === uid);
    if (!it || G.sys.inventory.full()) return false;
    const p = S.itemPrice(it);
    if (G.state.gold < p) return false;
    G.state.gold -= p;
    sh.items.splice(sh.items.indexOf(it), 1);
    it.isNew = true;
    G.state.inventory.push(it);
    return true;
  };
  G.sys.shop = S;
})();
