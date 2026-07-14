# Multi-stage build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Build the application using npx to ensure nest CLI is available
RUN npx nest build --tsc
# Copy seeds files manually (since postbuild script uses PowerShell)
RUN mkdir -p dist/src/database/seeds && cp -r src/database/seeds/*.json dist/src/database/seeds/ 2>/dev/null || true

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
# Copy TypeORM config for migrations
COPY --from=builder --chown=nestjs:nodejs /app/src/config/typeorm.config.ts ./typeorm.config.ts
# Copy package.json for scripts
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
# Copy logs directory
COPY --from=builder --chown=nestjs:nodejs /app/logs ./logs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "dist/main.js"]
