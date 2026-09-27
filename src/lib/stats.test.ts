import { describe, expect, it } from 'vitest';
import { average, daysAgoUTC, todayUTC, zeroFill } from '$lib/stats';

describe('zeroFill', () => {
	it('fills missing days with zero clicks in order', () => {
		const filled = zeroFill('2026-09-25', '2026-09-29', [
			{ day: '2026-09-25', clicks: 3 },
			{ day: '2026-09-28', clicks: 5 }
		]);
		expect(filled.map((d) => d.day)).toEqual([
			'2026-09-25',
			'2026-09-26',
			'2026-09-27',
			'2026-09-28',
			'2026-09-29'
		]);
		expect(filled.map((d) => d.clicks)).toEqual([3, 0, 0, 5, 0]);
	});

	it('returns the input unchanged for an invalid or inverted range', () => {
		const days = [{ day: '2026-09-01', clicks: 1 }];
		expect(zeroFill('nonsense', '2026-09-02', days)).toEqual(days);
		expect(zeroFill('2026-09-05', '2026-09-01', days)).toEqual(days);
	});

	it('handles a single day', () => {
		expect(zeroFill('2026-09-01', '2026-09-01', [{ day: '2026-09-01', clicks: 7 }])).toEqual([
			{ day: '2026-09-01', clicks: 7 }
		]);
	});
});

describe('average', () => {
	it('divides and rounds to one decimal', () => {
		expect(average(10, 4)).toBe(2.5);
		expect(average(10, 3)).toBe(3.3);
		expect(average(0, 5)).toBe(0);
	});

	it('is zero for empty ranges', () => {
		expect(average(5, 0)).toBe(0);
	});
});

describe('date helpers', () => {
	it('daysAgoUTC(n) is n days before todayUTC', () => {
		const today = new Date(`${todayUTC()}T00:00:00Z`).getTime();
		const ago = new Date(`${daysAgoUTC(7)}T00:00:00Z`).getTime();
		expect((today - ago) / 86_400_000).toBe(7);
	});
});
