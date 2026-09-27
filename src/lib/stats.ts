/** Fill missing days between from and to with zero clicks. */
export function zeroFill(
	from: string,
	to: string,
	days: { day: string; clicks: number }[]
): { day: string; clicks: number }[] {
	const byDay = new Map(days.map((d) => [d.day, d.clicks]));
	const out: { day: string; clicks: number }[] = [];
	const start = new Date(`${from}T00:00:00Z`).getTime();
	const end = new Date(`${to}T00:00:00Z`).getTime();
	if (Number.isNaN(start) || Number.isNaN(end) || end < start) return days.slice();
	for (let t = start; t <= end; t += 86_400_000) {
		const day = new Date(t).toISOString().slice(0, 10);
		out.push({ day, clicks: byDay.get(day) ?? 0 });
	}
	return out;
}

/** Average clicks per day over the filled range. */
export function average(total: number, dayCount: number): number {
	if (dayCount <= 0) return 0;
	return Math.round((total / dayCount) * 10) / 10;
}

export function todayUTC(): string {
	return new Date().toISOString().slice(0, 10);
}

export function daysAgoUTC(n: number): string {
	return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

/** Range presets offered on the stats view (days). */
export const RANGE_PRESETS = [7, 30, 90] as const;
