import { beforeEach, describe, expect, it, vi } from 'vitest';

// The store persists only in a browser environment.
vi.mock('$app/environment', () => ({ browser: true }));

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
	getItem: (k: string) => storage.get(k) ?? null,
	setItem: (k: string, v: string) => void storage.set(k, v),
	removeItem: (k: string) => void storage.delete(k)
});

const { history } = await import('$lib/history.svelte');

function entry(code: string, long = `https://example.com/${code}`) {
	return {
		code,
		short_url: `http://localhost:8080/${code}`,
		long_url: long,
		created_at: new Date().toISOString(),
		expires_at: null,
		managed: false
	};
}

describe('history store', () => {
	beforeEach(() => {
		history.clear();
	});

	it('prepends newest first and persists as JSON', () => {
		history.add(entry('first1'));
		history.add(entry('second'));
		expect(history.entries.map((e) => e.code)).toEqual(['second', 'first1']);
		expect(JSON.parse(storage.get('shortener.history') as string)).toHaveLength(2);
	});

	it('re-adding an existing code moves it to the top without duplicates', () => {
		history.add(entry('aaa'));
		history.add(entry('bbb'));
		history.add(entry('aaa'));
		expect(history.entries.map((e) => e.code)).toEqual(['aaa', 'bbb']);
	});

	it('caps at 50 entries', () => {
		for (let i = 0; i < 60; i++) history.add(entry(`c${String(i).padStart(3, '0')}`));
		expect(history.entries).toHaveLength(50);
		expect(history.entries[0]?.code).toBe('c059');
	});

	it('remove drops a single entry', () => {
		history.add(entry('keep1'));
		history.add(entry('drop1'));
		history.remove('drop1');
		expect(history.entries.map((e) => e.code)).toEqual(['keep1']);
	});
});
