# Guide d'édition

Tout le contenu vit dans `src/data/`. Une modification s'affiche automatiquement dans le **mode sobre**, le **lab 3D**
(fiches, index, stèles, anomalies) et le **terminal**. Après chaque modification :

```bash
npm run check        # types + tests + build
npm run dev          # aperçu sur http://localhost:3000
```

Les tests de `src/data/data.test.ts` vérifient notamment que toutes les références entre contenus existent.

## Modifier mon profil

`src/data/profile.ts` → objet `profile` :

- `status` (lignes sous le nom : poste, formation), `mobility` (permis, véhicule, secteur, modes de travail) ;
- `headline`, `location`, `currentTraining`, `tagline`, `about` (paragraphes), `practiceScopes` (entreprise / formation / pratique personnelle) ;
- `featuredSkills` : identifiants de compétences mises en avant dans l'en-tête ;
- `contacts` : email, LinkedIn et GitHub (constantes `CONTACT_EMAIL`, `LINKEDIN_URL`, `GITHUB_URL` en tête du fichier) ;
  chaque entrée apparaît dans l'accroche, la section Contact, la borne contact du lab et les commandes `contact`, `email`,
  `github`, `linkedin`. L'adresse de destination du formulaire se règle séparément (`CONTACT_TO` du service `server/`).
- `cvFile` (`CV_FILE`) : `/CV_Evann_Bougoula.pdf`. Le fichier publié est **généré** depuis la page `/cv` :
  `npm run build && npm run cv` (Chromium requis ; `CHROMIUM_PATH=/chemin/vers/chromium` si besoin). Pour publier votre propre CV,
  remplacez simplement `public/CV_Evann_Bougoula.pdf` par votre fichier (même nom) et ne relancez plus `npm run cv`.

## Réalisations professionnelles (fiches E5)

`src/data/realisations.ts` :

- `e5Competences` : les six compétences du bloc 1 (colonnes du tableau de synthèse) ;
- `realisations` : une entrée par fiche (`title`, `context`, `frame`, `period` — lien vers une expérience, date de début ou
  libellé —, `role`, `summary`, `description`, `environment`, `competences` avec la façon dont chacune est mobilisée, `schema`,
  `captures`, `documents`, `tests`, `related`, `links`).

Ajouter vos preuves :

1. **Capture** : déposez l'image (anonymisée) dans `public/realisations/` puis renseignez `src` et `alt` de l'entrée
   correspondante dans `captures`. Le libellé « capture non jointe » disparaît.
2. **Document** (procédure d'installation, guide d'exploitation / MCO, guide utilisateur) : déposez le PDF dans
   `public/realisations/` et renseignez `href`. Un bouton « Ouvrir le document (PDF) » remplace la mention.
3. **Recette** : pour chaque cas, renseignez `observed` (résultat réellement obtenu) et `status` (`"OK"` ou `"KO"`), à partir de
   votre cahier de recette. Modifiez les cas et résultats attendus s'ils ne correspondent pas à ce que vous avez testé.
4. Mettez à jour le test « fiches E5 » de `src/data/data.test.ts`, qui vérifie aujourd'hui qu'aucune preuve n'est renseignée.

Schémas : `src/components/sober/Schemas.tsx` (nœuds, groupes, liens, en coordonnées SVG). Gardez des libellés génériques pour ce
qui n'est pas publiable (équipements, numéros de VLAN, adressage d'un client ou de l'EFS).

## Référencement (canonique, Open Graph, sitemap, Search Console)

- Adresse du site : `SITE_URL` dans `src/lib/site.ts` (ou variable de build `SITE_URL`). Tout en découle : balises
  canoniques, `og:url`, `robots.txt`, `sitemap.xml`, JSON-LD.
- Nouvelle page publique : ajoutez-la à `PUBLIC_PAGES` (sitemap) et exportez `metadata = pageMetadata({ path, title, description })`.
- Image d'aperçu : modifiez le gabarit de `scripts/build-og.mjs`, puis `npm run og` (Chromium requis ; `CHROMIUM_PATH` si besoin).
- Search Console, méthode « Balise HTML » : reconstruisez avec `GOOGLE_SITE_VERIFICATION=<code>` (par exemple
  `GOOGLE_SITE_VERIFICATION=<code> docker compose up -d --build`). Méthode DNS : rien à changer dans le site.

## Contact, consentement et pages légales

- **Formulaire** : `src/components/sober/ContactForm.tsx`. Les règles de validation (longueurs, format d'email) sont dans
  `server/contact-core.mjs`, partagé par le navigateur et le service d'envoi : modifiez-les à un seul endroit.
- **Service d'envoi** : `server/` (voir le README pour les variables). Test local sans SMTP : `CONTACT_DRY_RUN=1 node server/index.mjs`.
- **Consentement** : catégories et durées dans `src/lib/consent.ts` ; textes du bandeau dans
  `src/components/consent/ConsentBanner.tsx`. Si vous ajoutez un jour un outil tiers (mesure d'audience, vidéo intégrée…),
  ajoutez une catégorie, ne le chargez qu'après accord et complétez le tableau de `/confidentialite`.
- **Pages légales** : `src/app/mentions-legales/page.tsx` et `src/app/confidentialite/page.tsx` (date de mise à jour en tête).

## Ajouter une expérience

1. `src/data/types.ts` : ajoutez un identifiant stable à `ExperienceId` (ex. `"entreprise-2027"`).
2. `src/data/experiences.ts` : ajoutez l'entrée **en tête de liste** (ordre chronologique inverse) :

   ```ts
   {
     id: "entreprise-2027",
     organizationId: "entreprise",          // à déclarer dans organizations (profile.ts)
     role: "Technicien systèmes et réseaux",
     contract: "Alternance",                // ou "Stage"
     period: { start: { year: 2027, month: 9 }, end: "present" },
     location: { city: "Angers", region: "Pays de la Loire", country: "France" },
     workMode: "Sur site",
     context: "Une phrase de contexte.",
     missions: [{ title: "Titre court", text: "Ce que j'ai réellement fait." }],
     skills: ["technical-support"],         // identifiants de src/data/skills.ts
     provenance: SOURCE_BRIEF,          // importée depuis ./profile
   },
   ```

3. Si l'employeur est nouveau : `organizations` dans `src/data/profile.ts`.
4. (Facultatif) Liez la compétence à ce contexte dans `src/data/skills.ts` (`contexts`).
5. (Facultatif) Ajoutez une stèle au mur du parcours : `CAREER_STELES` dans `src/game/layout.ts`
   (position `x` le long du mur ; gardez environ 2,3 m entre deux stèles). Sans stèle, l'expérience reste dans l'index du lab.

## Ajouter une formation ou une certification

`src/data/education.ts` : tableaux `education` et `certifications` (et les identifiants dans `types.ts`).
Le statut d'une formation est saisi à la main (`{ kind: "en-cours", expectedEnd }` ou `{ kind: "obtenu", obtainedAt }`) :
il ne change jamais tout seul avec la date.

## Ajouter un projet

1. `types.ts` : identifiant dans `ProjectId`.
2. `src/data/projects.ts` : entrée dans `projects` (`tagline`, `pillars`, facultativement `problem`, `solution`, `audience`,
   `value`, `illustrates`, `links`). Les `links` n'acceptent que des URL réelles et publiques.
3. Le projet apparaît dans la section Projets, l'index du lab et la commande `projects`.

### NetForge : lien, badges, aperçu

- `src/data/projects.ts` → `netforge.liveUrl` (adresse de production), `links` (bouton d'accès) et `badges`
  (« Outil en ligne », « IPAM », « Cisco CLI », « VLSM »). Le libellé du bouton est construit à partir du domaine de `liveUrl`.
- La carte est le composant `src/components/NetForgeLaunch.tsx` (mode sobre et fiche du lab). La maquette reprend les titres
  des quatre piliers. Si le domaine change, mettez aussi à jour `frame-src` dans `deploy/security-headers.json` **et**
  `deploy/security-headers.inc` (un test vérifie qu'ils restent identiques).
- Écran du bureau 3D : `drawNetForgeScreen` dans `src/game/textures.ts` ; dalle `bureau.netforge` dans `src/game/layout.ts`.

## Modifier les loisirs (« Centres d'intérêt » du parcours et circuit)

`src/data/hobbies.ts` : `title`, `kicker`, `lines` (phrases à la première personne), `quote` facultative, `tags`.
N'y mettez que ce qu'Evann a fourni (pas de rang, de temps de jeu ni de préférence supposée). Chaque loisir est ouvert par une
anomalie du circuit (`src/data/anomalies.ts`, `world: "circuit"`, `color` du cube) placée dans `ANOMALY_PLACEMENTS`
(repère du circuit) ; le décor du spot est dans `src/game/circuit/Spots.tsx` et sa position dans `SPOTS`
(`src/game/circuit/layout.ts`). Le test vérifie que les anomalies du circuit restent dans l'infield, hors de la piste.

## Ajouter une anomalie (lab ou circuit)

1. `types.ts` : identifiant dans `AnomalyId`, au format `evann.<famille>.<nom>` (ex. `evann.projects.monoutil`).
2. `src/data/anomalies.ts` : entrée avec `source` (objet d'où elle s'échappe), `world` (`"lab"` ou `"circuit"`), `zone`,
   `target` (contenu ouvert), `fragments` (courts textes décoratifs, sans fausse information), éventuellement `color` et `revealedBy`.
3. `src/game/layout.ts` → `ANOMALY_PLACEMENTS` : `float` (position flottante) et `ground` (point au sol où se tenir), dans le
   repère du monde concerné. Le test `src/game/interaction.test.ts` vérifie les placements des deux mondes.

## Ajouter une commande au terminal

`src/terminal/interpreter.ts` → tableau `COMMANDS` :

```ts
{
  name: "uptime",
  aliases: ["up"],
  description: "texte affiché par help",
  hidden: false,                       // true pour un easter egg (absent de help et de l'autocomplétion)
  run: () => out([line("Réponse lisible.")]),
},
```

Les sorties sont des segments (`text`, `link`, `action`) rendus par React : jamais de HTML brut.
Ajoutez un test dans `src/terminal/interpreter.test.ts`.

La commande cachée `cars` renvoie le texte exact `RACER_UNLOCKED` et l'effet `unlock-racer` (traité dans
`src/components/terminal/Terminal.tsx` : `useApp().unlockNascar()`, qui active aussi le son). Pour réinitialiser le mode course :
menu Pause → « Réinitialiser toute la progression », ou bouton de réinitialisation du pied de page.

## Circuit : tracé, véhicules, son

- Tracé, dévers, chronométrage, positions (paddock, sas, grille, kart, spots) : `src/game/circuit/layout.ts`, testé par
  `layout.test.ts`. Modifier `TRACK` recalcule la piste, les vibreurs, le mur et la collision.
- Réglages des véhicules : `SPECS` dans `src/game/circuit/VehicleController.tsx` (masse, centre de gravité, suspension,
  force moteur, vitesse maximale, freinage, braquage, adhérence normale et en drift, appui aérodynamique).
- Musique : `src/audio/synthwave.ts` (tempo, accords, motifs). Sons d'interface : `CUES` dans `src/audio/AudioEngine.ts`.
- **Retirer l'intro audio** (droits non vérifiés) : supprimez `public/audio/intro-racer.m4a` et `public/audio/intro-racer.ogg`.
  Le moteur détecte l'erreur de chargement et passe directement à la musique générée. Pour la remplacer, déposez un fichier
  sous les mêmes noms (AAC en `.m4a`, Opus en `.ogg`), ou changez `INTRO_SOURCES`.

## Modifier l'avatar

`src/game/avatar.config.ts` : couleurs (hoodie, pantalon, chaussures, peau, cheveux, sacoche), coiffure
(`"short"`, `"cap"`, `"none"`) et présence de la sacoche.

## Modifier la mission réseau

`src/sim/scenario.ts` décrit la topologie (ports, câbles fixes, VLAN, adresses) et `src/sim/mission.ts` les étapes et indices.
Toute modification doit rester cohérente avec `src/sim/network.test.ts` : lancez `npm test` et adaptez les cas.

## Options, tutoriel, rendu (v2.1)

- **Options** : `src/game/ui/SettingsModal.tsx`. La liste `CONTROLS` décrit le rappel des touches ; ajoutez-y toute nouvelle
  commande clavier (gérée dans `src/game/input.ts`).
- **Volumes** : `useApp().audio` (`muted`, `music`, `sfx`), appliqués par `audioEngine.configure` sur deux bus séparés.
- **Tutoriel** : textes dans `src/game/ui/TutorialBanner.tsx` ; état persisté `settings.tutorial` (`pending`, `done`, `skipped`).
  Pour le revoir : Pause → « Réinitialiser toute la progression ».
- **Bloom** : `src/game/PostFX.tsx` (seuil `BLOOM_THRESHOLD`, intensité des néons `GLOW_BOOST`). Un matériau devient « néon »
  avec `glow()` ou `registerGlow()` (`src/game/materials.ts`) ; les shaders des dalles et des câbles lisent `GLOW_UNIFORM`.
  Ne passez pas d'écran ou de grande surface en néon : ils brilleraient en entier.
- **Reflets** : environnement procédural dans `src/game/scene/Environment.tsx` (lab) et `src/game/circuit/CircuitEnvironment.tsx`
  (circuit) ; finitions métalliques par défaut de `alu` / `aluDark` dans `FINISH` (`src/game/materials.ts`).
