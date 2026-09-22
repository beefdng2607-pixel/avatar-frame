# ─── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root monorepo files
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

# Install dependencies and build shared + api
RUN npm ci
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# ─── Stage 2: Production Runner ──────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/shared/dist packages/shared/dist
COPY apps/api/package.json apps/api/
COPY apps/api/dist apps/api/dist

# Install production dependencies only
RUN npm ci --omit=dev

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace=apps/api"]
