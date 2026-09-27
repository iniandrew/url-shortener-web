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
	<section class="mx-auto mt-8 max-w-md panel p-8 text-center">
		<h1 class="font-mono text-lg font-semibold">/{data.code} is not yours</h1>
		<p class="mt-2 text-sm text-ink-soft dark:text-ash">
			It does not exist, or it belongs to another key. Anonymous links are only reachable by their
			code.
		</p>
		<a href="/links" class="btn-primary mt-6 inline-flex">Back to your links</a>
	</section>
{:else}
	<section>
		<a
			href="/links"
			class="font-mono text-[11px] tracking-micro text-ink-faint uppercase hover:text-signal dark:text-ash-faint"
		>
			← All links
		</a>

		<div class="mt-3 flex flex-wrap items-center justify-between gap-3">
			<div class="flex min-w-0 items-center gap-3">
				<h1 class="truncate font-mono text-2xl font-bold tracking-tight">/{data.link.code}</h1>
				<StatusBadge status={status!} custom={data.link.is_custom} />
			</div>
			{#if status === 'active'}
				<button type="button" class="btn-danger" onclick={() => (pending = true)}>
					Deactivate
				</button>
			{/if}
		</div>

		{#if actionError}
			<div
				class="mt-4 border border-danger/50 bg-danger/10 px-4 py-3 font-mono text-xs"
				role="alert"
			>
				{actionError}
			</div>
		{/if}

		<div class="mt-6 panel">
			<div
				class="border-b border-hairline px-5 py-2 font-mono text-[10px] tracking-micro text-ink-faint uppercase dark:border-hairline-dark dark:text-ash-faint"
			>
				Record
			</div>
			<dl class="grid gap-x-8 gap-y-3 px-5 py-4 font-mono text-xs sm:grid-cols-2">
				<div>
					<dt class="label-text mb-0.5">Short URL</dt>
					<dd class="flex items-center gap-2">
						<a
							href={data.link.short_url}
							target="_blank"
							rel="noopener noreferrer"
							class="truncate text-signal hover:underline"
						>
							{data.link.short_url}
						</a>
					</dd>
					<div class="mt-1.5 flex gap-1.5">
						<CopyButton value={data.link.short_url} class="btn-ghost px-2! py-0.5!" label="Copy" />
						<QrButton value={data.link.short_url} class="btn-ghost px-2! py-0.5!" />
					</div>
				</div>
				<div>
					<dt class="label-text mb-0.5">Destination</dt>
					<dd class="min-w-0">
						<a
							href={data.link.long_url}
							target="_blank"
							rel="noopener noreferrer"
							class="block truncate text-signal hover:underline"
							title={data.link.long_url}
						>
							{data.link.long_url}
						</a>
					</dd>
				</div>
				<div>
					<dt class="label-text mb-0.5">Created</dt>
					<dd class="text-ink-soft dark:text-ash">{fmtDateTime(data.link.created_at)}</dd>
				</div>
				<div>
					<dt class="label-text mb-0.5">Expires</dt>
					<dd class="text-ink-soft dark:text-ash">{fmtDate(data.link.expires_at)}</dd>
				</div>
			</dl>
		</div>

		<div class="mt-6 panel">
			<div
				class="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-5 py-2 dark:border-hairline-dark"
			>
				<h2
					class="font-mono text-[10px] tracking-micro text-ink-faint uppercase dark:text-ash-faint"
				>
					Clicks
				</h2>
				<div
					class="flex items-center gap-1 font-mono text-[10px] tracking-micro uppercase"
					role="group"
					aria-label="Range"
				>
					{#each RANGE_PRESETS as preset (preset)}
						<button
							type="button"
							class="border px-2 py-0.5 {data.range.days === preset && !data.range.from
								? 'border-signal bg-signal text-white'
								: 'border-transparent text-ink-faint hover:border-hairline dark:text-ash-faint dark:hover:border-hairline-dark'}"
							aria-pressed={data.range.days === preset && !data.range.from}
							onclick={() => setPreset(preset)}
						>
							{preset}d
						</button>
					{/each}
					<span class="mx-1 h-3 w-px bg-hairline dark:bg-hairline-dark" aria-hidden="true"></span>
					<input
						type="date"
						class="field w-auto! px-1.5! py-0.5! text-[10px]"
						bind:value={customFrom}
						aria-label="From date"
					/>
					<span class="text-ink-faint dark:text-ash-faint">→</span>
					<input
						type="date"
						class="field w-auto! px-1.5! py-0.5! text-[10px]"
						bind:value={customTo}
						aria-label="To date"
					/>
					<button
						type="button"
						class="border border-transparent px-2 py-0.5 text-ink-faint hover:border-hairline dark:text-ash-faint dark:hover:border-hairline-dark"
						onclick={setCustom}
						disabled={!customFrom || !customTo || customFrom > customTo}
					>
						Apply
					</button>
				</div>
			</div>

			<div class="flex gap-8 px-5 pt-4 font-mono">
				<p>
					<span class="text-2xl font-bold">{data.stats.total}</span>
					<span class="ml-1 text-[10px] tracking-micro text-ink-faint uppercase dark:text-ash-faint"
						>total</span
					>
				</p>
				<p>
					<span class="text-2xl font-bold">{data.avg}</span>
					<span class="ml-1 text-[10px] tracking-micro text-ink-faint uppercase dark:text-ash-faint"
						>avg/day</span
					>
				</p>
			</div>

			<div class="px-5 py-4">
				<BarChart days={data.days} label={`Clicks for /${data.link.code}`} />
			</div>
			<p class="rule-dashed px-5 py-2.5 font-mono text-[10px] text-ink-faint dark:text-ash-faint">
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
