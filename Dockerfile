# syntax=docker/dockerfile:1
# Build the static SPA, serve it with Caddy under /app (see Caddyfile.web).
FROM node:24-alpine AS build
WORKDIR /src
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM caddy:2-alpine
COPY Caddyfile.web /etc/caddy/Caddyfile
COPY --from=build /src/build /srv
EXPOSE 8080
