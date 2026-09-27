import { browser } from '$app/environment';

const STORAGE_KEY = 'shortener.theme';

type Preference = 'light' | 'dark' | null; // null = follow the system

/**
 * Light/dark with a manual override persisted in localStorage and
 * prefers-color-scheme as the default. The class lands on <html>; an inline
 * script in app.html applies it before first paint to avoid a flash.
 */
class ThemeStore {
	#pref = $state<Preference>(null);
	#systemDark = $state(false);
	#listener: (() => void) | undefined;

	constructor() {
		if (!browser) return;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			this.#pref = stored === 'light' || stored === 'dark' ? stored : null;
		} catch {
			// storage unavailable — follow the system
		}
		const query = window.matchMedia('(prefers-color-scheme: dark)');
		this.#systemDark = query.matches;
		this.#listener = () => {
			this.#systemDark = query.matches;
			this.#apply();
		};
		query.addEventListener('change', this.#listener);
		this.#apply();
	}

	destroy() {
		if (this.#listener) {
			window
				.matchMedia('(prefers-color-scheme: dark)')
				.removeEventListener('change', this.#listener);
		}
	}

	get dark(): boolean {
		return this.#pref ? this.#pref === 'dark' : this.#systemDark;
	}

	/** True when the user picked a mode explicitly (vs following the system). */
	get overridden(): boolean {
		return this.#pref !== null;
	}

	toggle() {
		this.#pref = this.dark ? 'light' : 'dark';
		this.#persist();
		this.#apply();
	}

	followSystem() {
		this.#pref = null;
		this.#persist();
		this.#apply();
	}

	#apply() {
		if (!browser) return;
		document.documentElement.classList.toggle('dark', this.dark);
	}

	#persist() {
		if (!browser) return;
		try {
			if (this.#pref) localStorage.setItem(STORAGE_KEY, this.#pref);
			else localStorage.removeItem(STORAGE_KEY);
		} catch {
			// non-fatal
		}
	}
}

export const theme = new ThemeStore();
