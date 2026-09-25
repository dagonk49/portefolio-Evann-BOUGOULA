import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter/index.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@/styles/base.css";
import "@/styles/sober.css";
import "@/styles/terminal.css";
import "@/styles/lab.css";
import "@/styles/consent.css";
import "@/styles/print.css";
import { profile } from "@/data";
import { ConsentBanner } from "@/components/consent/ConsentBanner";
import { GOOGLE_SITE_VERIFICATION, OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";

const title = `${profile.fullName} — Portfolio BTS SIO SISR · ${profile.shortRole}`;
const description = `${profile.headline}, étudiant en BTS SIO SISR à MyDigitalSchool Angers. Réalisations professionnelles et fiches E5, HomeLab Proxmox/Docker, projet NetForge. Consultable en mode sobre ou en lab 3D.`;

/**
 * Métadonnées communes. L'URL canonique et l'Open Graph complet (url, image)
 * sont définis page par page (`pageMetadata`) pour ne jamais hériter d'une
 * canonique qui ne serait pas la leur.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "EVANN // ROOT ACCESS",
  authors: [{ name: profile.fullName, url: SITE_URL }],
  creator: profile.fullName,
  openGraph: { type: "website", locale: "fr_FR", siteName: SITE_NAME, images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
  ...(GOOGLE_SITE_VERIFICATION ? { verification: { google: GOOGLE_SITE_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <ConsentBanner />
        {children}
      </body>
    </html>
  );
}
