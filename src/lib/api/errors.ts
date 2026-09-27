/** Error codes the API can return in `{"error": {"code", "message"}}`. */
export const API_ERROR_CODES = [
	'invalid_url',
	'invalid_alias',
	'invalid_input',
	'bad_request',
	'unauthorized',
	'not_found',
	'alias_taken',
	'gone',
	'rate_limited',
	'internal'
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/**
 * An API-level failure: non-2xx response or unparseable body. Network-level
 * failures (offline, refused) surface as plain TypeError from fetch instead.
 */
export class ApiError extends Error {
	readonly status: number;
	readonly code: ApiErrorCode | 'unknown';
	/** Seconds, present on 429 responses (`Retry-After`). */
	readonly retryAfter?: number;
	/** Requests left in the current window, when the API reports it. */
	readonly rateLimitRemaining?: number;

	constructor(init: {
		status: number;
		code: ApiErrorCode | 'unknown';
		message: string;
		retryAfter?: number;
		rateLimitRemaining?: number;
	}) {
		super(init.message);
		this.name = 'ApiError';
		this.status = init.status;
		this.code = init.code;
		this.retryAfter = init.retryAfter;
		this.rateLimitRemaining = init.rateLimitRemaining;
	}

	get isUnauthorized() {
		return this.status === 401;
	}
}

interface ErrorBody {
	error?: { code?: string; message?: string };
}

/** Parse an error response into an ApiError; never throws. */
export async function toApiError(res: Response): Promise<ApiError> {
	let code: ApiErrorCode | 'unknown' = 'unknown';
	let message = `request failed with status ${res.status}`;
	try {
		const body = (await res.json()) as ErrorBody;
		if (body.error?.code) {
			code = (API_ERROR_CODES as readonly string[]).includes(body.error.code)
				? (body.error.code as ApiErrorCode)
				: 'unknown';
		}
		if (body.error?.message) message = body.error.message;
	} catch {
		// non-JSON body (proxy error page, empty body) — keep defaults
	}
	const retryHeader = res.headers.get('Retry-After');
	const remainingHeader = res.headers.get('X-RateLimit-Remaining');
	return new ApiError({
		status: res.status,
		code,
		message,
		retryAfter: retryHeader ? Number(retryHeader) : undefined,
		rateLimitRemaining: remainingHeader !== null ? Number(remainingHeader) : undefined
	});
}
