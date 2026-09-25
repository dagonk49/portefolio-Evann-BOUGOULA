import type { Metadata } from "next";
import { CONTACT_EMAIL, profile } from "@/data";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: `Mentions légales — ${profile.fullName}`,
  description: "Éditeur, directeur de la publication, hébergement et propriété intellectuelle du portfolio d'Evann Bougoula.",
  robots: { index: true, follow: true },
};

const TOC = [
  { id: "editeur", label: "Éditeur du site" },
  { id: "publication", label: "Directeur de la publication" },
  { id: "hebergement", label: "Hébergement" },
  { id: "propriete", label: "Propriété intellectuelle" },
  { id: "marques", label: "Marques et œuvres citées" },
  { id: "liens", label: "Liens externes" },
  { id: "donnees", label: "Données personnelles et stockage local" },
  { id: "droit", label: "Droit applicable" },
];

export default function MentionsLegales() {
  return (
    <LegalPage title="Mentions légales" updated="septembre 2026" toc={TOC}>
      <p>
        Informations prévues par l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
        numérique (LCEN).
      </p>

      <LegalSection id="editeur" title="Éditeur du site">
        <dl>
          <div>
            <dt>Éditeur</dt>
            <dd>{profile.fullName}, à titre personnel (site non commercial)</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </dd>
          </div>
          <div>
            <dt>Objet du site</dt>
            <dd>Portfolio professionnel dans le cadre du BTS SIO option SISR (présentation du parcours et des réalisations)</dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection id="publication" title="Directeur de la publication">
        <p>
          {profile.fullName} — <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalSection>

      <LegalSection id="hebergement" title="Hébergement">
        <p>
          Le site est auto-hébergé par son éditeur, {profile.fullName}, sur une infrastructure conteneurisée (Docker) rattachée à
          son domaine personnel <strong>dagz.fr</strong>. Il s&apos;agit d&apos;un site statique servi par nginx ; le formulaire de
          contact est traité par un service d&apos;envoi distinct, sur la même infrastructure.
        </p>
        <p>
          Contact de l&apos;hébergeur : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalSection>

      <LegalSection id="propriete" title="Propriété intellectuelle">
        <p>
          Sauf mention contraire, les textes, schémas, illustrations, scènes 3D et le code propre à ce site sont la propriété de{" "}
          {profile.fullName}. Toute reproduction ou réutilisation, totale ou partielle, sans autorisation écrite préalable est
          interdite, en dehors des exceptions prévues par le Code de la propriété intellectuelle (courte citation avec mention de
          la source, par exemple).
        </p>
        <h3>Éléments de tiers</h3>
        <ul>
          <li>Typographies Inter et IBM Plex (Sans et Mono), sous licence SIL Open Font License 1.1.</li>
          <li>
            Bibliothèques libres : Next.js, React, Three.js, React Three Fiber, Drei, Rapier, postprocessing, zustand, Nodemailer —
            chacune sous sa propre licence (MIT, Apache 2.0 ou zlib).
          </li>
          <li>
            La musique d&apos;ambiance du circuit est générée dans le navigateur par le code du site ; l&apos;extrait sonore
            d&apos;introduction du mode course est un fichier fourni par l&apos;éditeur.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="marques" title="Marques et œuvres citées">
        <p>
          Les noms de produits et de marques cités (Cisco, Ubiquiti, UniFi, Proxmox, Docker, Debian, Windows, Ventoy, WireGuard,
          Nginx Proxy Manager, Jellyfin…) appartiennent à leurs propriétaires respectifs et ne sont mentionnés qu&apos;à titre
          descriptif. Les clins d&apos;œil du circuit 3D à des jeux et à des films sont des évocations stylisées, sans élément
          graphique officiel.
        </p>
      </LegalSection>

      <LegalSection id="liens" title="Liens externes">
        <p>
          Le site renvoie vers des pages externes (NetForge sur netforge.dagz.fr, GitHub, LinkedIn). Ces liens s&apos;ouvrent dans
          un nouvel onglet ; les pages de tiers relèvent de la responsabilité de leurs éditeurs.
        </p>
      </LegalSection>

      <LegalSection id="donnees" title="Données personnelles et stockage local">
        <p>
          Le traitement des données du formulaire de contact et l&apos;usage du stockage local du navigateur sont décrits dans la{" "}
          <a href="/confidentialite">politique de confidentialité et les conditions générales d&apos;utilisation</a>. Le site ne
          dépose aucun cookie publicitaire et n&apos;utilise aucun outil de mesure d&apos;audience.
        </p>
      </LegalSection>

      <LegalSection id="droit" title="Droit applicable">
        <p>Les présentes mentions sont soumises au droit français.</p>
      </LegalSection>
    </LegalPage>
  );
}
