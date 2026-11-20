// =====================================================================
//  ICÔNES PIXEL ART DES OBJETS (12x12) + palettes.
//  g = gemme (prend la couleur de la rareté), m/l = métal, w = bois,
//  a/b = matière principale (cuir, tissu), c = ornement doré.
// =====================================================================
Object.assign(G.render.templates, {
  i_sword: ['..........oo', '.........olo', '........olmo', '.......olmo.', '......olmo..', '.....olmo...', '..o.olmo....', '..ocomo.....', '...occo.....', '..owoco.....', '.owwo.o.....', '.ogo........'],
  i_axe: ['...oooo.....', '..ollmmo....', '.ollmmmmo...', '.olmmmmowo..', '.olmmmmowo..', '..ommmowo...', '...oooowo...', '.....owo....', '....owo.....', '...owo......', '..ogo.......', '...o........'],
  i_mace: ['......o.o.o.', '.......ooooo', '......olmmmo', '.....oolmmmo', '......ommmo.', '.....owoooo.', '....owo.....', '...owo......', '..owo.......', '.ocwo.......', '.ogo........', '..o.........'],
  i_spear: ['..........o.', '.........olo', '........olmo', '.......olmo.', '......ocoo..', '.....owo....', '....owo.....', '...owo......', '..owo.......', '.owo........', 'owo.........', 'oo..........'],
  i_bow: ['...oo.......', '..owwo......', '..owoolo....', '.owo..lo....', '.owo..lo....', 'owo...lo....', 'owo...lo....', '.owo..lo....', '.owo..lo....', '..owoolo....', '..owwo......', '...oo.......'],
  i_crossbow: ['............', '.oo......oo.', '.olo....olo.', '..oloooolo..', '...owwwwo...', '...owmmwo...', '...owwwwo...', '....owwo....', '....owwo....', '....owwo....', '....oooo....', '............'],
  i_dagger: ['............', '.........oo.', '........olo.', '.......olmo.', '......olmo..', '.....olmo...', '...o.omo....', '...ococo....', '....owo.....', '...owo......', '...ogo......', '....o.......'],
  i_staff: ['.......oooo.', '......oggggo', '......oggwgo', '.......occo.', '......owo...', '.....owo....', '....owo.....', '...owo......', '..owo.......', '.owo........', 'owo.........', 'oo..........'],
  i_wand: ['........o...', '.......ogo..', '......ogwgo.', '.......ogo..', '......owo...', '.....owo....', '....owo.....', '...owo......', '..owo.......', '..oo........', '............', '............'],
  i_holybook: ['............', '..oooooooo..', '.oaaaaaaaao.', '.oaaacaaaao.', '.oaacccaaao.', '.oaaacaaaao.', '.oaaacaaaao.', '.oaaaaaaaao.', '.oaaaaaaaao.', '.ollllllllo.', '.oooooooooo.', '............'],
  i_tome: ['............', '..oooooooo..', '.oaaaaaaaao.', '.oaaaogaaao.', '.oaaoggoaao.', '.oaogwggoao.', '.oaaoggoaao.', '.oaaaogaaao.', '.oaaaaaaaao.', '.ollllllllo.', '.oooooooooo.', '............'],
  i_shield: ['.oooooooooo.', '.ommmmmmmmo.', '.omaaaaaamo.', '.omaaggaamo.', '.omaggggamo.', '.omaaggaamo.', '.omaaaaaamo.', '..omaaaamo..', '..omaaaamo..', '...omaamo...', '....ommo....', '.....oo.....'],
  i_quiver: ['.l..l..l....', '.ll.ll.ll...', '..o.o.o.....', '.oooooooo...', '.owwwwwwo...', '.owaaaawo...', '.owaaaawo...', '.owwgwwwo...', '.owaaaawo...', '.owaaaawo...', '.owwwwwwo...', '..oooooo....'],
  i_relic: ['....oooo....', '...occcco...', '...ocoocoo..', '...occcco...', '..oooccooo..', '.occcccccco.', '..oooccooo..', '....occo....', '....ogco....', '....occo....', '....occo....', '....oooo....'],
  i_helm: ['............', '...oooooo...', '..ommmmmmo..', '.omlmmmmmmo.', '.omlmmmmmmo.', '.ommoooommo.', '.omoggggomo.', '.ommmmmmmmo.', '..ommoommo..', '..omo..omo..', '..oo....oo..', '............'],
  i_hood: ['....oooo....', '...oaaaao...', '..oaaaaaao..', '.oaaboobaao.', '.oabo..obao.', '.oabo..obao.', '.oaaboobaao.', '..oaaaaaao..', '.oaaaaaaaao.', 'oaaaagaaaaao', 'oooooooooooo', '............'],
  i_hat: ['.......oo...', '......oaao..', '.....oaao...', '....oaaao...', '....oaaaao..', '...oaaaaao..', '...occgcco..', '.oooooooooo.', 'oaaaaaaaaaao', '.oooooooooo.', '............', '............'],
  i_plate: ['..oo....oo..', '.ommoooommo.', 'omlmmmmmmmmo', 'omlmmggmmmmo', 'omlmmmmmmmmo', '.oolmmmmmoo.', '..olmmmmmo..', '..olmmmmmo..', '..ommccmmo..', '..ommmmmmo..', '...oooooo...', '............'],
  i_leather: ['..oo....oo..', '.oaaoooaao..', 'oaaaaaaaaao.', 'oabaaaaaabo.', 'oabaacgaabo.', '.oobaaaaboo.', '..obaaaabo..', '..obaaaabo..', '..occccccoo.', '..oaaaaaao..', '...oooooo...', '............'],
  i_robe: ['...oo..oo...', '..oaaooaao..', '.oaaaccaaao.', '.oaaacaaaao.', '.oaaagaaaao.', '..oaacaaao..', '..oaacaaao..', '.oaaacaaaao.', '.oaaacaaaao.', 'oaaaacaaaaao', 'oooooooooooo', '............'],
  i_gloves: ['............', '...o.o.o....', '..oaoaoao...', '..oaoaoao.o.', '..oaaaaaaoao', '..oaaaaaaaao', '..oaaaaaaao.', '...oaaaaao..', '...occgcco..', '...obbbbbo..', '...ooooooo..', '............'],
  i_boots: ['............', '...oooooo...', '...oaaaao...', '...oaaaao...', '...oaaaao...', '...ocgcco...', '...oaaaaoo..', '...oaaaaaao.', '..oaaaaaaaao', '..obbbbbbbbo', '..oooooooooo', '............'],
  i_belt: ['............', '............', '............', 'oooooooooooo', 'oaaaocccoaao', 'obbbocgcobbo', 'oaaaocccoaao', 'oooooooooooo', '............', '............', '............', '............'],
  i_cape: ['...oooooo...', '..oaccgcao..', '..oaaaaaao..', '.oaaaaaaaao.', '.oaaaaaaaao.', '.oaabaabaao.', 'oaaabaabaaao', 'oaaabaabaaao', 'oaabaabaabao', 'oaabaabaabao', 'oooooooooooo', '............'],
  i_amulet: ['..oo....oo..', '.oco....oco.', '.oc......co.', '..oc....co..', '...oc..co...', '....occo....', '...occcco...', '..ocggggco..', '..ocgwggco..', '..ocggggco..', '...occcco...', '....oooo....'],
  i_ring: ['............', '....oooo....', '...oggggo...', '...ogwggo...', '....oooo....', '...occcco...', '..oco..oco..', '..oc....co..', '..oc....co..', '..oco..oco..', '...occcco...', '....oooo....'],
  i_potion: ['....oooo....', '....owwo....', '.....oo.....', '....owwo....', '...owaaao...', '..owaaaaao..', '..oaaaaaao..', '..oaaaaaao..', '..obaaaaao..', '...obbbbo...', '....oooo....', '............'],
});

(function () {
  const METAL = { m: '#c9d1dc', l: '#ffffff', c: '#e3b341', w: '#8a5a2b' };
  // palette de base par type d'objet
  const PAL = {
    sword: METAL, axe: METAL, mace: METAL, spear: METAL, dagger: METAL, parry: METAL,
    bow: { w: '#a0703c', l: '#e8e0c8' }, crossbow: { w: '#8a5a2b', m: '#c9d1dc', l: '#c9d1dc' },
    staff: { w: '#8a5a2b', c: '#e3b341' }, wand: { w: '#c9a070' },
    holybook: { a: '#f0ead8', c: '#e3b341', l: '#ffffff' }, tome: { a: '#5a3a8a', l: '#e8e0c8' },
    shield: { m: '#c9d1dc', a: '#3d6fd1' }, quiver: { w: '#8a5a2b', a: '#6a4a24', l: '#e8e0c8' }, relic: { c: '#e3b341' },
    helm: { m: '#a8b0bc', l: '#e8eef4' }, hood: { a: '#4a7a3a', b: '#2a4a20' }, hat: { a: '#5a3fa5', c: '#e3b341' },
    plate: { m: '#a8b0bc', l: '#e8eef4', c: '#e3b341' }, leather: { a: '#8a5a2b', b: '#5a3a1a', c: '#c9d1dc' }, robe: { a: '#6a3fb5', c: '#e3b341' },
    gauntlets: { a: '#a8b0bc', b: '#6a7280', c: '#e3b341' }, gloves: { a: '#8a5a2b', b: '#5a3a1a', c: '#c9d1dc' }, mitts: { a: '#6a3fb5', b: '#4a2a85', c: '#e3b341' },
    sabatons: { a: '#a8b0bc', b: '#6a7280', c: '#e3b341' }, boots: { a: '#8a5a2b', b: '#5a3a1a', c: '#c9d1dc' }, slippers: { a: '#6a3fb5', b: '#4a2a85', c: '#e3b341' },
    belt: { a: '#8a5a2b', b: '#5a3a1a', c: '#e3b341' }, cape: { a: '#a4343a', b: '#7a2028', c: '#e3b341' },
    amulet: { c: '#e3b341', w: '#ffffff' }, ring: { c: '#e3b341', w: '#ffffff' },
  };
  G.render.itemSprite = function (item) {
    const base = G.data.itemBases[item.base];
    const rar = G.data.rarities[G.data.rarityIndex[item.rarity]];
    const pal = Object.assign({ w: '#ffffff' }, PAL[item.base] || METAL, { g: rar.color });
    if (item.base === 'amulet' || item.base === 'ring' || item.base === 'staff' || item.base === 'wand' || item.base === 'tome') pal.w = '#ffffff';
    return { tpl: base.icon, pal, id: 'item_' + item.base };
  };
  G.render.itemIconURL = (item, scale) => G.render.spriteURL(G.render.itemSprite(item), scale || 3);
  G.render.potionIconURL = (id, scale) => G.render.spriteURL({ tpl: 'i_potion', pal: { a: G.data.potions[id].icon, b: '#00000055', w: '#e8eef4' } }, scale || 3);
})();
