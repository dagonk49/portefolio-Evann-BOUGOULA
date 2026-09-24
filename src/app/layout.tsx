import type { Metadata, Viewport } from "next";
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
import "@/styles/print.css";
import { profile } from "@/data";

const title = `${profile.fullName} — ${profile.shortRole} · Systèmes & réseaux`;
const description = `${profile.headline}. ${profile.currentTraining}. HomeLab Proxmox/Docker, réseaux et projet NetForge. Portfolio consultable en mode sobre ou en lab 3D.`;

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#121417" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
