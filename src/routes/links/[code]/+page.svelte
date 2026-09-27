<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';
	import { auth } from '$lib/auth.svelte';
	import { deactivateLink } from '$lib/api/links';
	import { linkStatus } from '$lib/validate';
	import BarChart from '$lib/components/BarChart.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import QrButton from '$lib/components/QrButton.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { RANGE_PRESETS } from '$lib/stats';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let pending = $state(false);
	let working = $state(false);
	let actionError = $state('');
	let customFrom = $state('');
	let customTo = $state('');

	$effect(() => {
		if (data.notFound) return;
		customFrom = data.range.from ?? '';
		customTo = data.range.to ?? '';
	});

	const status = $derived(data.notFound ? null : linkStatus(data.link));

	function setPreset(days: number) {
		goto(`${base}/links/${data.notFound ? '' : data.link.code}?range=${days}`, { noScroll: true });
	}

	function setCustom() {
		if (!customFrom || !customTo || customFrom > customTo) return;
		const code = data.notFound ? '' : data.link.code;
		goto(`${base}/links/${code}?from=${customFrom}&to=${customTo}`, { noScroll: true });
	}

	async function confirmDeactivate() {
		if (data.notFound) return;
		working = true;
		actionError = '';
		try {
			await deactivateLink(data.link.code, auth.apiKey);
			pending = false;
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Deactivating failed.';
		} finally {
			working = false;
		}
	}

	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function fmtDateTime(iso: string): string {
		return new Date(iso).toLocaleString();
	}
</script>

<svelte:head>
	<title>sho.rt — /{data.notFound ? data.code : data.link.code}</title>
</svelte:head>

{#if data.notFound}
	<section class="mx-auto mt-8 max-w-md card p-10 text-center">
		<h1 class="text-xl font-semibold">/{data.code} is not yours</h1>
		<p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
			It does not exist, or it belongs to another key. Anonymous links are only reachable by their
			code.
		</p>
		<a href="/links" class="btn-primary mt-6 inline-flex">Back to your links</a>
	</section>
{:else}
	<section>
		<a
			href="/links"
			class="text-sm text-zinc-500 hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
		>
			← All links
		</a>

		<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
			<div class="flex min-w-0 items-center gap-3">
				<h1 class="font-mono text-2xl font-bold">/{data.link.code}</h1>
				<StatusBadge status={status!} custom={data.link.is_custom} />
			</div>
			{#if status === 'active'}
				<button type="button" class="btn-ghost text-danger-500" onclick={() => (pending = true)}>
					Deactivate
				</button>
			{/if}
		</div>

		{#if actionError}
			<div
				class="mt-4 rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm"
				role="alert"
			>
				{actionError}
			</div>
		{/if}

		<div class="mt-6 card p-5">
			<dl class="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
				<div class="flex items-center justify-between gap-4 sm:justify-start">
					<dt class="text-zinc-500 dark:text-zinc-400">Short URL</dt>
					<dd class="flex items-center gap-2">
						<a
							href={data.link.short_url}
							target="_blank"
							rel="noopener noreferrer"
							class="truncate font-mono text-brand-600 hover:underline dark:text-brand-400"
						>
							{data.link.short_url}
						</a>
						<CopyButton value={data.link.short_url} class="btn-ghost px-2! py-1!" label="Copy" />
						<QrButton value={data.link.short_url} class="btn-ghost px-2! py-1!" />
					</dd>
				</div>
				<div>
					<dt class="text-zinc-500 dark:text-zinc-400">Destination</dt>
					<dd class="mt-0.5 truncate">
						<a
							href={data.link.long_url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-brand-600 hover:underline dark:text-brand-400"
							title={data.link.long_url}
						>
							{data.link.long_url}
						</a>
					</dd>
				</div>
				<div>
					<dt class="text-zinc-500 dark:text-zinc-400">Created</dt>
					<dd class="mt-0.5">{fmtDateTime(data.link.created_at)}</dd>
				</div>
				<div>
					<dt class="text-zinc-500 dark:text-zinc-400">Expires</dt>
					<dd class="mt-0.5">{fmtDate(data.link.expires_at)}</dd>
				</div>
			</dl>
		</div>

		<div class="mt-6 card p-5">
			<div class="flex flex-wrap items-baseline justify-between gap-2">
				<h2 class="font-semibold">Clicks</h2>
				<div class="flex items-center gap-1 text-sm" role="group" aria-label="Range">
					{#each RANGE_PRESETS as preset (preset)}
						<button
							type="button"
							class="rounded-lg px-2.5 py-1 {data.range.days === preset && !data.range.from
								? 'bg-brand-600 text-white'
								: 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'}"
							aria-pressed={data.range.days === preset && !data.range.from}
							onclick={() => setPreset(preset)}
						>
							{preset}d
						</button>
					{/each}
					<span class="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" aria-hidden="true"></span>
					<input
						type="date"
						class="field w-auto! px-2! py-1! text-xs"
						bind:value={customFrom}
						aria-label="From date"
					/>
					<span class="text-xs text-zinc-400">→</span>
					<input
						type="date"
						class="field w-auto! px-2! py-1! text-xs"
						bind:value={customTo}
						aria-label="To date"
					/>
					<button
						type="button"
						class="rounded-lg px-2.5 py-1 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
						onclick={setCustom}
						disabled={!customFrom || !customTo || customFrom > customTo}
					>
						Apply
					</button>
				</div>
			</div>

			<div class="mt-3 flex gap-6">
				<p>
					<span class="text-2xl font-bold">{data.stats.total}</span>
					<span class="ml-1 text-sm text-zinc-500 dark:text-zinc-400">total</span>
				</p>
				<p>
					<span class="text-2xl font-bold">{data.avg}</span>
					<span class="ml-1 text-sm text-zinc-500 dark:text-zinc-400">avg / day</span>
				</p>
			</div>

			<div class="mt-4">
				<BarChart days={data.days} label={`Clicks for /${data.link.code}`} />
			</div>
			<p class="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
				{data.stats.from} → {data.stats.to} · fresh counts appear after the API's worker flush (≈10 s)
			</p>
		</div>
	</section>
{/if}

{#if pending && !data.notFound}
	<ConfirmDialog
		title="Deactivate /{data.link.code}?"
		message="The link will answer 410 Gone immediately. This cannot be undone."
		confirmLabel="Deactivate"
		busy={working}
		onconfirm={confirmDeactivate}
		oncancel={() => (pending = false)}
	/>
{/if}
