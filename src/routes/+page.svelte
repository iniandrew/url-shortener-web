<script lang="ts">
	import { createLink, type LinkCreated } from '$lib/api/links';
	import { ApiError } from '$lib/api/errors';
	import { validateUrl } from '$lib/validate';
	import { auth } from '$lib/auth.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';

	let url = $state('');
	let urlInput = $state<HTMLInputElement | undefined>(undefined);
	let submitting = $state(false);
	let result = $state<LinkCreated | null>(null);
	let urlError = $state('');
	let formError = $state('');
	let retryAfter = $state(0);
	let quota = $state<number | null>(null);

	let countdown: ReturnType<typeof setInterval> | undefined;
	$effect(() => () => clearInterval(countdown));

	// The URL field is the page's single purpose; own the focus on load
	// without the autofocus attribute (a11y lint).
	$effect(() => {
		urlInput?.focus();
	});

	const canSubmit = $derived(!submitting && retryAfter === 0 && url.trim() !== '');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		urlError = validateUrl(url);
		formError = '';
		if (urlError || !canSubmit) return;

		submitting = true;
		result = null;
		try {
			const { data, rateLimitRemaining } = await createLink({ url: url.trim() }, auth.apiKey);
			result = data;
			quota = rateLimitRemaining ?? null;
			url = '';
		} catch (err) {
			if (err instanceof ApiError) {
				switch (err.code) {
					case 'invalid_url':
					case 'bad_request': {
						urlError = err.message;
						break;
					}
					case 'rate_limited': {
						startCountdown(err.retryAfter ?? 60);
						break;
					}
					default:
						formError = err.message;
				}
			} else {
				formError = 'Could not reach the API. Is the backend running?';
			}
		} finally {
			submitting = false;
		}
	}

	function startCountdown(seconds: number) {
		clearInterval(countdown);
		retryAfter = seconds;
		countdown = setInterval(() => {
			retryAfter -= 1;
			if (retryAfter <= 0) clearInterval(countdown);
		}, 1000);
	}
</script>

<svelte:head>
	<title>sho.rt — shorten a URL</title>
	<meta name="description" content="Paste a long URL, get a short one." />
</svelte:head>

<section class="mx-auto max-w-xl">
	<h1 class="text-center text-4xl font-bold tracking-tight sm:text-5xl">Shorten a URL</h1>
	<p class="mt-3 text-center text-zinc-600 dark:text-zinc-400">
		Paste a long link, press shorten, share the short one. No account needed.
	</p>

	<form onsubmit={submit} class="mt-8" novalidate>
		<label class="label-text" for="url">Long URL</label>
		<div class="flex gap-2">
			<input
				id="url"
				type="text"
				class="field font-mono"
				placeholder="https://example.com/very/long/path?utm_source=x"
				bind:value={url}
				bind:this={urlInput}
				aria-invalid={urlError ? 'true' : undefined}
				aria-describedby={urlError ? 'url-error' : undefined}
			/>
			<button type="submit" class="btn-primary shrink-0" disabled={!canSubmit}>
				{#if submitting}
					<svg aria-hidden="true" class="h-4 w-4 animate-spin" viewBox="0 0 16 16" fill="none">
						<circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="2" opacity="0.25" />
						<path
							d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
					Shortening…
				{:else}
					Shorten
				{/if}
			</button>
		</div>

		{#if urlError}
			<p id="url-error" class="mt-2 text-sm text-danger-500" role="alert">{urlError}</p>
		{/if}
	</form>

	{#if retryAfter > 0}
		<div
			class="mt-4 rounded-lg border border-warn-500/40 bg-warn-500/10 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200"
			role="alert"
		>
			Rate limit reached — the anonymous allowance is 10 links per hour. Try again in
			<strong>{retryAfter}</strong> s{#if quota !== null && quota > 0}
				(or sign in with an API key for 1,000/h){/if}
			.
		</div>
	{/if}

	{#if formError}
		<div
			class="mt-4 rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200"
			role="alert"
		>
			{formError}
			<button
				type="button"
				class="ml-2 underline underline-offset-2"
				onclick={() => (formError = '')}
			>
				Dismiss
			</button>
		</div>
	{/if}

	{#if result}
		<div class="mt-6 card p-5" aria-live="polite">
			<p class="text-sm text-zinc-500 dark:text-zinc-400">Your short link</p>
			<div class="mt-1 flex flex-wrap items-center gap-3">
				<a
					href={result.short_url}
					target="_blank"
					rel="noopener noreferrer"
					class="font-mono text-2xl font-semibold text-brand-600 hover:underline dark:text-brand-400"
				>
					{result.short_url}
				</a>
				<CopyButton
					value={result.short_url}
					class="btn-ghost py-1.5! text-brand-600 dark:text-brand-400"
				/>
				<a
					href={result.short_url}
					target="_blank"
					rel="noopener noreferrer"
					class="btn-ghost py-1.5!"
				>
					Open
				</a>
			</div>
			<p
				class="mt-3 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400"
				title={result.long_url}
			>
				→ {result.long_url}
			</p>
			{#if result.expires_at}
				<p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
					Expires {new Date(result.expires_at).toLocaleString()}
				</p>
			{/if}
			{#if quota !== null}
				<p class="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
					{#if auth.signedIn}Key allowance{:else}Anonymous allowance{/if}: {quota} links left this hour
				</p>
			{/if}
		</div>
	{/if}
</section>
