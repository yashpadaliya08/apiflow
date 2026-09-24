# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# Stage 1: Build React 19 Frontend Bundle
# -------------------------------------------------------------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build optimized production bundle
COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Server Runner
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source code
COPY backend ./backend

# Copy built frontend bundle from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose HTTP port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start fullstack server (serves frontend SPA + CORS proxy on port 5000)
CMD ["node", "backend/server.js"]
