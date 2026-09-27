import { defineConfig } from '@playwright/test';

// E2E runs against the dev server, which proxies /api to the API stack
// (BACKEND_URL, default http://localhost:8080 — run `make dev` there first).
// The preview build is exercised in CI instead.
export default defineConfig({
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	use: { baseURL: 'http://localhost:5173' },
	webServer: {
		command: 'pnpm dev --port 5173 --strictPort',
		port: 5173,
		reuseExistingServer: true
	},
	testMatch: '**/*.e2e.ts'
});
