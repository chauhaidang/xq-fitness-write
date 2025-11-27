# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept GitHub token as build argument
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}

# Copy package files (exclude lock file to avoid file:// dependency issues)
COPY package.json ./
COPY .npmrc ./
# Install dependencies (production only)
# Lock file will be generated fresh without file:// devDependencies
RUN npm install --production --no-audit

# Copy source code
COPY src ./src

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy node_modules and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

# Expose port
EXPOSE 3000

# Health check (using /health endpoint, not /api/v1/health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the application
CMD ["node", "src/index.js"]
