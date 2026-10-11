# ==============================================================================
# KidMeal Frontend — React 18 + Vite Multi-stage Dockerfile
# ==============================================================================

FROM node:20-alpine AS builder
WORKDIR /app/apps/frontend

COPY apps/frontend/package*.json ./
RUN npm install

COPY apps/frontend ./
RUN npm run build

# ---- Static Nginx Runner ----
FROM nginx:1.25-alpine AS runner
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
