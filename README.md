# EVANN // ROOT ACCESS — portfolio d'Evann Bougoula

Portfolio personnel en deux modes complémentaires, construits à partir des mêmes données :

- **Mode sobre** : un portfolio éditorial en HTML statique, lisible sans JavaScript ni WebGL, pensé pour un recruteur pressé
  (présentation, expériences, compétences contextualisées, NetForge, HomeLab, formations, certifications, contact, terminal).
- **Lab 3D** : une petite île-atelier explorable à pied (Three.js + React Three Fiber + Rapier). On y pousse les lettres
  « EVANN BOUGOULA », on stabilise des anomalies de code qui ouvrent de vraies fiches, et on remet le poste du lab en ligne
  grâce à une mission réseau simulée (brassage, VLAN, IPv4, diagnostic).

> Accroche : « Je comprends, je branche, je configure, je teste. Bienvenue dans mon lab. »

Le lab ne conditionne jamais l'accès au parcours : tout le contenu est dans le mode sobre, dans l'index du lab et dans le terminal.

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
npm test          # tests unitaires (Vitest) : simulation réseau, terminal, données, VLSM, en-têtes
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
- La CSP autorise `'wasm-unsafe-eval'` (moteur physique Rapier en WebAssembly) et `blob:` pour les scripts de worker
  (rendu du texte 3D). Aucun domaine externe n'est appelé.

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
│  ├─ projects.ts        NetForge, ce portfolio, HomeLab
│  └─ anomalies.ts       Anomalies du lab → contenus réels
├─ components/           Mode sobre (sections), terminal, bascule de mode, démo NetForge
├─ terminal/             Interpréteur du terminal (pur, testé) : aucune exécution arbitraire
├─ sim/                  Simulation réseau pure (scénario, couches 1-3, ping, diagnostic, mission, consoles)
├─ netforge-demo/        Démonstration pédagogique VLSM + aperçu Cisco IOS (pas le code de NetForge)
├─ state/                État partagé (zustand) : mode, réglages, progression versionnée ; UI transitoire du lab
├─ lib/                  IPv4, formatage de dates, stockage sûr, détections navigateur, sons synthétisés
├─ game/                 Lab 3D, chargé à la demande
│  ├─ layout.ts          Topologie de la carte (zones, points d'intérêt, anomalies) — données pures
│  ├─ interaction.ts     Règles d'interaction (point actif, zone, visibilité des anomalies) — testées
│  ├─ input.ts           Clavier (codes physiques ZQSD/WASD), manette, tactile
│  ├─ player/            Avatar procédural et contrôleur physique (capsule Rapier)
│  ├─ camera/            Caméra isométrique amortie, travelling vers les objets
│  ├─ scene/             Île, zones, lettres physiques, accessoires, dalles, anomalies, câbles
│  └─ ui/                HUD, fenêtres accessibles, panneaux de mission, index, pause, tactile
└─ styles/               Jetons de design, mode sobre, terminal, lab, impression
```

Principes :

- **Une seule source de données** : le mode sobre, le lab (fiches, stèles, anomalies, index) et le terminal lisent `src/data`.
- **Règles indépendantes du rendu** : la mission (`src/sim`), l'interpréteur du terminal et la sélection des points d'intérêt
  sont des fonctions pures, testées sans navigateur. Le rendu 3D ne fait que refléter l'état (voyants, câbles, flux, écran du poste).
- **3D à la demande** : `next/dynamic` charge Three.js, R3F, drei et Rapier uniquement au clic sur « Explorer mon lab (3D) ».
  À la sortie, le Canvas est démonté (boucles arrêtées, contexte WebGL libéré, matériaux/géométries/textures partagés détruits).
- **Pas de mise à jour React par image** : le joueur, la caméra et les animations lisent des objets mutables dans `useFrame` ;
  l'état React n'est écrit que lorsqu'il change (point actif, zone, progression).
- **Temps écoulé, pas nombre d'images** : vitesses, accélérations et amortis utilisent le delta time (exponentiel).

### Lab 3D en bref

| Élément | Implémentation |
| --- | --- |
| Caméra | Perspective à 32°, lacet 45° / tangage 41° (vue isométrique), suivi amorti, anticipation du mouvement, glisser pour décaler, molette pour zoomer, `C` pour recentrer |
| Avatar | Humanoïde low-poly procédural (hoodie, sacoche d'intervention, câble enroulé), animation de marche/course/saut calculée depuis la vitesse réelle — apparence dans `src/game/avatar.config.ts` |
| Physique | Rapier : capsule dynamique à rotations bloquées, détection du sol par rayon, *coyote time* et tampon de saut ; lettres, cartons, cônes, blocs de code, mini-racks et chaise poussables |
| Lettres | Police « en blocs » dessinée à la main : les mêmes traits servent au rendu (géométrie fusionnée) et aux colliders |
| Zones | Accueil, Baie réseau, Bureau & atelier, Cluster HomeLab (estrade + rampe), Mur du parcours (terrasse + stèles chronologiques) |
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

## Terminal du mode sobre

Prompt `visiteur@evann:~$`. Commandes : `help`, `whoami`, `about`, `skills`, `experience`, `education`, `certifications`,
`projects`, `netforge`, `homelab`, `contact`, `linkedin`, `cv`, `history`, `clear`, `gui`, `google`, plus quelques easter eggs.
Insensible à la casse, historique ↑/↓, Tab complète une commande sans piéger le focus, Échap quitte le terminal.
`google` et `linkedin` ouvrent un onglet `noopener,noreferrer` depuis le geste de validation, avec un lien de secours.

## Accessibilité

- Mode sobre sémantique (titres, listes, `time`, landmarks), lien d'évitement, focus visible, contrastes vérifiés (axe, WCAG 2 AA).
- Fenêtres du lab : `role="dialog"`, focus piégé, Échap, retour du focus ; onglets au clavier ; états des ports en texte + symbole.
- `prefers-reduced-motion` : animations décoratives coupées (voyants, particules, flux, rotation des anomalies), travelling instantané.
- Le son est désactivé par défaut et coupable à tout moment (menu Pause).
- Le Canvas est masqué aux lecteurs d'écran ; tout son contenu est accessible par l'index et le mode sobre.

## Ressources et licences

- Aucune image, aucun modèle 3D ni son externe : géométries, textures (canvas) et sons (Web Audio) sont procéduraux.
- Polices **IBM Plex Sans / Mono** via `@fontsource` (SIL Open Font License 1.1) ; copies WOFF locales pour le texte 3D
  dans `public/fonts/` avec la licence `OFL-IBM-Plex.txt`.
- Bibliothèques : Next.js, React, Three.js, @react-three/fiber, @react-three/drei, @react-three/rapier (Rapier), zustand — licences MIT/Apache-2.0.

## Documentation complémentaire

- [`docs/GUIDE-EDITION.md`](docs/GUIDE-EDITION.md) — modifier le profil, ajouter une expérience, un projet, une anomalie, une commande.
- [`docs/INFOS-MANQUANTES.md`](docs/INFOS-MANQUANTES.md) — informations personnelles encore à fournir (suivi éditorial, non publié).
- [`docs/VERIFICATIONS.md`](docs/VERIFICATIONS.md) — vérifications exécutées, résultats et limites.
