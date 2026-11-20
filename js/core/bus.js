// Bus d'événements : les systèmes annoncent ce qui se passe ("monstre tué",
// "étage atteint"...), et les autres (quêtes, succès, interface) écoutent.
// Ça permet d'ajouter des fonctionnalités sans toucher au moteur.
(function () {
  const handlers = {};
  G.core.bus = {
    on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    off(evt, fn) { handlers[evt] = (handlers[evt] || []).filter((f) => f !== fn); },
    emit(evt, data) {
      const list = handlers[evt];
      if (!list) return;
      for (const fn of list) { try { fn(data); } catch (e) { console.error('bus', evt, e); } }
    },
  };
})();
