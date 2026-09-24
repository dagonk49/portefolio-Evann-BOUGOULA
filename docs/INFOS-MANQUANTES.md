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
| **Coordonnées** | LinkedIn uniquement | Email professionnel, téléphone… | `src/data/profile.ts` → `contacts` (type à étendre) |
| **GitHub** | Absent | URL du profil | `profile.contacts` |
| **CV** | Commande `cv` et bouton « Imprimer mon parcours » (feuille d'impression dédiée) | Fichier PDF | Déposer dans `public/` et renseigner `profile.cvFile` (ex. `"/cv-evann-bougoula.pdf"`) |
| **NetForge** | Présentation, piliers, valeur ; aucune URL, aucune stack | URL, dépôt, captures, stack, état du projet | `src/data/projects.ts` → `netforge.links` et textes |
| **HomeLab** | Schéma logique des usages connus | Nombre de VM, matériel, topologie, logiciels de la bibliothèque (seulement si vous voulez les publier) | `src/data/projects.ts` → `homelab` |
| **Avatar** | Personnage stylisé générique (aucune photo fournie) | Indications d'apparence (couleurs, cheveux, casquette…) | `src/game/avatar.config.ts` |
| **Compétences sans contexte** | NAT et Hyper-V affichés « déclarés sur mon profil » | Contexte réel éventuel | `src/data/skills.ts` → `contexts` |
| **URL du site** | Métadonnées sans URL canonique ni image de partage | Domaine définitif | `src/app/layout.tsx` (`metadataBase`, image Open Graph) |

## Points volontairement prudents

- Le poste actuel est présenté en **support N1** (pas N2, qui n'apparaît que dans les thèmes du BTS).
- Le **BTS SIO** reste « en cours, fin prévue en juillet 2028 » : ce statut ne change pas automatiquement avec la date.
- Le certificat **Cisco** est présenté comme un certificat d'introduction à la cybersécurité, distinct d'un CCNA.
- « Plus de 50 % des ressources » est présenté comme votre description de l'organisation du lab, pas comme une mesure.
- Les liens entre compétences et contextes ne reprennent que ce qui est documenté (ex. Ubiquiti ↔ stage 2024, Proxmox ↔ stage 2025 et HomeLab).
