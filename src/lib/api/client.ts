import { toApiError } from './errors';

export interface ApiFetchOptions extends RequestInit {
	/** Raw API key; omit for anonymous calls. */
	apiKey?: string;
}

/**
 * Fetch wrapper for the same-origin API. Throws ApiError on non-2xx so
 * callers can switch on status/code; network failures propagate as
 * TypeError from fetch (callers treat them as "unreachable").
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
	const { apiKey, headers, ...init } = options;
	const res = await fetch(path, {
		...init,
		headers: {
			Accept: 'application/json',
			...(init.body ? { 'Content-Type': 'application/json' } : {}),
			...(apiKey ? { 'X-API-Key': apiKey } : {}),
			...headers
		}
	});
	if (!res.ok) {
		throw await toApiError(res);
	}
	return (await res.json()) as T;
}

/** Response headers we care about, for quota feedback after mutations. */
export async function apiFetchWithHeaders<T>(
	path: string,
	options: ApiFetchOptions = {}
): Promise<{ data: T; rateLimitRemaining?: number }> {
	const { apiKey, headers, ...init } = options;
	const res = await fetch(path, {
		...init,
		headers: {
			Accept: 'application/json',
			...(init.body ? { 'Content-Type': 'application/json' } : {}),
			...(apiKey ? { 'X-API-Key': apiKey } : {}),
			...headers
		}
	});
	if (!res.ok) {
		throw await toApiError(res);
	}
	const remaining = res.headers.get('X-RateLimit-Remaining');
	return {
		data: (await res.json()) as T,
		rateLimitRemaining: remaining !== null ? Number(remaining) : undefined
	};
}
