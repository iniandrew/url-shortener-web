<script lang="ts">
	import { page } from '$app/state';

	const isNotFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>sho.rt — {page.status}</title>
</svelte:head>

<section class="mx-auto mt-12 max-w-md card p-10 text-center">
	<p class="font-mono text-5xl font-bold text-brand-600 dark:text-brand-400">{page.status}</p>
	<h1 class="mt-3 text-xl font-semibold">
		{#if isNotFound}Nothing here.{:else}Something went wrong.{/if}
	</h1>
	<p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
		{#if isNotFound}
			The page <span class="font-mono">{page.url.pathname}</span> does not exist.
		{:else}
			{page.error?.message ?? 'An unexpected error occurred.'}
		{/if}
	</p>
	<div class="mt-6 flex justify-center gap-2">
		<a href="/" class="btn-primary">Go home</a>
		{#if !isNotFound}
			<button type="button" class="btn-ghost" onclick={() => location.reload()}>Reload</button>
		{/if}
	</div>
</section>
