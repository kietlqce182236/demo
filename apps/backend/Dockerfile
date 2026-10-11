# ==============================================================================
# KidMeal Backend — NestJS Multi-stage Dockerfile
# ==============================================================================

FROM node:20-alpine AS builder
WORKDIR /app/apps/backend

RUN apk add --no-cache python3 make g++

COPY apps/backend/package*.json ./
RUN npm install

COPY apps/backend ./
RUN npm run build

# ---- Production Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json

USER nestjs
EXPOSE 3000

CMD ["sh", "-c", "if [ -f dist/main.js ]; then node dist/main.js; else node dist/src/main.js; fi"]
