import { browser } from '$app/environment';

const STORAGE_KEY = 'shortener.history';
const MAX_ENTRIES = 50;

export interface HistoryEntry {
	code: string;
	short_url: string;
	long_url: string;
	/** ISO timestamp of creation (client clock). */
	created_at: string;
	expires_at: string | null;
	/** True when created with an API key (manageable via the dashboard). */
	managed: boolean;
}

/**
 * Links created in this browser, newest first — the anonymous user's only
 * record, since unmanaged links are only reachable by code. Purely local.
 */
class HistoryStore {
	#entries = $state<HistoryEntry[]>([]);

	constructor() {
		if (browser) {
			try {
				const raw = localStorage.getItem(STORAGE_KEY);
				const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
				if (Array.isArray(parsed)) this.#entries = parsed.slice(0, MAX_ENTRIES);
			} catch {
				// Corrupt storage is not worth breaking the app over.
			}
		}
	}

	get entries(): readonly HistoryEntry[] {
		return this.#entries;
	}

	/** Prepend (or move to top) an entry, marking it managed when applicable. */
	add(entry: HistoryEntry) {
		const rest = this.#entries.filter((e) => e.code !== entry.code);
		this.#entries = [entry, ...rest].slice(0, MAX_ENTRIES);
		this.#persist();
	}

	remove(code: string) {
		this.#entries = this.#entries.filter((e) => e.code !== code);
		this.#persist();
	}

	clear() {
		this.#entries = [];
		this.#persist();
	}

	#persist() {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#entries));
		} catch {
			// Quota errors (private mode) — history stays in memory only.
		}
	}
}

export const history = new HistoryStore();
