import { toApiError } from './errors';
import { auth } from '../auth.svelte';

export interface ApiFetchOptions extends RequestInit {
	/** Raw API key; omit to use the signed-in key (if any). */
	apiKey?: string;
}

function resolveKey(explicit?: string): string | undefined {
	return explicit ?? (auth.signedIn ? auth.apiKey : undefined);
}

async function doFetch(path: string, options: ApiFetchOptions): Promise<Response> {
	const { apiKey, headers, ...init } = options;
	const key = resolveKey(apiKey);
	const res = await fetch(path, {
		...init,
		headers: {
			Accept: 'application/json',
			...(init.body ? { 'Content-Type': 'application/json' } : {}),
			...(key ? { 'X-API-Key': key } : {}),
			...headers
		}
	});
	// A key the API no longer accepts is dropped immediately so the rest of
	// the app falls back to the anonymous view instead of erroring forever.
	if (res.status === 401 && key === auth.apiKey && auth.signedIn) {
		auth.signOut();
	}
	return res;
}

/**
 * Fetch wrapper for the same-origin API. Throws ApiError on non-2xx so
 * callers can switch on status/code; network failures propagate as
 * TypeError from fetch (callers treat them as "unreachable").
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
	const res = await doFetch(path, options);
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
	const res = await doFetch(path, options);
	if (!res.ok) {
		throw await toApiError(res);
	}
	const remaining = res.headers.get('X-RateLimit-Remaining');
	return {
		data: (await res.json()) as T,
		rateLimitRemaining: remaining !== null ? Number(remaining) : undefined
	};
}
