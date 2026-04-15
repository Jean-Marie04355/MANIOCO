# version 1.0.1
# ===========================
#  BUILD STAGE
# ===========================
# Use an official Node.js runtime as the base image
FROM node:lts-slim AS base


# ===========================
#  DENPENDENCIES STAGE
# ===========================
# Install dependencies only when needed

FROM base AS deps
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if available) into the root directory of the container
COPY package.json pnpm-lock.yaml  ./

# Install any needed packages specified in package.json
# kics-scan ignore-block
RUN ls -la && \
    corepack enable pnpm && \
    pnpm fetch --prefer-offline && \
    pnpm i --ignore-scripts --frozen-lockfile  && \
    # Install any needed additional packages here
    pnpm i --ignore-scripts nestjs-typeorm-paginate eventemitter3 stripe countries-and-timezones


# ===========================
#  BUILD STAGE
# ===========================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules 
COPY nest-cli.json package.json pnpm-lock.yaml sonar-project.properties tsconfig.build.json tsconfig.json ./
COPY /src ./src

# Build the app (NestJS, NextJS, or plain TS app)
RUN ls -la && \
    corepack enable pnpm && pnpm run build && \
    rm -rf node_modules && \
    pnpm i --ignore-scripts --prod --no-optional && \
    rm -rf /root/.pnpm-store node_modules/.store


# ===========================
#  RUNTIME STAGE
# ===========================
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

# kics-scan ignore-block
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

