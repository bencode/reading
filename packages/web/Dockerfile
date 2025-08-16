# Use official Node.js runtime as base image
FROM node:22-alpine AS base

# Install dependencies needed for sqlite3 compilation
RUN apk add --no-cache \
    build-base \
    python3 \
    make \
    g++ \
    sqlite-dev

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for dependency installation
COPY packages/web/package.json ./packages/web/

# Install dependencies (this will compile sqlite3 native bindings)
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

# Copy source code
COPY packages/web ./packages/web

# Set working directory to web package
WORKDIR /app/packages/web

# Create .env.local if it doesn't exist (for build time)
RUN cp .env.example .env.local 2>/dev/null || true

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS runner

# Install runtime dependencies for sqlite3
RUN apk add --no-cache sqlite

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application and compiled node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/.next ./packages/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/packages/web/public ./packages/web/public
COPY --from=builder /app/packages/web/package.json ./packages/web/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/web/node_modules ./packages/web/node_modules

# Note: We're copying the already compiled node_modules from builder stage

# Create data directory for database
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
WORKDIR /app/packages/web
CMD ["pnpm", "start"]