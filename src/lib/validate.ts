export const MAX_URL_LENGTH = 2048;
export const ALIAS_PATTERN = /^[a-zA-Z0-9_-]{4,32}$/;

/** Client-side URL check mirroring the API's rules; empty string = no error. */
export function validateUrl(input: string): string {
	const value = input.trim();
	if (!value) return 'Paste a URL first.';
	if (value.length > MAX_URL_LENGTH) return `URL is longer than ${MAX_URL_LENGTH} characters.`;
	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		return 'That does not look like a URL.';
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return 'Only http and https URLs are accepted.';
	}
	if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
		return 'The URL needs a real hostname.';
	}
	return '';
}

/** Client-side alias check mirroring the API's rules; empty string = no error. */
export function validateAlias(input: string): string {
	if (!input) return '';
	if (!ALIAS_PATTERN.test(input)) {
		return 'Alias must be 4–32 characters: letters, numbers, _ or -.';
	}
	return '';
}

/** Link status derived the same way the API computes 302/410. */
export type LinkStatus = 'active' | 'expired' | 'deactivated';

export function linkStatus(link: { is_active: boolean; expires_at: string | null }): LinkStatus {
	if (!link.is_active) return 'deactivated';
	if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) return 'expired';
	return 'active';
}
