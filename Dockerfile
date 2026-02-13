# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept GitHub token as build argument
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}

# Copy package files (exclude lock file to avoid file:// dependency issues)
COPY package.json ./
COPY .npmrc ./
# Install all deps (including devDependencies for TypeScript build)
RUN npm install --no-audit

# Copy source and config
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:18-alpine

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
