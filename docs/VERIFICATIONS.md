# Vérifications exécutées

Environnement : conteneur Linux, Node 22.22, Chromium headless (Playwright 1.63) avec rendu WebGL **logiciel** (SwiftShader).
Date : septembre 2026 (version 2.0 : NetForge en ligne, sas, circuit extérieur, véhicules, audio).

## Résultats

| Vérification | Commande / méthode | Résultat |
| --- | --- | --- |
| Types | `npm run typecheck` (TypeScript 5.9, `strict`, `noUncheckedIndexedAccess`) | OK, 0 erreur |
| Tests unitaires | `npm test` (Vitest) | **72 tests / 8 fichiers OK** |
| Build | `npm run build` (Next.js 16, export statique) | OK, page `/` pré-rendue en HTML |
| Tests de bout en bout | `npm run e2e` (Playwright, bureau 1440×900 + émulation Pixel 7) | **26 tests OK** |
| Accessibilité automatique | axe-core (WCAG 2 A/AA) sur le mode sobre | 0 violation « serious » ou « critical » |
| CSP | Console du navigateur (lab, transition, circuit, audio), en-têtes de `deploy/` | Aucune violation ; `frame-src https://netforge.dagz.fr` ajouté pour l'aperçu à la demande |
| Audio | État du moteur lu via `window.__lab.state()` | Son coupé par défaut ; intro lancée en mode course (ou bouton si bloquée) ; fichier absent (404 simulé) → musique générée directement |
| Image Docker | v1 : build + `docker run --read-only --tmpfs /tmp --cap-drop ALL` | OK en v1. **Non reconstruite pour la v2** : `Dockerfile`, `compose.yaml` et `nginx.conf` sont inchangés, seuls les fichiers servis et les en-têtes ont évolué |
| Impression | Émulation `print` dans Chromium (v1) | En-tête, boutons, terminal masqués ; règles d'impression ajoutées pour la carte NetForge (non réimprimée) |

### Détail des tests unitaires

- **Simulation réseau** (`src/sim/network.test.ts`, 25 cas) : poste déconnecté au départ, liaison via PP-02, mauvaise prise
  de brassage, port désactivé, refus des cages SFP / ports occupés / boucles, port console sans Ethernet, débranchement ;
  validation IPv4 (CIDR et masque décimal, refus réseau/broadcast, masque non contigu, passerelle hors réseau, boucle locale) ;
  scénario résolu (serveur, passerelle, autre VLAN via R1 avec TTL=63) ; **ping dans le même sous-réseau indépendant de la
  passerelle** ; VLAN différents ; poste en VLAN 1 ; DHCP sans serveur → APIPA ; **conflits** avec le serveur et la passerelle ;
  pas de faux conflit entre VLAN ; masque trop large (réponse perdue) ; passerelle pointant vers un hôte non routeur ;
  pas d'accès Internet ; câble direct poste ↔ serveur ; étapes de la mission ; consoles du poste et du switch.
- **Terminal** (`src/terminal/interpreter.test.ts`) : aide sans easter eggs, casse et espaces, données partagées, Google,
  LinkedIn, CV, easter eggs et variantes, commande inconnue non interprétée, suggestions, historique, `gui`, autocomplétion.
- **Données** (`src/data/data.test.ts`) : 26 compétences et leurs intitulés d'origine, 5 expériences dont 3 stages NET4BUSINESS,
  pas de N2 ni de PowerShell attribués à tort, statuts des formations, références toutes résolues, identifiants d'anomalies.
- **Circuit** (`src/game/circuit/layout.test.ts`) : longueur du stade (4a + 2πR), continuité et tangence du tracé, normale
  extérieure, projection d'un point sur la piste, dévers nul en ligne droite et maximal au milieu des virages, hauteur du bord
  extérieur, orientation des objets, piste / infield, dalles du paddock ; **chronométrage** : tour complet validé avec le bon temps,
  tour coupé par l'infield refusé, ligne franchie à rebours = tour annulé, format des temps.
- **Musique générée** (`src/audio/synthwave.test.ts`) : boucle de 4 mesures à 96 BPM, grosse caisse sur les temps, caisse claire
  sur 2 et 4, grille Am – F – C – G, conversion MIDI → Hz.
- **Données v2** : NetForge limité à l'URL fournie et aux badges, aucune technologie inventée ; loisirs limités aux phrases fournies
  (ni rang ni temps de jeu), citation GTA exacte, une anomalie colorée par loisir ; index à 4 loisirs.
- **Terminal v2** : `cars` renvoie exactement « [RACER MODE UNLOCKED] : Configuration Stock-Car validée. Rendez-vous sur le circuit
  extérieur pour prendre la piste. », effet de déblocage, lien « aller au circuit » (absent sans WebGL), absent de `help` et de
  l'autocomplétion ; `netforge` renvoie vers la plateforme.
- **Interactions** : anomalies du lab sur l'île, anomalies du circuit dans l'infield hors piste, points d'intérêt séparés par monde,
  sas dans les deux sens.
- **IPv4**, **règles d'interaction du lab** (placements, hystérésis, zones) et **synchronisation des en-têtes** nginx / Node.

### Parcours vérifiés dans le navigateur (E2E)

- Mode sobre complet sans charger Three.js ni Rapier (aucune requête vers ces chunks tant que le lab n'est pas lancé).
- Ancres internes toutes existantes ; liens externes : le vrai profil LinkedIn et `https://netforge.dagz.fr`.
- **NetForge** : badges, bouton `target="_blank" rel="noopener noreferrer"` avec « ↗ », mention « Maquette illustrative », plus
  aucune démonstration VLSM ; **aucune requête vers netforge.dagz.fr** tant que l'aperçu en direct n'est pas demandé, puis iframe
  isolée (`sandbox`, `referrerpolicy="no-referrer"`).
- **Loisirs** : section « Hors de l'infra » dans la navigation, quatre fiches, textes exacts.
- Lien d'évitement et focus clavier.
- **Sans WebGL** : bouton « Explorer mon lab (3D) » signalé indisponible, bascule désactivée, parcours accessible.
- **Stockage bloqué** : le site fonctionne et l'indique dans le pied de page.
- Terminal : commandes, casse, historique ↑/↓, `clear`, `history`, contenu non interprété comme HTML, Tab qui complète puis
  laisse passer le focus, Échap qui quitte, **`google`** : nouvel onglet ouvert, `window.opener` nul, onglet du portfolio inchangé,
  lien de secours `target="_blank" rel="noopener noreferrer"` ; easter eggs et variantes (« gta v », « GTA  VI », « valo ») ;
  `prefers-reduced-motion` : effets désactivés par défaut, réactivables.
- **Lab** : déplacement clavier ; **saisie dans un champ sans déplacement du personnage** (touches ZQSD/WASD tapées et maintenues) ;
  **mission avec erreurs puis correction** : port désactivé, cage SFP refusée, adresse de broadcast refusée, diagnostic en échec
  expliquant VLAN 1 / VLAN 10, `ping` du terminal cohérent, correction des VLAN, diagnostic réussi, HUD « en ligne »,
  apparition et stabilisation de l'anomalie `evann.skills.networking`, 6 étapes validées ;
  **bascule de mode** depuis une fiche vers la section correspondante (focus et défilement), retour au lab avec progression et
  position conservées ; Échap ferme la fiche puis ouvre la pause ; index → fiche ; **perte du contexte WebGL** → message et
  retour au mode sobre ; sortie du lab → Canvas démonté, crochets de débogage retirés.
- **Circuit** : dalle du sas → journal « Déchargement des modules salle serveur... », « Allocation mémoire du circuit... »,
  « Initialisation du moteur physique... », « Root access granted. » ; nouveau Canvas (compteurs de mémoire WebGL différents) ;
  arrivée à pied, son coupé, aucune lecture ; kart monté avec E, avance à l'accélérateur, F → freinage puis descente ; retour par le
  sas du paddock devant la porte du lab. **Mode course** : `cars` dans le terminal, état mémorisé dans le stockage, « aller au
  circuit » → arrivée en stock-car, son actif, intro lancée, bouton muet et curseur de volume visibles et fonctionnels.
  **Anomalie du circuit** : fiche Valorant ouverte, compteur « 1/4 ».
- **Mobile** (émulation Pixel 7) : mode sobre privilégié même si le lab était mémorisé, pas de défilement horizontal,
  lab lancé avec joystick, boutons Interagir / Sauter et bascule de mode visibles. Captures du circuit en émulation : barre son,
  tableau de bord compact, boutons Drift / Descendre.

### Essais manuels scriptés (hors suite E2E)

- Pilote automatique de test (suit l'axe de la piste) : le stock-car boucle la ligne droite, prend le virage relevé à 18–24 m/s et
  atteint 27 m/s sur la ligne opposée. Sous SwiftShader (≈ 3 images/s), la boucle de contrôle réagit tard et touche parfois le mur
  à l'entrée du virage : la physique encaisse (le mur retient la voiture, R la remet d'aplomb).
- Frein à main + braquage à ≈ 20 m/s : décrochage de l'arrière, traces de pneus déposées (16 marques en 1,6 s), tête-à-queue si
  l'on insiste ; l'adhérence arrière en drift a été relevée ensuite pour rendre la glisse plus contrôlable.
- Kart : 0 → 17,8 m/s en 2,5 s, marche arrière au frein maintenu.

## Mesures

| Mesure | Valeur mesurée |
| --- | --- |
| HTML de la page | 142 Ko (25 Ko gzip) |
| JS + CSS chargés à l'arrivée | 729 Ko (220 Ko gzip), dont React/Next.js pour l'essentiel |
| Chunks 3D, chargés à la demande | 3,50 Mo (1,19 Mo gzip) : Three.js, R3F, drei, Rapier (WASM intégré), lab et circuit |
| Intro audio (mode course uniquement) | 1,08 Mo (AAC) ou 327 Ko (Opus), téléchargée seulement une fois le mode course activé |
| Appels de dessin, qualité haute : lab (accueil) / circuit (arrivée) | 385 / 310 |
| Appels de dessin, qualité réduite : circuit (arrivée) | 189 |
| Triangles, qualité haute : lab / circuit | ≈ 20 900 / ≈ 20 900 (≈ 13 100 en qualité réduite sur le circuit) |
| Géométries en mémoire WebGL : lab / circuit après passage du sas | ≈ 110 / ≈ 60 (nouveau contexte, rien du lab ne subsiste) |

Ces chiffres viennent de `renderer.info` via `window.__lab.stats()` et des fichiers de `out/`.

## Non testé ou limites connues

- **Fluidité réelle** : aucun GPU matériel ici. Sous SwiftShader (rendu processeur) le lab tourne à environ 3 images/s, ce qui
  n'est pas représentatif d'un ordinateur portable. **Aucun score ni nombre d'images par seconde n'est revendiqué.**
  La qualité réduite et la baisse automatique (une fois, désactivable) existent pour les machines modestes.
- **Navigateurs** : seul Chromium a été testé ; Firefox, Safari (macOS/iOS) et de vrais appareils Android/iOS ne l'ont pas été.
- **Manette** : code de l'API Gamepad écrit mais non essayé avec une manette physique.
- **Tactile** : présence des contrôles vérifiée en émulation ; le glisser du joystick n'a pas été testé sur un écran réel.
- **Clic direct sur les ports en 3D** : implémenté, mais les tests passent par le panneau HTML (même logique `clickPort`).
- **Lecteurs d'écran** : pas d'essai avec NVDA, JAWS ou VoiceOver ; seulement l'audit automatique axe et la structure sémantique.
- **Son** : rien n'a été écouté dans cet environnement (pas de sortie audio). Le routage, les états (intro, fondu, musique,
  blocage, fichier absent) sont vérifiés par programme ; l'équilibre des volumes, le fondu et la boucle synthwave restent à juger
  à l'oreille. Safari (amorçage silencieux de l'intro) n'a pas été essayé.
- **Conduite réelle** : la physique des véhicules n'a été éprouvée qu'à ≈ 3 images/s (pas fixe de 1/60 s, donc même résultat
  physique, mais sans ressenti de pilotage). Le réglage fin (`SPECS`) se fera sur une machine avec GPU.
- **Droits de l'intro audio** : fichier fourni par Evann, source non documentée (voir `INFOS-MANQUANTES.md`).
- **NetForge** : `https://netforge.dagz.fr` n'a pas pu être ouvert depuis l'environnement de développement ; le bouton pointe vers
  l'URL fournie. L'aperçu intégré dépend des en-têtes du site (il peut refuser d'être affiché dans une iframe : le texte le signale).
- **Bloqueur de fenêtres** : le cas où le navigateur bloque l'onglet Google n'a pas été simulé ; le lien de secours est vérifié.
- **Docker** : dans ce bac à sable, `npm ci` ne sort qu'à travers un proxy ; le build a donc été vérifié avec une copie
  temporaire du Dockerfile ajoutant uniquement le proxy et son certificat (fichier non commité). Le `Dockerfile` livré n'a pas
  été construit tel quel contre les registres publics.
- **Impression papier** : vérifiée à l'écran en émulation `print`, pas sur une imprimante.
