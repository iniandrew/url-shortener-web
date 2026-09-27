import { describe, expect, it } from 'vitest';
import { ApiError, toApiError } from '$lib/api/errors';

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers }
	});
}

describe('toApiError', () => {
	it('parses code and message from the error body', async () => {
		const err = await toApiError(
			jsonResponse(409, { error: { code: 'alias_taken', message: 'alias already taken' } })
		);
		expect(err).toBeInstanceOf(ApiError);
		expect(err.status).toBe(409);
		expect(err.code).toBe('alias_taken');
		expect(err.message).toBe('alias already taken');
	});

	it('marks unknown codes as unknown instead of guessing', async () => {
		const err = await toApiError(jsonResponse(400, { error: { code: 'brand_new_code' } }));
		expect(err.code).toBe('unknown');
	});

	it('survives non-JSON bodies with a status-derived message', async () => {
		const err = await toApiError(new Response('<html>gateway</html>', { status: 502 }));
		expect(err.status).toBe(502);
		expect(err.code).toBe('unknown');
		expect(err.message).toContain('502');
	});

	it('carries Retry-After and rate-limit headers', async () => {
		const err = await toApiError(
			jsonResponse(
				429,
				{ error: { code: 'rate_limited', message: 'slow down' } },
				{ 'Retry-After': '37', 'X-RateLimit-Remaining': '0' }
			)
		);
		expect(err.retryAfter).toBe(37);
		expect(err.rateLimitRemaining).toBe(0);
		expect(err.isUnauthorized).toBe(false);
	});

	it('isUnauthorized on 401', async () => {
		const err = await toApiError(jsonResponse(401, { error: { code: 'unauthorized' } }));
		expect(err.isUnauthorized).toBe(true);
	});
});
