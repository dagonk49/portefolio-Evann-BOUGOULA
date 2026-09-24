import type { Period, YearMonth } from "@/data/types";

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export function formatMonth(ym: YearMonth, style: "long" | "short" = "long"): string {
  const names = style === "long" ? MONTHS : MONTHS_SHORT;
  return `${names[ym.month - 1] ?? "?"} ${ym.year}`;
}

/** « septembre 2026 – aujourd'hui », « janvier – mars 2026 », « septembre 2023 – juillet 2026 ». */
export function formatPeriod(period: Period, style: "long" | "short" = "long"): string {
  const { start, end } = period;
  if (end === "present") return `depuis ${formatMonth(start, style)}`;
  if (start.year === end.year) {
    const names = style === "long" ? MONTHS : MONTHS_SHORT;
    return `${names[start.month - 1]} – ${formatMonth(end, style)}`;
  }
  return `${formatMonth(start, style)} – ${formatMonth(end, style)}`;
}

/** Valeur machine pour l'attribut `datetime` de <time>. */
export function isoMonth(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month).padStart(2, "0")}`;
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
