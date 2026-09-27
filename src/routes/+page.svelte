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

<section class="max-w-2xl">
	<h1 class="font-mono text-3xl leading-tight font-semibold tracking-tight">
		Shorten a URL<span class="ml-1 cursor-block" aria-hidden="true"></span>
	</h1>
	<p class="mt-3 max-w-md text-sm text-ink-soft dark:text-ash">
		Paste a long link, press shorten, share the short one. No account needed.
	</p>

	<form onsubmit={submit} class="mt-8" novalidate>
		<label class="label-text" for="url">Long URL</label>
		<div class="flex items-stretch gap-0">
			<span
				class="flex items-center border border-r-0 border-hairline bg-paper-deep px-3 font-mono text-sm text-signal select-none dark:border-hairline-dark dark:bg-coal-deep"
				aria-hidden="true"
			>
				❯
			</span>
			<input
				id="url"
				type="text"
				class="field rounded-none border-x-0"
				placeholder="https://example.com/very/long/path?utm_source=x"
				bind:value={url}
				bind:this={urlInput}
				aria-invalid={urlError ? 'true' : undefined}
				aria-describedby={urlError ? 'url-error' : undefined}
			/>
			<button type="submit" class="btn-primary rounded-none px-5!" disabled={!canSubmit}>
				{#if submitting}
					<svg aria-hidden="true" class="h-3.5 w-3.5 animate-spin" viewBox="0 0 16 16" fill="none">
						<circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="2" opacity="0.25" />
						<path
							d="M14.5 8A6.5 6.5 0 0 0 8 1.5"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
					Working
				{:else}
					Shorten <span class="opacity-60">↵</span>
				{/if}
			</button>
		</div>

		{#if urlError}
			<p id="url-error" class="mt-2 font-mono text-xs text-danger" role="alert">
				{urlError}
			</p>
		{/if}

		{#if auth.signedIn}
			<button
				type="button"
				class="mt-3 font-mono text-[11px] tracking-micro text-ink-faint uppercase hover:text-signal dark:text-ash-faint dark:hover:text-signal"
				onclick={() => (showAdvanced = !showAdvanced)}
				aria-expanded={showAdvanced}
			>
				{showAdvanced ? '− Hide' : '+ Advanced'} options
			</button>
			{#if showAdvanced}
				<div
					class="mt-3 grid gap-4 border-l-2 border-hairline pl-4 sm:grid-cols-2 dark:border-hairline-dark"
				>
					<div>
						<label class="label-text" for="alias">Custom alias</label>
						<input
							id="alias"
							type="text"
							class="field"
							placeholder="promo-okt"
							bind:value={alias}
							aria-invalid={aliasError ? 'true' : undefined}
							aria-describedby={aliasError ? 'alias-error' : undefined}
						/>
						{#if aliasError}
							<p id="alias-error" class="mt-1 font-mono text-xs text-danger" role="alert">
								{aliasError}
							</p>
						{/if}
						<p class="mt-1 font-mono text-[10px] text-ink-faint dark:text-ash-faint">
							4–32 chars · [a-zA-Z0-9_-]
						</p>
					</div>
					<div>
						<label class="label-text" for="expiry">Expires</label>
						<input id="expiry" type="date" class="field" bind:value={expiry} />
						<p class="mt-1 font-mono text-[10px] text-ink-faint dark:text-ash-faint">
							Optional — no expiry by default
						</p>
					</div>
				</div>
			{/if}
		{/if}
	</form>

	{#if retryAfter > 0}
		<div class="mt-4 border border-warn/50 bg-warn/10 px-4 py-3 font-mono text-xs" role="alert">
			RATE LIMIT — anonymous allowance is 10 links/hour. Retry in
			<strong>{retryAfter}</strong>s{#if !auth.signedIn}
				(or sign in with an API key for 1,000/h){/if}
			.
		</div>
	{/if}

	{#if formError}
		<div class="mt-4 border border-danger/50 bg-danger/10 px-4 py-3 font-mono text-xs" role="alert">
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
		<!-- Receipt: the machine's answer, printed on dashed-rule stationery. -->
		<div class="mt-8 panel" aria-live="polite">
			<div
				class="flex items-center justify-between border-b border-hairline px-5 py-2 dark:border-hairline-dark"
			>
				<span
					class="font-mono text-[10px] tracking-micro text-ink-faint uppercase dark:text-ash-faint"
				>
					Short link
				</span>
				<span class="font-mono text-[10px] tracking-micro text-ok uppercase"> 201 · created </span>
			</div>
			<div class="px-5 py-4">
				<a
					href={result.short_url}
					target="_blank"
					rel="noopener noreferrer"
					class="font-mono text-xl font-semibold break-all text-signal hover:underline"
				>
					{result.short_url}
				</a>
				<div class="mt-3 flex flex-wrap gap-2">
					<CopyButton value={result.short_url} class="btn-ghost px-2.5! py-1!" />
					<a
						href={result.short_url}
						target="_blank"
						rel="noopener noreferrer"
						class="btn-ghost px-2.5! py-1!"
					>
						Open ↗
					</a>
					<QrButton value={result.short_url} class="btn-ghost px-2.5! py-1!" />
				</div>
			</div>
			<dl class="px-5 pb-4 font-mono text-xs">
				<div class="flex gap-3 rule-dashed py-2">
					<dt class="w-20 shrink-0 text-ink-faint dark:text-ash-faint">DEST</dt>
					<dd class="min-w-0 break-all text-ink-soft dark:text-ash">
						<a
							href={result.long_url}
							target="_blank"
							rel="noopener noreferrer"
							class="hover:text-signal hover:underline">{result.long_url}</a
						>
					</dd>
				</div>
				{#if result.expires_at}
					<div class="flex gap-3 rule-dashed py-2">
						<dt class="w-20 shrink-0 text-ink-faint dark:text-ash-faint">EXPIRES</dt>
						<dd class="text-ink-soft dark:text-ash">
							{new Date(result.expires_at).toLocaleString()}
						</dd>
					</div>
				{/if}
				{#if quota !== null}
					<div class="flex gap-3 rule-dashed py-2">
						<dt class="w-20 shrink-0 text-ink-faint dark:text-ash-faint">QUOTA</dt>
						<dd class="text-ink-soft dark:text-ash">
							{#if auth.signedIn}Key allowance{:else}Anonymous allowance{/if}: {quota} left this hour
						</dd>
					</div>
				{/if}
			</dl>
		</div>
	{/if}

	{#if history.entries.length > 0}
		<section class="mt-12" aria-label="Recently created in this browser">
			<div class="flex items-baseline justify-between">
				<h2
					class="font-mono text-xs font-medium tracking-micro text-ink-faint uppercase dark:text-ash-faint"
				>
					Recent · this browser
				</h2>
				<button
					type="button"
					class="font-mono text-[10px] tracking-micro text-ink-faint uppercase hover:text-danger dark:text-ash-faint"
					onclick={() => history.clear()}
				>
					Clear
				</button>
			</div>
			<ul class="mt-2 divide-y divide-hairline panel dark:divide-hairline-dark">
				{#each history.entries as entry (entry.code)}
					<li class="flex items-center gap-3 px-4 py-2.5">
						<div class="min-w-0 flex-1">
							<a
								href={entry.short_url}
								target="_blank"
								rel="noopener noreferrer"
								class="font-mono text-sm font-medium text-signal hover:underline"
							>
								/{entry.code}
							</a>
							<p
								class="truncate font-mono text-[11px] text-ink-faint dark:text-ash-faint"
								title={entry.long_url}
							>
								{entry.long_url}
							</p>
						</div>
						{#if entry.expires_at}
							<span
								class="hidden shrink-0 font-mono text-[10px] text-ink-faint sm:block dark:text-ash-faint"
							>
								until {formatDate(entry.expires_at)}
							</span>
						{/if}
						{#if entry.managed}
							<span class="tag-signal hidden sm:inline-flex">managed</span>
						{:else}
							<span class="tag-muted hidden sm:inline-flex">not managed</span>
						{/if}
						<CopyButton value={entry.short_url} class="btn-ghost px-2! py-0.5!" label="Copy" />
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</section>
