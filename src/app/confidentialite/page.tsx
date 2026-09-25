import type { Metadata } from "next";
import { CONTACT_EMAIL, profile } from "@/data";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { ManageConsentButton } from "@/components/consent/ConsentBanner";
import { CONSENT_KEY } from "@/lib/consent";
import { SESSION_KEYS, STORAGE_KEY } from "@/lib/storage";

export const metadata: Metadata = {
  title: `Politique de confidentialité et CGU — ${profile.fullName}`,
  description:
    "Données du formulaire de contact, finalité, durée de conservation, stockage local et droits RGPD sur le portfolio d'Evann Bougoula.",
  robots: { index: true, follow: true },
};

const TOC = [
  { id: "responsable", label: "Responsable du traitement" },
  { id: "formulaire", label: "Formulaire de contact" },
  { id: "stockage-local", label: "Stockage local et cookies" },
  { id: "securite", label: "Sécurité" },
  { id: "droits", label: "Vos droits" },
  { id: "cgu", label: "Conditions générales d'utilisation" },
];

export default function Confidentialite() {
  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  return (
    <LegalPage title="Politique de confidentialité et CGU" updated="septembre 2026" toc={TOC}>
      <p>
        Cette page explique quelles données ce portfolio traite, pourquoi, combien de temps, et comment exercer vos droits au titre
        du Règlement général sur la protection des données (RGPD) et de la loi Informatique et Libertés.
      </p>

      <LegalSection id="responsable" title="Responsable du traitement">
        <p>
          {profile.fullName}, éditeur du site — {mail}
        </p>
      </LegalSection>

      <LegalSection id="formulaire" title="Formulaire de contact">
        <dl>
          <div>
            <dt>Données</dt>
            <dd>Nom et prénom, entreprise ou organisation (facultatif), adresse email, sujet et contenu du message.</dd>
          </div>
          <div>
            <dt>Finalité</dt>
            <dd>
              Exclusivement répondre à votre demande et échanger avec vous (alternance, stage, emploi, projet). Aucune
              prospection, aucune inscription à une liste de diffusion.
            </dd>
          </div>
          <div>
            <dt>Base légale</dt>
            <dd>
              Votre demande de contact : mesures prises à votre demande (article 6.1.b du RGPD) et intérêt légitime à répondre aux
              messages reçus (article 6.1.f).
            </dd>
          </div>
          <div>
            <dt>Destinataire</dt>
            <dd>
              {profile.fullName} uniquement. Le message est transmis par email au moyen du serveur d&apos;envoi du domaine ; il
              n&apos;est ni cédé, ni vendu, ni communiqué à des tiers.
            </dd>
          </div>
          <div>
            <dt>Conservation</dt>
            <dd>
              3 ans au maximum à compter de notre dernier échange, puis suppression. Le site lui-même ne stocke pas les messages :
              ils sont seulement relayés par email.
            </dd>
          </div>
          <div>
            <dt>Caractère obligatoire</dt>
            <dd>
              Nom, email, sujet et message sont nécessaires pour vous répondre ; l&apos;organisation est facultative. Vous pouvez
              aussi écrire directement à {mail}.
            </dd>
          </div>
        </dl>
      </LegalSection>

      <LegalSection id="stockage-local" title="Stockage local et cookies">
        <p>
          Ce site <strong>ne dépose aucun cookie</strong>, n&apos;utilise <strong>aucune mesure d&apos;audience</strong> et ne charge
          <strong> aucun traceur tiers</strong>. Il peut seulement enregistrer, dans le stockage local de votre navigateur, des
          informations de confort — et uniquement avec votre accord pour la catégorie « Préférences et progression ».
        </p>
        <table>
          <caption className="sr-only">Éléments enregistrés dans votre navigateur</caption>
          <thead>
            <tr>
              <th scope="col">Clé</th>
              <th scope="col">Contenu et finalité</th>
              <th scope="col">Durée</th>
              <th scope="col">Consentement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="mono">{CONSENT_KEY}</td>
              <td>Votre choix (accord ou refus), pour ne pas vous le redemander à chaque visite.</td>
              <td>6 mois</td>
              <td>Non requis (strictement nécessaire)</td>
            </tr>
            <tr>
              <td className="mono">{STORAGE_KEY}</td>
              <td>
                Mode préféré (sobre ou 3D), réglages du son, de l&apos;accessibilité et des graphismes, état du tutoriel, progression
                de la mission 3D, meilleur tour et véhicule débloqué.
              </td>
              <td>13 mois au plus depuis la dernière sauvegarde</td>
              <td>Requis</td>
            </tr>
            <tr>
              <td className="mono">{SESSION_KEYS[0]}</td>
              <td>Bandeau du tutoriel masqué pour la session en cours (stockage de session).</td>
              <td>Fin de la session</td>
              <td>Requis</td>
            </tr>
          </tbody>
        </table>
        <p>
          Ces informations restent sur votre appareil et ne sont jamais transmises. Sans accord, le site fonctionne de la même
          façon : vos réglages sont simplement oubliés à la fermeture de la page. Refuser efface les éléments déjà enregistrés.
        </p>
        <p>
          L&apos;aperçu en direct de NetForge (netforge.dagz.fr, site de l&apos;éditeur) ne se charge que si vous le demandez.
        </p>
        <p>
          <ManageConsentButton className="btn btn--ghost btn--small" />
        </p>
      </LegalSection>

      <LegalSection id="securite" title="Sécurité">
        <p>
          Le formulaire est protégé contre les envois automatisés (champ piège, limitation du nombre d&apos;envois, contrôle de
          l&apos;origine) et chaque champ est vérifié avant l&apos;envoi. Le contenu des messages n&apos;est pas journalisé par le
          service d&apos;envoi.
        </p>
      </LegalSection>

      <LegalSection id="droits" title="Vos droits">
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, d&apos;opposition et de
          portabilité sur vos données. Pour les exercer, écrivez à {mail} ; une réponse vous est apportée dans un délai d&apos;un
          mois au plus.
        </p>
        <p>
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
            cnil.fr/fr/plaintes<span className="sr-only"> (nouvel onglet)</span>
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection id="cgu" title="Conditions générales d'utilisation">
        <h3>Objet</h3>
        <p>
          Ce site présente le parcours, les compétences et les réalisations de {profile.fullName}. Sa consultation est libre et
          gratuite ; elle vaut acceptation des présentes conditions.
        </p>
        <h3>Contenu</h3>
        <p>
          Le lab 3D et son terminal sont des simulations locales : ils ne se connectent à aucune infrastructure réelle. Les schémas
          des fiches de réalisation sont des schémas de principe et ne décrivent pas l&apos;architecture interne des organisations
          citées.
        </p>
        <h3>Usage du formulaire</h3>
        <p>
          Le formulaire est réservé aux prises de contact sincères. Les envois abusifs, automatisés ou au contenu illicite sont
          interdits.
        </p>
        <h3>Disponibilité</h3>
        <p>
          Le site est fourni tel quel, sans garantie de disponibilité permanente. L&apos;éditeur peut le modifier ou le suspendre à
          tout moment.
        </p>
        <h3>Évolution</h3>
        <p>Ces conditions peuvent évoluer ; la date de dernière mise à jour figure en haut de page. Droit applicable : droit français.</p>
      </LegalSection>
    </LegalPage>
  );
}
