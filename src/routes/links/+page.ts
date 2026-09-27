import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { ApiError } from '$lib/api/errors';
import { listLinks, PAGE_SIZE, type LinkListResult } from '$lib/api/links';
import { auth } from '$lib/auth.svelte';

export async function load({ url }: { url: URL }): Promise<{
	result: LinkListResult | null;
	q: string;
	page: number;
	failure?: string;
}> {
	if (!auth.signedIn) {
		redirect(307, `${base}/signin?next=/links`);
	}

	const q = url.searchParams.get('q') ?? '';
	const requested = Number(url.searchParams.get('page')) || 1;
	const page = Math.max(1, Math.min(requested, 1000)); // sane bound; API clamps too
	try {
		const result = await listLinks(
			{ q, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
			auth.apiKey
		);
		return { result, q, page };
	} catch (err) {
		if (err instanceof ApiError && err.isUnauthorized) {
			// The client already dropped the rejected key.
			redirect(307, `${base}/signin?next=/links&reason=stale`);
		}
		return {
			result: null,
			q,
			page,
			failure: err instanceof Error ? err.message : 'Failed to load links.'
		};
	}
}
