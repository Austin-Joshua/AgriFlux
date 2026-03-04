# Use Node.js LTS as base
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for both Frontend and Backend
COPY . .
RUN cd Backend && npm install && npm run build
RUN cd Frontend && npm install && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built backend
COPY --from=builder /app/Backend/dist ./Backend/dist
COPY --from=builder /app/Backend/package*.json ./Backend/
COPY --from=builder /app/Backend/.env.example ./Backend/.env

# Copy built frontend (static files)
COPY --from=builder /app/Frontend/dist ./Frontend/dist

# Install production dependencies only
RUN cd Backend && npm install --only=production

EXPOSE 5005

CMD ["node", "Backend/dist/server.js"]
