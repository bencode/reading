# Use official Node.js runtime as base image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package.json files for dependency installation
COPY packages/web/package.json ./packages/web/
COPY package.json ./

# Install dependencies using npm (avoids pnpm symlink issues)
WORKDIR /app/packages/web
RUN npm install

# Copy source code
COPY packages/web ./

# Create .env.local if it doesn't exist (for build time)
RUN cp .env.example .env.local 2>/dev/null || true

# Build the application
RUN npm run build

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
CMD ["npm", "start"]