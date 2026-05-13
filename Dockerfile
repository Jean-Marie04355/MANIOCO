# version 1.0.1
ARG PNPM_VERSION=9.14.2
# ===========================
#  BUILD STAGE
# ===========================
# Use an official Node.js runtime as the base image
FROM node:24-alpine3.23 AS base


# ===========================
#  DENPENDENCIES STAGE
# ===========================
# Install dependencies only when needed

FROM base AS deps
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if available) into the root directory of the container
COPY package.json pnpm-lock.yaml  ./

ARG PNPM_VERSION
# Versions APK corresponds to 24-alpine3.23
ARG APK_GPP_VERSION=15.2.0-r2
ARG APK_MAKE_VERSION=4.4.1-r3
ARG APK_PYTHON3_VERSION=3.12.13-r0

RUN apk add --no-cache \
    g++=${APK_GPP_VERSION} \
    make=${APK_MAKE_VERSION} \
    python3=${APK_PYTHON3_VERSION} && \
    corepack enable && \
    corepack prepare pnpm@${PNPM_VERSION} --activate && \
    pnpm fetch --prefer-offline

RUN pnpm i --ignore-scripts --frozen-lockfile --offline

# ===========================
#  BUILD STAGE
# ===========================
FROM base AS builder
WORKDIR /app

ARG PNPM_VERSION

COPY --from=deps /app/node_modules ./node_modules 
COPY nest-cli.json package.json pnpm-lock.yaml sonar-project.properties tsconfig.build.json tsconfig.json ./
COPY /src ./src

# Build the app, then prune dev dependencies without reinstalling packages.
RUN corepack enable && \
    corepack prepare pnpm@${PNPM_VERSION} --activate && \
    pnpm run build && \
    pnpm prune --prod --no-optional && \
    rm -rf /root/.pnpm-store node_modules/.store


# ===========================
#  RUNTIME STAGE
# ===========================
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder --chmod=755 /app/dist ./dist
COPY --from=builder --chmod=755 /app/src/utils ./src/utils
COPY --from=builder --chmod=755 /app/node_modules ./node_modules
COPY --from=builder --chmod=755 /app/package.json ./package.json

USER nestjs
#ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --spider -q http://localhost:3000/ping || exit 1

CMD ["node", "dist/main.js"]