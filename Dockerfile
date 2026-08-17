# ==========================================================================
# SecureVote — single-image build (frontend + backend)
# Used by GCP Cloud Run (free tier). The Express API serves the built React
# SPA from the same origin, so cookies/CORS just work.
# ==========================================================================

# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin API calls in production (no hardcoded host)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Stage 2: backend runtime ----
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev
COPY backend/ ./backend/
COPY --from=frontend-build /build/dist ./frontend/dist
ENV NODE_ENV=production
WORKDIR /app/backend
EXPOSE 8080
CMD ["npm", "start"]
