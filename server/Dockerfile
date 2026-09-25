# syntax=docker/dockerfile:1.7
# Service d'envoi du formulaire de contact (Nodemailer), relayé par nginx sur /api/contact.
FROM node:22-alpine
WORKDIR /srv
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY contact-core.mjs handler.mjs index.mjs ./
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:3001/healthz || exit 1
CMD ["node", "index.mjs"]
