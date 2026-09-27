<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';
	import { navigating } from '$app/state';
	import { auth } from '$lib/auth.svelte';
	import { deactivateLink, PAGE_SIZE } from '$lib/api/links';
	import { linkStatus } from '$lib/validate';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import CopyButton from '$lib/components/CopyButton.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Seeded from the URL and re-synced when navigation changes q externally
	// (pagination keeps the query); writable so typing overrides it locally.
	let search = $derived(data.q);
	let pending = $state<{ code: string } | null>(null);
	let working = $state(false);
	let actionError = $state('');

	// Push ?q= into the URL (debounced) so the load function refetches.
	let debounce: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(debounce));

	function onSearchInput() {
		clearTimeout(debounce);
		debounce = setTimeout(() => {
			const params = new URLSearchParams();
			if (search.trim()) params.set('q', search.trim());
			const qs = params.toString();
			goto(`${base}/links${qs ? `?${qs}` : ''}`, { keepFocus: true, noScroll: true });
		}, 300);
	}

	function turn(pageNum: number) {
		const params = new URLSearchParams();
		if (data.q.trim()) params.set('q', data.q.trim());
		if (pageNum > 1) params.set('page', String(pageNum));
		const qs = params.toString();
		goto(`${base}/links${qs ? `?${qs}` : ''}`, { noScroll: true });
	}

	async function confirmDeactivate() {
		if (!pending) return;
		working = true;
		actionError = '';
		try {
			await deactivateLink(pending.code, auth.apiKey);
			pending = null;
			await invalidateAll();
		} catch (err) {
			actionError = err instanceof Error ? err.message : 'Deactivating failed.';
		} finally {
			working = false;
		}
	}

	const totalPages = $derived(
		data.result ? Math.max(1, Math.ceil(data.result.total / PAGE_SIZE)) : 1
	);
	const loading = $derived(Boolean(navigating.to?.url.pathname === '/links'));

	function fmtDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>sho.rt — your links</title>
</svelte:head>

<section>
	<div class="flex flex-wrap items-baseline justify-between gap-2">
		<h1 class="text-2xl font-bold tracking-tight">Your links</h1>
		{#if data.result}
			<p class="text-sm text-zinc-500 dark:text-zinc-400">
				{`${data.result.total} ${data.result.total === 1 ? 'link' : 'links'}${data.q ? ` matching “${data.q}”` : ''}`}
			</p>
		{/if}
	</div>

	<div class="mt-4">
		<label class="sr-only" for="search">Search by code or destination</label>
		<input
			id="search"
			type="search"
			class="field"
			placeholder="Search code or destination URL…"
			bind:value={search}
			oninput={onSearchInput}
		/>
	</div>

	{#if actionError}
		<div
			class="mt-4 rounded-lg border border-danger-500/40 bg-danger-500/10 px-4 py-3 text-sm"
			role="alert"
		>
			{actionError}
		</div>
	{/if}

	{#if data.failure}
		<div class="mt-6 card p-8 text-center">
			<p class="text-sm text-zinc-600 dark:text-zinc-400">{data.failure}</p>
			<button type="button" class="btn-primary mt-4" onclick={() => invalidateAll()}>
				Retry
			</button>
		</div>
	{:else if !data.result}
		<div class="mt-6 divide-y divide-zinc-200 card dark:divide-zinc-800" aria-hidden="true">
			{#each Array(6).keys() as i (i)}
				<div class="flex items-center gap-4 px-4 py-3.5">
					<div class="h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></div>
					<div class="h-4 flex-1 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800"></div>
					<div class="h-5 w-20 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
				</div>
			{/each}
		</div>
	{:else if data.result.items.length === 0}
		<div class="mt-6 card p-10 text-center">
			<p class="font-medium">
				{#if data.q}No links match “{data.q}”.{:else}No links yet.{/if}
			</p>
			<p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
				{#if data.q}Try a different search.{:else}Create one on the
					<a class="text-brand-600 underline dark:text-brand-400" href={`${base}/`}>shorten page</a> while
					signed in — it becomes manageable here.{/if}
			</p>
		</div>
	{:else}
		<div
			class={'mt-6 divide-y divide-zinc-200 overflow-hidden card transition-opacity dark:divide-zinc-800 ' +
				(loading ? 'opacity-50' : '')}
		>
			<table class="w-full text-left text-sm">
				<thead>
					<tr class="text-xs tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
						<th class="px-4 py-3 font-medium" scope="col">Code</th>
						<th class="hidden px-4 py-3 font-medium md:table-cell" scope="col">Destination</th>
						<th class="px-4 py-3 font-medium" scope="col">Status</th>
						<th class="hidden px-4 py-3 font-medium lg:table-cell" scope="col">Created</th>
						<th class="hidden px-4 py-3 font-medium lg:table-cell" scope="col">Expires</th>
						<th class="px-4 py-3 text-right font-medium" scope="col">
							<span class="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each data.result.items as link (link.code)}
						{@const status = linkStatus(link)}
						<tr class="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
							<td class="px-4 py-3">
								<a
									href={`/links/${link.code}`}
									class="font-mono font-medium text-brand-600 hover:underline dark:text-brand-400"
								>
									/{link.code}
								</a>
							</td>
							<td
								class="hidden max-w-60 truncate px-4 py-3 text-zinc-500 md:table-cell dark:text-zinc-400"
								title={link.long_url}
							>
								{link.long_url}
							</td>
							<td class="px-4 py-3">
								<StatusBadge {status} custom={link.is_custom} />
							</td>
							<td
								class="hidden px-4 py-3 whitespace-nowrap text-zinc-500 lg:table-cell dark:text-zinc-400"
							>
								{fmtDate(link.created_at)}
							</td>
							<td
								class="hidden px-4 py-3 whitespace-nowrap text-zinc-500 lg:table-cell dark:text-zinc-400"
							>
								{fmtDate(link.expires_at)}
							</td>
							<td class="px-4 py-3 text-right">
								<div class="flex justify-end gap-1">
									<CopyButton value={link.short_url} class="btn-ghost px-2! py-1!" label="Copy" />
									{#if status === 'active'}
										<button
											type="button"
											class="btn-ghost px-2! py-1! text-danger-500"
											onclick={() => (pending = { code: link.code })}
										>
											Deactivate
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if totalPages > 1 || data.page > 1}
			<nav class="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">
				<button
					type="button"
					class="btn-ghost"
					disabled={data.page <= 1}
					onclick={() => turn(data.page - 1)}
				>
					Previous
				</button>
				<span class="text-zinc-500 dark:text-zinc-400">Page {data.page} of {totalPages}</span>
				<button
					type="button"
					class="btn-ghost"
					disabled={data.page >= totalPages}
					onclick={() => turn(data.page + 1)}
				>
					Next
				</button>
			</nav>
		{/if}
	{/if}
</section>

{#if pending}
	<ConfirmDialog
		title="Deactivate /{pending.code}?"
		message="The link will answer 410 Gone immediately and stay in the table as deactivated. This cannot be undone."
		confirmLabel="Deactivate"
		busy={working}
		onconfirm={confirmDeactivate}
		oncancel={() => (pending = null)}
	/>
{/if}
