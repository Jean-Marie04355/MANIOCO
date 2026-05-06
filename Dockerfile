# version 1.0.1 - Root Adapted for Backend
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

# Install build tools for native modules
ARG APK_PYTHON3_VERSION=3.12.13-r0
ARG APK_MAKE_VERSION=4.4.1-r3
ARG APK_GPP_VERSION=15.2.0-r2

RUN apk update && apk add --no-cache \
    python3=${APK_PYTHON3_VERSION} \
    make=${APK_MAKE_VERSION} \
    g++=${APK_GPP_VERSION}

# Copy package.json and package-lock.json (if available) from backend directory
COPY backend/package*.json ./

# Install any needed packages specified in package.json
RUN ls -la && \
    npm ci


# ===========================
#  BUILD STAGE
# ===========================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY backend/nest-cli.json backend/package.json backend/tsconfig.build.json backend/tsconfig.json ./
COPY backend/src ./src
# Build the app (NestJS)
RUN ls -la && \
    npm run build && \
    # Remove dev dependencies
    npm prune --omit=dev --legacy-peer-deps && \
    rm -rf /root/.npm


# ===========================
#  RUNTIME STAGE
# ===========================
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

RUN apk add --no-cache wget

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create necessary directories for runtime
RUN mkdir -p data uploads && chown -R nestjs:nodejs data uploads

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --spider -q http://localhost:3000/ping || exit 1

CMD ["node", "dist/main.js"]
