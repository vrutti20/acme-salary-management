# ---- 1. Build the React frontend ----
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# ---- 2. Build the backend (better-sqlite3 may need a native build) ----
FROM node:22-slim AS backend
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend ./
RUN npm run build && npm prune --omit=dev

# ---- 3. Small runtime image: API + built frontend on one port ----
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production \
    DB_PATH=/app/data/salary.db \
    AUTO_SEED=true \
    FRONTEND_DIST=/app/public
COPY --from=backend /app/backend/node_modules ./node_modules
COPY --from=backend /app/backend/dist ./dist
COPY --from=backend /app/backend/package.json ./
COPY --from=frontend /app/frontend/dist ./public
EXPOSE 4000
CMD ["node", "dist/server.js"]
