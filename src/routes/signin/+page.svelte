<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { whoAmI } from '$lib/api/links';
	import { ApiError } from '$lib/api/errors';
	import { auth } from '$lib/auth.svelte';

	let key = $state('');
	let keyError = $state('');
	let formError = $state('');
	let busy = $state(false);

	// The load function redirects already-signed-in visitors away.

	// goto() does not get the base path prefixed automatically (template hrefs
	// do); route within the app explicitly. `next` is sanitized to app-relative
	// paths so a crafted ?next= can't bounce the user elsewhere.
	const rawNext = $derived(page.url.searchParams.get('next'));
	const next = $derived(
		rawNext && /^\/[a-zA-Z0-9/_-]*$/.test(rawNext) ? `${base}${rawNext}` : `${base}/`
	);
	const rejected = $derived(page.url.searchParams.get('reason') === 'stale');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		keyError = '';
		formError = '';
		const value = key.trim();
		if (!value.startsWith('sk_')) {
			keyError = 'API keys start with sk_.';
			return;
		}

		busy = true;
		try {
			const me = await whoAmI(value);
			auth.signIn(value, me.name);
			goto(next, { replaceState: true });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.isUnauthorized) {
					keyError = 'That key was not recognized.';
				} else {
					formError = err.message;
				}
			} else {
				formError = 'Could not reach the API. Is the backend running?';
			}
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>sho.rt — sign in with an API key</title>
</svelte:head>

<section class="mx-auto max-w-md">
	<h1 class="font-mono text-2xl font-semibold tracking-tight">Sign in</h1>
	<p class="mt-2 text-sm text-ink-soft dark:text-ash">
		Paste an API key to manage your links and see their stats. The key is stored only in this
		browser.
	</p>

	{#if rejected}
		<div class="mt-4 border border-warn/50 bg-warn/10 px-4 py-3 font-mono text-xs" role="alert">
			Your stored key was rejected — it may have been revoked. Sign in again.
		</div>
	{/if}

	<form onsubmit={submit} class="mt-6" novalidate>
		<label class="label-text" for="key">API key</label>
		<div class="flex items-stretch">
			<span
				class="flex items-center border border-r-0 border-hairline bg-paper-deep px-3 font-mono text-sm text-signal select-none dark:border-hairline-dark dark:bg-coal-deep"
				aria-hidden="true"
			>
				sk
			</span>
			<input
				id="key"
				type="password"
				class="field rounded-none border-x-0"
				placeholder="…"
				bind:value={key}
				autocomplete="off"
				spellcheck="false"
				aria-invalid={keyError ? 'true' : undefined}
				aria-describedby={keyError ? 'key-error' : undefined}
			/>
		</div>
		{#if keyError}
			<p id="key-error" class="mt-2 font-mono text-xs text-danger" role="alert">{keyError}</p>
		{/if}

		{#if formError}
			<p class="mt-3 font-mono text-xs text-danger" role="alert">{formError}</p>
		{/if}

		<button
			type="submit"
			class="btn-primary mt-5 w-full py-2.5!"
			disabled={busy || key.trim() === ''}
		>
			{#if busy}Checking…{:else}Sign in ↵{/if}
		</button>
	</form>

	<div class="mt-8 rule-dashed pt-4">
		<p class="font-mono text-[11px] leading-relaxed text-ink-faint dark:text-ash-faint">
			No key yet? Create one where the API runs:
			<code
				class="border border-hairline bg-paper-deep px-1 py-0.5 text-ink-soft dark:border-hairline-dark dark:bg-coal-deep dark:text-ash"
			>
				make keygen NAME=you
			</code>
			— the raw key is printed once.
		</p>
	</div>
</section>
