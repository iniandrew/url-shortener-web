import { expect, test } from '@playwright/test';

const apiKey = process.env.E2E_API_KEY;

test.describe('link detail + stats', () => {
	test.skip(!apiKey, 'E2E_API_KEY not set');

	test('detail shows metadata, chart reflects real clicks after a flush', async ({
		request,
		page
	}) => {
		const marker = `stat${Date.now().toString(36)}`;
		const res = await request.post('http://localhost:8080/api/v1/links', {
			headers: { 'X-API-Key': apiKey as string },
			data: { url: `https://example.com/e2e/${marker}`, alias: marker }
		});
		expect(res.status()).toBe(201);
		const { code } = (await res.json()) as { code: string };

		// Generate clicks through the redirect path.
		for (let i = 0; i < 6; i++) {
			const click = await request.get(`http://localhost:8080/${code}`, { maxRedirects: 0 });
			expect(click.status()).toBe(302);
		}

		await page.goto('/app/signin');
		await page.getByLabel('API key').fill(apiKey as string);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).toHaveURL(/\/app\/?$/);

		await page.goto(`/app/links/${code}`);
		await expect(page.getByRole('heading', { name: `/${code}` })).toBeVisible();
		await expect(page.getByText('Destination').locator('..').getByRole('link')).toBeVisible();

		// The API worker flushes counters every ~10 s. Poll the API until the
		// clicks land, then reload the page — it has no live refresh by design.
		await expect
			.poll(
				async () => {
					const s = await request.get(`http://localhost:8080/api/v1/links/${code}/stats`, {
						headers: { 'X-API-Key': apiKey as string }
					});
					return ((await s.json()) as { total: number }).total;
				},
				{ timeout: 30_000, intervals: [2_000] }
			)
			.toBe(6);
		await page.reload();
		const totalSpan = page.locator('p:has-text("total") span').first();
		await expect(totalSpan).toHaveText('6');

		// Range presets change the query and stay green.
		await page.getByRole('button', { name: '7d' }).click();
		await expect(page).toHaveURL(new RegExp(`range=7`));
		await expect(page.getByText('avg/day')).toBeVisible();

		// The bar chart rendered with an accessible summary.
		await expect(page.getByRole('img', { name: new RegExp(`Clicks for /${code}`) })).toBeVisible();
	});

	test("another key's link (or unknown code) shows the not-yours card", async ({ page }) => {
		await page.goto('/app/signin');
		await page.getByLabel('API key').fill(apiKey as string);
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).toHaveURL(/\/app\/?$/);

		await page.goto('/app/links/s1'); // seeded link, ownerless
		await expect(page.getByText('is not yours')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Back to your links' })).toBeVisible();
	});
});
