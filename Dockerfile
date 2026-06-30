# syntax=docker/dockerfile:1.7

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache bash openjdk17-jre \
  && corepack enable

# Generate the local file dependency before the immutable install.
COPY package.json yarn.lock .yarnrc.yml openapitools.json ./
COPY api/write-service-api.yaml ./api/write-service-api.yaml
COPY scripts/generate-api-client.sh ./scripts/generate-api-client.sh
RUN --mount=type=secret,id=GITHUB_TOKEN,required=true \
  export GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN)" \
  && bash ./scripts/generate-api-client.sh write-service \
  && yarn install --immutable

# Copy source and config
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN yarn build

# Runtime stage
FROM node:20-alpine

LABEL org.opencontainers.image.title="xq-fitness-write-service" \
  org.opencontainers.image.description="Unified read and write API for XQ Fitness"

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy node_modules and built output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check (using /health endpoint, not /api/v1/health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the application
CMD ["node", "dist/src/index.js"]
