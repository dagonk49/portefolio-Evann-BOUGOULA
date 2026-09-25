# Informations encore manquantes (suivi éditorial interne)

Ce fichier n'est **pas** affiché sur le site. Rien de ce qui suit n'a été inventé : en l'absence d'information, le site
n'affiche simplement pas l'élément (aucun lorem ipsum, aucun « à compléter », aucun bouton mort).

| Sujet | État actuel sur le site | À fournir si souhaité | Où le renseigner |
| --- | --- | --- | --- |
| Stage **EURL Moizan** (avril – mai 2024) | Entrée affichée avec l'employeur, le type et les dates uniquement | Missions, lieu | `src/data/experiences.ts` → `moizan-2024` |
| Stage **NET4BUSINESS 2026** | Trois missions affichées ; texte LinkedIn tronqué après elles | Suite éventuelle de la description | `src/data/experiences.ts` → `net4business-2026` |
| Stage **NET4BUSINESS 2024** | Missions affichées, lieu absent | Lieu (non précisé dans le texte fourni) | `net4business-2024.location` |
| Langage du script de 2025 | « Script de désinstallation » sans langage | Langage utilisé, si vous voulez le mentionner | `net4business-2025` |
| Programme **AMI** (EFS) | Acronyme non développé | Définition vérifiée, si publiable | `efs-2026.missions` |
| **Coordonnées** | Email `evann.bougoula@dagz.fr`, LinkedIn, GitHub `dagonk49` (brief v3) | Téléphone, seulement si vous souhaitez le publier | `src/data/profile.ts` → `contacts` |
| **CV** | `public/CV_Evann_Bougoula.pdf` **généré** à partir des données du site (page `/cv`, une page A4) : aucun CV n'avait été fourni | Votre propre CV, si vous en avez un : remplacez le fichier (même nom) | `public/CV_Evann_Bougoula.pdf` |
| **NetForge** | Présentation, piliers, valeur, bouton vers `https://netforge.dagz.fr` (URL fournie, non ouverte depuis l'environnement de développement), maquette illustrative | Captures réelles, stack, dépôt éventuel ; vérifier que le site accepte l'aperçu intégré (sinon le bouton suffit) | `src/data/projects.ts` → `netforge` |
| **Intro audio du circuit** | Fichier fourni avec le brief v2, lu en mode course | Source et droits de diffusion du fichier (s'il vient d'un film ou d'une œuvre protégée, autorisation nécessaire ou retrait) | `public/audio/` (voir le guide d'édition) |
| **Loisirs** | Valorant (Duelist / Initiator), Minecraft, GTA V et VI, cinéma et mécanique : phrases du brief uniquement | Rien d'obligatoire ; précisions seulement si vous souhaitez les publier | `src/data/hobbies.ts` |
| **HomeLab** | Schéma logique des usages connus | Nombre de VM, matériel, topologie, logiciels de la bibliothèque (seulement si vous voulez les publier) | `src/data/projects.ts` → `homelab` |
| **Avatar** | Personnage stylisé générique (aucune photo fournie) | Indications d'apparence (couleurs, cheveux, casquette…) | `src/game/avatar.config.ts` |
| **Compétences sans contexte** | NAT et Hyper-V affichés « déclarés sur mon profil » | Contexte réel éventuel | `src/data/skills.ts` → `contexts` |
| **URL du site** | Métadonnées sans URL canonique ni image de partage | Domaine définitif du portfolio (le brief cite seulement le domaine dagz.fr) | `src/app/layout.tsx` (`metadataBase`, image Open Graph) |
| **Fiches E5 — captures** | Emplacements légendés « capture non jointe » (16 au total) | Captures anonymisées (aucune donnée de l'EFS ni d'un client) | `src/data/realisations.ts` → `captures[].src` / `alt`, fichiers dans `public/realisations/` |
| **Fiches E5 — documentation** | Trois documents par fiche, titrés, marqués « document non joint à la version en ligne » | PDF des procédures d'installation, guides d'exploitation / MCO et guides utilisateur que vous avez réellement rédigés (ou retrait des titres qui ne correspondent à rien) | `documents[].href` |
| **Fiches E5 — recette** | Cas et résultats attendus proposés d'après les objectifs ; résultat obtenu et statut « non consigné » | Vos résultats réels (OK / KO) et, si besoin, vos propres cas de test | `tests[].observed` / `status` |
| **Fiches E5 — rattachement** | Compétences E5 cochées selon les missions documentées (interprétation) | Validation par vous et votre équipe pédagogique | `realisations[].competences` |
| **Fiches E5 — détails techniques** | Aucun outil de ticketing, modèle d'équipement, numéro de VLAN, adressage ni mécanisme d'automatisation Ventoy n'est cité | Ce que vous pouvez publier (sinon, gardez ces détails pour le dossier papier) | `description`, `environment`, schémas (`Schemas.tsx`) |
| **HomeLab « cluster »** | Titre du brief conservé ; la fiche parle d'un hyperviseur Proxmox VE | Nombre de nœuds, si c'est bien un cluster | `realisations.ts` → `homelab` |
| **Veille** | Section « Veille et développement professionnel » limitée aux pratiques documentées (HomeLab, NetForge, formation) | Vos sources de veille réelles (sites, newsletters, podcasts, CERT-FR…) | `src/components/sober/Skills.tsx` → `PRACTICES` |
| **Mentions légales (LCEN)** | Éditeur, directeur de la publication, contact email, hébergement « auto-hébergé sur une infrastructure conteneurisée rattachée à dagz.fr » | Pour un site édité par un particulier, la loi demande aussi le **nom, l'adresse et le téléphone de l'hébergeur** (ici vous-même, ou le fournisseur de votre serveur / connexion si la VM est chez un tiers) ; à défaut de les publier, conservez-les disponibles | `src/app/mentions-legales/page.tsx` |
| **SMTP du formulaire** | Service prêt, envoi simulé dans l'aperçu | Serveur SMTP du domaine, adresse d'expéditeur, identifiants (dans `server/.env`, jamais dans le dépôt) ; vérifier si ce prestataire héberge les emails hors UE | `server/.env` (modèle : `server/.env.example`) |

## Points volontairement prudents

- Le poste actuel est présenté en **support N1** (pas N2, qui n'apparaît que dans les thèmes du BTS).
- Le **BTS SIO** reste « en cours, fin prévue en juillet 2028 » : ce statut ne change pas automatiquement avec la date.
- Le certificat **Cisco** est présenté comme un certificat d'introduction à la cybersécurité, distinct d'un CCNA.
- « Plus de 50 % des ressources » est présenté comme votre description de l'organisation du lab, pas comme une mesure.
- Les liens entre compétences et contextes ne reprennent que ce qui est documenté (ex. Ubiquiti ↔ stage 2024, Proxmox ↔ stage 2025 et HomeLab).
- Les décors du circuit citent des jeux et des films par leur nom, sans logo ni visuel officiel ; aucun titre de film précis n'est cité.
- La vitesse affichée par le tableau de bord est celle de la simulation (m/s × 3,6), pas une performance réelle.
- **Fiches E5** : aucune capture, aucun document, aucun résultat de recette n'a été inventé ; un test unitaire échoue si l'un
  d'eux est renseigné sans que le test soit mis à jour. Les schémas sont des schémas de principe avec libellés génériques.
- Le rattachement « Travailler en mode projet » de la fiche EFS repose sur la participation au programme AMI ; celui de la fiche
  Ventoy sur la personnalisation selon les besoins des clients. À confirmer.
- La fiche Ventoy n'affirme pas de lien entre le support d'installation et la mise en place des portables : ce sont deux
  missions distinctes du profil.
- Le gris ardoise `#71717a` demandé n'est utilisé que pour les grands index et les éléments décoratifs : sur fond `#0a0a0c`,
  son contraste (4,1:1) est insuffisant pour du texte courant (WCAG AA). Les sous-titres utilisent `#a1a1aa`.
- Le formulaire annonce une conservation de **3 ans au plus** et aucun transfert à des tiers : c'est à vous de respecter ces
  engagements dans votre messagerie (suppression des échanges anciens).

