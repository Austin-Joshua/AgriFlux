# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build Frontend Assets
# ==============================================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/Frontend

# Install dependencies (cached if package files are unchanged)
COPY Frontend/package*.json ./
RUN npm ci

# Copy Frontend sources and compile production bundle
COPY Frontend/ ./
RUN npm run build

# ==============================================================================
# Stage 2: Build Backend TypeScript
# ==============================================================================
FROM node:20-alpine AS backend-builder
WORKDIR /app

# Install Backend dependencies
COPY Backend/package*.json ./Backend/
RUN cd Backend && npm ci

# Copy Database models and Backend source code
COPY Database/ ./Database/
COPY Backend/ ./Backend/

# Compile TypeScript to Backend/dist
RUN cd Backend && npm run build

# ==============================================================================
# Stage 3: Production Runtime Environment
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root system user and group for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S agriflux -u 1001 -G nodejs

# Application runtime port
ENV PORT=5001

# Install production dependencies only
WORKDIR /app/Backend
COPY Backend/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled backend output from builder
COPY --from=backend-builder /app/Backend/dist ./dist

# Copy compiled frontend distribution for static serving / CDN
COPY --from=frontend-builder /app/Frontend/dist ./public
COPY --from=frontend-builder /app/Frontend/dist /app/Frontend/dist

# Copy environmental reference datasets for auto-seeding
COPY Data/ /app/Data/
COPY Data/ /app/Backend/Data/

# Set ownership to non-root user
RUN chown -R agriflux:nodejs /app

USER agriflux

EXPOSE 5001

# Container healthcheck against /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/health || exit 1

# Start the AgriFlux API server
CMD ["node", "dist/Backend/src/server.js"]
