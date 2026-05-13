# ===========================
#  BASE STAGE
# ===========================
FROM node:24-alpine3.23 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ===========================
#  DEPENDENCIES STAGE
# ===========================
FROM base AS deps
RUN apk add --no-cache libc6-compat=1.1.3-r6

COPY package.json package-lock.json* ./
RUN npm ci

# ===========================
#  BUILD STAGE
# ===========================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables for Next.js
ARG NEXT_PUBLIC_API_URL=https://afrigaribkdev.svodoozlabs.com/api
ARG NEXT_PUBLIC_SOCKET_URL=https://afrigaribkdev.svodoozlabs.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

RUN npm run build

# ===========================
#  RUNTIME STAGE
# ===========================
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache wget=1.25.0-r2 && \
    addgroup --system --gid 1001 webapp && \
    adduser --system --uid 1001 --ingroup webapp webapp

# Only copy what's needed for execution
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions
RUN chmod -R 555 /app && \
    mkdir -p /app/.next/cache /app/.next/server && \
    chmod -R 755 /app/.next/cache /app/.next/server && \
    chown -R webapp:webapp /app

USER webapp

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

EXPOSE 3000

# Using the newly created /api/ping route
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --timeout=5 --output-document=/dev/null http://127.0.0.1:3000/api/ping || exit 1

CMD ["node", "server.js"]
