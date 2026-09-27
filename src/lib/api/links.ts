import { apiFetch, apiFetchWithHeaders } from './client';
import { toApiError } from './errors';

/** Page size used by the dashboard listing. */
export const PAGE_SIZE = 25;

export interface LinkCreated {
	code: string;
	short_url: string;
	long_url: string;
	expires_at: string | null;
}

export interface LinkDetail {
	code: string;
	short_url: string;
	long_url: string;
	is_custom: boolean;
	is_active: boolean;
	expires_at: string | null;
	created_at: string;
}

export interface CreateLinkInput {
	url: string;
	alias?: string;
	/** RFC 3339 timestamp. */
	expires_at?: string;
}

export interface LinkListResult {
	items: LinkDetail[];
	total: number;
}

export interface DailyClicks {
	code: string;
	from: string;
	to: string;
	total: number;
	days: { day: string; clicks: number }[];
}

/** POST /api/v1/links — auth optional. */
export function createLink(input: CreateLinkInput, apiKey?: string) {
	return apiFetchWithHeaders<LinkCreated>('/api/v1/links', {
		method: 'POST',
		body: JSON.stringify(input),
		apiKey
	});
}

/** GET /api/v1/links/{code} */
export function getLink(code: string, apiKey: string) {
	return apiFetch<LinkDetail>(`/api/v1/links/${encodeURIComponent(code)}`, { apiKey });
}

/** GET /api/v1/links?limit=&offset=&q= */
export function listLinks(params: { limit?: number; offset?: number; q?: string }, apiKey: string) {
	const qs = new URLSearchParams();
	if (params.limit) qs.set('limit', String(params.limit));
	if (params.offset) qs.set('offset', String(params.offset));
	if (params.q) qs.set('q', params.q);
	const suffix = qs.size ? `?${qs}` : '';
	return apiFetch<LinkListResult>(`/api/v1/links${suffix}`, { apiKey });
}

/** GET /api/v1/links/{code}/stats?from=&to= */
export function getStats(code: string, range: { from?: string; to?: string }, apiKey: string) {
	const qs = new URLSearchParams();
	if (range.from) qs.set('from', range.from);
	if (range.to) qs.set('to', range.to);
	const suffix = qs.size ? `?${qs}` : '';
	return apiFetch<DailyClicks>(`/api/v1/links/${encodeURIComponent(code)}/stats${suffix}`, {
		apiKey
	});
}

/** DELETE /api/v1/links/{code} — 204 on success. */
export async function deactivateLink(code: string, apiKey: string): Promise<void> {
	const res = await fetch(`/api/v1/links/${encodeURIComponent(code)}`, {
		method: 'DELETE',
		headers: { 'X-API-Key': apiKey }
	});
	if (!res.ok) {
		throw await toApiError(res);
	}
}

/** GET /api/v1/me — validates a key and identifies it. */
export function whoAmI(apiKey: string) {
	return apiFetch<{ id: number; name: string }>('/api/v1/me', { apiKey });
}
