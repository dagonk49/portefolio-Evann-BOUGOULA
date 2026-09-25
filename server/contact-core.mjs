/**
 * Validation du formulaire de contact, partagée par le navigateur (retour
 * immédiat) et par le service d'envoi (contrôle faisant foi).
 * Module pur, sans dépendance.
 */

export const LIMITS = Object.freeze({
  name: 100,
  organization: 120,
  email: 254,
  subject: 150,
  messageMin: 10,
  message: 5000,
});

/** Champs visibles du formulaire, dans l'ordre d'affichage. */
export const FIELDS = Object.freeze(["name", "organization", "email", "subject", "message"]);

/** Champ piège : invisible pour un humain, rempli par les robots. */
export const HONEYPOT = "website";

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:".]+(\.[^\s@<>()[\]\\,;:".]+)+$/;

// Caractères de contrôle (dont CR/LF) : interdits dans les champs d'une ligne
// pour empêcher toute injection d'en-têtes dans l'email.
const CONTROL_RE = /[\u0000-\u001f\u007f]+/g;
const CONTROL_EXCEPT_NEWLINE_RE = /[\u0000-\u0009\u000b-\u001f\u007f]+/g;

function text(value) {
  return typeof value === "string" ? value : "";
}

/** Nettoie une saisie brute (objet JSON ou champs de formulaire). */
export function normalizeContact(input) {
  const src = input && typeof input === "object" ? input : {};
  const line = (v) => text(v).replace(CONTROL_RE, " ").replace(/\s+/g, " ").trim();
  return {
    name: line(src.name),
    organization: line(src.organization),
    email: line(src.email).toLowerCase(),
    subject: line(src.subject),
    message: text(src.message).replace(/\r\n?/g, "\n").replace(CONTROL_EXCEPT_NEWLINE_RE, "").trim(),
    [HONEYPOT]: line(src[HONEYPOT]),
  };
}

/**
 * Valide la saisie. Renvoie `{ ok: true, data }` ou `{ ok: false, errors }`,
 * où `errors` associe un champ à un message en français.
 */
export function validateContact(input) {
  const data = normalizeContact(input);
  const errors = {};
  if (!data.name) errors.name = "Indiquez votre nom et votre prénom.";
  else if (data.name.length > LIMITS.name) errors.name = `${LIMITS.name} caractères au maximum.`;

  if (data.organization.length > LIMITS.organization) errors.organization = `${LIMITS.organization} caractères au maximum.`;

  if (!data.email) errors.email = "Indiquez votre adresse email.";
  else if (data.email.length > LIMITS.email || !EMAIL_RE.test(data.email))
    errors.email = "Adresse email invalide (exemple : prenom.nom@entreprise.fr).";

  if (!data.subject) errors.subject = "Indiquez le sujet de votre message.";
  else if (data.subject.length > LIMITS.subject) errors.subject = `${LIMITS.subject} caractères au maximum.`;

  if (!data.message) errors.message = "Écrivez votre message.";
  else if (data.message.length < LIMITS.messageMin) errors.message = `Votre message doit faire au moins ${LIMITS.messageMin} caractères.`;
  else if (data.message.length > LIMITS.message) errors.message = `${LIMITS.message} caractères au maximum.`;

  return Object.keys(errors).length ? { ok: false, errors, data } : { ok: true, data };
}

/** Le champ piège est rempli : envoi à ignorer silencieusement. */
export function isSpam(data) {
  return Boolean(data && data[HONEYPOT]);
}

/** Construit l'email envoyé à Evann (texte brut, réponse directe à l'expéditeur). */
export function buildMail(data, { to, from }) {
  const lines = [
    "Nouveau message depuis le formulaire de contact du portfolio.",
    "",
    `Nom et prénom : ${data.name}`,
    `Entreprise / organisation : ${data.organization || "non précisée"}`,
    `Email : ${data.email}`,
    `Sujet : ${data.subject}`,
    "",
    data.message,
    "",
    "—",
    "Données traitées uniquement pour répondre à ce message (voir la politique de confidentialité du site).",
  ];
  return {
    to,
    from,
    replyTo: `${data.name} <${data.email}>`,
    subject: `[Portfolio] ${data.subject}`,
    text: lines.join("\n"),
  };
}
