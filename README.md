# url-shortener-web

Web app for [url-shortener](github.com/iniandrew/url-shortener), the Go API.
SvelteKit 2 SPA (Svelte 5 runes, adapter-static) with Tailwind CSS v4;
TypeScript strict.

Served same-origin under `/app` behind the API's Caddy/Gateway, so the
browser only ever talks to one origin (`/api/v1/...` is proxied in dev and
routed in prod). `/app` is three characters, below the 4-char minimum of a
short code, so no app route can collide with the backend's `GET /{code}`
redirect catch-all.

## Develop

Needs the API on `localhost:8080` (in `url-shortener/`: `make dev`).

```bash
pnpm install
pnpm dev            # http://localhost:5173/app  (proxies /api → :8080)
```

## Everything else

```bash
pnpm check          # svelte-check (types, templates)
pnpm lint           # prettier --check + eslint
pnpm test:unit      # vitest (node + browser projects)
pnpm test:e2e       # playwright (installs browsers on first run)
pnpm build          # static bundle → build/
```

Bundle budget: ≤ 150 KB gzipped JS (currently 60.6 KB; run `node
scripts/bundle-size.mjs` after a build). The stats chart is hand-rolled
CSS; there is no chart library.

## Deploy

One image: a multi-stage build ends at `caddy:2-alpine` serving the static
bundle under `/app` (three characters again, so it never matches a short
code). Caddy strips the prefix (`handle_path`), falls back to `index.html`
for every app route, and sends the CSP with a script hash for the inline
pre-paint theme script (`node scripts/csp-hash.mjs` after touching it).

```bash
docker build -t url-shortener-web:dev .

# standalone, forwarding /api to the local stack:
docker run --rm -p 8090:8080 -e API_UPSTREAM=host.docker.internal:8080 url-shortener-web:dev
open http://localhost:8090/app/
```

Behind the production edge (the API repo's Caddy/Gateway), add:

```
# Caddyfile (edge)
handle_path /app/* {
    root * /srv/web       # or point at the web container / imported files
    try_files {path} /index.html
    file_server
}
redir / /app/ 308
```

Kubernetes: `deploy/k8s/web.yaml` (Deployment 2× + Service; Caddyfile baked
into the image) and `deploy/k8s/httproute-web.yaml`, a PathPrefix `/app`
rule on the existing `public` Gateway. CI builds and pushes
`ghcr.io/<owner>/url-shortener-web:<sha>` on merges to main (set
`GHCR_OWNER` repo variable). Roll out web before API changes; the route is
inert until the image exists.

Note for e2e against the local API: raise the anonymous creation limit
first or the specs burn it (`ANON_RATE_LIMIT=1000000 docker compose up -d
api` in the API repo).
