# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies (including devDependencies)
RUN npm install --frozen-lockfile

# Copy all source files
COPY . .

# Run tests (optional - can be done in CI instead)
RUN npm run test:ci

# Remove dev dependencies for production
RUN npm prune --production

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/app.js ./
COPY --from=builder /app/models ./models
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/config ./config

# Environment variables (override with docker run -e)
ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:${PORT}/api/health || exit 1

EXPOSE ${PORT}

CMD ["node", "app.js"]