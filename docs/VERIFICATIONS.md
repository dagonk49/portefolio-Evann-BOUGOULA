# Vérifications exécutées

Environnement : conteneur Linux, Node 22.22, Chromium headless (Playwright 1.63) avec rendu WebGL **logiciel** (SwiftShader).
Date : septembre 2026 (version 3.0 : refonte du mode sobre, fiches E5, formulaire de contact et service d'envoi, consentement
CNIL, pages légales, export PDF et CV ; la v2.1 a corrigé les interfaces bloquées et ajouté options, tutoriel et
post-traitement ; la v2.0 a apporté NetForge en ligne, le sas, le circuit extérieur, les véhicules et l'audio).

## Résultats

| Vérification | Commande / méthode | Résultat |
| --- | --- | --- |
| Types | `npm run typecheck` (TypeScript 5.9, `strict`, `noUncheckedIndexedAccess`) | OK, 0 erreur |
| Tests unitaires | `npm test` (Vitest) | **96 tests / 11 fichiers OK** (v3 : fiches E5, coordonnées, validation et service de contact, consentement) |
| Build | `npm run build` (Next.js 16, export statique) | OK : `/`, `/mentions-legales`, `/confidentialite`, `/cv` pré-rendues en HTML |
| Tests de bout en bout | `npm run e2e` (Playwright, bureau 1440×900 + émulation Pixel 7) | **50 tests OK** (46 bureau + 4 mobile ; v3 : `v3.spec.ts`, `consent.spec.ts`, en-tête, liens, menu mobile) |
| Accessibilité automatique | axe-core (WCAG 2 A/AA) : mode sobre sombre fiches dépliées, pages légales, panneau de consentement ; v2.1 : HUD du lab avec tutoriel, fenêtre Options | 0 violation « serious » ou « critical » |
| CSP | Console du navigateur (lab, transition, circuit, audio), en-têtes de `deploy/` | Aucune violation ; `frame-src https://netforge.dagz.fr` ajouté pour l'aperçu à la demande |
| Audio | État du moteur lu via `window.__lab.state()` | Son coupé par défaut ; intro lancée en mode course (ou bouton si bloquée) ; fichier absent (404 simulé) → musique générée directement |
| Image Docker | v1 : build + `docker run --read-only --tmpfs /tmp --cap-drop ALL`. v3 : `nginx -t` puis exécution de l'image officielle `nginx-unprivileged` (config et `out/` montés, lecture seule) et du service `contact` (Node 22 Alpine) sur un réseau Docker | Site servi (pages légales, CV en `application/pdf`, CSP) ; `POST /api/contact` relayé → 200 (envoi simulé) ; `GET` → 403 ; origine étrangère → 403 ; 16 envois rapides → 6 traités puis 429 (nginx) ; service arrêté → 504 et nginx redémarre quand même. **`docker compose build` non abouti ici** : `npm ci` dans les conteneurs refuse le certificat du proxy réseau de l'environnement de développement (pas en cause sur la VM) |
| Impression | Chromium (PDF A4 et émulation `print`) | Portfolio complet : 21 pages ; fiche seule : 3 pages ; CV : 1 page |

### Version 3.0 (mode sobre « norme BTS SIO & conformité FR »)

- **Refonte visuelle** : captures à 1 440, 768 et 390 px (Pixel 7) de chaque section ; **aucun défilement horizontal**
  (`scrollWidth = clientWidth`) aux trois largeurs, fiches E5 dépliées. Un premier passage débordait à 390 px : les libellés
  `.sr-only` des tableaux (position absolue) échappaient à leur zone de défilement ; corrigé (`position: relative` sur les
  conteneurs) et vérifié par le test mobile.
- **Fiches E5** : tableau de synthèse (6 lignes, 6 compétences), six fiches en sept parties, schémas SVG relus un par un
  (une étiquette qui débordait sur le schéma NetForge a été retirée), recette « non consignée » partout (test unitaire + E2E).
- **Impression** : PDF du portfolio complet (21 pages A4) et d'une fiche seule (3 pages) générés avec Chromium ; en-tête
  imprimé (coordonnées, synthèse, chronologie, compétences), fond blanc, interface masquée, schémas en noir sur blanc.
  Les boutons « Exporter » sont testés avec `window.print` remplacé par un enregistreur (fiches dépliées au moment de
  l'impression, fiche ciblée seule, état restauré ensuite).
- **CV** : `public/CV_Evann_Bougoula.pdf` généré par `npm run cv` (1 page A4, 186 Ko), servi en `application/pdf`,
  téléchargé par le bouton et par la commande `cv`.
- **Formulaire et service** : validation navigateur (4 champs signalés, focus, `aria-invalid`), envoi réussi sans rechargement
  (service simulé de `serve.mjs`), erreur 502 simulée → saisie conservée et lien `mailto:` prérempli ; tests unitaires du
  service réel (`src/lib/contact.test.ts`) : 405, 415, 403 (origine), 400, 422, 413, champ piège, limitation de débit (429 puis
  reprise après la fenêtre), échec SMTP sans fuite du message d'erreur, formulaire sans JavaScript (303). `server/index.mjs`
  lancé en `CONTACT_DRY_RUN=1` : `/healthz`, envoi simulé, origine refusée, journal sans contenu.
- **nginx** : `nginx -t` OK dans l'image `nginx-unprivileged` (bloc `/api/contact`, `limit_req_zone`, `resolver`).
- **Consentement** : bandeau au premier passage, trois boutons de même taille et de même style, rien d'écrit avant le choix,
  refus mémorisé sans préférence stockée, accord → écriture immédiate, « Personnaliser » sans case précochée, retrait depuis
  « Gérer les cookies » (données effacées), Échap sans effet, choix de plus de 6 mois redemandé, préférences de plus de 13 mois
  ignorées (tests unitaires `src/lib/consent.test.ts`).
- **Pages légales** : contenu (éditeur, publication, hébergement, propriété intellectuelle ; finalité, 3 ans, aucun tiers,
  droits, CGU), axe sans violation grave, retour au portfolio.
- **Accessibilité** : axe (WCAG 2 A/AA) sur le thème sombre avec toutes les fiches dépliées, sur les deux pages légales et sur
  le panneau de consentement : 0 violation « serious » ou « critical ».

### Version 2.1

- **Bug des interfaces bloquées, reproduit puis corrigé.** Reproduction : cliquer « Aide » dans le HUD, fermer, se placer sur la
  dalle du poste et appuyer sur Entrée → l'aide se rouvrait au lieu du poste (le bouton du HUD avait gardé le focus ; Espace
  faisait de même). Cause : retour du focus au déclencheur d'une fenêtre ouverte à la souris, et point actif conservé après la
  fermeture. Correctif vérifié par `e2e/interfaces.spec.ts` : focus rendu au jeu, Entrée ouvre le poste, Espace n'ouvre rien,
  une autre dalle ouvre sa propre interface, point actif recalculé dès la fermeture. Les points d'intérêt étaient déjà détectés
  à la distance réelle (aucun événement d'entrée / sortie de collider) ; des garde-fous empêchent désormais une stabilisation
  ou un changement de monde interrompu de verrouiller le jeu.
- **Options** : engrenage du HUD et touche O, bascule du son, volumes musique / effets persistés, qualité conservée.
- **Tutoriel** : texte exact, déplacement possible pendant l'affichage, « Ignorer » persistant après rechargement,
  « Compris » valable pour la session.
- **Stock-car** : sans `cars`, seul le kart existe dans la scène (`window.__lab.state().vehicles`) ; après `cars`, kart et stock-car.
- **Migrations du stockage** (`src/state/app.test.ts`) : ancienne carte de bienvenue vue → tutoriel terminé, ancien réglage
  de son v1 et volume unique v2.0 repris, valeurs invalides rejetées.
- **Rendu** : comparaison qualité élevée / basse au même endroit. Premier réglage du bloom (seuil 1) écarté : avant tone mapping,
  les surfaces éclairées dépassent déjà une luminance de 2 et tout le sol brillait. Seuil retenu 2,8, néons poussés à 6,5 × :
  seuls dalles, LED, liserés, cœurs d'anomalie, phares et soleil ont un halo ; le sol garde sa texture.

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
- **Données v3** : coordonnées (email, LinkedIn, GitHub), CV, statut et mobilité ; cinq certifications, Pix et travail en hauteur
  sans date supposée ; six fiches E5 numérotées, compétences et références valides, périodes résolues, trois documents par fiche,
  **aucun résultat de recette, capture ni document renseigné**, aucun PowerShell, CCNA, N2 ni technologie inventée.
- **Terminal v3** : `github` (onglet + lien de secours), `email` (adresse + `mailto:`, rien d'ouvert d'office), `cv`
  (téléchargement + lien), `realisations` / `e5` (six liens vers les fiches), `whoami` avec statut et mobilité.
- **Contact** (`src/lib/contact.test.ts`, 12 cas) : validation (champs obligatoires, organisation facultative, emails invalides,
  longueurs), retrait des CR/LF des champs d'une ligne, message multiligne conservé, email construit avec `Reply-To` ; service
  HTTP réel sur un port local (codes 200, 303, 400, 403, 405, 413, 415, 422, 429, 502).
- **Consentement** (`src/lib/consent.test.ts`) : rien lu ni écrit sans accord, accord puis refus, expiration du choix (6 mois)
  et des préférences (13 mois), enregistrements malformés ignorés.

### Parcours vérifiés dans le navigateur (E2E)

- Mode sobre complet sans charger Three.js ni Rapier (aucune requête vers ces chunks tant que le lab n'est pas lancé).
- Ancres internes toutes existantes ; liens externes : le vrai profil LinkedIn et `https://netforge.dagz.fr`.
- **NetForge** : badges, bouton `target="_blank" rel="noopener noreferrer"` avec « ↗ », mention « Maquette illustrative », plus
  aucune démonstration VLSM ; **aucune requête vers netforge.dagz.fr** tant que l'aperçu en direct n'est pas demandé, puis iframe
  isolée (`sandbox`, `referrerpolicy="no-referrer"`).
- **Loisirs** : quatre fiches « Centres d'intérêt » dans le parcours, textes exacts.
- Lien d'évitement et focus clavier.
- **Sans WebGL** : boutons « Basculer en 3D » (accroche et en-tête) signalés indisponibles, parcours accessible.
- **En-tête v3** : sept liens dans l'ordre demandé, indicateur `aria-current` qui suit la section, en-tête fixe ; menu mobile
  (Échap, fermeture au choix d'une section) ; liens externes limités à GitHub, LinkedIn et NetForge, seul `mailto:` vers
  evann.bougoula@dagz.fr ; toutes les pages et fichiers liés répondent 200.
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
| HTML de la page | 379 Ko (53 Ko gzip) — v3 : six fiches E5 complètes et leurs schémas dans le HTML statique |
| JS + CSS chargés à l'arrivée | 776 Ko (230 Ko gzip), dont React/Next.js pour l'essentiel |
| Pages légales / CV | 22 Ko et 27 Ko de HTML ; `CV_Evann_Bougoula.pdf` ≈ 187 Ko |
| Chunks 3D, chargés à la demande | 3,68 Mo (1,24 Mo gzip) : Three.js, R3F, drei, Rapier (WASM intégré), postprocessing, lab et circuit |
| Intro audio (mode course uniquement) | 1,08 Mo (AAC) ou 327 Ko (Opus), téléchargée seulement une fois le mode course activé |
| Appels de dessin par image, qualité élevée (post-traitement compris) : lab (baie) / circuit (arrivée) | 360 / ≈ 330 |
| Appels de dessin par image, qualité basse : lab (baie) | 313 |
| Triangles, qualité haute : lab / circuit | ≈ 20 900 / ≈ 20 900 (≈ 13 100 en qualité réduite sur le circuit) |
| Géométries en mémoire WebGL : lab / circuit après passage du sas | ≈ 110 / ≈ 60 (nouveau contexte, rien du lab ne subsiste) |

Ces chiffres viennent de `renderer.info` via `window.__lab.stats()` (compteurs cumulés sur l'image entière depuis la v2.1)
et des fichiers de `out/`.

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
- **Envoi d'email réel** : aucun SMTP n'est configuré ici ; le service a été testé en envoi simulé et avec un transport de test.
  L'envoi réel (authentification, TLS, délivrabilité, SPF/DKIM du domaine) reste à vérifier sur la VM avec `server/.env`.
- **Impression dans d'autres navigateurs** : la mise en page PDF a été vérifiée dans Chromium seulement ; l'ouverture des fiches
  repose sur l'événement `beforeprint` (Firefox et Safari le déclenchent aussi, non essayé).
- **Contenu juridique** : les mentions légales et la politique de confidentialité ont été rédigées d'après les obligations
  connues (LCEN, RGPD, recommandations CNIL sur les traceurs) mais n'ont pas été relues par un juriste ; l'adresse de
  l'hébergeur reste à compléter si elle doit être publiée (voir `INFOS-MANQUANTES.md`).
- **NetForge** : `https://netforge.dagz.fr` n'a pas pu être ouvert depuis l'environnement de développement ; le bouton pointe vers
  l'URL fournie. L'aperçu intégré dépend des en-têtes du site (il peut refuser d'être affiché dans une iframe : le texte le signale).
- **Bloqueur de fenêtres** : le cas où le navigateur bloque l'onglet Google n'a pas été simulé ; le lien de secours est vérifié.
- **Docker** : dans ce bac à sable, `npm ci` ne sort qu'à travers un proxy ; le build a donc été vérifié avec une copie
  temporaire du Dockerfile ajoutant uniquement le proxy et son certificat (fichier non commité). Le `Dockerfile` livré n'a pas
  été construit tel quel contre les registres publics.
- **Impression papier** : vérifiée à l'écran en émulation `print`, pas sur une imprimante.
