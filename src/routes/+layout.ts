// The whole app renders client-side; adapter-static's SPA fallback
// (index.html) answers every /app/* path. No route is prerendered.
export const ssr = false;
export const prerender = false;
export const trailingSlash = 'never';
