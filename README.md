# EVANN // ROOT ACCESS — portfolio d'Evann Bougoula

Portfolio personnel construit à partir d'une seule source de données, en deux modes :

- **Mode sobre** : un portfolio éditorial en HTML statique, lisible sans JavaScript ni WebGL, pensé pour un recruteur pressé
  (présentation, expériences, compétences contextualisées, NetForge, HomeLab, formations, certifications, loisirs, contact, terminal).
- **Mode 3D**, deux mondes reliés par un sas :
  - **le lab** : une île-atelier explorable à pied (Three.js + React Three Fiber + Rapier). On y pousse les lettres
    « EVANN BOUGOULA », on stabilise des anomalies de code qui ouvrent de vraies fiches, et on remet le poste du lab en ligne
    grâce à une mission réseau simulée (brassage, VLAN, IPv4, diagnostic) ;
  - **le circuit extérieur** : un ovale à virages relevés à l'heure dorée, avec kart, stock-car débloquable, chronomètre,
    accessoires physiques et quatre spots « pop culture » (Valorant, Minecraft, GTA V et VI, cinéma et mécanique).

> Accroche : « Je comprends, je branche, je configure, je teste. Bienvenue dans mon lab. »

La 3D ne conditionne jamais l'accès au parcours : tout le contenu est dans le mode sobre, dans l'index du mode 3D et dans le terminal.

## Démarrage rapide

Prérequis : **Node.js ≥ 20.9** (testé avec Node 22) et npm.

```bash
npm ci            # installation reproductible (package-lock.json)
npm run dev       # développement : http://localhost:3000
npm run build     # export statique dans out/
npm start         # sert out/ sur http://localhost:3000 (serveur Node minimal, sans dépendance)
```

Vérifications :

```bash
npm run typecheck # TypeScript strict
npm test          # tests unitaires (Vitest) : simulation réseau, circuit et chronométrage, terminal, données, audio, en-têtes
npm run e2e       # tests de bout en bout (Playwright) — nécessite un build préalable
npm run check     # typecheck + tests + build
```

Pour Playwright, installez un navigateur (`npx playwright install chromium`) ou indiquez un Chromium existant :
`PLAYWRIGHT_CHROMIUM=/chemin/vers/chromium npm run e2e`.

## Hébergement sur la VM Docker

Le site est un export statique : l'image finale est un **nginx non privilégié** qui sert `out/` sur le **port 8080**.
Aucune variable d'environnement n'est nécessaire à l'exécution.

```bash
docker compose up -d --build     # construit l'image puis lance le conteneur
# → http://<ip-de-la-vm>:8080
```

- `Dockerfile` : étape `build` (Node 22 Alpine, `npm ci` puis `npm run build`) → étape `runtime` (`nginxinc/nginx-unprivileged:stable-alpine`).
- `compose.yaml` : port `8080:8080`, `restart: unless-stopped`, système de fichiers en lecture seule (`/tmp` en tmpfs),
  toutes les capacités retirées, `no-new-privileges`. Un bloc commenté montre comment rejoindre le réseau de
  **Nginx Proxy Manager** plutôt que d'exposer le port : créez alors un *Proxy Host* vers `evann-portfolio:8080` et gérez
  le certificat TLS côté NPM.
- `deploy/nginx.conf` : cache long pour `/_next/static/`, gzip, page 404, en-têtes de sécurité
  (`deploy/security-headers.inc`, identiques à `deploy/security-headers.json` utilisé par `npm start` ; un test vérifie qu'ils restent synchronisés).
- La CSP autorise `'wasm-unsafe-eval'` (moteur physique Rapier en WebAssembly), `blob:` pour les scripts de worker
  (rendu du texte 3D) et `frame-src https://netforge.dagz.fr` pour l'aperçu en direct de NetForge, chargé **uniquement à la
  demande** du visiteur. Aucun autre domaine externe n'est appelé.

Mise à jour du contenu : modifiez `src/data/`, puis `docker compose up -d --build`.

## Architecture

```
src/
├─ app/                  Next.js (App Router) : layout, métadonnées, page unique
├─ data/                 Modèle de données central et typé (source unique des deux modes et du terminal)
│  ├─ types.ts           Types, identifiants stables, références entre contenus, provenance interne
│  ├─ profile.ts         Identité, présentation, contacts
│  ├─ experiences.ts     5 expériences (3 stages NET4BUSINESS distincts)
│  ├─ education.ts       Formations et certifications
│  ├─ skills.ts          26 compétences (intitulés d'origine conservés) et leurs contextes documentés
│  ├─ projects.ts        NetForge (URL de production, badges), ce portfolio, HomeLab
│  ├─ hobbies.ts         Loisirs (Valorant, Minecraft, GTA V et VI, cinéma et mécanique)
│  └─ anomalies.ts       Anomalies des deux mondes → contenus réels (monde, zone, couleur)
├─ components/           Mode sobre (sections), carte NetForge, terminal, bascule de mode
├─ terminal/             Interpréteur du terminal (pur, testé) : aucune exécution arbitraire
├─ sim/                  Simulation réseau pure (scénario, couches 1-3, ping, diagnostic, mission, consoles)
├─ state/                État partagé (zustand) : mode, monde, réglages, son, mode course, progression versionnée ; UI transitoire
├─ audio/                Moteur Web Audio (bus, intro, fondu, boucle synthwave générée, moteur, sons d'interface) et son hook
├─ lib/                  IPv4, formatage de dates, stockage sûr, détections navigateur
├─ game/                 Mode 3D, chargé à la demande
│  ├─ LabExperience.tsx  Racine : un monde monté à la fois, changement de monde avec libération de la mémoire
│  ├─ LoadingTransition.tsx  Écran de transition (journal des étapes réelles, jauges)
│  ├─ layout.ts          Topologie du lab (zones, points d'intérêt, sas, anomalies) — données pures
│  ├─ interaction.ts     Règles d'interaction des deux mondes (point actif, zone, visibilité) — testées
│  ├─ input.ts           Clavier (codes physiques ZQSD/WASD), manette, tactile, commandes de véhicule
│  ├─ player/            Avatar procédural et contrôleur physique (capsule Rapier)
│  ├─ camera/            Caméra isométrique amortie, cadrage par monde, recul avec la vitesse
│  ├─ scene/             Lab : île, zones, lettres physiques, accessoires, dalles, anomalies, câbles, sas
│  ├─ circuit/           Circuit : tracé et chronométrage (purs, testés), OutdoorScene, piste, paddock, spots,
│  │                     accessoires, VehicleController (kart, stock-car), traces de pneus, ciel
│  └─ ui/                HUD (son, tableau de bord), fenêtres accessibles, mission, index, pause, tactile
└─ styles/               Jetons de design, mode sobre, terminal, 3D, impression
```

Correspondance avec les noms du brief v2 : `usePortfolioStore.ts` → `src/state/app.ts` (`useApp` : `world`,
`isNascarUnlocked`, `audio`, `bestLap`, persistés) et `src/state/labUi.ts` (transition, véhicule conduit) ;
`portfolioData.ts` → `src/data/` (lien NetForge dans `projects.ts`, loisirs dans `hobbies.ts`, anomalies dans `anomalies.ts`) ;
`VehicleController.tsx`, `OutdoorScene.tsx` → `src/game/circuit/` ; `AudioEngine.ts` et `useAudioController.ts` → `src/audio/` ;
`LoadingTransition.tsx` → `src/game/`.

Principes :

- **Une seule source de données** : le mode sobre, le lab (fiches, stèles, anomalies, index) et le terminal lisent `src/data`.
- **Règles indépendantes du rendu** : la mission (`src/sim`), l'interpréteur du terminal et la sélection des points d'intérêt
  sont des fonctions pures, testées sans navigateur. Le rendu 3D ne fait que refléter l'état (voyants, câbles, flux, écran du poste).
- **3D à la demande** : `next/dynamic` charge Three.js, R3F, drei et Rapier uniquement au clic sur « Explorer mon lab (3D) ».
  À la sortie, le Canvas est démonté (boucles arrêtées, contexte WebGL libéré, matériaux/géométries/textures partagés détruits).
- **Un monde à la fois** : passer le sas démonte tout le Canvas du monde courant (monde physique compris), attend la libération
  du contexte WebGL, détruit les ressources partagées, puis monte un Canvas neuf. L'écran de transition affiche ces étapes.
- **Pas de mise à jour React par image** : le joueur, la caméra et les animations lisent des objets mutables dans `useFrame` ;
  l'état React n'est écrit que lorsqu'il change (point actif, zone, progression).
- **Temps écoulé, pas nombre d'images** : vitesses, accélérations et amortis utilisent le delta time (exponentiel).

### Lab 3D en bref

| Élément | Implémentation |
| --- | --- |
| Caméra | Perspective à 32°, lacet 45° / tangage 41° (37° et plus de recul sur le circuit, recul supplémentaire avec la vitesse en véhicule), suivi amorti, anticipation du mouvement, glisser pour décaler, molette pour zoomer, `C` pour recentrer |
| Avatar | Humanoïde low-poly procédural (hoodie, sacoche d'intervention, câble enroulé), animation de marche/course/saut calculée depuis la vitesse réelle — apparence dans `src/game/avatar.config.ts` |
| Physique | Rapier : capsule dynamique à rotations bloquées, détection du sol par rayon, *coyote time* et tampon de saut ; lettres, cartons, cônes, blocs de code, mini-racks et chaise poussables |
| Lettres | Police « en blocs » dessinée à la main : les mêmes traits servent au rendu (géométrie fusionnée) et aux colliders |
| Zones | Accueil, Baie réseau, Bureau & atelier, Cluster HomeLab (estrade + rampe), Mur du parcours (terrasse + stèles chronologiques), Sas du circuit |
| Interaction | Dalles au sol (shader GLSL losange + cercles), balise « E · Entrée — Interagir », fenêtre HTML accessible, travelling caméra |
| Anomalies | Noyau, cage filaire, fragments de code et particules (shader) ; états *repérée*, *consultée*, et *révélée par la mission* |
| Mission | Brassage (panneau HTML ou clic sur les ports 3D), câbles 3D, voyants de port, VLAN d'accès, IPv4, diagnostic, terminal `ipconfig`/`ping`, console switch en lecture seule |
| Qualité | Haute (ombres, antialiasing, DPR ≤ 1,75) ou réduite (DPR 1, sans ombres) ; baisse automatique une fois si l'animation n'est pas fluide (désactivable) |
| Pause | Onglet masqué : rendu et physique suspendus. Menu Échap : physique en pause |

### Mission « Remettre le poste du lab en ligne »

Scénario local documenté (`src/sim/scenario.ts`) : VLAN 10 « LAB », réseau 192.168.10.0/24, poste 192.168.10.42,
serveur 192.168.10.10, passerelle 192.168.10.1. **Préconfigurés et verrouillés** : R1 (sous-interfaces 802.1Q pour les VLAN 10 et 20),
le trunk Gi0/8, la borne Wi-Fi (VLAN 20, 192.168.20.2) sur Gi0/1, l'adressage de SRV-LAB. Aucun serveur DHCP.

Le modèle tient compte des câbles (y compris le passage par le panneau de brassage et la prise murale B-02), des ports désactivés,
des cages SFP, du port console, des VLAN (domaines de diffusion), des masques, de la passerelle, des conflits d'adresse et du
chemin retour. Un ping dans le même sous-réseau ne dépend pas de la passerelle. Les sorties imitent Windows (« Délai d'attente… »,
« Impossible de joindre l'hôte de destination », « Défaillance générale ») et sont accompagnées d'une analyse en français clair.

Commandes disponibles — poste : `help`, `ipconfig [/all]`, `ping <IPv4>`, `diag`, `clear`/`cls`.
Switch (lecture seule, abréviations IOS acceptées) : `show vlan brief`, `show interfaces status`, `help`.

### NetForge

La carte NetForge (mode sobre et fiche du lab) présente les quatre piliers, les badges « Outil en ligne, IPAM, Cisco CLI, VLSM »
et le bouton **« Accéder à la plateforme NetForge (netforge.dagz.fr) ↗ »** (`target="_blank" rel="noopener noreferrer"`).
L'aperçu est une maquette stylisée signalée comme telle ; un aperçu en direct (iframe isolée, sans référent) ne se charge que si
le visiteur le demande. Dans le lab, la dalle « Écran NetForge » devant le second écran du bureau ouvre cette fiche.

### Sas et circuit extérieur

- **Sas du lab** : porte blindée vitrée au mur du fond (zone « Sas du circuit », flèche « Circuit » sur le panneau d'accueil), dalle
  néon `[E] SORTIR VERS LE CIRCUIT`. La caméra s'approche, les vantaux s'ouvrent, puis l'écran de transition déroule :
  « Déchargement des modules salle serveur... », « Allocation mémoire du circuit... », « Initialisation du moteur physique... »,
  « Root access granted. ». Le sas du paddock (`[E] RENTRER AU LAB`) fait le chemin inverse. Le menu Pause et l'index proposent
  aussi le passage, sans avoir à marcher.
- **Piste** (`src/game/circuit/layout.ts`) : stade de 2 × 60 m de lignes droites et deux virages de 22 m de rayon, 12 m de large,
  dévers progressif jusqu'à 14° au milieu des virages, vibreurs rouge et blanc lumineux, ligne de départ en damier, mur extérieur
  continu, panneaux « sponsors » en texte seul. Chronométrage par secteurs : un tour coupé par l'infield ou pris à rebours n'est pas validé.
- **Véhicules** (`VehicleController.tsx`) : contrôleur de véhicule à rayons de Rapier, propulsion arrière, braquage réduit avec la
  vitesse, appui aérodynamique, centre de gravité abaissé, remise d'aplomb (R). Frein à main (Espace) : adhérence arrière réduite,
  drift et traces de pneus. Kart dans les stands (E pour monter) ; stock-car rouge n°49 (aileron, numéro sur le toit, stickers texte
  « Proxmox », « Docker », « Cisco ») quand le mode course est débloqué. F monte ou descend (freinage automatique avant de descendre).
- **Spots** (`Spots.tsx`) : site « A » avec caisses de radianite et dispositif hexagonal ; blocs en pixels dessinés en code, dont un mur
  destructible et un petit circuit de redstone ; portique d'autoroute néon « Los Santos / Vice City » et kiosque d'attente GTA VI ;
  écran de drive-in et établi de mécanique. Chaque spot porte une anomalie colorée qui ouvre la fiche loisir correspondante.
- **Accessoires physiques** : slalom de cônes, piles de pneus à l'intérieur des virages, deux tremplins.

### Son

`src/audio/AudioEngine.ts` : un seul contexte Web Audio (bus maître, voix, musique, moteur, interface, compresseur).
Le son est **coupé par défaut** ; le bouton « Son » et le volume sont toujours visibles en haut de l'écran 3D (et dans le menu Pause).
La commande secrète du terminal active le son : c'est une demande explicite du visiteur. En arrivant sur le circuit en stock-car,
l'intro (`public/audio/intro-racer.m4a`, repli Opus `.ogg`) est lue une fois par session puis fondue vers une boucle
« synthwave chill » **générée en code** (la mineur, Am–F–C–G, 96 BPM, `src/audio/synthwave.ts`). Si le navigateur bloque la lecture,
un bouton « ▶ Activer le son » apparaît. Boutons « Musique », « Passer l'intro » / « Rejouer l'intro ». Moteur synthétisé selon la
vitesse et l'accélérateur. Tout s'arrête en quittant le circuit.

## Terminal du mode sobre

Prompt `visiteur@evann:~$`. Commandes : `help`, `whoami`, `about`, `skills`, `experience`, `education`, `certifications`,
`projects`, `netforge`, `homelab`, `contact`, `linkedin`, `cv`, `history`, `clear`, `gui`, `google`, plus quelques easter eggs
non listés par `help` (`valorant`, `minecraft`, `gta5`, `gta6`, `sudo`, et `cars`, qui débloque le mode course : réponse
« [RACER MODE UNLOCKED] : Configuration Stock-Car validée. Rendez-vous sur le circuit extérieur pour prendre la piste. », état
`isNascarUnlocked` mémorisé, lien « aller au circuit »).
Insensible à la casse, historique ↑/↓, Tab complète une commande sans piéger le focus, Échap quitte le terminal.
`google` et `linkedin` ouvrent un onglet `noopener,noreferrer` depuis le geste de validation, avec un lien de secours.

## Accessibilité

- Mode sobre sémantique (titres, listes, `time`, landmarks), lien d'évitement, focus visible, contrastes vérifiés (axe, WCAG 2 AA).
- Fenêtres du lab : `role="dialog"`, focus piégé, Échap, retour du focus ; onglets au clavier ; états des ports en texte + symbole.
- `prefers-reduced-motion` : animations décoratives coupées (voyants, particules, flux, rotation des anomalies), travelling instantané.
- Le son est coupé par défaut ; couper / rétablir et le volume restent visibles en haut de l'écran 3D. Aucune lecture automatique
  sans action du visiteur.
- Véhicules et changement de monde : commandes clavier, manette et tactile ; passage de sas aussi possible depuis le menu Pause et l'index.
- Le Canvas est masqué aux lecteurs d'écran ; tout son contenu est accessible par l'index et le mode sobre.

## Ressources et licences

- Aucune image ni modèle 3D externe : géométries et textures (canvas) sont procédurales. Les clins d'œil aux jeux et aux films sont
  des décors stylisés dessinés en code, **sans logo ni élément graphique officiel**.
- Musique du circuit, moteur et sons d'interface : synthétisés en Web Audio (aucun fichier).
- **Intro du stock-car** : `public/audio/intro-racer.m4a` est le fichier audio fourni par Evann avec le brief v2 (≈ 44 s) ;
  `intro-racer.ogg` en est une conversion Opus. Sa source et ses droits n'ont pas été documentés : s'il s'agit d'un extrait d'une
  œuvre protégée, sa diffusion publique demande une autorisation. Pour le retirer, supprimez les deux fichiers : le circuit passe
  alors directement à la musique générée (voir `docs/GUIDE-EDITION.md`).
- Polices **IBM Plex Sans / Mono** via `@fontsource` (SIL Open Font License 1.1) ; copies WOFF locales pour le texte 3D
  dans `public/fonts/` avec la licence `OFL-IBM-Plex.txt`.
- Bibliothèques : Next.js, React, Three.js, @react-three/fiber, @react-three/drei, @react-three/rapier (Rapier), zustand — licences MIT/Apache-2.0.

## Documentation complémentaire

- [`docs/GUIDE-EDITION.md`](docs/GUIDE-EDITION.md) — modifier le profil, ajouter une expérience, un projet, une anomalie, une commande.
- [`docs/INFOS-MANQUANTES.md`](docs/INFOS-MANQUANTES.md) — informations personnelles encore à fournir (suivi éditorial, non publié).
- [`docs/VERIFICATIONS.md`](docs/VERIFICATIONS.md) — vérifications exécutées, résultats et limites.
