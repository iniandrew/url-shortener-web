# url-shortener-web

Web app for [url-shortener](../url-shortener) — the Go API. SvelteKit 2 SPA
(Svelte 5 runes, adapter-static) with Tailwind CSS v4; TypeScript strict.

Served same-origin under `/app` behind the API's Caddy/Gateway, so the browser
only ever talks to one origin (`/api/v1/...` proxied in dev, routed in prod).
`/app` is three characters — below the 4-char minimum of a short code — so no
app route can collide with the backend's `GET /{code}` redirect catch-all.

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

Bundle budget: ≤ 150 KB gzipped JS. The stats chart is hand-rolled SVG on
purpose — no chart library.
