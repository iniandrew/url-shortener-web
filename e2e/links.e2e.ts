import { expect, test } from '@playwright/test';

const apiKey = process.env.E2E_API_KEY;
const headers = () => ({ 'X-API-Key': apiKey as string });

test.describe('links dashboard', () => {
	test.skip(!apiKey, 'E2E_API_KEY not set');

	const codes: string[] = [];

	test.beforeAll(async ({ request }) => {
		// Seed through the API: three links with a shared marker.
		const marker = `dash${Date.now().toString(36)}`;
		for (let i = 0; i < 3; i++) {
			const res = await request.post('http://localhost:8080/api/v1/links', {
				headers: headers(),
				data: { url: `https://example.com/e2e/${marker}/item-${i}`, alias: `${marker}${i}` }
			});
			expect(res.status()).toBe(201);
			codes.push(((await res.json()) as { code: string }).code);
		}
	});

	test('anonymous visit redirects to sign-in and back after signing in', async ({ page }) => {
		await page.goto('/app/links');
		await expect(page).toHaveURL(/\/app\/signin/);
		await page.getByLabel('API key').fill(apiKey as string);
		await page.getByRole('button', { name: 'Sign in' }).click();
		// ?next=/links bounces back to the dashboard.
		await expect(page).toHaveURL(/\/app\/links/);
	});

	test('table shows links, search narrows, deactivate flips the badge', async ({ page }) => {
		// Sign in first (localStorage-only auth).
		await page.goto('/app/signin');
		await page.getByLabel('API key').fill(apiKey as string);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).toHaveURL(/\/app\/?$/);

		await page.goto('/app/links');
		for (const code of codes) {
			await expect(page.getByRole('link', { name: `/${code}`, exact: true })).toBeVisible({
				timeout: 10_000
			});
		}

		// Search narrows to the marker only.
		const marker = codes[0].slice(0, -1); // shared prefix without the index digit
		await page.getByLabel('Search by code or destination').fill(marker);
		await page.waitForURL(new RegExp(`q=${marker}`));
		await expect(page.getByRole('row')).toHaveCount(4); // header + 3
		await expect(page.getByText(/3 links matching/)).toBeVisible();

		// Deactivate one row through the confirm dialog.
		const victim = codes[0];
		await page
			.locator('tr', { has: page.getByRole('link', { name: `/${victim}`, exact: true }) })
			.getByRole('button', { name: 'Deactivate' })
			.click();
		await expect(page.getByRole('dialog')).toContainText(`Deactivate /${victim}?`);
		await page.getByRole('dialog').getByRole('button', { name: 'Deactivate' }).click();

		const victimRow = page.locator('tr', {
			has: page.getByRole('link', { name: `/${victim}`, exact: true })
		});
		await expect(victimRow.getByText('deactivated')).toBeVisible({ timeout: 10_000 });

		// The link itself now answers 410 Gone.
		const res = await page.request.get(`http://localhost:8080/${victim}`, {
			maxRedirects: 0
		});
		expect(res.status()).toBe(410);
	});
});
