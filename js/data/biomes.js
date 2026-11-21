// =====================================================================
//  BIOMES : un biome tous les 10 étages, puis le cycle recommence
//  en mode "Cauchemar" (monstres déjà renforcés par l'étage).
//  palette : couleurs des sols/murs (pixel art généré en code).
//  ambient : particules d'ambiance (poussière, lucioles, braises, neige...).
//  Les gardiens (mini-boss x5, boss x10) sont définis dans data/bosses.js (id biome + '_mini' / '_boss').
// =====================================================================
G.data.biomes = [
  { id: 'crypt', ambient: { kind: 'dust', color: '#b8a8d8' }, name: 'Crypte oubliée', element: 'shadow',
    palette: { floor: ['#3a3545', '#332e3d', '#433d52', '#2b2735'], wallTop: '#17141f', wallFace: ['#4d4660', '#3d3750'], mortar: '#25202f', light: '255,170,90' },
    monsters: ['skeleton', 'zombie', 'bat', 'ghost'], decor: ['bones', 'skull', 'cobweb'],
    guardians: { mini: { monster: 'skeleton', name: 'Capitaine squelette' }, boss: { monster: 'zombie', name: 'Goule ancestrale' } } },
  { id: 'forest', ambient: { kind: 'firefly', color: '#c8ff7a' }, name: 'Forêt maudite', element: 'earth',
    palette: { floor: ['#2f4a2a', '#2a4226', '#365431', '#243a20'], wallTop: '#0f1a0d', wallFace: ['#3d5a2a', '#2c4520'], mortar: '#1c2e16', light: '200,255,140' },
    monsters: ['wolf', 'spider', 'slime_green', 'treant'], decor: ['grass', 'mushroom', 'rock'],
    guardians: { mini: { monster: 'wolf', name: 'Alpha des ombres' }, boss: { monster: 'treant', name: 'Cœur-de-ronce' } } },
  { id: 'caves', ambient: { kind: 'drip', color: '#7fd8ff' }, name: 'Cavernes grondantes', element: 'lightning',
    palette: { floor: ['#3a3a40', '#33333a', '#44444c', '#2b2b31'], wallTop: '#141418', wallFace: ['#55555f', '#45454e'], mortar: '#25252b', light: '140,200,255' },
    monsters: ['cave_bat', 'goblin', 'spark_slime', 'stone_golem'], decor: ['rock', 'crystal'],
    guardians: { mini: { monster: 'goblin', name: 'Chef gobelin' }, boss: { monster: 'stone_golem', name: 'Colosse tonnerre' } } },
  { id: 'volcano', ambient: { kind: 'ember', color: '#ff8a3b' }, name: 'Fournaise', element: 'fire',
    palette: { floor: ['#3d2622', '#35201d', '#472c26', '#2e1b18'], wallTop: '#140a08', wallFace: ['#5a2e24', '#47231b'], mortar: '#24120e', light: '255,120,50' },
    monsters: ['fire_imp', 'magma_slime', 'hellhound', 'lava_golem'], decor: ['rock', 'skull', 'ember'],
    guardians: { mini: { monster: 'hellhound', name: 'Cerbère' }, boss: { monster: 'lava_golem', name: 'Seigneur du magma' } } },
  { id: 'ice', ambient: { kind: 'snow', color: '#ffffff' }, name: 'Glacier éternel', element: 'ice',
    palette: { floor: ['#5a7088', '#52677e', '#647b94', '#4a5e74'], wallTop: '#1a2430', wallFace: ['#8aa8c4', '#7090b0'], mortar: '#3a4c60', light: '180,230,255' },
    monsters: ['ice_wolf', 'yeti', 'frost_ghost', 'ice_slime'], decor: ['crystal', 'rock'],
    guardians: { mini: { monster: 'ice_wolf', name: 'Croc-de-givre' }, boss: { monster: 'yeti', name: 'Roi yéti' } } },
  { id: 'abyss', ambient: { kind: 'wisp', color: '#c06aff' }, name: 'Abysses', element: 'shadow',
    palette: { floor: ['#1f1a2e', '#1a1627', '#261f38', '#151220'], wallTop: '#07050c', wallFace: ['#2e2445', '#241c38'], mortar: '#100c18', light: '200,90,255' },
    monsters: ['abyss_eye', 'void_spider', 'shadow_ghost', 'demon'], decor: ['skull', 'crystal'],
    guardians: { mini: { monster: 'demon', name: 'Bourreau abyssal' }, boss: { monster: 'abyss_eye', name: 'Œil du néant' } } },
  { id: 'celestial', ambient: { kind: 'mote', color: '#fff3a8' }, name: 'Sanctuaire céleste', element: 'light',
    palette: { floor: ['#d8d0b8', '#cec6ac', '#e2dac4', '#c4bca2'], wallTop: '#3a3428', wallFace: ['#f0e8d0', '#ddd4b8'], mortar: '#a89e84', light: '255,240,180' },
    monsters: ['seraph', 'gold_golem', 'light_wisp', 'watcher_eye'], decor: ['crystal', 'grass'],
    guardians: { mini: { monster: 'gold_golem', name: 'Sentinelle dorée' }, boss: { monster: 'seraph', name: 'Archange déchu' } } },
];
// Biome d'un étage
G.data.biomeFor = function (floor) {
  const list = G.data.biomes;
  const idx = Math.floor((floor - 1) / 10);
  return { biome: list[idx % list.length], cycle: Math.floor(idx / list.length) };
};
