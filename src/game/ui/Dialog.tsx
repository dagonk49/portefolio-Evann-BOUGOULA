"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Fenêtre modale accessible : focus piégé, Échap pour fermer, retour du
 * focus à l'élément déclencheur. Elle s'affiche par-dessus la 3D, qui
 * continue de s'animer derrière.
 */
export function Dialog({
  title,
  kicker,
  onClose,
  children,
  footer,
  size = "side",
  closeLabel = "Fermer",
}: {
  title: string;
  kicker?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "side" | "wide" | "center";
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (!node) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) {
        e.preventDefault();
        node.focus();
        return;
      }
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (!active || !node.contains(active)) {
        e.preventDefault();
        firstEl.focus();
      } else if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    // Écoute au niveau du document : le piège tient même si le focus a quitté la fenêtre (clic dans la 3D).
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      const fallback = document.querySelector<HTMLElement>(".lab-root");
      if (previous && document.contains(previous) && previous !== document.body) previous.focus({ preventScroll: true });
      else fallback?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div className={`lab-dialog lab-dialog--${size}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
      <header className="lab-dialog__head">
        <div className="lab-dialog__titles">
          {kicker ? <div className="lab-dialog__kicker">{kicker}</div> : null}
          <h2 id={titleId}>{title}</h2>
        </div>
        <button type="button" className="lab-dialog__close" onClick={onClose}>
          {closeLabel} <span className="lab-kbd">Échap</span>
        </button>
      </header>
      <div className="lab-dialog__body">{children}</div>
      {footer ? <footer className="lab-dialog__foot">{footer}</footer> : null}
    </div>
  );
}

/** Onglets accessibles (flèches gauche/droite). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  const baseId = useId();
  return (
    <div
      className="lab-tabs"
      role="tablist"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const i = tabs.findIndex((t) => t.id === value);
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]!;
        onChange(next.id);
        document.getElementById(`${baseId}-${next.id}`)?.focus();
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          id={`${baseId}-${t.id}`}
          type="button"
          role="tab"
          aria-selected={t.id === value}
          tabIndex={t.id === value ? 0 : -1}
          className="lab-tab"
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
