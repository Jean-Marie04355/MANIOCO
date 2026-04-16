# version 1.0.1
# ===========================
#  BUILD STAGE
# ===========================
# Use an official Node.js runtime as the base image
FROM node:24-slim AS base


# ===========================
#  DENPENDENCIES STAGE
# ===========================
# Install dependencies only when needed

FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json (if available) into the root directory of the container
COPY package*.json ./

# Install any needed packages specified in package.json
RUN ls -la && \
    npm ci


# ===========================
#  BUILD STAGE
# ===========================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY nest-cli.json package.json sonar-project.properties tsconfig.build.json tsconfig.json ./
COPY src ./src
COPY data ./data

# Build the app (NestJS, NextJS, or plain TS app)
RUN ls -la && \
    npm run build && \
    # Remove dev dependencies
    npm prune --production --legacy-peer-deps && \
    rm -rf /root/.npm


# ===========================
#  RUNTIME STAGE
# ===========================
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
RUN chown -R nestjs:nodejs data

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/data ./data


USER nestjs
#ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --spider -q http://localhost:3000/ping || exit 1

CMD ["node", "dist/main.js"]