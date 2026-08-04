# Multi-stage build producing a minimal runtime image around Next.js's
# `output: "standalone"` bundle (next.config.ts) — the runner stage ships
# only the compiled server + its exact dependency subset, not the full
# node_modules tree or source.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are baked into the client bundle at build time, not
# read at runtime — must be supplied as build args, not just env vars on
# the deployed container.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# No public/ directory in this app (admin UI has no static assets served
# from one) — only standalone + static are needed.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001
# Local `docker run` default — Cloud Run injects its own PORT at deploy
# time and server.js reads it fresh at startup, so this is overridden
# automatically in production, not something to keep in sync by hand.
ENV PORT=3001
CMD ["node", "server.js"]
