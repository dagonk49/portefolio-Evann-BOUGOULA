/**
 * Réalisations professionnelles présentées au tableau de synthèse de
 * l'épreuve E5 (BTS SIO option SISR).
 *
 * Règles éditoriales :
 * - chaque phrase reprend un fait documenté (profil, brief v3, notes HomeLab) ;
 * - les schémas sont des schémas de principe, jamais une architecture interne supposée ;
 * - les cahiers de recette listent les cas et résultats attendus ; la colonne
 *   « résultat obtenu » n'est remplie qu'à partir des résultats consignés par Evann ;
 * - captures et documents restent des emplacements tant que les fichiers ne sont pas fournis.
 */
import type { E5Competence, Realisation } from "./types";
import { SOURCE_HOMELAB, SOURCE_LINKEDIN, SOURCE_V3 } from "./profile";

/** Compétences du bloc 1 du référentiel BTS SIO (épreuve E5). */
export const e5Competences: E5Competence[] = [
  {
    id: "patrimoine",
    title: "Gérer le patrimoine informatique",
    short: "Patrimoine",
    scope:
      "Recenser et identifier les ressources numériques, mettre en place et vérifier les niveaux d'habilitation, vérifier la continuité d'un service, gérer les sauvegardes et le respect des règles d'utilisation.",
  },
  {
    id: "incidents",
    title: "Répondre aux incidents et aux demandes d'assistance et d'évolution",
    short: "Incidents",
    scope:
      "Collecter, suivre et orienter des demandes ; traiter des demandes concernant les services réseau, système et applicatifs.",
  },
  {
    id: "presence-en-ligne",
    title: "Développer la présence en ligne de l'organisation",
    short: "Présence en ligne",
    scope:
      "Valoriser l'image de l'organisation sur les médias numériques dans le respect du cadre juridique, référencer ses services en ligne, faire évoluer un site web.",
  },
  {
    id: "projet",
    title: "Travailler en mode projet",
    short: "Mode projet",
    scope: "Analyser les objectifs et l'organisation d'un projet, planifier les activités, suivre les indicateurs et analyser les écarts.",
  },
  {
    id: "service",
    title: "Mettre à disposition des utilisateurs un service informatique",
    short: "Service",
    scope: "Réaliser les tests d'intégration et d'acceptation, déployer un service, accompagner les utilisateurs dans sa mise en place.",
  },
  {
    id: "developpement-pro",
    title: "Organiser son développement professionnel",
    short: "Dév. pro",
    scope:
      "Mettre en place son environnement d'apprentissage personnel, mettre en œuvre une veille informationnelle, gérer son identité professionnelle.",
  },
];

const MAPPING_NOTE =
  "Rattachement aux compétences E5 proposé à partir des missions documentées : à valider par Evann et son équipe pédagogique.";

export const realisations: Realisation[] = [
  {
    id: "efs-ad-parc",
    number: 1,
    title: "Administration Active Directory et déploiement du parc à la DSI de l'EFS",
    context: "Entreprise",
    frame: "Établissement Français du Sang — DSI régionale, Angers",
    period: { experienceId: "efs-2026" },
    role: "Alternant technicien informatique, support de niveau 1",
    summary:
      "Support N1, gestion des comptes et des accès dans l'Active Directory, masterisation et déploiement du matériel régional, participation au programme national AMI.",
    description: [
      "Au sein de la DSI régionale de l'Établissement Français du Sang, j'interviens sur le support technique et la fiabilité des infrastructures à l'échelle du territoire.",
      "Support N1 : je traite les demandes et résous les incidents techniques du quotidien des utilisateurs.",
      "Active Directory : je gère les comptes et les accès, en veillant à la conformité et à la pérennité de l'annuaire d'entreprise.",
      "MCO et parc : je participe à la masterisation, au déploiement et à la maintenance du matériel régional.",
      "Programme national AMI : je participe aux initiatives du programme et au déploiement de ses processus.",
    ],
    environment: ["Active Directory", "Support N1", "Masterisation de postes", "MCO du parc", "Programme national AMI"],
    competences: [
      {
        id: "incidents",
        how: "Traitement des demandes et résolution des incidents techniques du quotidien, au niveau 1.",
      },
      {
        id: "patrimoine",
        how: "Gestion des comptes et des accès dans l'annuaire : mise en place et vérification des habilitations, conformité de l'annuaire.",
      },
      {
        id: "service",
        how: "Masterisation et déploiement du matériel régional mis à disposition des utilisateurs.",
      },
      {
        id: "projet",
        how: "Participation au déploiement des processus du programme national AMI.",
      },
    ],
    schema: "ad",
    schemaCaption:
      "Schéma de principe : cheminement d'une demande et périmètre d'intervention au niveau 1. Il ne décrit pas l'architecture interne de l'EFS, qui n'est pas publiée.",
    captures: [
      { id: "efs-compte", caption: "Gestion d'un compte ou d'un accès dans l'annuaire (données anonymisées)." },
      { id: "efs-demande", caption: "Suivi d'une demande d'assistance, de la prise en charge à la clôture (données anonymisées)." },
      { id: "efs-master", caption: "Poste en cours de masterisation avant son déploiement." },
    ],
    documents: [
      { kind: "installation", title: "Procédure de masterisation et de déploiement d'un poste" },
      { kind: "exploitation", title: "Mode opératoire : création, modification et désactivation d'un compte dans l'annuaire" },
      { kind: "utilisateur", title: "Fiche remise à l'utilisateur lors de la livraison de son poste" },
    ],
    tests: [
      {
        case: "Création d'un compte pour un nouvel arrivant",
        expected: "Le compte est actif et l'utilisateur ouvre sa session avec les accès prévus, et eux seuls.",
      },
      {
        case: "Retrait d'un accès à la demande du responsable",
        expected: "L'utilisateur n'accède plus à la ressource concernée ; ses autres accès sont inchangés.",
      },
      {
        case: "Livraison d'un poste masterisé",
        expected: "Le poste démarre sur l'image de référence et l'utilisateur retrouve ses outils de travail.",
      },
      {
        case: "Clôture d'une demande d'assistance",
        expected: "Le demandeur confirme la résolution avant la clôture de la demande.",
      },
    ],
    related: [{ type: "experience", id: "efs-2026" }],
    provenance: SOURCE_LINKEDIN,
    editorialNotes: [
      "Acronyme AMI non développé. Niveau N1 uniquement.",
      "Outils de ticketing, systèmes et volumes du parc non fournis : ne pas les nommer.",
      MAPPING_NOTE,
    ],
  },
  {
    id: "netforge",
    number: 2,
    title: "NetForge : conception réseau, VLSM, IPAM et génération de configurations Cisco IOS",
    context: "Projet personnel",
    frame: "Projet personnel — application web publiée sur netforge.dagz.fr",
    period: { since: { year: 2026, month: 5 } },
    role: "Conception et développement",
    summary:
      "Une boîte à outils web qui relie la conception d'un réseau aux commandes des équipements : découpage VLSM, suivi des attributions (IPAM léger) et génération de configurations Cisco IOS.",
    description: [
      "Besoin : entre le schéma d'un réseau et les commandes saisies sur les équipements, les étapes sont nombreuses — découper les plages, suivre les attributions, écrire les configurations. Réalisées à la main, elles sont longues et propices aux erreurs d'adressage.",
      "Adressage IP et VLSM : découpage d'une plage parente en sous-réseaux, calcul des plages utilisables, des masques décimaux et CIDR, des adresses de broadcast et des passerelles proposées, avec prévention des chevauchements.",
      "Documentation et IPAM léger : suivi des blocs d'adresses et organisation des attributions (serveurs, passerelles, hyperviseurs, pools DHCP) pour garder la traçabilité de l'espace réseau.",
      "Génération Cisco IOS : VLAN et leurs noms, ports d'accès, trunks 802.1Q, routage inter-VLAN par sous-interfaces (Router-on-a-Stick) ou SVI, ACL, pools DHCP et routage dynamique tel qu'OSPF.",
      "Qualité : les calculs d'adressage sont couverts par des tests unitaires. Visualisation : représentations textuelles ou visuelles de la répartition des réseaux, réutilisables dans des dossiers techniques.",
      "Public visé : administrateurs systèmes et réseaux, étudiants en BTS SIO SISR ou en BUT Réseaux & Télécoms, passionnés de HomeLab.",
    ],
    environment: ["Application web", "IPv4 / VLSM", "IPAM", "Cisco IOS", "802.1Q", "Inter-VLAN", "ACL", "DHCP", "OSPF", "Tests unitaires"],
    competences: [
      {
        id: "service",
        how: "Mise à disposition d'un outil en ligne pour les administrateurs, les étudiants et les passionnés de HomeLab.",
      },
      {
        id: "presence-en-ligne",
        how: "Publication d'un service web accessible publiquement sur le domaine dagz.fr.",
      },
      {
        id: "patrimoine",
        how: "IPAM léger : recensement des blocs d'adresses et traçabilité des attributions.",
      },
      {
        id: "projet",
        how: "Du besoin rencontré en formation et en pratique à la conception, au développement et à la publication de l'outil.",
      },
      {
        id: "developpement-pro",
        how: "Comprendre un calcul avant de l'automatiser, et construire un outil utile à d'autres techniciens et étudiants.",
      },
    ],
    schema: "netforge",
    schemaCaption: "Chaîne fonctionnelle de NetForge, de la plage d'adresses parente aux configurations prêtes à appliquer.",
    captures: [
      { id: "nf-vlsm", caption: "Découpage VLSM d'une plage parente, avec masques, plages utilisables et broadcast." },
      { id: "nf-ipam", caption: "Suivi des attributions dans l'IPAM (serveurs, passerelles, pools DHCP)." },
      { id: "nf-cli", caption: "Configuration Cisco IOS générée : VLAN, trunk 802.1Q et routage inter-VLAN." },
    ],
    documents: [
      { kind: "installation", title: "Procédure de déploiement de l'application" },
      { kind: "exploitation", title: "Guide d'exploitation et de mise à jour" },
      { kind: "utilisateur", title: "Guide utilisateur : du découpage VLSM à la configuration générée" },
    ],
    tests: [
      {
        case: "VLSM : 192.168.10.0/24 pour des besoins de 100, 50 et 20 hôtes",
        expected: "192.168.10.0/25, 192.168.10.128/26 et 192.168.10.192/27, sans chevauchement.",
      },
      {
        case: "Calcul d'un /27",
        expected: "Masque 255.255.255.224, 30 adresses utilisables.",
      },
      {
        case: "Plage utilisable et broadcast de 10.0.0.0/30",
        expected: "Hôtes 10.0.0.1 à 10.0.0.2, broadcast 10.0.0.3.",
      },
      {
        case: "Réservation de 192.168.10.64/26 alors que 192.168.10.0/25 est attribué",
        expected: "Le chevauchement est détecté et signalé ; la réservation est refusée.",
      },
      {
        case: "Génération d'un trunk 802.1Q pour les VLAN 10 et 20",
        expected: "La configuration contient « switchport mode trunk » et « switchport trunk allowed vlan 10,20 ».",
      },
    ],
    related: [{ type: "project", id: "netforge" }],
    links: [{ label: "Ouvrir NetForge (netforge.dagz.fr)", href: "https://netforge.dagz.fr" }],
    provenance: SOURCE_V3,
    editorialNotes: ["Stack technique et dépôt non fournis : ne pas les nommer.", MAPPING_NOTE],
  },
  {
    id: "ventoy",
    number: 3,
    title: "Automatisation du déploiement de Windows avec un support Ventoy personnalisé",
    context: "Entreprise",
    frame: "NET4BUSINESS — stage, La Chapelle-Glain",
    period: { experienceId: "net4business-2026" },
    role: "Stagiaire technicien informatique",
    summary:
      "Création d'un support d'installation Windows automatisé avec Ventoy, personnalisé selon les besoins des clients, et mise en place d'ordinateurs portables en entreprise.",
    description: [
      "Ventoy permet de démarrer plusieurs images d'installation depuis une même clé USB, en choisissant l'image au démarrage.",
      "J'ai créé un support d'installation Windows automatisé à partir de Ventoy, personnalisé selon les besoins des clients.",
      "J'ai également mis en place des ordinateurs portables en entreprise.",
      "En parallèle, j'ai assisté le support technique sur les problèmes du quotidien.",
    ],
    environment: ["Ventoy", "Windows", "Clé USB d'installation", "Ordinateurs portables"],
    competences: [
      {
        id: "service",
        how: "Mise en place d'ordinateurs portables en entreprise et création d'un support d'installation Windows automatisé pour les clients.",
      },
      {
        id: "projet",
        how: "Personnalisation du support d'installation selon les besoins exprimés par chaque client.",
      },
      {
        id: "incidents",
        how: "Assistance au support technique sur les problèmes du quotidien.",
      },
    ],
    schema: "ventoy",
    schemaCaption: "Schéma de principe : du support Ventoy au poste remis au client.",
    captures: [
      { id: "ventoy-menu", caption: "Menu de démarrage Ventoy proposant les images d'installation." },
      { id: "ventoy-install", caption: "Installation automatisée de Windows en cours." },
    ],
    documents: [
      { kind: "installation", title: "Procédure de création du support Ventoy personnalisé" },
      { kind: "exploitation", title: "Mise à jour des images et des personnalisations du support" },
      { kind: "utilisateur", title: "Mode d'emploi du support pour les techniciens" },
    ],
    tests: [
      {
        case: "Démarrage d'un portable sur la clé",
        expected: "Le menu Ventoy s'affiche et propose les images disponibles.",
      },
      {
        case: "Lancement de l'installation de Windows",
        expected: "Les étapes automatisées s'enchaînent sans intervention.",
      },
      {
        case: "Personnalisation pour un client",
        expected: "Le poste livré correspond aux besoins exprimés par le client.",
      },
      {
        case: "Remise du portable à l'utilisateur",
        expected: "L'utilisateur ouvre sa session et accède à ses outils.",
      },
    ],
    related: [{ type: "experience", id: "net4business-2026" }],
    provenance: SOURCE_LINKEDIN,
    editorialNotes: [
      "Mécanisme d'automatisation (fichier de réponses, scripts, langage) non précisé : ne pas le nommer.",
      "Description LinkedIn tronquée après ces missions.",
      MAPPING_NOTE,
    ],
  },
  {
    id: "proxmox-debian",
    number: 4,
    title: "Déploiement d'un hyperviseur Proxmox VE sous Debian et script de maintenance",
    context: "Entreprise",
    frame: "NET4BUSINESS — stage, La Chapelle-Glain",
    period: { experienceId: "net4business-2025" },
    role: "Stagiaire technicien informatique",
    summary:
      "Mise en place d'un hyperviseur Proxmox pour la virtualisation, sous Debian, et création d'un script de désinstallation des applications inutiles sous Windows.",
    description: [
      "Virtualisation : j'ai mis en place un hyperviseur Proxmox VE sous Debian, pour héberger des machines virtuelles.",
      "Maintenance des postes : j'ai créé un script de désinstallation des applications inutiles sous Windows.",
    ],
    environment: ["Debian", "Proxmox VE", "Virtualisation", "Windows", "Script de maintenance"],
    competences: [
      {
        id: "service",
        how: "Mise en place d'un hyperviseur mettant à disposition des machines virtuelles.",
      },
      {
        id: "patrimoine",
        how: "Maîtrise des logiciels installés sur les postes grâce au script de désinstallation des applications inutiles.",
      },
    ],
    schema: "proxmox",
    schemaCaption:
      "Schéma de principe : empilement Debian / Proxmox VE et machines virtuelles, et rôle du script sur un poste Windows. Nombre de VM et ressources non représentés.",
    captures: [
      { id: "pve-ui", caption: "Interface web de Proxmox VE après l'installation." },
      { id: "pve-vm", caption: "Création d'une machine virtuelle de test." },
      { id: "script-run", caption: "Exécution du script de désinstallation sur un poste Windows." },
    ],
    documents: [
      { kind: "installation", title: "Procédure d'installation de Proxmox VE sous Debian" },
      { kind: "exploitation", title: "Guide d'exploitation de l'hyperviseur" },
      { kind: "utilisateur", title: "Mode d'emploi du script de désinstallation" },
    ],
    tests: [
      {
        case: "Accès à l'interface d'administration de Proxmox VE",
        expected: "La page de connexion s'affiche depuis le réseau local (port 8006).",
      },
      {
        case: "Création et démarrage d'une VM de test",
        expected: "La VM démarre et est joignable sur le réseau.",
      },
      {
        case: "Exécution du script sur un poste Windows",
        expected: "Les applications ciblées sont désinstallées ; le poste reste fonctionnel.",
      },
      {
        case: "Deuxième exécution du script sur le même poste",
        expected: "Aucune erreur : rien n'est à désinstaller.",
      },
    ],
    related: [{ type: "experience", id: "net4business-2025" }],
    provenance: SOURCE_LINKEDIN,
    editorialNotes: [
      "Langage du script non précisé : ne pas l'attribuer à PowerShell.",
      MAPPING_NOTE,
    ],
  },
  {
    id: "unifi-wifi",
    number: 5,
    title: "Infrastructure Wi-Fi Ubiquiti UniFi avec séparation des réseaux invités et privé",
    context: "Entreprise",
    frame: "NET4BUSINESS — stage",
    period: { experienceId: "net4business-2024" },
    role: "Stagiaire technicien informatique",
    summary:
      "Déploiement d'un réseau Wi-Fi Ubiquiti avec des réseaux invités et privés séparés, et préparation d'ordinateurs pour des clients professionnels et particuliers.",
    description: [
      "J'ai participé au déploiement d'un réseau Wi-Fi Ubiquiti UniFi comportant des réseaux invités et privés.",
      "La séparation par VLAN isole le trafic des invités du réseau privé : un invité accède à Internet sans voir les ressources internes.",
      "Pendant ce stage, j'ai aussi préparé des ordinateurs pour des clients professionnels et particuliers.",
    ],
    environment: ["Ubiquiti UniFi", "Wi-Fi", "VLAN", "Réseau invités", "Réseau privé"],
    competences: [
      {
        id: "service",
        how: "Déploiement d'un service Wi-Fi pour les utilisateurs du client.",
      },
      {
        id: "patrimoine",
        how: "Séparation des accès invités et privés : chaque réseau n'ouvre que les ressources prévues.",
      },
    ],
    schema: "unifi",
    schemaCaption:
      "Schéma de principe : équipements, numéros de VLAN et adressage du client ne sont pas publiés ; les libellés sont génériques.",
    captures: [
      { id: "unifi-ssid", caption: "Réseaux Wi-Fi invités et privé déclarés dans l'interface UniFi." },
      { id: "unifi-ap", caption: "Point d'accès adopté et en ligne." },
    ],
    documents: [
      { kind: "installation", title: "Procédure de déploiement des points d'accès et des réseaux Wi-Fi" },
      { kind: "exploitation", title: "Guide d'exploitation : ajout d'un point d'accès, changement de clé Wi-Fi" },
      { kind: "utilisateur", title: "Fiche de connexion au réseau invités" },
    ],
    tests: [
      {
        case: "Connexion au réseau privé",
        expected: "Accès à Internet et aux ressources du réseau privé.",
      },
      {
        case: "Connexion au réseau invités",
        expected: "Accès à Internet.",
      },
      {
        case: "Depuis le réseau invités, accès à une ressource du réseau privé",
        expected: "Accès refusé : les réseaux sont isolés.",
      },
      {
        case: "Couverture des zones prévues",
        expected: "Le Wi-Fi est disponible dans chaque zone définie avec le client.",
      },
    ],
    related: [{ type: "experience", id: "net4business-2024" }],
    provenance: SOURCE_V3,
    editorialNotes: [
      "Segmentation VLAN invités / privé : intitulé du brief v3. Modèles d'équipements et nombre de points d'accès non fournis.",
      MAPPING_NOTE,
    ],
  },
  {
    id: "homelab",
    number: 6,
    title: "HomeLab Proxmox et stack de conteneurs Docker sécurisés",
    context: "HomeLab",
    frame: "Pratique personnelle — domaine dagz.fr",
    period: { label: "Pratique personnelle" },
    role: "Conception et administration de mon infrastructure personnelle",
    summary:
      "Un hyperviseur Proxmox VE qui héberge une VM Docker et des environnements de test, avec reverse proxy Nginx Proxy Manager, accès VPN WireGuard et segmentation VLAN.",
    description: [
      "Hyperviseur : Proxmox VE héberge plusieurs machines virtuelles.",
      "VM principale : la plus puissante du lab, elle regroupe plus de 50 % des ressources de mon infrastructure selon mon organisation actuelle, et héberge mes conteneurs Docker.",
      "Services conteneurisés : automatisations pour une bibliothèque privée, NetForge, ce portfolio, Jellyfin (serveur multimédia) et un staging privé pour la préproduction de mes projets.",
      "Environnements de test : Windows Server 2022, Windows Server 2025, Debian et Windows 11.",
      "Sécurisation : segmentation du réseau par VLAN, accès distant par VPN WireGuard et publication des services derrière le reverse proxy Nginx Proxy Manager.",
      "Ce lab est mon terrain d'expérimentation : j'y essaie, je comprends et j'apprends par la pratique. C'est une pratique personnelle, distincte de mon expérience professionnelle.",
    ],
    environment: ["Proxmox VE", "Docker", "Debian", "Windows Server 2022 / 2025", "Windows 11", "VLAN", "WireGuard", "Nginx Proxy Manager", "Jellyfin"],
    competences: [
      {
        id: "developpement-pro",
        how: "Environnement d'apprentissage personnel : expérimenter, comprendre et apprendre par la pratique.",
      },
      {
        id: "service",
        how: "Mise à disposition de services conteneurisés (Jellyfin, NetForge, portfolio) derrière un reverse proxy.",
      },
      {
        id: "presence-en-ligne",
        how: "Hébergement conteneurisé de mes projets publiés sur le domaine dagz.fr.",
      },
      {
        id: "patrimoine",
        how: "Organisation des ressources : VM principale, environnements de test séparés, segmentation VLAN et accès VPN.",
      },
    ],
    schema: "homelab",
    schemaCaption:
      "Vue logique du HomeLab. WireGuard et Nginx Proxy Manager y figurent par leur rôle (accès et publication), pas par leur emplacement d'exécution, qui n'est pas documenté.",
    captures: [
      { id: "hl-pve", caption: "Vue d'ensemble de l'hyperviseur Proxmox VE et de ses machines virtuelles." },
      { id: "hl-npm", caption: "Hôtes publiés dans Nginx Proxy Manager." },
      { id: "hl-docker", caption: "Conteneurs en service sur la VM Docker." },
    ],
    documents: [
      { kind: "installation", title: "Procédure d'installation d'un service conteneurisé derrière le reverse proxy" },
      { kind: "exploitation", title: "Guide d'exploitation et de MCO du HomeLab" },
      { kind: "utilisateur", title: "Guide de connexion au VPN WireGuard" },
    ],
    tests: [
      {
        case: "Accès à un service publié par son nom de domaine",
        expected: "La requête passe par Nginx Proxy Manager et le service répond.",
      },
      {
        case: "Connexion au VPN WireGuard depuis l'extérieur",
        expected: "Le tunnel s'établit et les ressources autorisées sont joignables.",
      },
      {
        case: "Redémarrage de la VM Docker",
        expected: "Les conteneurs redémarrent et les services répondent de nouveau.",
      },
      {
        case: "Depuis un VLAN de test, accès à un réseau non autorisé",
        expected: "Accès refusé par la segmentation.",
      },
    ],
    related: [{ type: "homelab" }],
    provenance: SOURCE_HOMELAB,
    editorialNotes: [
      "Titre du brief v3 : « cluster ». Nombre de nœuds, CPU, RAM et stockage non fournis : la fiche parle d'un hyperviseur.",
      "« Plus de 50 % » : description d'Evann, pas une mesure.",
      MAPPING_NOTE,
    ],
  },
];
