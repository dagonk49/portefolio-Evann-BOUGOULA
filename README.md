# EVANN // ROOT ACCESS — portfolio d'Evann Bougoula

Portfolio personnel construit à partir d'une seule source de données, en deux modes :

- **Mode sobre (v3, « norme BTS SIO & conformité FR »)** : un portfolio professionnel en HTML statique, monochrome sombre,
  lisible sans WebGL : parcours, **réalisations professionnelles et fiches E5** (tableau de synthèse, schémas, preuves,
  documentation, cahier de recette), NetForge, HomeLab, veille et compétences, contact avec formulaire, CLI. Bandeau de
  consentement CNIL, mentions légales, politique de confidentialité, export PDF et CV téléchargeable.
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
npm start         # sert out/ sur http://localhost:3000 (serveur Node minimal, sans dépendance ; /api/contact en envoi simulé)
npm run cv        # après un build : régénère public/CV_Evann_Bougoula.pdf à partir de la page /cv
npm run og        # régénère public/og-image.png (image des aperçus de lien, 1200 × 630)
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
Le formulaire de contact est traité par un second conteneur, **`contact`** (Node + Nodemailer, dossier `server/`), que nginx
joint sur le réseau Docker interne via `POST /api/contact`. Le site n'a besoin d'aucune variable d'environnement ; le service
d'envoi lit `server/.env`.

```bash
cp server/.env.example server/.env   # renseigner CONTACT_FROM et le SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS…)
docker compose up -d --build         # construit les deux images puis lance les conteneurs
# → http://<ip-de-la-vm>:8080 (en production : https://evann-bougoula.dagz.fr)
```

Variables de build du site (facultatives, lues par `next build`) : `SITE_URL` (adresse publique, par défaut
`https://evann-bougoula.dagz.fr`) et `GOOGLE_SITE_VERIFICATION` (code de la balise Search Console). Exemple :
`GOOGLE_SITE_VERIFICATION=abc123 docker compose up -d --build`.

Service de contact (`server/`) :

| Variable | Rôle |
| --- | --- |
| `CONTACT_TO` | Destinataire (par défaut `evann.bougoula@dagz.fr`) |
| `CONTACT_FROM` | Expéditeur technique autorisé par le serveur SMTP ; la réponse part vers le visiteur grâce à `Reply-To` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Serveur d'envoi (STARTTLS obligatoire si `SMTP_SECURE=0`) |
| `ALLOWED_ORIGINS` | Origines autorisées (en-tête `Origin`), séparées par des virgules |
| `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS` | Limitation par adresse IP (5 messages / 15 min par défaut) |
| `CONTACT_DRY_RUN=1` | Aucun envoi réel (le sujet est journalisé, jamais le contenu) |

Protections : JSON ou formulaire uniquement (415 sinon), corps limité à 32 Ko (413), contrôle de l'origine (403), champ piège
invisible, limitation de débit (429, aussi dans nginx), validation complète côté serveur (422, mêmes règles que le navigateur :
`server/contact-core.mjs`), caractères de contrôle retirés des champs d'une ligne (pas d'injection d'en-têtes), aucun stockage
du message. nginx résout le service à la requête (`resolver 127.0.0.11`) : il démarre même si `contact` est arrêté, et le
formulaire affiche alors une erreur avec l'adresse email.

- `Dockerfile` : étape `build` (Node 22 Alpine, `npm ci` puis `npm run build`) → étape `runtime` (`nginxinc/nginx-unprivileged:stable-alpine`).
- `compose.yaml` : port `8080:8080`, `restart: unless-stopped`, système de fichiers en lecture seule (`/tmp` en tmpfs),
  toutes les capacités retirées, `no-new-privileges`. Un bloc commenté montre comment rejoindre le réseau de
  **Nginx Proxy Manager** plutôt que d'exposer le port : créez alors un *Proxy Host* vers `evann-portfolio:8080` et gérez
  le certificat TLS côté NPM.
- `deploy/nginx.conf` : cache long pour `/_next/static/`, gzip, page 404, en-têtes de sécurité
  (`deploy/security-headers.inc`, identiques à `deploy/security-headers.json` utilisé par `npm start` ; un test vérifie qu'ils restent synchronisés).
- La CSP autorise `'wasm-unsafe-eval'` (moteur physique Rapier en WebAssembly), `blob:` pour les scripts de worker
  (rendu du texte 3D) et `frame-src https://netforge.dagz.fr` pour l'aperçu en direct de NetForge, chargé **uniquement à la
  demande** du visiteur ; `form-action 'self'` pour le formulaire. Aucun autre domaine externe n'est appelé.

Mise à jour du contenu : modifiez `src/data/`, puis `docker compose up -d --build`.

## Architecture

```
src/
├─ app/                  Next.js (App Router) : accueil, /mentions-legales, /confidentialite, /cv (source du PDF),
│                        robots.ts et sitemap.ts (générés en fichiers statiques)
├─ data/                 Modèle de données central et typé (source unique des deux modes et du terminal)
│  ├─ types.ts           Types, identifiants stables, références entre contenus, provenance interne
│  ├─ profile.ts         Identité, statut, mobilité, contacts (email, LinkedIn, GitHub), fichier de CV
│  ├─ realisations.ts    Six réalisations E5 et compétences du bloc 1 (faits documentés, recette sans résultat inventé)
│  ├─ experiences.ts     5 expériences (3 stages NET4BUSINESS distincts)
│  ├─ education.ts       Formations et certifications
│  ├─ skills.ts          26 compétences (intitulés d'origine conservés) et leurs contextes documentés
│  ├─ projects.ts        NetForge (URL de production, badges), ce portfolio, HomeLab
│  ├─ hobbies.ts         Loisirs (Valorant, Minecraft, GTA V et VI, cinéma et mécanique)
│  └─ anomalies.ts       Anomalies des deux mondes → contenus réels (monde, zone, couleur)
├─ components/           Mode sobre (en-tête, sections, fiches E5, schémas SVG, formulaire), consentement, pages légales,
│                        carte NetForge, terminal, bascule de mode
├─ terminal/             Interpréteur du terminal (pur, testé) : aucune exécution arbitraire
├─ sim/                  Simulation réseau pure (scénario, couches 1-3, ping, diagnostic, mission, consoles)
├─ state/                État partagé (zustand) : mode, monde, réglages, son, mode course, progression versionnée ; UI transitoire
├─ audio/                Moteur Web Audio (bus, intro, fondu, boucle synthwave générée, moteur, sons d'interface) et son hook
├─ lib/                  IPv4, formatage, stockage sûr soumis au consentement (consent.ts), impression (print.ts), navigateur
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
└─ styles/               Jetons de design, mode sobre, consentement, terminal, 3D, impression, CV
server/                  Service d'envoi du formulaire : validation partagée, handler HTTP, Nodemailer, Dockerfile
scripts/                 serve.mjs (aperçu + /api/contact simulé), build-cv.mjs (CV PDF), build-og.mjs (image d'aperçu)
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
- **3D à la demande** : `next/dynamic` charge Three.js, R3F, drei et Rapier uniquement au clic sur « Basculer en 3D ».
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
| Qualité | Élevée (ombres douces PCF, post-traitement : MSAA, bloom ciblé sur les néons, ACES Filmic ; DPR ≤ 1,75) ou basse (DPR 1, sans ombres ni post-traitement) ; baisse automatique une fois si l'animation n'est pas fluide (désactivable). Réglage dans **Options** |
| Rendu | Environnement lumineux procédural (drei `Environment` + `Lightformer`, calculé une fois, sans fichier) pour les reflets de l'aluminium, des jantes et des rails ; asphalte sombre et vibreurs nets sur le circuit |
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
Le son est **coupé par défaut**. Réglages dans la fenêtre **Options** (engrenage en haut à droite, à côté de la bascule de mode,
ou touche `O`) : bascule générale, volume de la musique d'ambiance, volume des effets sonores et de la voix de l'intro (deux bus
séparés dans le moteur).
La commande secrète du terminal active le son : c'est une demande explicite du visiteur. En arrivant sur le circuit en stock-car,
l'intro (`public/audio/intro-racer.m4a`, repli Opus `.ogg`) est lue une fois par session puis fondue vers une boucle
« synthwave chill » **générée en code** (la mineur, Am–F–C–G, 96 BPM, `src/audio/synthwave.ts`). Si le navigateur bloque la lecture,
un bouton « ▶ Activer le son » apparaît dans le HUD. Dans les options, sur le circuit : lancer / arrêter la musique, passer,
lancer ou rejouer l'intro. Moteur synthétisé selon la vitesse et l'accélérateur. Tout s'arrête en quittant le circuit.

### Options, tutoriel, mode course (v2.1)

- **Options** (`src/game/ui/SettingsModal.tsx`) : son, rappel visuel de toutes les touches (à pied, conduite, interface),
  qualité graphique, baisse automatique, réduction des animations.
- **Tutoriel** (`src/game/ui/TutorialBanner.tsx`) : au premier passage dans le lab, un bandeau discret en bas à droite
  (en haut sur mobile) : « Première visite dans le Lab ? Déplace-toi avec ZQSD et approche-toi d'une borne lumineuse pour
  interagir (E). » — « Compris » le masque pour la session, « Ignorer le tutoriel » définitivement ; la première interaction
  réussie le termine. Aucun blocage des contrôles.
- **Stock-car** : sans la commande `cars`, il n'existe pas dans la scène (ni modèle, ni collider, ni allusion) ; on explore le
  circuit à pied, avec le kart des stands en option. Après `cars`, on arrive au volant et l'intro sonore démarre.
- **Interfaces** : la fermeture d'une fenêtre purge l'état lié (point actif, cadrage, sélection), remet les entrées à zéro et
  rend le focus au jeu si la fenêtre a été ouverte à la souris ; la proximité est recalculée aussitôt à la distance réelle
  joueur ↔ borne. Garde-fous : une stabilisation ou un changement de monde interrompu ne peut plus verrouiller le jeu.

## Mode sobre v3 : norme BTS SIO et conformité française

### Direction artistique

Monochrome sombre inspiré des portfolios éditoriaux minimalistes : fond `#0a0a0c`, blanc cassé `#f4f4f5`, gris ardoise
`#71717a`, filets de 1 px, ni dégradés ni bordures épaisses. Typographies **Inter** (texte) et **IBM Plex Mono** (dates,
métadonnées, badges, code). Le gris `#71717a` n'atteint pas le contraste AA sur le fond pour du texte courant (4,1:1) : il est
réservé aux grands index de section et aux éléments décoratifs ; les sous-titres et métadonnées utilisent `#a1a1aa` (≈ 7,7:1).
Le lab 3D garde sa propre identité (IBM Plex Sans, palette graphite/cyan/ambre).

**En-tête fixe** (`SiteHeader.tsx`) : Parcours, Réalisations & Fiches E5, NetForge, HomeLab, Veille & Compétences, Contact, CLI.
Le lien de la section courante est souligné (`aria-current="location"`) et un filet de progression suit la lecture. Actions :
**Basculer en 3D**, **Télécharger le CV (PDF)**, **Exporter le Portfolio (PDF)** (libellés abrégés sous 1 480 px, noms
accessibles complets). Sous 1 180 px, la navigation passe dans un menu (Échap le referme). Les ancres utilisées par le lab 3D et
le terminal (`#a-propos`, `#experience-…`, `#competences-…`, `#projet-…`, `#homelab`, `#contact`, `#loisir-…`) sont conservées.

### Réalisations professionnelles et fiches E5

`src/data/realisations.ts` décrit les six réalisations (EFS : AD et parc ; NetForge ; Ventoy ; Proxmox VE sous Debian et script ;
Wi-Fi UniFi invités / privé ; HomeLab Proxmox et Docker). La section affiche le **tableau de synthèse** (une colonne par
compétence du bloc 1), puis une fiche dépliable par réalisation, en sept parties : en-tête (intitulé, contexte, période, rôle),
compétences E5 mobilisées (avec la façon dont elles le sont), description technique, **schéma SVG** (`Schemas.tsx`, schémas de
principe, imprimables en noir sur blanc), captures et preuves, documentation (installation, exploitation / MCO, utilisateur),
**cahier de recette** (cas testé, résultat attendu, résultat obtenu, statut OK/KO).

Aucune preuve n'a été fabriquée : tant qu'Evann n'a pas fourni de capture, de document PDF ou de résultat de recette, la fiche
l'indique (« capture non jointe », « document non joint à la version en ligne », « non consigné »). Les ajouter se fait dans
les données (voir le guide d'édition) ; un test vérifie qu'aucun résultat n'est renseigné sans source.

### Export PDF et CV

- **Exporter le Portfolio (PDF)** lance l'impression du navigateur : toutes les fiches sont dépliées avant, refermées après
  (même avec Ctrl+P). La feuille `print.css` passe en fond blanc et encre sombre, masque navigation, boutons 3D, animations,
  CLI, formulaire et bandeau de consentement, et ajoute en tête les coordonnées, la synthèse du profil, la **chronologie des
  expériences** et le **tableau des compétences** ; chaque fiche E5 commence sur une nouvelle page.
- **Exporter cette fiche en PDF** (dans chaque fiche) n'imprime que la fiche concernée.
- **CV** : `public/CV_Evann_Bougoula.pdf` est généré depuis la page `/cv` (mêmes données, une page A4) par
  `npm run cv`. C'est un CV de travail : remplacez-le par votre propre fichier si vous en avez un (même nom).

### Contact, RGPD et CNIL

- **Formulaire** (`ContactForm.tsx`) : nom et prénom, entreprise ou organisation (facultatif), email professionnel, sujet,
  message. Validation immédiate (mêmes règles que le serveur), erreurs reliées aux champs et annoncées, envoi sans rechargement,
  états « envoi en cours », « message envoyé », « erreur » (saisie conservée et lien `mailto:` prérempli). Mention
  d'information RGPD sous le formulaire.
- **Consentement** (`src/lib/consent.ts`, `ConsentBanner.tsx`) : le site ne dépose aucun cookie et n'utilise aucun traceur ni
  outil d'audience. Au premier passage, un bandeau explique la seule catégorie optionnelle (« Préférences et progression » :
  mode, son, accessibilité, graphismes, tutoriel, progression 3D) avec trois boutons de même poids : **Tout accepter**, **Tout
  refuser**, **Personnaliser** (aucune case précochée). Sans accord, rien n'est écrit dans le navigateur ; refuser efface ce qui
  existait. Le choix est gardé 6 mois, les préférences 13 mois au plus. « Gérer les cookies » en pied de page rouvre le panneau.
- **Pages légales** : `/mentions-legales` (éditeur, directeur de la publication, hébergement auto-géré sur dagz.fr, propriété
  intellectuelle, marques citées) et `/confidentialite` (finalité exclusive, base légale, conservation 3 ans au plus, aucun
  tiers, stockage local détaillé, droits RGPD et CNIL, CGU).

### Référencement

- `src/lib/site.ts` : adresse publique (`SITE_URL`), métadonnées de page (`pageMetadata` : titre, description, **canonique**,
  **Open Graph** avec `og:url` et `og:image`, carte Twitter `summary_large_image`) et **JSON-LD** de l'accueil
  (`WebSite`, `ProfilePage`, `Person` : nom, poste, employeur, formation, certifications, LinkedIn et GitHub en `sameAs`).
- `src/app/robots.ts` → `/robots.txt` (tout est explorable sauf `/api/`, ligne `Sitemap:`) ; `src/app/sitemap.ts` →
  `/sitemap.xml` (accueil et pages légales ; la page `/cv`, source du PDF, est en `noindex` et hors sitemap).
- `public/og-image.png` : image d'aperçu 1200 × 630 générée par `npm run og` (polices embarquées, aucune ressource externe).
- Search Console : la balise `google-site-verification` n'est ajoutée que si `GOOGLE_SITE_VERIFICATION` est fourni au build
  (aucun faux code). La validation par enregistrement DNS TXT sur `dagz.fr` ne demande aucune modification du site.
- Cloudflare : si l'option « robots.txt géré » est active, Cloudflare ajoute son bloc de commentaires **devant** le
  `robots.txt` du site (il ne le remplace que si le site n'en a pas). Après un déploiement, purger le cache de
  `/robots.txt` et `/sitemap.xml`.

## Terminal du mode sobre

Prompt `visiteur@evann:~$`. Commandes : `help`, `whoami`, `about`, `skills`, `experience`, `education`, `certifications`,
`projects`, `realisations` (alias `e5`), `netforge`, `homelab`, `contact`, `email`, `linkedin`, `github`, `cv`, `history`,
`clear`, `gui`, `google`, plus quelques easter eggs
non listés par `help` (`valorant`, `minecraft`, `gta5`, `gta6`, `sudo`, et `cars`, qui débloque le mode course : réponse
« [RACER MODE UNLOCKED] : Configuration Stock-Car validée. Rendez-vous sur le circuit extérieur pour prendre la piste. », état
`isNascarUnlocked` mémorisé, lien « aller au circuit »).
Insensible à la casse, historique ↑/↓, Tab complète une commande sans piéger le focus, Échap quitte le terminal.
`google`, `linkedin` et `github` ouvrent un onglet `noopener,noreferrer` depuis le geste de validation, avec un lien de secours ;
`email` affiche l'adresse et un lien `mailto:` ; `cv` télécharge `CV_Evann_Bougoula.pdf`.

## Accessibilité

- Mode sobre sémantique (titres, listes, `time`, landmarks, tableaux avec en-têtes), lien d'évitement, focus visible,
  contrastes vérifiés sur le thème sombre (axe, WCAG 2 AA, fiches dépliées), schémas SVG avec titre et description textuelle.
- Formulaire : libellés visibles, champs obligatoires signalés, erreurs reliées par `aria-describedby`, focus sur le premier
  champ à corriger, statut d'envoi en région `role="status"`. Bandeau de consentement non bloquant ; panneau en `<dialog>`
  modal (focus piégé, Échap).
- Fenêtres du lab : `role="dialog"`, focus piégé, Échap, retour du focus ; onglets au clavier ; états des ports en texte + symbole.
- `prefers-reduced-motion` : animations décoratives coupées (voyants, particules, flux, rotation des anomalies), travelling instantané.
- Le son est coupé par défaut et se règle dans Options (engrenage toujours visible, touche `O`). Aucune lecture automatique
  sans action du visiteur.
- Retour du focus : au déclencheur pour une fenêtre ouverte au clavier, à la surface de jeu pour une fenêtre ouverte à la
  souris ; reprendre le déplacement rend aussi le focus au jeu (Entrée et Espace ne réactivent jamais un bouton oublié).
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
- Polices **Inter** (`@fontsource-variable/inter`) et **IBM Plex Sans / Mono** via `@fontsource` (SIL Open Font License 1.1) ;
  copies WOFF locales pour le texte 3D dans `public/fonts/` avec la licence `OFL-IBM-Plex.txt`.
- Bibliothèques : Next.js, React, Three.js, @react-three/fiber, @react-three/drei, @react-three/rapier (Rapier), postprocessing,
  zustand — licences MIT, Apache-2.0 ou zlib ; service de contact : Nodemailer (MIT-0).
- Schémas des fiches E5 et CV : dessinés en SVG et HTML à partir des données, sans ressource externe.

## Documentation complémentaire

- [`docs/GUIDE-EDITION.md`](docs/GUIDE-EDITION.md) — modifier le profil, ajouter une expérience, un projet, une anomalie, une commande.
- [`docs/INFOS-MANQUANTES.md`](docs/INFOS-MANQUANTES.md) — informations personnelles encore à fournir (suivi éditorial, non publié).
- [`docs/VERIFICATIONS.md`](docs/VERIFICATIONS.md) — vérifications exécutées, résultats et limites.
