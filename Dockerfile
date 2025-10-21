# Multi-stage build: build static site with Vite, then serve via Nginx

# --- Builder ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* .npmrc* ./
# Prefer npm since package-lock is present; fall back to npm ci
RUN npm ci || npm install
COPY . .
RUN npm run build

# --- Runtime ---
FROM nginx:1.27-alpine
# Security updates
RUN apk --no-cache add curl
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
