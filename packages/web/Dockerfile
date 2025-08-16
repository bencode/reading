# Use official Node.js runtime as base image
FROM node:22-slim

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for dependency installation
COPY packages/web/package.json ./packages/web/

# Install dependencies (this will compile sqlite3 native bindings)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/web ./packages/web

# Set working directory to web package
WORKDIR /app/packages/web

# Create .env.local if it doesn't exist (for build time)
RUN cp .env.example .env.local 2>/dev/null || true

# Build the application
RUN pnpm build

# Create data directory for database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app

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