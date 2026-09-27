<script lang="ts">
	import { page } from '$app/state';

	const isNotFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>sho.rt — {page.status}</title>
</svelte:head>

<section class="mx-auto mt-12 max-w-md panel p-8 text-center">
	<p class="font-mono text-5xl font-bold text-signal">{page.status}</p>
	<h1 class="mt-3 font-mono text-lg font-semibold">
		{#if isNotFound}Nothing here.{:else}Something went wrong.{/if}
	</h1>
	<p class="mt-2 font-mono text-xs text-ink-soft dark:text-ash">
		{#if isNotFound}
			The page <span class="text-signal">{page.url.pathname}</span> does not exist.
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
