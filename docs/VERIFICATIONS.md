# Vérifications exécutées

Environnement : conteneur Linux, Node 22.22, Chromium headless (Playwright 1.63) avec rendu WebGL **logiciel** (SwiftShader).
Date : septembre 2026.

## Résultats

| Vérification | Commande / méthode | Résultat |
| --- | --- | --- |
| Types | `npm run typecheck` (TypeScript 5.9, `strict`, `noUncheckedIndexedAccess`) | OK, 0 erreur |
| Tests unitaires | `npm test` (Vitest) | **58 tests / 7 fichiers OK** |
| Build | `npm run build` (Next.js 16, export statique) | OK, page `/` pré-rendue en HTML |
| Tests de bout en bout | `npm run e2e` (Playwright, bureau 1440×900 + émulation Pixel 7) | **21 tests OK** |
| Accessibilité automatique | axe-core (WCAG 2 A/AA) sur le mode sobre, thèmes clair et sombre | 0 violation « serious » ou « critical » (clair) ; 0 violation (sombre) |
| CSP | Console du navigateur, lab lancé, en-têtes de `deploy/` | Aucune violation (après ajout de `blob:` pour le worker du texte 3D) |
| Image Docker | Build + `docker run --read-only --tmpfs /tmp --cap-drop ALL` | OK : 200 sur `/`, 404 personnalisée, en-têtes de sécurité, gzip, cache immuable sur `/_next/static/` |
| E2E contre nginx | Sous-ensemble (parcours sobre, axe, mission complète) sur le conteneur | OK |
| Impression | Émulation `print` dans Chromium | En-tête, boutons, terminal et démo masqués ; parcours lisible en noir sur blanc |

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
- **VLSM de la démonstration** (`src/netforge-demo/vlsm.test.ts`) : découpage vérifié à la main (192.168.10.0/26, /27, /28, /30),
  frontières 62/63 hôtes, erreurs, normalisation, aperçu IOS.
- **IPv4**, **règles d'interaction du lab** (placements, hystérésis, zones) et **synchronisation des en-têtes** nginx / Node.

### Parcours vérifiés dans le navigateur (E2E)

- Mode sobre complet sans charger Three.js ni Rapier (aucune requête vers ces chunks tant que le lab n'est pas lancé).
- Ancres internes toutes existantes ; seul lien externe : le vrai profil LinkedIn.
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
- **Mobile** (émulation Pixel 7) : mode sobre privilégié même si le lab était mémorisé, pas de défilement horizontal,
  lab lancé avec joystick, boutons Interagir / Sauter et bascule de mode visibles.

## Mesures

| Mesure | Valeur mesurée |
| --- | --- |
| HTML de la page | 135 Ko (23 Ko gzip) |
| JS + CSS chargés à l'arrivée | 696 Ko (211 Ko gzip), dont React/Next.js pour l'essentiel |
| Chunks du lab, chargés à la demande | 3,35 Mo (1,14 Mo gzip) : Three.js, R3F, drei, Rapier (WASM intégré) |
| Appels de dessin, qualité haute (accueil / baie) | 369 / 368 (465 / 645 avant la fusion statique des décors) |
| Appels de dessin, qualité réduite (accueil / baie) | 270 / 290 |
| Triangles, qualité haute (accueil / baie) | ≈ 20 600 / ≈ 23 000 |

Ces chiffres viennent de `renderer.info` via `window.__lab.stats()`.

## Non testé ou limites connues

- **Fluidité réelle** : aucun GPU matériel ici. Sous SwiftShader (rendu processeur) le lab tourne à environ 3 images/s, ce qui
  n'est pas représentatif d'un ordinateur portable. **Aucun score ni nombre d'images par seconde n'est revendiqué.**
  La qualité réduite et la baisse automatique (une fois, désactivable) existent pour les machines modestes.
- **Navigateurs** : seul Chromium a été testé ; Firefox, Safari (macOS/iOS) et de vrais appareils Android/iOS ne l'ont pas été.
- **Manette** : code de l'API Gamepad écrit mais non essayé avec une manette physique.
- **Tactile** : présence des contrôles vérifiée en émulation ; le glisser du joystick n'a pas été testé sur un écran réel.
- **Clic direct sur les ports en 3D** : implémenté, mais les tests passent par le panneau HTML (même logique `clickPort`).
- **Lecteurs d'écran** : pas d'essai avec NVDA, JAWS ou VoiceOver ; seulement l'audit automatique axe et la structure sémantique.
- **Sons** : synthèse Web Audio non écoutée (désactivée par défaut).
- **Bloqueur de fenêtres** : le cas où le navigateur bloque l'onglet Google n'a pas été simulé ; le lien de secours est vérifié.
- **Docker** : dans ce bac à sable, `npm ci` ne sort qu'à travers un proxy ; le build a donc été vérifié avec une copie
  temporaire du Dockerfile ajoutant uniquement le proxy et son certificat (fichier non commité). Le `Dockerfile` livré n'a pas
  été construit tel quel contre les registres publics.
- **Impression papier** : vérifiée à l'écran en émulation `print`, pas sur une imprimante.
