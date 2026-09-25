export interface ContactInput {
  name: string;
  organization: string;
  email: string;
  subject: string;
  message: string;
  website: string;
}

export type ContactField = "name" | "organization" | "email" | "subject" | "message";

export type ContactErrors = Partial<Record<ContactField, string>>;

export type ContactValidation = { ok: true; data: ContactInput } | { ok: false; errors: ContactErrors; data: ContactInput };

export interface ContactMail {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  text: string;
}

export const LIMITS: Readonly<{
  name: number;
  organization: number;
  email: number;
  subject: number;
  messageMin: number;
  message: number;
}>;
export const FIELDS: readonly ContactField[];
export const HONEYPOT: "website";
export function normalizeContact(input: unknown): ContactInput;
export function validateContact(input: unknown): ContactValidation;
export function isSpam(data: ContactInput): boolean;
export function buildMail(data: ContactInput, opts: { to: string; from: string }): ContactMail;
