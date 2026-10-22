# syntax=docker/dockerfile:1.7
# MCSU Console: multi-stage image (pnpm + Next.js standalone output + Prisma 7)
# Targets:
#   dev      → hot-reload dev server (used by `docker compose --profile dev`)
#   migrate  → one-off: prisma migrate deploy + idempotent seed
#   runner   → slim production image (node server.js), non-root, ~300 MB
# See docs/10-docker.md.

ARG NODE_VERSION=22

# ───────────── base ─────────────
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat openssl
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ───────────── deps (cached on lockfile) ─────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ───────────── dev ─────────────
FROM base AS dev
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm db:generate
EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]

# ───────────── build ─────────────
FROM base AS build
# No NEXT_PUBLIC_* build args: public config (APP_URL, VAPID public key) is read at
# runtime, so one image is promoted unchanged from staging to prod (ADR 0014).
ENV SKIP_ENV_VALIDATION=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm db:generate && pnpm build

# ───────────── migrate (one-off job) ─────────────
FROM build AS migrate
ENV SKIP_ENV_VALIDATION=
CMD ["sh", "-c", "pnpm db:deploy && pnpm db:seed"]

# ───────────── runner (production) ─────────────
FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache libc6-compat openssl \
 && addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs \
 && install -d -m 755 /app/certs
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
# AWS RDS CA bundle for sslmode=verify-full (docs/11-aws-deployment.md §6). Read-only and root-owned;
# /app/certs is created 755 above because ADD --chmod would otherwise apply 644 to the directory too.
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/certs/rds-global-bundle.pem
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]
