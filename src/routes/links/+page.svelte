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
		<h1 class="font-mono text-xl font-semibold tracking-tight">Your links</h1>
		{#if data.result}
			<p class="font-mono text-[11px] tracking-micro text-ink-faint uppercase dark:text-ash-faint">
				{`${data.result.total} ${data.result.total === 1 ? 'link' : 'links'}${data.q ? ` matching “${data.q}”` : ''}`}
			</p>
		{/if}
	</div>

	<div class="mt-4">
		<label class="sr-only" for="search">Search by code or destination</label>
		<div class="flex items-stretch">
			<span
				class="flex items-center border border-r-0 border-hairline bg-paper-deep px-3 font-mono text-sm text-signal select-none dark:border-hairline-dark dark:bg-coal-deep"
				aria-hidden="true"
			>
				/
			</span>
			<input
				id="search"
				type="search"
				class="field rounded-none border-x-0"
				placeholder="Search code or destination…"
				bind:value={search}
				oninput={onSearchInput}
			/>
		</div>
	</div>

	{#if actionError}
		<div class="mt-4 border border-danger/50 bg-danger/10 px-4 py-3 font-mono text-xs" role="alert">
			{actionError}
		</div>
	{/if}

	{#if data.failure}
		<div class="mt-6 panel p-8 text-center">
			<p class="font-mono text-xs text-ink-soft dark:text-ash">{data.failure}</p>
			<button type="button" class="btn-primary mt-4" onclick={() => invalidateAll()}>
				Retry
			</button>
		</div>
	{:else if !data.result}
		<div class="mt-6 divide-y divide-hairline panel dark:divide-hairline-dark" aria-hidden="true">
			{#each Array(6).keys() as i (i)}
				<div class="flex items-center gap-4 px-4 py-3.5">
					<div class="h-3 w-24 animate-pulse bg-hairline dark:bg-hairline-dark"></div>
					<div class="h-3 flex-1 animate-pulse bg-hairline dark:bg-hairline-dark"></div>
					<div class="h-4 w-20 animate-pulse bg-hairline dark:bg-hairline-dark"></div>
				</div>
			{/each}
		</div>
	{:else if data.result.items.length === 0}
		<div class="mt-6 panel p-10 text-center">
			<p class="font-mono text-sm font-medium">
				{#if data.q}No links match “{data.q}”.{:else}No links yet.{/if}
			</p>
			<p class="mt-1 text-sm text-ink-faint dark:text-ash-faint">
				{#if data.q}Try a different search.{:else}Create one on the
					<a class="text-signal underline" href={`${base}/`}>shorten page</a>
					while signed in — it becomes manageable here.{/if}
			</p>
		</div>
	{:else}
		<div class={'mt-6 overflow-x-auto panel transition-opacity ' + (loading ? 'opacity-50' : '')}>
			<table class="w-full text-left font-mono text-xs">
				<thead>
					<tr
						class="border-b border-hairline text-[10px] tracking-micro text-ink-faint uppercase dark:border-hairline-dark dark:text-ash-faint"
					>
						<th class="px-4 py-2.5 font-medium" scope="col">Code</th>
						<th class="hidden px-4 py-2.5 font-medium md:table-cell" scope="col">Destination</th>
						<th class="px-4 py-2.5 font-medium" scope="col">Status</th>
						<th class="hidden px-4 py-2.5 font-medium lg:table-cell" scope="col">Created</th>
						<th class="hidden px-4 py-2.5 font-medium lg:table-cell" scope="col">Expires</th>
						<th class="px-4 py-2.5 text-right font-medium" scope="col">
							<span class="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-hairline dark:divide-hairline-dark">
					{#each data.result.items as link (link.code)}
						{@const status = linkStatus(link)}
						<tr class="hover:bg-paper-deep dark:hover:bg-coal-deep">
							<td class="px-4 py-2.5">
								<a
									href={`${base}/links/${link.code}`}
									class="font-medium text-signal hover:underline"
								>
									/{link.code}
								</a>
							</td>
							<td
								class="hidden max-w-72 truncate px-4 py-2.5 text-ink-faint md:table-cell dark:text-ash-faint"
								title={link.long_url}
							>
								{link.long_url}
							</td>
							<td class="px-4 py-2.5">
								<StatusBadge {status} custom={link.is_custom} />
							</td>
							<td
								class="hidden px-4 py-2.5 whitespace-nowrap text-ink-faint lg:table-cell dark:text-ash-faint"
							>
								{fmtDate(link.created_at)}
							</td>
							<td
								class="hidden px-4 py-2.5 whitespace-nowrap text-ink-faint lg:table-cell dark:text-ash-faint"
							>
								{fmtDate(link.expires_at)}
							</td>
							<td class="px-4 py-2.5 text-right">
								<div class="flex justify-end gap-1">
									<CopyButton value={link.short_url} class="btn-ghost px-2! py-0.5!" label="Copy" />
									{#if status === 'active'}
										<button
											type="button"
											class="btn-danger px-2! py-0.5!"
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
			<nav class="mt-4 flex items-center justify-between font-mono text-xs" aria-label="Pagination">
				<button
					type="button"
					class="btn-ghost px-3! py-1!"
					disabled={data.page <= 1}
					onclick={() => turn(data.page - 1)}
				>
					← Prev
				</button>
				<span class="tracking-micro text-ink-faint uppercase dark:text-ash-faint">
					Page {data.page} / {totalPages}
				</span>
				<button
					type="button"
					class="btn-ghost px-3! py-1!"
					disabled={data.page >= totalPages}
					onclick={() => turn(data.page + 1)}
				>
					Next →
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
