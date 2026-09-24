import type { NextConfig } from "next";

// Export statique : le site est un ensemble de fichiers HTML/JS/CSS servis
// par n'importe quel serveur web (nginx dans l'image Docker fournie).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
