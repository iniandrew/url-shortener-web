import { expect, test } from '@playwright/test';

test('theme toggle flips the html class and survives reload', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/app');
	const html = page.locator('html');
	await expect(html).not.toHaveClass(/dark/);

	await page.getByRole('button', { name: 'Switch to dark theme' }).click();
	await expect(html).toHaveClass(/dark/);

	// Persisted preference is applied before first paint after reload.
	await page.reload();
	await expect(html).toHaveClass(/dark/);

	await page.getByRole('button', { name: 'Switch to light theme' }).click();
	await expect(html).not.toHaveClass(/dark/);
	await page.reload();
	await expect(html).not.toHaveClass(/dark/);
});

test('in-app 404 for unknown routes', async ({ page }) => {
	await page.goto('/app/nope/not-a-page');
	await expect(page.getByText('Nothing here.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Go home' })).toBeVisible();
});

test('shorten form works with the keyboard only', async ({ page }) => {
	await page.goto('/app');
	const url = `https://example.com/e2e/kbd-${Date.now()}`;

	// Focus by interaction (the page also auto-focuses, but don't race it).
	await page.getByLabel('Long URL').click();
	await page.keyboard.type(url);
	await page.keyboard.press('Enter');

	await expect(page.getByRole('link', { name: /localhost:8080\// })).toBeVisible({
		timeout: 10_000
	});
});

import AxeBuilder from '@axe-core/playwright';

const apiKey = process.env.E2E_API_KEY;

test('pages have no automatic accessibility violations', async ({ page }) => {
	const scan = async (path: string, ready: string) => {
		await page.goto(path);
		// The SPA shell hydrates asynchronously; scan the rendered app only.
		await page.getByLabel(ready).waitFor();
		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
	};
	await scan('/app', 'sho.rt home');
	await scan('/app/signin', 'API key');
	if (apiKey) {
		await page.goto('/app/signin');
		await page.getByLabel('API key').fill(apiKey);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await page.waitForURL(/\/app\/?$/);
		await scan('/app/links', 'Search by code or destination');
	}
});
