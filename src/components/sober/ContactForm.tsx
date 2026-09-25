"use client";
/**
 * Formulaire de contact : validation immédiate (même règles que le service
 * d'envoi), envoi sans rechargement vers /api/contact, états « envoi en
 * cours », « envoyé » et « erreur » annoncés aux lecteurs d'écran. En cas
 * d'échec, l'adresse email reste proposée avec un message prérempli.
 */
import { useEffect, useRef, useState } from "react";
import { HONEYPOT, LIMITS, validateContact, type ContactErrors, type ContactField } from "../../../server/contact-core.mjs";
import { CONTACT_EMAIL } from "@/data";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "success" } | { kind: "error"; message: string };

const EMPTY: Record<ContactField | typeof HONEYPOT, string> = {
  name: "",
  organization: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};

const SUBJECTS = ["Proposition d'alternance ou d'emploi", "Stage", "Projet d'infrastructure", "NetForge", "Autre demande"];

function mailtoFallback(values: typeof EMPTY): string {
  const body = [values.message, "", `${values.name}${values.organization ? ` — ${values.organization}` : ""}`].join("\n");
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(values.subject || "Contact depuis le portfolio")}&body=${encodeURIComponent(body)}`;
}

export function ContactForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const form = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Retour d'un envoi sans JavaScript (redirection du service avec ?contact=…).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("contact");
    if (q === "envoye") setStatus({ kind: "success" });
    else if (q === "erreur") setStatus({ kind: "error", message: "Le message n'a pas pu être envoyé." });
  }, []);

  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    if (field in errors) setErrors((err) => ({ ...err, [field]: undefined }));
  };

  const fieldProps = (field: ContactField) => ({
    id: `contact-${field}`,
    name: field,
    value: values[field],
    onChange: set(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": [errors[field] ? `contact-${field}-error` : null, field === "message" ? "contact-message-count" : null]
      .filter(Boolean)
      .join(" ") || undefined,
  });

  const focusFirstError = (errs: ContactErrors) => {
    const first = (["name", "organization", "email", "subject", "message"] as const).find((f) => errs[f]);
    if (first) form.current?.querySelector<HTMLElement>(`#contact-${first}`)?.focus();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status.kind === "sending") return;
    const check = validateContact(values);
    if (!check.ok) {
      setErrors(check.errors);
      setStatus({ kind: "idle" });
      focusFirstError(check.errors);
      return;
    }
    setErrors({});
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await res.json().catch(() => null)) as { ok?: boolean; errors?: ContactErrors; error?: string } | null;
      if (res.ok && body?.ok) {
        setStatus({ kind: "success" });
        setValues(EMPTY);
      } else if (res.status === 422 && body?.errors) {
        setErrors(body.errors);
        setStatus({ kind: "idle" });
        focusFirstError(body.errors);
      } else if (res.status === 429) {
        setStatus({ kind: "error", message: "Trop de messages envoyés depuis votre connexion. Réessayez dans quelques minutes." });
      } else {
        setStatus({ kind: "error", message: "Le service d'envoi ne répond pas pour le moment." });
      }
    } catch {
      setStatus({ kind: "error", message: "La connexion au service d'envoi a échoué." });
    }
    requestAnimationFrame(() => statusRef.current?.focus({ preventScroll: false }));
  };

  const errorCount = Object.values(errors).filter(Boolean).length;
  const sending = status.kind === "sending";

  return (
    <form ref={form} className="contact-form" action="/api/contact" method="post" noValidate onSubmit={onSubmit} aria-labelledby="contact-form-title">
      <h3 id="contact-form-title" className="contact-form__title">
        Écrire un message
      </h3>
      <p className="contact-form__hint">
        Les champs marqués <span aria-hidden="true">*</span>
        <span className="sr-only">d&apos;un astérisque</span> sont obligatoires.
      </p>

      {errorCount > 0 ? (
        <p className="form-summary" role="alert">
          {errorCount === 1 ? "Un champ est à corriger." : `${errorCount} champs sont à corriger.`}
        </p>
      ) : null}

      <div className="field-row">
        <div className="field">
          <label htmlFor="contact-name">
            Nom et prénom <span aria-hidden="true">*</span>
          </label>
          <input {...fieldProps("name")} type="text" autoComplete="name" required maxLength={LIMITS.name} />
          {errors.name ? (
            <p id="contact-name-error" className="field__error">
              {errors.name}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="contact-organization">
            Entreprise ou organisation <span className="field__optional">(facultatif)</span>
          </label>
          <input {...fieldProps("organization")} type="text" autoComplete="organization" maxLength={LIMITS.organization} />
          {errors.organization ? (
            <p id="contact-organization-error" className="field__error">
              {errors.organization}
            </p>
          ) : null}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="contact-email">
            Email professionnel <span aria-hidden="true">*</span>
          </label>
          <input {...fieldProps("email")} type="email" autoComplete="email" inputMode="email" required maxLength={LIMITS.email} />
          {errors.email ? (
            <p id="contact-email-error" className="field__error">
              {errors.email}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="contact-subject">
            Sujet <span aria-hidden="true">*</span>
          </label>
          <input {...fieldProps("subject")} type="text" list="contact-subjects" required maxLength={LIMITS.subject} />
          <datalist id="contact-subjects">
            {SUBJECTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {errors.subject ? (
            <p id="contact-subject-error" className="field__error">
              {errors.subject}
            </p>
          ) : null}
        </div>
      </div>

      <div className="field">
        <label htmlFor="contact-message">
          Message <span aria-hidden="true">*</span>
        </label>
        <textarea {...fieldProps("message")} rows={7} required maxLength={LIMITS.message} />
        <p id="contact-message-count" className="field__count mono">
          {values.message.length} / {LIMITS.message} caractères
        </p>
        {errors.message ? (
          <p id="contact-message-error" className="field__error">
            {errors.message}
          </p>
        ) : null}
      </div>

      {/* Champ piège pour les robots : caché aux humains et aux technologies d'assistance. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="contact-website">Site web (ne pas remplir)</label>
        <input id="contact-website" name={HONEYPOT} type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>

      <p className="contact-form__rgpd">
        Vos données (nom, organisation, email, sujet, message) servent uniquement à répondre à votre demande. Elles sont transmises
        par email à Evann Bougoula, conservées 3 ans au maximum après notre dernier échange, et jamais cédées à des tiers. Vous
        pouvez y accéder, les rectifier ou les faire effacer en écrivant à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.{" "}
        <a href="/confidentialite#formulaire">Politique de confidentialité</a>
      </p>

      <div className="contact-form__actions">
        <button type="submit" className="btn" disabled={sending} aria-disabled={sending || undefined}>
          {sending ? "Envoi en cours…" : "Envoyer le message"}
        </button>
      </div>

      <div ref={statusRef} className={`form-status form-status--${status.kind}`} role="status" tabIndex={-1} aria-live="polite">
        {status.kind === "sending" ? <p>Envoi en cours…</p> : null}
        {status.kind === "success" ? (
          <p>
            <strong>Message envoyé.</strong> Merci, je vous réponds dès que possible à l&apos;adresse indiquée.
          </p>
        ) : null}
        {status.kind === "error" ? (
          <p>
            <strong>{status.message}</strong> Votre saisie est conservée. Vous pouvez réessayer, ou{" "}
            <a href={mailtoFallback(values)}>m&apos;écrire directement à {CONTACT_EMAIL}</a>.
          </p>
        ) : null}
      </div>
    </form>
  );
}
