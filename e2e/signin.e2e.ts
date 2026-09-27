import { expect, test } from '@playwright/test';

// Requires a real API key: E2E_API_KEY=$(make keygen NAME=e2e ...) in the
// API repo. Anonymous specs live in shorten.e2e.ts.
const apiKey = process.env.E2E_API_KEY;

test.describe('sign-in', () => {
	test.skip(!apiKey, 'E2E_API_KEY not set');

	test('wrong key is rejected without signing in', async ({ page }) => {
		await page.goto('/app/signin');
		await page.getByLabel('API key').fill('sk_totally_wrong');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page.getByRole('alert')).toContainText(/not recognized/i);
		await expect(page).toHaveURL(/\/app\/signin/);
	});

	test('sign in shows the key name in the header, then signs out', async ({ page }) => {
		await page.goto('/app/signin');
		await page.getByLabel('API key').fill(apiKey as string);
		await page.getByRole('button', { name: 'Sign in' }).click();

		// Back on the home page with the key badge visible.
		await expect(page).toHaveURL(/\/app\/?$/);
		await expect(page.getByTitle(/^API key: e2e/)).toBeVisible();

		await page.getByRole('button', { name: 'Sign out' }).click();
		await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
	});

	test('signed-in create with custom alias lands in history as managed', async ({ page }) => {
		await page.goto('/app/signin');
		await page.getByLabel('API key').fill(apiKey as string);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).toHaveURL(/\/app\/?$/);

		const alias = `e2e${Date.now().toString(36)}`.slice(0, 32);
		await page.getByLabel('Long URL').fill(`https://example.com/e2e/history-${alias}`);
		await page.getByRole('button', { name: 'Advanced options' }).click();
		await page.getByLabel('Custom alias').fill(alias);
		await page.getByRole('button', { name: /^Shorten/ }).click();

		await expect(
			page.getByRole('link', { name: new RegExp(`localhost:8080/${alias}$`) })
		).toBeVisible({
			timeout: 10_000
		});

		// History shows the link with a managed badge.
		await expect(
			page.getByRole('region', { name: /recent/i }).getByText(`/${alias}`)
		).toBeVisible();
		await expect(page.getByText('managed', { exact: true }).first()).toBeVisible();
	});
});
