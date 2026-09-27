import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { ApiError } from '$lib/api/errors';
import { getLink, getStats, type DailyClicks, type LinkDetail } from '$lib/api/links';
import { auth } from '$lib/auth.svelte';
import { average, daysAgoUTC, todayUTC, zeroFill } from '$lib/stats';

export async function load({ params, url }): Promise<
	| {
			link: LinkDetail;
			stats: DailyClicks;
			days: { day: string; clicks: number }[];
			avg: number;
			range: { days?: number; from?: string; to?: string };
	  }
	| { notFound: true; code: string }
> {
	if (!auth.signedIn) {
		redirect(307, `${base}/signin?next=/links`);
	}
	const code = params.code;

	const rangeDays = Number(url.searchParams.get('range')) || 30;
	const from = url.searchParams.get('from') ?? daysAgoUTC(rangeDays - 1);
	const to = url.searchParams.get('to') ?? todayUTC();

	try {
		const [link, stats] = await Promise.all([
			getLink(code, auth.apiKey),
			getStats(code, { from, to }, auth.apiKey)
		]);
		const days = zeroFill(stats.from, stats.to, stats.days);
		return {
			link,
			stats,
			days,
			avg: average(stats.total, days.length),
			range: { days: rangeDays, from, to }
		};
	} catch (err) {
		if (err instanceof ApiError && err.isUnauthorized) {
			// The client already dropped the rejected key.
			redirect(307, `${base}/signin?next=/links&reason=stale`);
		}
		if (err instanceof ApiError && err.status === 404) {
			// Unknown code, or a link owned by someone else: same story.
			return { notFound: true, code };
		}
		throw err;
	}
}
