# syntax=docker/dockerfile:1.7
# ------------------------------------------------------------------
# Portfolio EVANN // ROOT ACCESS — image de production.
# Étape 1 : build Next.js en export statique (dossier out/).
# Étape 2 : nginx non privilégié qui sert les fichiers sur le port 8080.
# Aucune variable d'environnement n'est nécessaire à l'exécution.
# ------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
LABEL org.opencontainers.image.title="evann-portfolio" \
      org.opencontainers.image.description="Portfolio d'Evann Bougoula : mode sobre + lab 3D (site statique)"
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
