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

const title = `${profile.fullName} — Portfolio BTS SIO SISR · ${profile.shortRole}`;
const description = `${profile.headline}, étudiant en BTS SIO SISR à MyDigitalSchool Angers. Réalisations professionnelles et fiches E5, HomeLab Proxmox/Docker, projet NetForge. Consultable en mode sobre ou en lab 3D.`;

export const metadata: Metadata = {
  title,
  description,
  applicationName: "EVANN // ROOT ACCESS",
  authors: [{ name: profile.fullName }],
  openGraph: {
    type: "profile",
    locale: "fr_FR",
    title,
    description,
    firstName: profile.firstName,
    lastName: profile.lastName,
  },
  twitter: { card: "summary", title, description },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
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
