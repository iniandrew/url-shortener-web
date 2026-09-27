import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import { auth } from '$lib/auth.svelte';

// Already signed in? Nothing to do here.
export function load() {
	if (auth.signedIn) redirect(307, `${base}/`);
}
