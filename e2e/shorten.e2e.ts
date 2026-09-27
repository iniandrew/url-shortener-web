import { expect, test } from '@playwright/test';

// Anonymous creations are rate-limited to 10/hour per IP; these specs stay
// well under that. Key-authenticated flows live in links.e2e.ts.

test('shorten flow: paste, submit, result card, copy', async ({ page }) => {
	await page.goto('/app');

	const url = `https://example.com/e2e/shorten-${Date.now()}`;
	await page.getByLabel('Long URL').fill(url);
	await page.getByRole('button', { name: 'Shorten' }).click();

	const card = page.getByRole('link', { name: /localhost:8080\// });
	await expect(card).toBeVisible({ timeout: 10_000 });
	await expect(page.locator('dd a', { hasText: url })).toBeVisible();

	// The API's own redirect answers 302 for the new code.
	const short = (await card.getAttribute('href')) as string;
	const res = await page.request.get(short, { maxRedirects: 0 });
	expect(res.status()).toBe(302);
	expect(res.headers()['location']).toBe(url);

	// Copy button flips to feedback.
	await page.getByRole('button', { name: /copy/i }).first().click();
	await expect(page.getByRole('button', { name: /copied/i })).toBeVisible();
});

test('invalid URL is rejected client-side with a helpful message', async ({ page }) => {
	await page.goto('/app');

	await page.getByLabel('Long URL').fill('not-a-url');
	await page.getByRole('button', { name: 'Shorten' }).click();

	await expect(page.getByRole('alert')).toContainText(/does not look like a URL/i);
	// No request leaves the browser: no result card appears.
	await expect(page.getByText('Your short link')).toHaveCount(0);
});
