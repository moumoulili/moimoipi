// =====================================================================
//  ICÔNES PIXEL ART DE L'INTERFACE (onglets) — 12x12, agrandies.
// =====================================================================
Object.assign(G.render.templates, {
  tab_dungeon: ['oo........oo', 'owo......owo', '.owo....owo.', '..owo..owo..', '...owoowo...', '....owwo....', '....owwo....', '...owoowo...', '.occo..occo.', '.occo..occo.', 'oco......oco', 'oo........oo'],
  tab_team: ['.oooooooooo.', 'ommmmmmmmmmo', 'omaaaaaaaamo', 'omaaaccaaamo', 'omaaccccaamo', 'omaaaccaaamo', 'omaaaccaaamo', '.omaaaaaamo.', '.omaaaaaamo.', '..omaaaamo..', '...ommmmo...', '....oooo....'],
  tab_bag: ['...oooooo...', '..oaaaaaao..', '..oao..oao..', '.oooooooooo.', 'oaaaaaaaaaao', 'oaaoooooaaao', 'oaaocccoaaao', 'oaaoooooaaao', 'oaaaaaaaaaao', 'oAaaaaaaaaAo', 'oAAaaaaaaAAo', '.oooooooooo.'],
  tab_town: ['o.o......o.o', 'ooo..cc..ooo', 'oao.oooo.oao', 'oao.oaao.oao', 'oaoooaaoooao', 'oaaaaaaaaaao', 'oaaoaaaaoaao', 'oaaaaaaaaaao', 'oaaaaooaaaao', 'oaaaoddoaaao', 'oAaaoddoaaAo', 'oooooooooooo'],
  tab_mine: ['...oooooo...', '.oommmmmmoo.', 'om..owwo..mo', 'o...owwo...o', '....owwo....', '....owwo....', '....owwo....', '....owwo....', '....owwo....', '....owwo....', '....owwo....', '.....oo.....'],
  tab_settings: ['....oooo....', '.oo.oaao.oo.', '.oaoaaaaoao.', '..oaaaaaao..', 'ooaaooooaaoo', 'oaaao..oaaao', 'oaaao..oaaao', 'ooaaooooaaoo', '..oaaaaaao..', '.oaoaaaaoao.', '.oo.oaao.oo.', '....oooo....'],
});
G.render.tabIcons = {
  dungeon: { tpl: 'tab_dungeon', pal: { w: '#e8eef4', c: '#e3b341', shade: 1 } },
  team: { tpl: 'tab_team', pal: { m: '#c9d1dc', a: '#3d6fd1', c: '#ffd34d', shade: 1 } },
  bag: { tpl: 'tab_bag', pal: { a: '#a0642c', c: '#ffd34d', shade: 1 } },
  town: { tpl: 'tab_town', pal: { a: '#b8b0c0', c: '#e3b341', d: '#5a3a1a', shade: 1 } },
  mine: { tpl: 'tab_mine', pal: { m: '#a8b0bc', w: '#a0703c', shade: 1 } },
  settings: { tpl: 'tab_settings', pal: { a: '#a8b0bc', shade: 1 } },
};
G.render.tabIconURL = (id) => G.render.spriteURL(G.render.tabIcons[id], 3);
