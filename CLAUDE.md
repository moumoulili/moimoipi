# Moimoipi – Donjons Idle

Jeu web mobile (portrait) d'exploration de donjons automatique en **pixel art**.
L'équipe de 4 aventuriers explore, combat **en temps réel sur la carte** et ramasse le butin seule ;
le joueur gère l'équipe, l'équipement, la ville et la progression.

## Contraintes
- HTML + CSS + JS (Canvas 2D), **sans build**, ouvrable en `file://` → **scripts classiques**
  (pas de modules ES) rangés dans l'objet global `G`. L'ordre de chargement est dans `index.html`.
- PWA : `manifest.webmanifest` + `sw.js` (réseau d'abord, cache en secours). **Changer `VERSION`
  dans `sw.js` et y ajouter tout nouveau fichier JS** à chaque phase.
- Sauvegarde localStorage (`moimoipi-save`), versionnée (`save.js` : `VERSION` + `migrations`).
  Export/import texte `MMP1:<base64>:<checksum>`.
- Toutes les données dans `js/data/`. Toutes les constantes d'équilibrage dans `js/data/balance.js`.
- Pixel art généré en code : héros et monstres en **16x16** (`js/render/sprites16.js`, demande utilisateur : plus détaillés),
  objets/décors en 12x12 ou 8x8 (`pixelart.js`, `itemart.js`). Minuscule = couleur de palette, MAJUSCULE = ombre (×0,68),
  ombrage automatique des sprites ≥16 px (haut éclairci, bas assombri), couleurs par défaut `DEF` dans sprites.js.
  Remplaçable par des PNG via `G.render.spriteFiles = { id: 'assets/sprites/id.png' }`.
- **Style visuel « fantasy/épique »** (demande utilisateur) : boutons `.pxbtn` sculptés (coins taillés via clip-path,
  bordure = ::before, remplissage = ::after ; variantes primary/gold/danger/sel/epic), panneaux à coins dorés,
  titres en police **Cinzel** (assets/fonts, OFL) — Cinzel exclut les chiffres (unicode-range) car son « 1 » ressemble à « I ».
- **Thème parchemin** (demande utilisateur, fin de style.css) : panneaux/fenêtres/notifications/fiches héros en papier
  (grain SVG intégré, bords déchirés via clip-path `--torn`), fenêtres entre deux rouleaux (`.scroll-wrap` + `.roll`),
  cadre en bois, boutons cuir. Sur papier les variables de couleur (--text, --muted, --gold…) sont redéfinies en tons
  sombres ; les noms colorés (raretés) reçoivent un contour sombre pour rester lisibles.
- L'utilisateur n'est pas développeur : expliquer brièvement chaque étape, en français.

## Architecture
```
js/core/    namespace, utils (fmt, $), rng (graine), bus (événements), save, loop (pas fixes 30/s × vitesse),
            audio (séquenceur 8-bit Web Audio : onde carrée, arpèges, basse triangle, bruit ; sfx ; déverrouillé au 1er toucher)
js/data/    balance, elements, classes, monsters, biomes, rooms, names, buildings (8 bâtiments : cost/val/effect),
            rarities, items (emplacements, bases, classGear), affixes (+ pouvoirs mythiques), uniques, potions, materials,
            synergies (conditions classes/rôles + bonus + cible), recruits (qualités des recrues),
            skills (40 compétences : 2 branches × 4 rangées par classe, actives/passives/ultimes, règles par défaut),
            effects (statuts + effets d'impact des éléments), bosses (mini-boss + boss par biome et mécaniques),
            events (événements à choix) + blessings, rooms (poids des salles + salles spéciales),
            ores (7 minerais), music (3 thèmes originaux camp/dungeon/boss : accords + mélodie « NOTE:pas »),
            evolutions (10 spécialités + 20 ultimes : base, from, tier, rôle, bonus, palette, attaque), skills_adv (100 compétences
            des branches C/D, descriptions auto), sets (6 sets, bonus 2/4/6 pièces),
            dungeons (4 donjons : offset de niveau, mult, reward, mf, shift de biome, teinte, unlock),
            cards (42 cartes générées depuis monstres/biomes/boss — charger après bosses.js ; cardDrop)
js/render/  pixelart (modèles), icons (icônes des onglets), townart (ville : décor + 9 bâtiments dessinés en code, townLayout), itemart (icônes d'objets + palettes, g = couleur de rareté), sprites (cache, miroir, flash blanc), tiles (pré-rendu carte : dalles biseautées, pavés de couloir, briques en relief, bord des murs, décor mural/sol par biome (STYLE), tapis, mosaïques, cercle d'entrée),
            fx (textes, particules, impacts par élément, arcs, anneaux, rayons, éclats de pixels, flash),
            font (chiffres 3x5), renderer (caméra, lumière, brouillard, couche lumineuse additive après l'obscurité)
js/systems/ path (A*, BFS, ligne de vue), items (création/nom/stats/prix), synergy (synergies actives + bonusesFor(hero) =
            point d'entrée des bonus hors équipement : y brancher passifs/ville/rebirth), stats (classe+niveau×qualité+équipement+bonus+élixirs),
            xp (gain par victime, écart de niveau, montée de niveau), tavern (recrues, embauche, renvoi, composition),
            effects (statuts : DoT, contrôles, buffs, boucliers, provocation ; mods()), skills (arbre, passifs, règles,
            tryCast/cast ; run.pending = événements programmés pour vagues/délais), bosses (mécaniques : summon, aoe, slam,
            charge, barrage, shield, phaseSummon, enrage, regen ; zones annoncées run.telegraphs, que les héros esquivent),
            rooms (fontaine, autel/bénédictions run.saved.blessings, marchand, événements ; pauses run.state merchant/event),
            heroes (+ évolutions : evo/className/role/sprite/attack/evoBonus/evoOptions/evolve — toujours passer par ces
            fonctions plutôt que G.data.classes[h.cls] pour le nom, le rôle, l'apparence et l'attaque), forge (améliorer/relancer/fusionner),
            dungeon (génération + donjons multiples : def/cur/prog(id)/level/unlocked/bestLevel), combat (IA temps réel), inventory (sac, vente, recyclage, score, auto-équipement),
            loot (drops), potions (auto + manuel, élixirs = run.buffs), shop, town (bâtiments : T.val(id) = valeurs actuelles,
            départs, syncLibrary, deathKeep, heroBonus), offline (rendement mesuré state.rate + gains hors ligne + auto-minage), cards (collection : stars, bonus() en cache, onKill, give), mine (toucher, auto-minage,
            améliorations, profondeur, atelier de fabrication), run (expédition, auto-farm)
js/ui/      ui (onglets, modales, toasts, journal, bannière), hud (écran donjon + barre de potions), items (case, fiche,
            comparaison, sélecteur d'emplacement), town (**carte de la ville en pixel art** : toucher un bâtiment ouvre
            ui.buildingModal(id) = fonction du bâtiment + amélioration ; Portail = expédition/auto-farm, Taverne, Boutique, Mine), team (héros : niveau/XP/stats, sous-onglets Équipement/Compétences, composition,
            synergies, fenêtre taverne), skills (arbre, fiche compétence, priorités), cards (grille de collection, cardPop), bag (sac, tri auto, potions), town (+ boutique), settings
```
- Simulation séparée du rendu : `G.sys.run.update(dt)` est déterministe en temps de jeu
  (aucun `setTimeout` dans la logique) → testable en accéléré, utilisable pour hors-ligne/auto-farm.
- Événements émis (`G.core.bus`) : `floor:enter`, `monster:kill`, `boss:kill`, `chest:open`, `run:end`
  → à brancher pour quêtes, succès, bestiaire.
- État sauvegardé `G.state` (sans changement de version : settings.dungeon, progress.dg{id:{maxFloor,maxCheckpoint}} — le donjon principal garde progress.maxFloor/maxCheckpoint —, run.dungeon, lastRun.off ; v11 : + cards {id: étoiles} ; v10 : + mine {ores, sel, hp, power, auto, crit, depth, broken}, settings.music/musicVol/sfx) : gold, heroes[{id,name,cls (classe actuelle de base ou 'adventurer'),pastCls[],legacy,adv,ult,level,xp,sp,quality,equip{slot:item},skills{id:rang},skillOrder[],skillRules{id:{mode,value}}}] (= toute la compagnie), team[ids] (ordre = formation),
  tavern {recruits, refreshAt}, run (étage, or, PV, graine),
  progress {maxFloor, maxCheckpoint}, stats, settings (+autoSell, autoEquip), town, inventory[], materials, potions,
  potionRules {heal: seuil, revive, buffs{id:'never'|'boss'|'combat'}}, shop {items, refreshAt}.
- Après tout changement d'équipement pendant une expédition : `G.sys.run.refreshStats()` (fait par inventory.equip). L'étage est régénéré depuis sa graine au chargement.

## Choix de conception validés
- Combat en temps réel sur la carte (pas de scène séparée).
- Gardien tous les 5 étages (mini-boss), boss tous les 10. Après sa mort : **choix sortir (100 % du butin)
  ou continuer** (option : demander 10 s / toujours continuer / toujours rentrer). Sortie possible jusqu'à
  la fin de l'étage. Sortir / Fuir = petites icônes rondes dans le coin de la carte (#map-actions), 🚪 visible seulement quand la sortie est possible.
- **Départ toujours à l'étage 1** sauf amélioration : le bâtiment **Portail des profondeurs** (niv. k)
  autorise le départ à l'étage 5k+1, à condition d'avoir vaincu le gardien de l'étage 5k. Coût 2500 × 3^niv.
- Difficulté relevée à la demande de l'utilisateur ; les monstres « dive » (rapides) évitent le tank et visent l'arrière.
- **Jeu volontairement très exigeant (validé par l'utilisateur)** : pas de régénération de mana de base, pas de soin
  gratuit, potions et équipement au cœur de la survie. Ne pas « adoucir » sans demande explicite.
- Effets visuels riches demandés : chaque attaque/sort a un départ, une traînée et un impact propres à son élément.
- Défaite ou fuite : retour en ville avec 50 % de l'or de l'expédition (objets gardés à partir de la phase 2).
- Gains hors ligne : rendement mesuré en fin d'expédition (moyenne glissante, ≥ 60 s) appliqué au temps d'absence
  (lastSeen), limité par le Camp de base (2 h + 2 h/niv., efficacité 50 % + 5 %/niv.) ; l'XP est donnée par tranches avec
  la baisse d'écart de niveau ; objets passés par le tri auto. Vérifié au chargement et au retour sur l'appli (visibilitychange).
- Auto-farm (settings.farm) : rejoue un étage ≤ record (nouvelle carte à chaque boucle, saved.loop), sans choix au gardien.
- Bâtiments : Forge (max +10+niv., réussite +4 %/niv., coûts −4 %/niv.), Taverne (équipe 5 au niv. 3, 6 au niv. 6, compagnie
  8+2/niv., recrues), Temple (soins +4 %/niv., plumes −6 %/niv., or gardé si défaite +4 %/niv.), Bibliothèque (XP +8 %/niv.,
  +1 point de compétence par héros et par niv.), Boutique (prix −4 %/niv., objets, qualité), Entrepôt (sac 40+10/niv., potions
  10+5/niv.), Camp de base (hors ligne), Portail. Coût `base × croissance^niv.` + 🔩 ferraille / ✨ poussière / 💠 éther.
- Biomes tous les 10 étages (7 biomes, puis cycle « Cauchemar » = teinte rouge), chacun avec particules d'ambiance.
- Salles spéciales : 2 max par étage (1 marchand max). Marchand payé avec l'or de la ville. Options : événements
  « demander » (15 s, sinon choix prudent) ou « auto » ; marchand « s'arrêter » (20 s) ou « ignorer ».
- Bénédictions (autel/événements) : bonus jusqu'à la fin de l'expédition, passés aux stats via `run.runBuffs` (avec les élixirs).
- **Mine** (onglet ⛏️, demande utilisateur) : choisir un minerai et taper le rocher (solidité `12 × 3,4^(palier-1)`) ;
  améliorations Force (×1,6/niv.), Mineurs auto (0,5 × force × niv. par seconde, aussi hors ligne), Critique (+5 %/niv., ×4),
  Creuser (débloque le palier suivant). Coûts en or + minerai du palier le plus profond.
  **Atelier** : objet au choix + minerai → objet niv. `5 + 10 × (palier-1)`, rareté ≥ peu commun (≥ rare dès le palier 5).
- **Musique 8-bit originale** « style JRPG rétro » (ne jamais reproduire de mélodie existante, ex. Final Fantasy, droits d'auteur) :
  le thème suit la situation (camp / donjon / boss). Options : musique, volume, effets sonores.
- **Ville = carte cliquable** (demande utilisateur) : plus de liste ; chaque bâtiment ouvre sa fenêtre. ▲ = amélioration possible.
- Montée de niveau : fanfare 8-bit originale (`audio.fanfare`, la musique baisse ~1,5 s) + effet sur le héros (`u.lvlFx` 2 s :
  aura et colonne dorées, rebond, clignotement, « LVL UP! » en police pixel) + fiche du héros qui brille (`.hcard.lvlup`).
- Barres (demande utilisateur) : barre du haut, étagère à potions et onglets en bois sculpté (`--wood` = grain SVG +
  dégradé), moulures dorées, rivets ; onglets avec icônes pixel art (`render/icons.js`, `G.render.tabIcons`), onglet actif
  en parchemin surélevé. Icône de l'appli générée par `tools/make-icons.js` (bouclier + épées).
- Titres : `ui.fixTitles` isole l'émoji de tête (sinon le dégradé doré le recouvre).
- **Progression de classe (spécification de l'utilisateur)** :
  Aventurier (niv. 1-10, branche V, « Premiers soins » offert ; équipe de départ et recrues) → **niv. 10** : choix d'une classe
  parmi 5 (pas de retour au niv. 1) → **niv. 40** : spécialité (2e rang) parmi 2 (pas de retour) → **niv. 100 : RENAISSANCE** :
  classe ultime parmi 2 par spécialité, **retour au niv. 1** et +1 renaissance (`hero.legacy`, +50 % de stats de base).
  Équipement (si portable), compétences et branches des classes précédentes (`hero.pastCls`) toujours conservés.
- Classes : guerrier, archer, mage, prêtre, voleur → spécialités → ultimes (2 chacune) :
  Paladin → Templier sacré / Croisé de l'Aube ; Berserker → Seigneur de guerre / Titan ;
  Tireur d'élite → Œil-de-faucon / Archer arcanique ; Rôdeur → Maître des bêtes / Sentinelle sylvestre ;
  Pyromancien → Archimage / Phénix ; Nécromancien → Liche / Prince des ombres ; Clerc → Saint / Oracle ;
  Inquisiteur → Grand Inquisiteur / Exalté ; Assassin → Faucheur / Lame fantôme ; Saboteur → Maître saboteur / Alchimiste.

- **Donjons multiples** (demande utilisateur, choix au Portail) : Donjon des Oubliés (niv. conseillé 1-40), Catacombes sanglantes
  (30-60, monstres niv. étage+30, ×1,3, or/XP ×1,35, butin +10 %, ouvert à l'ét. 35 du premier), Citadelle du Chaos (55-85, +55, ×1,65,
  ×1,75, +20 %, ét. 30 du 2e), Trône du Néant (80-100, +80, ×2,1, ×2,3, +35 %, ét. 30 du 3e). Record, départs du Portail et auto-farm
  par donjon ; `run.level` = niveau réel des monstres (butin, or, XP, marchand, événements) ; boutique/score via `bestLevel()`.
  Rendu : vignette, teinte et couleur d'accent (bannières, tapis) propres au donjon.
- **Collection de cartes de monstres** (demande utilisateur) : chaque monstre/gardien/boss a une carte, drop très rare
  (normal 0,15 %, élite 0,1 %, gardien 0,06 %, boss 0,03 % — plus puissant = plus rare, demande utilisateur, × chance de butin), doublon = +1 ★ (max 5, ensuite or). Bonus léger
  par carte (famille/élément, ×étoiles) appliqué à **tous les héros** via stats.js. Consultable dans la **Salle des trophées** (ville).

## Formules (balance.js)
- Monstre de base 46 PV / 10 ATQ / 4 DEF. Puissance : `(1 + 0,12(f-1)) × 1,065^(f-1)` (relevée en phase 4 pour compenser les compétences) ; élite (16 %) ×3 PV ×1,4 ATQ ;
  mini-boss ×8 PV ×1,5 ATQ ; boss ×18 PV ×1,8 ATQ. 2-4 monstres/salle (+1 tous les 6 étages). L'escalier ne rend aucun PV.
- Réduction défense : `DEF / (DEF + 50 + 10 × niv. attaquant)`, max 75 % ; magie ignore 50 % DEF.
- Élément : faiblesse ×1,5, résistance ×0,5. Critique 5 % + AGI×0,1 % (×1,5). Esquive AGI×0,05 % (max 30 %).
- Attaque = 2 × stat principale + 5. Intervalle d'attaque = 1,2 s × 100 / vitesse.
- Or par monstre `2 × niv^1,2`.
- XP (ralentie à la demande de l'utilisateur) : niveau suivant `100 × N^2,3`, monstre `4 × niv^1,3` (élite ×2,5, mini-boss ×6, boss ×12),
  à chaque héros vivant. Héros au-dessus du monstre : −12 %/niveau (min 5 %) ; en dessous : +5 %/niveau (max +50 %). Réserve : 25 % de l'XP.
  Montée de niveau en expédition : +25 % PV. 1 point de compétence / niveau (stocké pour la phase 4). Niveau max 100.
- Compétences : rangée r = r×3 points dans la branche + nœud précédent. Mana max = base + 2×INT ; **aucune régénération de base** (demande utilisateur) : seulement le bonus d'équipement
  « mpRegen » (min +0,1/s, ×(1+0,03·ilvl), armes/mains sec./bijoux/têtes, compté dans le score d'optimisation) et les potions ;
  coût des compétences +5 %/niveau du héros ; mana conservée d'un étage à l'autre (saved.mp), comme les PV.
  Règles : always/never/boss (élites+gardiens)/enemies N/allyHp/teamHp/selfHp/targetHp X %/allyDead. Réinitialisation `80 × niv^1,5` or.
  Option « répartir automatiquement » (settings.autoSkills). Le prêtre n'a **pas de soin de base** (demande utilisateur) :
  « Soin majeur » est une compétence de départ (`innate`, rang 1 offert, `K.freeRank`), 10 mana. Contrôles 2× plus courts sur les gardiens.
- Éléments à l'impact : feu brûlure 20 %, glace ralenti 25 % (gel 8 %), foudre étourdit 10 %, terre armure brisée 15 %,
  ombre affaiblit 20 %, lumière +30 % contre morts-vivants/démons ; chance × (1 − résistance).
- Coûts : classe 500 or ; spécialité 3000 or + 10 poussière ; renaissance 60 000 or + 5 éther.
  Branche C (4 nœuds) / D (3 nœuds, ultime).
- Sets : objet ≥ rare → 12 % pièce de set (base forcée, nom « Base · Set »). Bonus comptés par pièces portées (anneaux ×2).
- Forge : +1 = +10 % stats plates/dégâts, +5 % stats en % ; max +10 ; réussite 100 % jusqu'à +5 puis −12 %/niveau (min 30 %),
  échec = coût perdu. Coût or `valeur × 1,5 × (up+1)^1,6` + ferraille (+ poussière dès +3, éther dès +6). Relance d'un bonus
  (pas les spéciaux). **Pas de fusion** (retirée à la demande de l'utilisateur).
- Recrues : qualité Ordinaire 70 % / Doué 25 % (+12 % de gains par niveau) / Héroïque 5 % (+25 %) ; niveau = moyenne équipe − 0..3 ;
  prix `150 × (1+niv)^1,6 × (1 / 2,2 / 5)`. Équipe 4, compagnie 8 (la taverne améliorée en phase 7 augmentera).
- 10 synergies (data/synergies.js), ex. tank+soigneur +15 % déf., 2 mages +12 % dégâts des mages, 4 rôles distincts +5 % PV/dégâts.
- Raretés : commun 60 / peu commun 25 / rare 10 / épique 4 (dès ét. 3) / légendaire 0,9 (dès ét. 8) / mythique 0,1 (dès ét. 30) ;
  poids × (1+chance de butin)^rang × (1+0,01·étage)^rang. Bonus aléatoires : 0/1/2/3/4/5. Puissance ×1 / 1,12 / 1,28 / 1,48 / 1,72 / 2.
- Puissance d'un objet : `(1 + 0,1(ilvl-1)) × 1,05^(ilvl-1)` (légèrement sous les monstres → besoin de raretés, forge, niveaux).
- Drops : 8 % par monstre, 35 % élite (≥ peu commun), mini-boss 2 objets ≥ rare, boss 3 (dont 1 ≥ épique), coffre 1 objet.
  Légendaire → 25 % de chance d'être un unique. Mythique : +1 pouvoir spécial.
- Vente = or d'un monstre du niveau × 3 × (1/2/5/12/30/80). Boutique : objets ×5, potions base × étage record^1,2.
- Effets d'équipement gérés en combat : dégâts élémentaires (el_*), résistances (res_*), vol de vie, épines,
  double frappe (echo), bonus contre élites/gardiens, soin par victime, or trouvé, chance de butin, vitesse d'attaque.

## État d'avancement
- [x] **Phase 1** : donjon généré, exploration + combat temps réel, monstres (7 biomes définis), gardiens
      simples, or, coffres, pièges, défaite/retour, sortie après gardien, sauvegarde + export/import,
      vitesse x1/x2/x4, PWA. Ajouts : Portail (départ payant), difficulté relevée, effets visuels.
- [x] **Phase 2** : équipement (11 emplacements, restrictions par classe), 6 raretés, bonus aléatoires, 10 uniques,
      mythiques, inventaire 40, comparaison, vente/recyclage/verrouillage, vente groupée (jusqu’aux mythiques, confirmation dès légendaire), tri auto, auto-équipement,
      boutique (potions + stock d'objets), 5 potions avec règles auto, matériaux, colonne de lumière au drop.
      **Optimiser l'équipe** (`inventory.optimizeTeam`) : sac + objets portés mis en commun, attribution gloutonne
      au meilleur gain relatif (les objets peuvent changer de héros), annulée si pas meilleure ; boutons Équipe/Sac/Ville/fin
      d'expédition + option « optimiser à chaque retour en ville ». Thème visuel fantasy.
- [x] **Phase 3** : XP et niveaux (barres d'XP, effets, récap), taverne (3 recrues / 30 min, qualités, renvoi), compagnie
      de 8 avec réserve, composition et ordre de l'équipe, 10 synergies, voleur recrutable.
- [x] **Phase 4** : 40 compétences (actives, passives, 5 ultimes), arbres à 2 branches avec prérequis, points de compétence,
      réinitialisation, répartition auto, priorités réglables, mana + potion de mana, 10 effets de statut, effets des éléments.
- [x] **Phase 5** : 14 boss/mini-boss uniques (apparence, mécaniques, barre de vie, bannière, rage, boucliers, renforts),
      zones de danger annoncées et esquivées, 5 salles spéciales, 6 événements à choix, 7 bénédictions, ambiance des biomes.
- [x] **Phase 6** : 10 classes avancées + 10 ultimes (choix au niv. 20, ultime au niv. 50, nouvelles branches, bonus,
      apparence, rôle, élément), 70 compétences, 6 sets, forge (amélioration +10, relance, fusion) dans la fiche objet et la Ville.
- [x] **Phase 7** : 7 nouveaux bâtiments améliorables, gains hors ligne avec résumé, auto-farm, vitesse x1/x2/x4.
- [ ] Phase 8 : rebirth
- [ ] Phase 9 : quêtes, succès, bestiaire, donjon du jour
- [ ] Phase 10 : confort (stats, effets, notifications) et équilibrage

## Tests
Serveur local : `python3 -m http.server 8765` puis Playwright en viewport mobile. Simulation accélérée possible :
`for (...) G.sys.run.update(1/30)` dans `page.evaluate`. Phase 6 (joueur simulé : 4 aventuriers, optimise, vend, potions soin+mana, Portail, compétences auto, change de classe
dès que possible) : classe choisie vers la 6e expédition (niv. 10), ét. ~14 après 10-12.
L'or s'accumule sans débouché au-delà du Portail : la forge (phase 6) et la ville (phase 7) l'absorberont.
Attention : recharger la page déclenche une sauvegarde (pagehide) ; neutraliser `G.core.save.save` avant d'éditer localStorage dans un test.
Réinitialisation et import posent un verrou (`locked` dans save.js) pour que la sauvegarde de fermeture n'écrase pas le résultat.
