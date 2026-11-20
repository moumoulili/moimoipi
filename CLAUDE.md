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
- Pixel art généré en code (`js/render/pixelart.js`, modèles 12x12 en caractères + palette).
  Remplaçable par des PNG via `G.render.spriteFiles = { id: 'assets/sprites/id.png' }`.
- L'utilisateur n'est pas développeur : expliquer brièvement chaque étape, en français.

## Architecture
```
js/core/    namespace, utils (fmt, $), rng (graine), bus (événements), save, loop (pas fixes 30/s × vitesse)
js/data/    balance, elements, classes, monsters, biomes, rooms, names, buildings
js/render/  pixelart (modèles), sprites (cache, miroir, flash blanc), tiles (textures + pré-rendu carte),
            fx (textes, particules, impacts par élément, arcs, anneaux, rayons, éclats de pixels, flash),
            font (chiffres 3x5), renderer (caméra, lumière, brouillard, couche lumineuse additive après l'obscurité)
js/systems/ path (A*, BFS, ligne de vue), stats, heroes, dungeon (génération), combat (IA temps réel), town (bâtiments, départs), run (expédition)
js/ui/      ui (onglets, modales, toasts, journal, bannière), hud (écran donjon), town, settings
```
- Simulation séparée du rendu : `G.sys.run.update(dt)` est déterministe en temps de jeu
  (aucun `setTimeout` dans la logique) → testable en accéléré, utilisable pour hors-ligne/auto-farm.
- Événements émis (`G.core.bus`) : `floor:enter`, `monster:kill`, `boss:kill`, `chest:open`, `run:end`
  → à brancher pour quêtes, succès, bestiaire.
- État sauvegardé `G.state` : gold, heroes[{id,name,cls,level,xp}], team[ids], run (étage, or, PV, graine),
  progress {maxFloor, maxCheckpoint}, stats, settings. L'étage est régénéré depuis sa graine au chargement.

## Choix de conception validés
- Combat en temps réel sur la carte (pas de scène séparée).
- Gardien tous les 5 étages (mini-boss), boss tous les 10. Après sa mort : **choix sortir (100 % du butin)
  ou continuer** (option : demander 10 s / toujours continuer / toujours rentrer). Sortie possible jusqu'à
  la fin de l'étage.
- **Départ toujours à l'étage 1** sauf amélioration : le bâtiment **Portail des profondeurs** (niv. k)
  autorise le départ à l'étage 5k+1, à condition d'avoir vaincu le gardien de l'étage 5k. Coût 2500 × 3^niv.
- Difficulté relevée à la demande de l'utilisateur ; les monstres « dive » (rapides) évitent le tank et visent l'arrière.
- Effets visuels riches demandés : chaque attaque/sort a un départ, une traînée et un impact propres à son élément.
- Défaite ou fuite : retour en ville avec 50 % de l'or de l'expédition (objets gardés à partir de la phase 2).
- Gains hors ligne (phase 7) : estimés à partir du rendement réel mesuré, pas de simulation complète.
- Biomes tous les 10 étages (7 biomes, puis cycle « Cauchemar »).
- Classes : guerrier, archer, mage, prêtre, voleur → 2 évolutions chacune (niv. 20) → ultimes (niv. 50) :
  Paladin/Berserker → Templier sacré/Seigneur de guerre ; Tireur d'élite/Rôdeur → Œil-de-faucon/Maître des bêtes ;
  Pyromancien/Nécromancien → Archimage/Liche ; Clerc/Inquisiteur → Saint/Grand Inquisiteur ;
  Assassin/Saboteur → Faucheur/Maître saboteur.

## Formules (balance.js)
- Monstre de base 40 PV / 9 ATQ / 4 DEF. Puissance : `(1 + 0,12(f-1)) × 1,055^(f-1)` ; élite (16 %) ×3 PV ×1,4 ATQ ;
  mini-boss ×8 PV ×1,5 ATQ ; boss ×18 PV ×1,8 ATQ. 2-4 monstres/salle (+1 tous les 6 étages). L'escalier ne rend aucun PV.
- Réduction défense : `DEF / (DEF + 50 + 10 × niv. attaquant)`, max 75 % ; magie ignore 50 % DEF.
- Élément : faiblesse ×1,5, résistance ×0,5. Critique 5 % + AGI×0,1 % (×1,5). Esquive AGI×0,05 % (max 30 %).
- Attaque = 2 × stat principale + 5. Intervalle d'attaque = 1,2 s × 100 / vitesse.
- Or par monstre `2 × niv^1,2`. XP prévue : niveau suivant `50 × N^1,6`, monstre `5 × niv^1,3`.
- Drops prévus : raretés commun 60 / peu commun 25 / rare 10 / épique 4 / légendaire 0,9 / mythique 0,1.

## État d'avancement
- [x] **Phase 1** : donjon généré, exploration + combat temps réel, monstres (7 biomes définis), gardiens
      simples, or, coffres, pièges, défaite/retour, sortie après gardien, sauvegarde + export/import,
      vitesse x1/x2/x4, PWA. Ajouts : Portail (départ payant), difficulté relevée, effets visuels.
- [ ] Phase 2 : équipement, raretés, inventaire, boutique, potions auto, tri/vente auto
- [ ] Phase 3 : XP, niveaux, classes (voleur recrutable), taverne, synergies
- [ ] Phase 4 : compétences, arbres, priorités, éléments complets
- [ ] Phase 5 : mécaniques de boss, salles spéciales, biomes visibles
- [ ] Phase 6 : évolutions de classe, sets, forge
- [ ] Phase 7 : ville améliorable, hors ligne, auto-farm
- [ ] Phase 8 : rebirth
- [ ] Phase 9 : quêtes, succès, bestiaire, donjon du jour
- [ ] Phase 10 : confort (stats, effets, notifications) et équilibrage

## Tests
Serveur local : `python3 -m http.server 8765` puis Playwright en viewport mobile. Simulation accélérée possible :
`for (...) G.sys.run.update(1/30)` dans `page.evaluate`. Phase 1 sans progression : l'équipe meurt vers l'étage 5-6 (gardien de l'étage 5 battu ~1 fois sur 3) — normal.
Attention : recharger la page déclenche une sauvegarde (pagehide) ; neutraliser `G.core.save.save` avant d'éditer localStorage dans un test.
