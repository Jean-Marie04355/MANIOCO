# ===========================
#  DOCKERFILE RACINE (Backend NestJS)
#  Ce fichier est utilisé par le pipeline CI/CD GitLab.
#  Il pointe vers le code du backend dans le dossier backend/
# ===========================

# ===========================
#  BASE
# ===========================
FROM node:24-alpine3.23 AS base

# ===========================
#  DENPENDENCIES STAGE
# ===========================
FROM base AS deps
WORKDIR /app

ARG APK_PYTHON3_VERSION=3.12.13-r0
ARG APK_MAKE_VERSION=4.4.1-r3
ARG APK_GPP_VERSION=15.2.0-r2

RUN apk update && apk add --no-cache \
    python3=${APK_PYTHON3_VERSION} \
    make=${APK_MAKE_VERSION} \
    g++=${APK_GPP_VERSION}

COPY backend/package*.json ./
RUN npm ci

# ===========================
#  BUILD STAGE
# ===========================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/nest-cli.json backend/package.json backend/sonar-project.properties backend/tsconfig.build.json backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build && \
    npm prune --production --legacy-peer-deps && \
    rm -rf /root/.npm

# ===========================
#  RUNTIME STAGE
# ===========================
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p data && chown -R nestjs:nodejs data

USER nestjs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --spider -q http://localhost:5000/ping || exit 1

CMD ["node", "dist/main.js"]
