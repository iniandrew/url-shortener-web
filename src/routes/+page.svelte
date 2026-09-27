<script lang="ts">
	import { createLink, type LinkCreated } from '$lib/api/links';
	import { ApiError } from '$lib/api/errors';
	import { auth } from '$lib/auth.svelte';
	import { history } from '$lib/history.svelte';
	import { validateAlias, validateUrl } from '$lib/validate';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import QrButton from '$lib/components/QrButton.svelte';

	let url = $state('');
	let urlInput = $state<HTMLInputElement | undefined>(undefined);
	let alias = $state('');
	let expiry = $state(''); // YYYY-MM-DD from the date picker
	let showAdvanced = $state(false);
	let submitting = $state(false);
	let result = $state<LinkCreated | null>(null);
	let urlError = $state('');
	let aliasError = $state('');
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

	/** Date picker value (YYYY-MM-DD) → end-of-day UTC, RFC 3339. */
	function expiryRFC3339(date: string): string | undefined {
		if (!date) return undefined;
		const parsed = new Date(`${date}T23:59:59Z`);
		return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		urlError = validateUrl(url);
		aliasError = auth.signedIn ? validateAlias(alias) : '';
		formError = '';
		if (urlError || aliasError || !canSubmit) return;

		submitting = true;
		result = null;
		try {
			const input: { url: string; alias?: string; expires_at?: string } = { url: url.trim() };
			if (auth.signedIn) {
				if (alias.trim()) input.alias = alias.trim();
				const exp = expiryRFC3339(expiry);
				if (exp) input.expires_at = exp;
			}
			const { data, rateLimitRemaining } = await createLink(input, auth.apiKey);
			result = data;
			quota = rateLimitRemaining ?? null;
			history.add({
				code: data.code,
				short_url: data.short_url,
				long_url: data.long_url,
				expires_at: data.expires_at,
				created_at: new Date().toISOString(),
				managed: auth.signedIn
			});
			url = '';
			alias = '';
			expiry = '';
			showAdvanced = false;
		} catch (err) {
			if (err instanceof ApiError) {
				switch (err.code) {
					case 'invalid_url':
					case 'bad_request': {
						urlError = err.message;
						break;
					}
					case 'invalid_alias':
					case 'alias_taken': {
						aliasError = err.code === 'alias_taken' ? 'That alias is already taken.' : err.message;
						showAdvanced = true;
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

	function formatDate(iso: string | null): string {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
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

		{#if auth.signedIn}
			<button
				type="button"
				class="mt-3 text-sm text-brand-600 hover:underline dark:text-brand-400"
				onclick={() => (showAdvanced = !showAdvanced)}
				aria-expanded={showAdvanced}
			>
				{showAdvanced ? 'Hide' : 'Advanced'} options
			</button>
			{#if showAdvanced}
				<div class="mt-3 grid gap-4 sm:grid-cols-2">
					<div>
						<label class="label-text" for="alias">Custom alias</label>
						<input
							id="alias"
							type="text"
							class="field font-mono"
							placeholder="promo-okt"
							bind:value={alias}
							aria-invalid={aliasError ? 'true' : undefined}
							aria-describedby={aliasError ? 'alias-error' : undefined}
						/>
						{#if aliasError}
							<p id="alias-error" class="mt-1 text-sm text-danger-500" role="alert">
								{aliasError}
							</p>
						{/if}
						<p class="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
							4–32 characters: letters, numbers, _ or -
						</p>
					</div>
					<div>
						<label class="label-text" for="expiry">Expires</label>
						<input id="expiry" type="date" class="field" bind:value={expiry} />
						<p class="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
							Optional — no expiry by default
						</p>
					</div>
				</div>
			{/if}
		{/if}
	</form>

	{#if retryAfter > 0}
		<div
			class="mt-4 rounded-lg border border-warn-500/40 bg-warn-500/10 px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200"
			role="alert"
		>
			Rate limit reached — the anonymous allowance is 10 links per hour. Try again in
			<strong>{retryAfter}</strong>
			s{#if !auth.signedIn}
				(or sign in with an API key for 1,000/h){/if}.
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
				<QrButton value={result.short_url} class="btn-ghost py-1.5!" />
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

	{#if history.entries.length > 0}
		<section class="mt-12" aria-label="Recently created in this browser">
			<div class="flex items-baseline justify-between">
				<h2 class="text-lg font-semibold">Recent in this browser</h2>
				<button
					type="button"
					class="text-sm text-zinc-500 hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
					onclick={() => history.clear()}
				>
					Clear
				</button>
			</div>
			<ul class="mt-3 divide-y divide-zinc-200 card dark:divide-zinc-800">
				{#each history.entries as entry (entry.code)}
					<li class="flex items-center gap-3 px-4 py-3">
						<div class="min-w-0 flex-1">
							<a
								href={entry.short_url}
								target="_blank"
								rel="noopener noreferrer"
								class="font-mono text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
							>
								/{entry.code}
							</a>
							<p class="truncate text-xs text-zinc-500 dark:text-zinc-400" title={entry.long_url}>
								{entry.long_url}
							</p>
						</div>
						{#if entry.expires_at}
							<span class="hidden shrink-0 text-xs text-zinc-400 sm:block" title="Expires">
								until {formatDate(entry.expires_at)}
							</span>
						{/if}
						{#if entry.managed}
							<span
								class="hidden shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700 sm:inline-block dark:bg-brand-950 dark:text-brand-300"
							>
								managed
							</span>
						{:else}
							<span
								class="hidden shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 sm:inline-block dark:bg-zinc-800 dark:text-zinc-400"
							>
								not managed
							</span>
						{/if}
						<CopyButton value={entry.short_url} class="btn-ghost px-2! py-1!" label="Copy" />
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</section>
