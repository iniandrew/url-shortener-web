import { browser } from '$app/environment';

const STORAGE_KEY = 'shortener.api-key';

/**
 * The signed-in API key and (after validation) its display name. The raw key
 * lives only in localStorage and the X-API-Key header — never in URLs or logs.
 */
class AuthStore {
	#apiKey = $state('');
	#keyName = $state('');

	constructor() {
		if (browser) {
			this.#apiKey = localStorage.getItem(STORAGE_KEY) ?? '';
		}
	}

	get apiKey() {
		return this.#apiKey;
	}

	get keyName() {
		return this.#keyName;
	}

	get signedIn() {
		return this.#apiKey !== '';
	}

	/** Persist a key (already validated by the caller via /api/v1/me). */
	signIn(apiKey: string, keyName: string) {
		this.#apiKey = apiKey;
		this.#keyName = keyName;
		if (browser) localStorage.setItem(STORAGE_KEY, apiKey);
	}

	signOut() {
		this.#apiKey = '';
		this.#keyName = '';
		if (browser) localStorage.removeItem(STORAGE_KEY);
	}
}

export const auth = new AuthStore();
