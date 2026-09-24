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

- `headline`, `location`, `currentTraining`, `tagline`, `about` (paragraphes), `practiceScopes` (entreprise / formation / pratique personnelle) ;
- `featuredSkills` : identifiants de compétences mises en avant dans l'en-tête ;
- `contacts` : chaque entrée apparaît dans le mode sobre, la borne contact du lab et la commande `contact`.
  Exemple d'ajout (uniquement avec de vraies valeurs) :

  ```ts
  { id: "email", label: "Email", href: "mailto:prenom.nom@exemple.fr", display: "prenom.nom@exemple.fr" },
  { id: "github", label: "GitHub", href: "https://github.com/mon-compte", display: "github.com/mon-compte" },
  ```

- `cvFile` : déposez le PDF dans `public/` (ex. `public/cv-evann-bougoula.pdf`) puis indiquez `"/cv-evann-bougoula.pdf"`.
  Le bouton « Télécharger mon CV » et la commande `cv` l'utiliseront à la place de l'impression.

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

## Modifier les loisirs (section « Hors de l'infra » et circuit)

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
